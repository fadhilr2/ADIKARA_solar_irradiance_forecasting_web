"""
FastAPI application entry point for Option A (NASA POWER Pipeline).

Run server:
    uvicorn app:app --reload --host 0.0.0.0 --port 8000

Endpoints:
    GET /api/forecast/latest   – Latest NASA POWER forecast + actual measured curve
    GET /api/forecast/live     – Alias to latest
    GET /api/metrics           – LightGBM validation & test benchmarks (2025)
    GET /health                – Health check
"""

import csv
import logging
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from forecast_engine import get_latest_forecast

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).parent.parent / "data" / "model"

app = FastAPI(title="Kupang Solar Irradiance Forecast API", version="2.0.0")

# CORS middleware for Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/forecast/latest")
@app.get("/api/forecast/live")
def get_forecast():
    """
    Return the latest forecast for Kupang from NASA POWER dataset with paired
    actual measurements, Q10-Q90 uncertainty ribbon, and spatial neighbors.
    """
    try:
        return get_latest_forecast()
    except Exception as exc:
        logger.error("Forecast fetch error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/metrics")
def get_metrics():
    """Return test-set (2025) benchmark metrics from data/model/metrics.csv."""
    path = MODEL_DIR / "metrics.csv"
    if not path.exists():
        raise HTTPException(status_code=404, detail="metrics.csv not found")

    rows = []
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            parsed = {}
            for k, v in row.items():
                if k in ("split", "model"):
                    parsed[k] = v
                else:
                    try:
                        parsed[k] = float(v)
                    except ValueError:
                        parsed[k] = v
            rows.append(parsed)
    return {"metrics": rows}


@app.get("/health")
def health():
    return {"status": "ok", "pipeline": "Option A (NASA POWER)"}
