import { useState } from 'react'

const PERFORMANCE_RATIO = 0.75   // Standard real-world PV system efficiency

export default function PvYieldWidget({ summary }) {
  const [kwp, setKwp] = useState(5)

  const insolation = summary?.daily_insolation_kwh ?? 0
  const estimated  = +(kwp * insolation * PERFORMANCE_RATIO).toFixed(2)
  const peakWita   = summary
    ? `${String((summary.peak_hour_utc + 8) % 24).padStart(2, '0')}:00 – ${String((summary.peak_hour_utc + 10) % 24).padStart(2, '0')}:00 WITA`
    : '—'

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body p-4">
        <h6 className="card-title fw-semibold text-muted text-uppercase small mb-3">
          <i className="bi bi-lightning-charge-fill text-warning me-1" />
          Rooftop PV Yield Estimator
        </h6>

        {/* Slider */}
        <label className="form-label d-flex justify-content-between mb-1">
          <span>Installed Capacity</span>
          <strong className="fs-6 text-dark">{kwp} kWp</strong>
        </label>
        <input
          type="range"
          className="form-range mb-3"
          min={1} max={50} step={0.5}
          value={kwp}
          onChange={e => setKwp(Number(e.target.value))}
        />

        {/* Estimated Output Result */}
        <div className="p-3 rounded-3 text-center mb-3"
             style={{ background: 'rgba(253,126,20,0.08)', border: '1px solid rgba(253,126,20,0.2)' }}>
          <p className="text-muted small mb-1">Estimated Daily Generation</p>
          <div className="d-flex align-items-end justify-content-center gap-1">
            <span className="display-5 fw-bold text-warning lh-1">{estimated}</span>
            <span className="text-muted fs-6 pb-1">kWh</span>
          </div>
          <p className="text-muted small mt-1 mb-0" style={{ fontSize: '0.78rem' }}>
            {kwp} kWp × {insolation.toFixed(2)} kWh/m² × {PERFORMANCE_RATIO} PR
          </p>
        </div>

        {/* Operational Recommendation */}
        <div className="border rounded-3 p-3 mb-3">
          <p className="small fw-semibold mb-1">
            <i className="bi bi-clock me-1 text-warning" />
            Optimal Solar Self-Consumption Window
          </p>
          <p className="small text-muted mb-0">{peakWita}</p>
          <p className="small text-muted mt-1 mb-0" style={{ fontSize: '0.78rem' }}>
            Schedule high-power loads (pumps, water heating, air conditioning) during this window.
          </p>
        </div>

        {/* Transparent Disclaimer */}
        <p className="text-muted mb-0" style={{ fontSize: '0.75rem', lineHeight: '1.35' }}>
          <em>Disclaimer:</em> Rough estimate assuming a 75% system performance ratio. Ignores panel tilt angle, ambient temperature derating, inverter clipping, and local shading.
        </p>
      </div>
    </div>
  )
}
