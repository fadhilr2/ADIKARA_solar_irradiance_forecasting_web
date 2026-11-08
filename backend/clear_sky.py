"""
NASA-consistent clear-sky irradiance provider for Kupang, NTT.

The LightGBM model was trained on NASA POWER's CLRSKY_SFC_SW_DWN product.
To avoid bias from uncalibrated atmospheric models (e.g. raw pvlib), this module:
  1. Uses NASA's historical hourly clear-sky data (from predictions.csv) to build
     an empirical (day_of_year, hour) lookup table.
  2. For published days in the dataset, provides the exact NASA published values.
  3. For unpublished days, provides the exact day-of-year x hour mean.
"""

from pathlib import Path
import pandas as pd

_PREDICTIONS_PATH = Path(__file__).parent.parent / "data" / "model" / "predictions.csv"

# Global caches
_EXACT_MAP: dict[tuple[str, int], float] = {}
_LOOKUP_TABLE: dict[tuple[int, int], float] = {}


def _init_cache() -> None:
    global _EXACT_MAP, _LOOKUP_TABLE
    if _LOOKUP_TABLE:
        return

    if not _PREDICTIONS_PATH.exists():
        raise FileNotFoundError(f"predictions.csv not found at {_PREDICTIONS_PATH}")

    df = pd.read_csv(_PREDICTIONS_PATH, usecols=["target_time", "clr"])
    df["dt"] = pd.to_datetime(df["target_time"])

    # Map (YYYY-MM-DD, hour_utc) -> exact NASA clr
    df["date_str"] = df["dt"].dt.strftime("%Y-%m-%d")
    df["hour"] = df["dt"].dt.hour
    _EXACT_MAP = df.set_index(["date_str", "hour"])["clr"].to_dict()

    # Empirical mean by (day of year, hour)
    df["doy"] = df["dt"].dt.dayofyear
    _LOOKUP_TABLE = df.groupby(["doy", "hour"])["clr"].mean().to_dict()


def get_nasa_clear_sky(dt: pd.Timestamp) -> float:
    """
    Return NASA-consistent clear-sky irradiance (W/m²) for a given timestamp.
    Prefers exact published value, falls back to day-of-year x hour mean.
    """
    _init_cache()
    date_str = dt.strftime("%Y-%m-%d")
    h = dt.hour

    if (date_str, h) in _EXACT_MAP:
        return float(_EXACT_MAP[(date_str, h)])

    doy = dt.dayofyear
    if (doy, h) in _LOOKUP_TABLE:
        return float(_LOOKUP_TABLE[(doy, h)])

    # Fallback to nearest day of year
    for offset in [1, -1, 2, -2]:
        neighbor_doy = ((doy - 1 + offset) % 365) + 1
        if (neighbor_doy, h) in _LOOKUP_TABLE:
            return float(_LOOKUP_TABLE[(neighbor_doy, h)])

    return 0.0


def get_clear_sky_window(issue_time: pd.Timestamp) -> pd.Series:
    """
    Return clear-sky irradiance series of length 24 for the window starting at issue_time.
    Index is step (0 to 23 hours after issue_time).
    """
    _init_cache()
    values = []
    for step in range(24):
        target_t = issue_time + pd.Timedelta(hours=step)
        values.append(get_nasa_clear_sky(target_t))

    return pd.Series(values, index=range(24), dtype=float)
