function pct(val) {
  return `${(val * 100).toFixed(1)}%`
}

function SkillBadge({ value }) {
  const good = value > 0
  return (
    <span className={`badge ${good ? 'text-bg-success' : 'text-bg-danger'}`}>
      {good ? '+' : ''}{pct(value)}
    </span>
  )
}

export default function MetricsCard({ metrics }) {
  if (!metrics) return null

  // Show only test-split rows (2025 unseen test year)
  const testRows = metrics.filter(m => m.split === 'test')
  if (testRows.length === 0) return null

  const modelOrder = ['persistence', 'climatology', 'lightgbm']
  const sorted = [...testRows].sort(
    (a, b) => modelOrder.indexOf(a.model) - modelOrder.indexOf(b.model)
  )

  const modelLabels = {
    persistence: 'Persistence (same as yesterday)',
    climatology: 'Climatology (seasonal average)',
    lightgbm: 'LightGBM Multi-Site (ours)',
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
          <h6 className="card-title fw-semibold text-muted text-uppercase small mb-0">
            <i className="bi bi-graph-up me-1" />
            Model Accuracy Benchmark · Test Year (2025)
          </h6>
          <span className="badge text-bg-light border text-muted">
            Uncertainty coverage: ~70.9% within Q10–Q90
          </span>
        </div>
        <p className="text-muted small mb-3">
          Evaluated strictly on held-out test year 2025 (4,054 daylight hours). Skill score = 1 − RMSE / RMSE_baseline (positive = outperforms reference).
        </p>

        <div className="table-responsive">
          <table className="table table-sm table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Model</th>
                <th className="text-end">RMSE (W/m²)</th>
                <th className="text-end">MAE (W/m²)</th>
                <th className="text-end">vs. Yesterday</th>
                <th className="text-end">vs. Seasonal Avg</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(row => (
                <tr key={row.model}
                    className={row.model === 'lightgbm' ? 'table-warning fw-semibold' : ''}>
                  <td>{modelLabels[row.model] ?? row.model}</td>
                  <td className="text-end">{row.rmse.toFixed(1)}</td>
                  <td className="text-end">{row.mae.toFixed(1)}</td>
                  <td className="text-end">
                    {row.model === 'persistence'
                      ? <span className="text-muted">—</span>
                      : <SkillBadge value={row.skill_vs_persistence} />}
                  </td>
                  <td className="text-end">
                    {row.model === 'climatology'
                      ? <span className="text-muted">—</span>
                      : <SkillBadge value={row.skill_vs_climatology} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.78rem' }}>
          * Evaluated on hourly NASA POWER satellite-derived data. Shaded band captures ~70.9% of real-world test measurements.
        </p>
      </div>
    </div>
  )
}
