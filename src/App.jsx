import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import SolarHeroCard from './components/SolarHeroCard'
import DiurnalChart from './components/DiurnalChart'
import PvYieldWidget from './components/PvYieldWidget'
import MetricsCard from './components/MetricsCard'
import './App.css'

const API_BASE = 'http://localhost:8000'

export default function App() {
  const [forecast, setForecast] = useState(null)
  const [metrics, setMetrics]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/forecast/latest`).then(r => {
        if (!r.ok) throw new Error(`Forecast API returned status ${r.status}`)
        return r.json()
      }),
      fetch(`${API_BASE}/api/metrics`).then(r => {
        if (!r.ok) throw new Error(`Metrics API returned status ${r.status}`)
        return r.json()
      }),
    ])
      .then(([forecastData, metricsData]) => {
        setForecast(forecastData)
        setMetrics(metricsData)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center solar-loading">
        <div className="spinner-border text-warning mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading…</span>
        </div>
        <p className="text-muted">Memuat Prakiraan Solar Forecast…</p>
      </div>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="container-lg py-5">
          <div className="alert alert-warning d-flex align-items-start gap-3 shadow-sm" role="alert">
            <i className="bi bi-exclamation-triangle-fill fs-3 text-warning mt-1 flex-shrink-0" />
            <div>
              <h5 className="alert-heading mb-1">FastAPI Backend Not Connected</h5>
              <p className="mb-2">
                Could not connect to the backend server at <code>{API_BASE}</code>. Please start the backend server with:
              </p>
              <div className="p-3 bg-dark text-warning rounded-3 font-monospace small mb-3">
                uvicorn backend.app:app --reload<br />
                or<br />
                cd backend &amp;&amp; uvicorn app:app --reload
              </div>
              <p className="mb-0 small text-muted">Technical error: {error}</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar dataAsOf={forecast?.data_as_of} />

      <main className="container-lg py-4">

        {/* Row 1 — Hero Summary Card */}
        <section className="row mb-4">
          <div className="col-12">
            <SolarHeroCard
              summary={forecast?.summary}
              forecastDate={forecast?.forecast_date}
            />
          </div>
        </section>

        {/* Row 2 — Diurnal Solar Profile Chart */}
        <section className="row mb-4">
          <div className="col-12">
            <DiurnalChart hourly={forecast?.hourly} />
          </div>
        </section>

        {/* Row 3 — Rooftop PV Yield Estimator */}
        <section className="row mb-4">
          <div className="col-12">
            <PvYieldWidget summary={forecast?.summary} />
          </div>
        </section>

        {/* Row 4 — Model Accuracy Benchmarks (2025 Test Year) */}
        <section className="row mb-4">
          <div className="col-12">
            <MetricsCard metrics={metrics?.metrics} />
          </div>
        </section>

      </main>

      <footer className="border-top py-3 text-center text-muted small bg-light mt-auto">
        <div className="container-lg">
          <p className="mb-1">
            <strong>Inference Engine:</strong> LightGBM Multi-Site Quantile Model (trained on 25 years of hourly NASA POWER data: 2001 to 2025; training 2001–2023, validation 2024, test 2025).
          </p>
          <p className="mb-0 text-secondary" style={{ fontSize: '0.75rem' }}>
            Reference: Brahma &amp; Wadhvani, <em>Symmetry</em> 2020 · NASA Langley Research Center POWER Project · Unvalidated against BMKG ground sensors.
          </p>
        </div>
      </footer>
    </>
  )
}
