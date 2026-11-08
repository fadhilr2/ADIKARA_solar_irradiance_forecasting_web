# ☀️ Prakiraan Solar Forecast

> **Spatial Machine-Learning Day-Ahead Solar Irradiance & Rooftop PV Yield Prediction for Kupang, East Nusa Tenggara**

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=flat&logo=react&logoColor=61DAFB)
![LightGBM](https://img.shields.io/badge/LightGBM-Quantile_Regression-blue)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)

---

## 📌 Overview

Solar power generation in tropical island micro-grids is highly volatile due to localized cloud convection and maritime atmospheric shifts. 

**Prakiraan Solar Forecast** is an end-to-end forecasting dashboard designed for **Kota Kupang, East Nusa Tenggara, Indonesia (-10.17°, 123.67°)**. Rather than relying on simple persistence or isolated single-station models, this platform leverages **spatially-correlated regional grid networks** across East Nusa Tenggara to forecast day-ahead hourly solar irradiance ($W/m^2$) with quantile uncertainty bounds and household rooftop PV yield ($kWh$).

---

## ✨ Key Features

- **Day-Ahead Diurnal Forecast:** Hourly expected solar irradiance (Global Horizontal Irradiance - $GHI$) across all daylight hours (06:00–18:00 WITA).
- **Quantile Uncertainty Ribbon (Q10–Q90):** Provides an 80% confidence band (10th to 90th percentile) using pinball-loss gradient boosting, giving grid operators and homeowners visibility into cloudy-day downside risks and clear-sky upsides.
- **Empirical Clear-Sky Envelope:** Automatically computes a site-specific empirical clear-sky ceiling to contextualize how close the day's harvest will be to ideal conditions.
- **Interactive Rooftop PV Yield Estimator:** Dynamic slider (1–50 kWp) estimating total daily generated kilowatt-hours ($kWh$) alongside an optimal appliance scheduling window.
- **Spatial Grid Feature Integration:** Uses recent readings and temporal lags from 3 geographically ranked neighbor grid cells to capture upstream cloud movements.
- **Model Validation Dashboard:** Transparent validation metrics comparing LightGBM against baseline persistence and historical climatology models.

---

## 🏗️ System Architecture

```
[ 25-Year NASA POWER Reanalysis ] ──► [ Spatial Correlation Ranking ]
                                                │
                                    19 Spatio-Temporal Features
                                                ▼
                                   [ LightGBM Quantile Models ]
                                   ├── Mean (Expected GHI)
                                   ├── Q10  (Downside Risk)
                                   └── Q90  (Upside Harvest)
                                                │
                                                ▼
[ FastAPI Backend (Port 8000) ] ◄─── REST API Serialization
        │
        ▼
[ React + Chart.js Dashboard (Port 5173) ]
  ├── Diurnal Curve & Uncertainty Ribbon
  ├── Peak Solar Window & Harvest Summary
  └── Interactive PV Yield Calculator
```

---

## 🚀 Quickstart

### Prerequisites
- **Node.js** 18+ and `npm`
- **Python** 3.10+ (with `venv`)

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/your-username/prakiraan-solar-forecast.git
cd prakiraan-solar-forecast

# Create and activate Python virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Start FastAPI server (serves on http://127.0.0.1:8000)
python backend/app.py
```

### 2. Frontend Setup

In a new terminal:

```bash
# Install NPM dependencies
npm install

# Start Vite development server (serves on http://localhost:5173)
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🔬 Methodology & Model Design

### 1. Spatial-Temporal Feature Engineering
Inspired by satellite multi-site solar forecasting research (*Brahma & Wadhvani, 2020*), the inference engine assembles **19 standardized features**:
- **Target Site (Kupang):** Same-hour lag $t-24\text{h}$, previous hour $t-25\text{h}$, and day-before lag $t-48\text{h}$.
- **Top-3 Spatial Neighbors:** Lagged irradiance from 3 optimal geographic coordinates in East Nusa Tenggara selected via cross-correlation ranking.
- **Cyclic Temporal Encodings:** Sine and cosine representations of hour-of-day ($0\text{–}23$) and month-of-year ($1\text{–}12$).

### 2. LightGBM Quantile Regression
Rather than outputting a single deterministic estimate, three distinct LightGBM tree ensembles are evaluated:
- **Mean Model:** Minimizes $L_2$ loss for the expected diurnal trajectory.
- **Lower Bound (Q10):** Minimizes quantile pinball loss with $\alpha = 0.10$.
- **Upper Bound (Q90):** Minimizes quantile pinball loss with $\alpha = 0.90$.

### 3. PV Yield Estimation
Hourly irradiance is converted into estimated electricity output via:
$$\text{Yield (kWh)} = \left( \sum_{h=6}^{18} GHI_h \times \frac{1\,\text{hour}}{1000} \right) \times \text{Capacity }(kW_p) \times PR$$
*where $PR = 0.75$ represents standard rooftop solar balance-of-system performance ratio (inverter efficiency, temperature derating, dust/soiling).*

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/forecast/latest` | Returns latest day-ahead forecast (hours, mean, Q10, Q90, clear-sky max, expected harvest, peak hour). |
| `GET` | `/api/metrics` | Model performance summary vs. Persistence and Climatology baselines. |
| `GET` | `/health` | Service health status. |

---

## 📂 Project Structure

```
my-react-app/
├── backend/
│   ├── app.py             # FastAPI REST endpoints & CORS configuration
│   ├── forecast_engine.py # LightGBM feature builder & inference runner
│   ├── clear_sky.py       # Empirical clear-sky envelope generator
│   └── requirements.txt   # Python dependencies
├── data/
│   ├── main.py            # NASA POWER data ingestion utility
│   ├── data_selection/    # Spatial neighbor correlation ranking script
│   └── model/             # Trained LightGBM models & validation metrics
│       ├── lgbm_mean.txt
│       ├── lgbm_q10.txt
│       ├── lgbm_q90.txt
│       ├── features.txt
│       └── metrics.csv
├── src/
│   ├── components/
│   │   ├── Navbar.jsx         # Header & location dropdown
│   │   ├── SolarHeroCard.jsx  # Daily harvest summary & outlook badge
│   │   ├── DiurnalChart.jsx   # Chart.js diurnal forecast with uncertainty ribbon
│   │   ├── PvYieldWidget.jsx  # Interactive rooftop solar calculator
│   │   └── MetricsCard.jsx    # Model validation performance table
│   └── App.jsx                # Single-page dashboard assembly
└── index.html
```

---

## 📄 License & References

- **Data Source:** [NASA POWER API](https://power.larc.nasa.gov/) (Prediction Of Worldwide Energy Resources), 2001–2025.
- **Methodology Reference:** Brahma, B.; Wadhvani, R. *Solar Irradiance Forecasting Based on Spatial-Temporal Feature Selection and Machine Learning.* Symmetry 2020, 12, 1830.
