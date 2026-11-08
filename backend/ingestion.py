"""
Data ingestion module.

Fetches recent hourly surface irradiance from NASA POWER for the target
site (P) and the three top-ranked neighbor sites, then stores the data
in a local SQLite rolling buffer.

Sites (derived from data_selection/main.py and Adikara.ipynb):
  +0_+0  Kupang target P      (-10.17,  123.67)
  +0_-2  Neighbor 1 (rank 1)  (-10.17,  122.67)
  +0_+1  Neighbor 2 (rank 2)  (-10.17,  124.17)
  +1_+0  Neighbor 3 (rank 3)  ( -9.67,  123.67)
"""

import datetime
import logging
import sqlite3
import time
from pathlib import Path

import numpy as np
import pandas as pd
import requests

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SITES: dict[str, tuple[float, float]] = {
    "+0_+0": (-10.17, 123.67),   # Target P
    "+0_-2": (-10.17, 122.67),   # Neighbor 1
    "+0_+1": (-10.17, 124.17),   # Neighbor 2
    "+1_+0": (-9.67,  123.67),   # Neighbor 3
}

MIN_CLEAR_SKY = 50.0             # W/m² – hours below this count as night

BUFFER_DIR = Path(__file__).parent / "data_cache"
DB_PATH = BUFFER_DIR / "buffer.db"

NASA_API = "https://power.larc.nasa.gov/api/temporal/hourly/point"
NASA_PARAMS = "ALLSKY_SFC_SW_DWN,CLRSKY_SFC_SW_DWN"


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------
def _init_db() -> None:
    BUFFER_DIR.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS observations (
                time_utc TEXT NOT NULL,
                site     TEXT NOT NULL,
                allsky   REAL,
                clrsky   REAL,
                kt       REAL,
                PRIMARY KEY (time_utc, site)
            )
        """)
        conn.commit()


def _upsert(rows: list[tuple]) -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.executemany(
            "INSERT OR IGNORE INTO observations "
            "(time_utc, site, allsky, clrsky, kt) VALUES (?,?,?,?,?)",
            rows,
        )
        conn.commit()


def _purge_old(keep_days: int = 14) -> None:
    cutoff = (
        datetime.datetime.utcnow() - datetime.timedelta(days=keep_days)
    ).strftime("%Y-%m-%d %H:%M:%S")
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("DELETE FROM observations WHERE time_utc < ?", (cutoff,))
        conn.commit()


# ---------------------------------------------------------------------------
# NASA POWER fetch
# ---------------------------------------------------------------------------
def _fetch_nasa(lat: float, lon: float, start: str, end: str) -> pd.DataFrame:
    """
    Fetch hourly ALLSKY + CLRSKY from NASA POWER for one point.
    start / end are 'YYYYMMDD' strings.
    Returns DataFrame with columns [allsky, clrsky], datetime UTC index.
    """
    params = {
        "parameters":    NASA_PARAMS,
        "community":     "RE",
        "latitude":      lat,
        "longitude":     lon,
        "start":         start,
        "end":           end,
        "format":        "JSON",
        "time-standard": "UTC",
    }
    for attempt in range(3):
        try:
            r = requests.get(NASA_API, params=params, timeout=180)
            r.raise_for_status()
            js = r.json()
            df = pd.DataFrame(js["properties"]["parameter"])
            df.index = pd.to_datetime(df.index, format="%Y%m%d%H", utc=True)
            df = df.rename(columns={
                "ALLSKY_SFC_SW_DWN": "allsky",
                "CLRSKY_SFC_SW_DWN": "clrsky",
            })[["allsky", "clrsky"]]
            df = df.replace(-999.0, float("nan"))
            return df
        except Exception as exc:
            logger.warning("Attempt %d/3 for (%s,%s): %s", attempt + 1, lat, lon, exc)
            time.sleep(5 * (attempt + 1))
    raise RuntimeError(f"NASA POWER fetch failed for ({lat},{lon}) {start}-{end}")


def _df_to_rows(df: pd.DataFrame, site: str) -> list[tuple]:
    rows = []
    for ts, row in df.iterrows():
        allsky = row["allsky"]
        clrsky = row["clrsky"]
        kt: float | None = None
        if (
            not (np.isnan(allsky) if isinstance(allsky, float) else False)
            and not (np.isnan(clrsky) if isinstance(clrsky, float) else False)
            and clrsky >= MIN_CLEAR_SKY
        ):
            kt = float(np.clip(allsky / clrsky, 0.0, 1.5))
        rows.append((
            ts.strftime("%Y-%m-%d %H:%M:%S"),
            site,
            float(allsky) if allsky is not None and not np.isnan(allsky) else None,
            float(clrsky) if clrsky is not None and not np.isnan(clrsky) else None,
            kt,
        ))
    return rows


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def run_ingestion(lookback_days: int = 10) -> None:
    """
    Fetch the last `lookback_days` days for all four sites and upsert into
    the SQLite buffer.  Skips the current day (data not yet complete).
    """
    _init_db()
    today = datetime.date.today()
    start_date = today - datetime.timedelta(days=lookback_days)
    # NASA POWER may lag by ~1-3 days; fetch up to yesterday to be safe
    end_date = today - datetime.timedelta(days=1)

    start_str = start_date.strftime("%Y%m%d")
    end_str = end_date.strftime("%Y%m%d")

    logger.info(
        "Ingesting NASA POWER %s→%s for %d sites", start_str, end_str, len(SITES)
    )
    for site_id, (lat, lon) in SITES.items():
        try:
            logger.info("  Fetching %s (%.2f, %.2f) …", site_id, lat, lon)
            df = _fetch_nasa(lat, lon, start_str, end_str)
            rows = _df_to_rows(df, site_id)
            _upsert(rows)
            logger.info("  → %d rows stored for %s", len(rows), site_id)
        except Exception as exc:
            logger.error("Failed to ingest %s: %s", site_id, exc)
        time.sleep(5)   # polite pause between requests

    _purge_old(14)
    logger.info("Ingestion complete.")


def load_buffer(hours: int = 192) -> dict[str, pd.Series]:
    """
    Load the last `hours` hours of kt observations for every site.
    Returns {site_id: pd.Series(kt, tz-aware UTC DatetimeIndex)}.
    Missing sites return an empty Series.
    """
    _init_db()
    cutoff = (
        datetime.datetime.utcnow() - datetime.timedelta(hours=hours)
    ).strftime("%Y-%m-%d %H:%M:%S")

    result: dict[str, pd.Series] = {}
    with sqlite3.connect(DB_PATH) as conn:
        for site_id in SITES:
            rows = conn.execute(
                "SELECT time_utc, kt FROM observations "
                "WHERE site = ? AND time_utc >= ? ORDER BY time_utc",
                (site_id, cutoff),
            ).fetchall()
            if rows:
                idx = pd.to_datetime([r[0] for r in rows], utc=True)
                vals = [r[1] for r in rows]
                result[site_id] = pd.Series(vals, index=idx, dtype=float)
            else:
                result[site_id] = pd.Series(dtype=float)
    return result

