const TARGET = { id: '+0_+0', lat: -10.17, lon: 123.67, rank: 0, label: 'Kupang Target P' }

function SiteCard({ id, lat, lon, rank, label, isTarget }) {
  return (
    <div className={`card h-100 border-0 shadow-sm ${isTarget ? 'border-warning border-2' : ''}`}
         style={isTarget ? { borderStyle: 'solid' } : {}}>
      <div className="card-body p-3 text-center">
        {isTarget
          ? <i className="bi bi-crosshair text-warning fs-4" />
          : <i className="bi bi-broadcast text-secondary fs-4" />
        }
        <p className={`fw-semibold mb-0 mt-1 ${isTarget ? 'text-warning' : ''}`}>
          {isTarget ? 'Kupang (P)' : `Neighbor ${rank}`}
        </p>
        <p className="text-muted small mb-1">{id}</p>
        <p className="text-muted mb-1" style={{ fontSize: '0.78rem' }}>
          {lat.toFixed(2)}°, {lon.toFixed(2)}°
        </p>
        {!isTarget ? (
          <span className="badge text-bg-secondary" style={{ fontSize: '0.7rem' }}>
            Rank #{rank} (Gain)
          </span>
        ) : (
          <span className="badge text-bg-warning text-dark" style={{ fontSize: '0.7rem' }}>
            Primary Site
          </span>
        )}
      </div>
    </div>
  )
}

export default function NeighborGrid({ neighbors }) {
  const sites = neighbors || []

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body p-4">
        <h6 className="card-title fw-semibold text-muted text-uppercase small mb-3">
          <i className="bi bi-diagram-3 me-1" />
          Multi-Site Spatial Grid Network
        </h6>
        <div className="row g-2">
          <div className="col-6">
            <SiteCard {...TARGET} isTarget />
          </div>
          {sites.map(n => (
            <div className="col-6" key={n.id}>
              <SiteCard {...n} isTarget={false} />
            </div>
          ))}
        </div>
        <p className="text-muted mt-3 mb-0" style={{ fontSize: '0.78rem' }}>
          <i className="bi bi-info-circle me-1" />
          Neighbor ordering strictly follows <code>selected_dataset.csv</code> columns (Pearson, Spearman, and XGBoost feature importance rank).
        </p>
      </div>
    </div>
  )
}
