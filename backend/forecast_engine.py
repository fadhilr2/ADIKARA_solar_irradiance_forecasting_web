"""
Forecast engine for Option A: Pure NASA POWER Pipeline.

Loads and serves the latest published day forecast from the verified NASA POWER
dataset (test year 2025), pairing the LightGBM multi-site forecast with ground-truth
measured observations side-by-side.
"""

from pathlib import Path
import json
import logging
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).parent.parent / "data" / "model"
PREDICTIONS_PATH = MODEL_DIR / "predictions.csv"
CACHE_DIR = Path(__file__).parent / "data_cache"
FORECAST_CACHE = CACHE_DIR / "forecast_cache.json"

NEIGHBOR_META = [
    {"id": "+0_-2", "lat": -10.17, "lon": 122.67, "rank": 1, "label": "Neighbor 1 (West)"},
    {"id": "+0_+1", "lat": -10.17, "lon": 124.17, "rank": 2, "label": "Neighbor 2 (East)"},
    {"id": "+1_+0", "lat": -9.67,  "lon": 123.67, "rank": 3, "label": "Neighbor 3 (North)"},
]


def get_latest_forecast() -> dict:
    """
    Return the latest published forecast day from NASA POWER dataset.
    Pairs the LightGBM multi-site quantile forecast with actual measured values.
    """
    if not PREDICTIONS_PATH.exists():
        raise FileNotFoundError(f"Missing {PREDICTIONS_PATH}")

    df = pd.read_csv(PREDICTIONS_PATH)
    test_df = df[df["split"] == "test"].copy()

    # Find the most recent issue_time
    latest_issue = test_df["issue_time"].max()
    day_df = test_df[test_df["issue_time"] == latest_issue].sort_values("step").copy()

    # Issue time in UTC and WITA
    issue_dt = pd.to_datetime(latest_issue)
    # 16:00 UTC corresponds to 00:00 WITA of the forecast date
    forecast_date = (issue_dt + pd.Timedelta(hours=8)).strftime("%Y-%m-%d")

    hourly = []
    for _, row in day_df.iterrows():
        target_dt = pd.to_datetime(row["target_time"])
        hourly.append({
            "hour_utc": int(target_dt.hour),
            "step": int(row["step"]),
            "clear_sky_wm2": round(float(row["clr"]), 1),
            "forecast_mean_wm2": round(float(row["lightgbm"]), 1),
            "actual_wm2": round(float(row["actual"]), 1) if pd.notna(row["actual"]) else None,
            "q10_wm2": round(float(min(row["q10"], row["q90"])), 1),
            "q90_wm2": round(float(max(row["q10"], row["q90"])), 1),
            "persistence_wm2": round(float(row["persistence"]), 1) if pd.notna(row["persistence"]) else None,
            "climatology_wm2": round(float(row["climatology"]), 1) if pd.notna(row["climatology"]) else None,
        })

    # Summary metrics
    forecast_vals = [h["forecast_mean_wm2"] for h in hourly]
    actual_vals = [h["actual_wm2"] for h in hourly if h["actual_wm2"] is not None]
    clr_vals = [h["clear_sky_wm2"] for h in hourly]

    daily_forecast_kwh = float(np.sum(forecast_vals)) / 1000.0
    daily_actual_kwh = float(np.sum(actual_vals)) / 1000.0 if actual_vals else None
    daily_clr_kwh = float(np.sum(clr_vals)) / 1000.0

    peak_idx = int(np.argmax(forecast_vals))
    peak_hour_utc = hourly[peak_idx]["hour_utc"]
    peak_irradiance = hourly[peak_idx]["forecast_mean_wm2"]

    # Outlook ratio = Forecast total / Clear-sky total
    ratio = daily_forecast_kwh / max(daily_clr_kwh, 1e-3)
    if ratio >= 0.75:
        outlook, outlook_label = "optimal", "Optimal Solar Yield"
    elif ratio >= 0.50:
        outlook, outlook_label = "intermittent", "Intermittent / Partly Cloudy"
    else:
        outlook, outlook_label = "overcast", "Overcast / Low Yield"

    forecast_payload = {
        "issued_at": issue_dt.isoformat(),
        "data_as_of": issue_dt.isoformat(),
        "forecast_date": forecast_date,
        "location": {
            "name": "Kupang, East Nusa Tenggara",
            "lat": -10.17,
            "lon": 123.67,
            "timezone": "WITA (UTC+8)"
        },
        "summary": {
            "daily_insolation_kwh": round(daily_forecast_kwh, 2),
            "actual_insolation_kwh": round(daily_actual_kwh, 2) if daily_actual_kwh is not None else None,
            "clear_sky_insolation_kwh": round(daily_clr_kwh, 2),
            "outlook": outlook,
            "outlook_label": outlook_label,
            "outlook_ratio": round(ratio, 3),
            "peak_hour_utc": peak_hour_utc,
            "peak_irradiance_wm2": peak_irradiance,
            "uncertainty_coverage": "70.9%",
        },
        "hourly": hourly,
        "neighbors": NEIGHBOR_META,
    }

    # Save to local cache
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    FORECAST_CACHE.write_text(json.dumps(forecast_payload, indent=2))
    return forecast_payload
