# ☀️ Prakiraan Solar Forecast

> **Spatial Machine-Learning Day-Ahead Solar Irradiance & Rooftop PV Yield Prediction for Kupang, East Nusa Tenggara**

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=flat&logo=react&logoColor=61DAFB)
![LightGBM](https://img.shields.io/badge/LightGBM-Quantile_Regression-blue)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=flat&logo=bootstrap&logoColor=white)

---

## 📌 Overview

Solar power generation in tropical island micro-grids is volatile due to localized cloud convection and maritime atmospheric shifts.

**Prakiraan Solar Forecast** is an end-to-end solar forecasting and rooftop PV analytics platform designed for **Kota Kupang, East Nusa Tenggara, Indonesia (-10.17°, 123.67°)**. Rather than relying on simple persistence or isolated single-station models, this platform leverages **spatially-correlated regional grid networks** across East Nusa Tenggara to forecast day-ahead hourly solar irradiance ($W/m^2$) with quantile uncertainty bounds ($Q_{10} - Q_{90}$) and household rooftop PV yield ($kWh$).

Trained and validated on **25 years of hourly NASA POWER reanalysis data (2001–2025)** (Train: 2001–2023, Validation: 2024, Test: 2025), the application displays both the day-ahead forecast curve and actual ground-truth satellite measurements side-by-side for full transparency.

---

## ✨ Key Features

- **Day-Ahead Diurnal Forecast:** Hourly expected solar irradiance (Global Horizontal Irradiance - $GHI$) across all daylight hours (06:00–18:00 WITA).
- **Quantile Uncertainty Ribbon ($Q_{10}$–$Q_{90}$):** Provides an 80% confidence band (10th to 90th percentile) using pinball-loss gradient boosting, giving grid operators and homeowners visibility into cloud-cover downside risks and clear-sky upsides.
- **Empirical Clear-Sky Envelope:** Leverages NASA's published `CLRSKY_SFC_SW_DWN` benchmark ceiling to contextualize how close the day's harvest is to ideal astronomical conditions.
- **Side-by-Side Actual vs. Forecast Validation:** Displays predicted vs. observed irradiance curves for direct visual verification without distribution shift.
- **Interactive Rooftop PV Yield Estimator:** Dynamic slider ($1\text{–}50\text{ kWp}$) estimating total daily generated kilowatt-hours ($kWh$) alongside peak solar generation windows and appliance scheduling recommendations.
- **Spatial Grid Feature Integration:** Ingests readings and temporal lags from 3 geographically ranked neighbor grid cells across East Nusa Tenggara (`+0_-2`, `+0_+1`, `+1_+0`) to capture upstream cloud movements.
- **Model Validation Dashboard:** Transparent benchmark metrics comparing LightGBM against baseline persistence and historical climatology models.

---

## 🏗️ System Architecture

```
[ 25-Year NASA POWER Reanalysis (2001-2025) ] ──► [ Spatial Correlation Ranking ]
                                                              │
                                                  19 Spatio-Temporal Features
                                                              ▼
                                                 [ LightGBM Quantile Models ]
                                                 ├── Mean (Expected GHI)
                                                 ├── Q10  (Downside Risk)
                                                 └── Q90  (Upside Harvest)
                                                              │
                                                              ▼
[ FastAPI Backend (Port 8000) ] ◄──────────────────── REST API Serialization
        │
        ▼
[ React + Chart.js Dashboard (Port 5173) ]
  ├── Diurnal Curve & Uncertainty Ribbon (Q10 - Q90)
  ├── Peak Solar Window & Harvest Summary
  └── Interactive PV Yield Calculator (1 - 50 kWp)
```

---

## 📊 Model Evaluation & Benchmarks

The model is evaluated using 25 years of hourly observations across Validation (2024) and Test (2025) splits, benchmarked against standard solar forecasting baselines (*Persistence* and *Historical Climatology*):

### Overall Performance (`data/model/metrics.csv`)

| Split | Model | Sample ($N$) | RMSE ($W/m^2$) | MAE ($W/m^2$) | Bias ($W/m^2$) | Skill vs. Persistence | Skill vs. Climatology |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Validation (2024)** | Persistence | 20,055 | 116.89 | 74.53 | +0.03 | 0.00% | -5.20% |
| **Validation (2024)** | Climatology | 20,055 | 111.11 | 76.83 | -2.01 | +4.94% | 0.00% |
| **Validation (2024)** | **LightGBM** | 20,055 | **94.30** | **64.09** | **-1.14** | **+19.33%** | **+15.13%** |
| **Test (2025)** | Persistence | 20,054 | 130.98 | 84.63 | +0.13 | 0.00% | -3.54% |
| **Test (2025)** | Climatology | 20,054 | 126.51 | 84.09 | +16.98 | +3.42% | 0.00% |
| **Test (2025)** | **LightGBM** | 20,054 | **106.15** | **71.57** | **+4.37** | **+18.96%** | **+16.09%** |

*Note: Positive skill scores indicate percentage improvement in RMSE over the corresponding baseline.*

---

## 🚀 Quickstart

### Prerequisites
- **Node.js** 18+ and `npm`
- **Python** 3.10+ (with `venv`)

---

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/your-username/ADIKARA_solar_irradiance_forecasting_web.git
cd ADIKARA_solar_irradiance_forecasting_web

# Create and activate Python virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate

# On Linux/macOS:
source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Start FastAPI server (serves on http://127.0.0.1:8000)
uvicorn main:app --reload
```

*Alternative ways to start the backend:*
- Direct script execution: `python main.py`
- From the `backend/` directory: `cd backend && python app.py`

---

### 2. Frontend Setup

In a new terminal:

```bash
# Install frontend dependencies
npm install

# Start Vite development server (serves on http://localhost:5173)
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🔬 Methodology & Model Design

### 1. Spatial-Temporal Feature Engineering
Inspired by satellite multi-site solar forecasting research (*Brahma & Wadhvani, 2020*), the inference engine assembles **19 standardized features**:
- **Target Site (Kupang - `P`):** Same-hour lag $t-24\text{h}$, previous hour $t-25\text{h}$, and day-before lag $t-48\text{h}$.
- **Top-3 Spatial Neighbors:** Lagged irradiance from 3 optimal geographic coordinates across East Nusa Tenggara ranked by cross-correlation:
  - **Neighbor 1 (West - `+0_-2`):** $-10.17^\circ, 122.67^\circ$
  - **Neighbor 2 (East - `+0_+1`):** $-10.17^\circ, 124.17^\circ$
  - **Neighbor 3 (North - `+1_+0`):** $-9.67^\circ, 123.67^\circ$
- **Cyclic Temporal Encodings:** Sine and cosine representations of hour-of-day ($0\text{–}23$) and day-of-year ($1\text{–}365$).

### 2. LightGBM Quantile Regression
Rather than outputting a single deterministic estimate, three distinct LightGBM tree ensembles are trained:
- **Mean Model (`lgbm_mean.txt`):** Minimizes $L_2$ loss for the expected diurnal trajectory.
- **Lower Bound (`lgbm_q10.txt`):** Minimizes quantile pinball loss with $\alpha = 0.10$.
- **Upper Bound (`lgbm_q90.txt`):** Minimizes quantile pinball loss with $\alpha = 0.90$.

### 3. Rooftop PV Yield Estimation
Hourly predicted irradiance is converted into estimated electricity output via:
$$\text{Yield (kWh)} = \left( \sum_{h=6}^{18} GHI_h \times \frac{1\,\text{hour}}{1000} \right) \times \text{Capacity }(kW_p) \times PR$$
*where $PR = 0.75$ represents standard rooftop balance-of-system performance ratio (inverter efficiency, temperature derating, dust/soiling).*

---

## 📡 API Endpoints

The backend exposes the following REST endpoints on `http://127.0.0.1:8000`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/forecast/latest` | Returns latest day-ahead forecast with paired observations, $Q_{10} - Q_{90}$ uncertainty bounds, clear-sky ceiling, peak hour, and neighbor coordinates. |
| `GET` | `/api/forecast/live` | Alias for `/api/forecast/latest`. |
| `GET` | `/api/metrics` | Model performance summary vs. Persistence and Climatology baselines (from `metrics.csv`). |
| `GET` | `/health` | Service health status. |

---

## 📂 Project Structure

```
ADIKARA_solar_irradiance_forecasting_web/
├── main.py                    # Root entrypoint for FastAPI server (uvicorn main:app)
├── backend/
│   ├── __init__.py            # Python package marker
│   ├── app.py                 # FastAPI REST application & CORS setup
│   ├── forecast_engine.py     # Inference runner, forecast formatting & data pairing
│   ├── clear_sky.py           # Empirical clear-sky envelope generator
│   ├── ingestion.py           # SQLite rolling buffer & NASA POWER fetcher
│   ├── check_parity.py        # Feature alignment & model parity verification
│   └── requirements.txt       # Python backend dependencies
├── data/
│   ├── main.py                # NASA POWER data pipeline runner
│   ├── data_selection/        # Spatial correlation analysis & neighbor selection
│   │   └── main.py
│   └── model/                 # Trained LightGBM boosters & evaluation data
│       ├── lgbm_mean.txt      # Mean GHI booster
│       ├── lgbm_q10.txt       # 10th percentile downside booster
│       ├── lgbm_q90.txt       # 90th percentile upside booster
│       ├── features.txt       # 19 features in exact model order
│       ├── metrics.csv        # Overall validation and test benchmarks
│       ├── metrics_by_month.csv # Monthly RMSE distribution
│       ├── metrics_by_step.csv  # Hourly diurnal RMSE distribution
│       └── predictions.csv    # Test set predictions & observations
├── src/
│   ├── components/
│   │   ├── Navbar.jsx         # Header & location indicator
│   │   ├── SolarHeroCard.jsx  # Daily harvest summary, outlook badge & peak window
│   │   ├── DiurnalChart.jsx   # Chart.js diurnal curve with Q10-Q90 uncertainty ribbon
│   │   ├── PvYieldWidget.jsx  # Interactive rooftop PV slider & appliance guide
│   │   └── MetricsCard.jsx    # Model validation performance table
│   ├── App.jsx                # Single-page dashboard container
│   ├── App.css                # Custom styling
│   └── main.jsx               # React DOM entrypoint
├── index.html
├── package.json
└── vite.config.js
```

---

## 📄 License & References

- **Data Source:** [NASA POWER API](https://power.larc.nasa.gov/) (Prediction Of Worldwide Energy Resources), 2001–2025.
- **Methodology Reference:** Brahma, B.; Wadhvani, R. *Solar Irradiance Forecasting Based on Spatial-Temporal Feature Selection and Machine Learning.* Symmetry 2020, 12, 1830.
