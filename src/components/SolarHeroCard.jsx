function outlookStyle(outlook) {
  switch (outlook) {
    case 'optimal':
      return { badge: 'text-bg-warning text-dark', icon: 'bi-sun-fill', text: 'text-warning' }
    case 'intermittent':
      return { badge: 'text-bg-info text-dark', icon: 'bi-cloud-sun-fill', text: 'text-info' }
    default:
      return { badge: 'text-bg-secondary', icon: 'bi-clouds-fill', text: 'text-secondary' }
  }
}

function toWITA(hourUtc) {
  const h = (hourUtc + 8) % 24
  return `${String(h).padStart(2, '0')}:00 WITA`
}

export default function SolarHeroCard({ summary, forecastDate }) {
  if (!summary) return null
  const { badge, icon, text } = outlookStyle(summary.outlook)

  const dateLabel = forecastDate
    ? new Date(forecastDate + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    : 'Latest Date'

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <div className="row align-items-center">

          {/* Left: Expected Daily Total & Actual */}
          <div className="col-12 col-md-5 mb-3 mb-md-0 text-center text-md-start">
            <p className="text-muted small mb-1 text-uppercase fw-semibold" style={{ letterSpacing: '0.05em' }}>
              Forecast for {dateLabel} · issued 00:00 WITA
            </p>
            <div className="d-flex align-items-end gap-2 justify-content-center justify-content-md-start">
              <span className="display-4 fw-bold text-warning lh-1">
                {summary.daily_insolation_kwh.toFixed(1)}
              </span>
              <span className="text-muted fs-5 pb-1">kWh/m²</span>
            </div>
            <p className="text-muted small mt-2 mb-0">
              Clear-sky ceiling: <strong>{summary.clear_sky_insolation_kwh?.toFixed(1) ?? '—'} kWh/m²</strong> (ratio: {(summary.outlook_ratio * 100).toFixed(0)}%)
            </p>
          </div>

          {/* Centre: Expected Outlook */}
          <div className="col-12 col-md-4 mb-3 mb-md-0 text-center">
            <i className={`bi ${icon} ${text}`} style={{ fontSize: '3rem' }} />
            <div className="mt-2">
              <span className={`badge fs-6 fw-semibold px-3 py-2 ${badge}`}>
                {summary.outlook_label}
              </span>
            </div>
            <p className="text-muted small mt-1 mb-0" style={{ fontSize: '0.78rem' }}>
              Expected solar condition
            </p>
          </div>

          {/* Right: Peak window */}
          <div className="col-12 col-md-3 text-center text-md-end">
            <div className="mb-2">
              <span className="text-muted small d-block">Peak Solar Hour</span>
              <span className="fs-5 fw-semibold">{toWITA(summary.peak_hour_utc)}</span>
            </div>
            <div>
              <span className="text-muted small d-block">Peak Irradiance</span>
              <span className="fs-5 fw-semibold">{summary.peak_irradiance_wm2.toFixed(0)}</span>
              <span className="text-muted"> W/m²</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
