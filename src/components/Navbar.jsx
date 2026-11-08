import { useState, useEffect } from 'react'

const DISTRICTS = [
  { id: 'kupang_kota', name: 'Kota Kupang (NTT)', coords: '−10.17°, 123.67°', active: true },
  { id: 'kab_kupang', name: 'Kab. Kupang (Oelamasi)', coords: 'Segera hadir', active: false },
  { id: 'kab_tts', name: 'Kab. Timor Tengah Selatan', coords: 'Segera hadir', active: false },
  { id: 'kab_rote', name: 'Kab. Rote Ndao', coords: 'Segera hadir', active: false },
  { id: 'kab_sumba', name: 'Kab. Sumba Timur', coords: 'Segera hadir', active: false },
]

export default function Navbar({ dataAsOf }) {
  const [time, setTime] = useState(getWITA())
  const [selectedDistrict, setSelectedDistrict] = useState('kupang_kota')

  useEffect(() => {
    const id = setInterval(() => setTime(getWITA()), 1000)
    return () => clearInterval(id)
  }, [])

  const currentDistrict = DISTRICTS.find(d => d.id === selectedDistrict) || DISTRICTS[0]

  const asOfLabel = dataAsOf
    ? new Date(dataAsOf).toLocaleString('id-ID', {
        timeZone: 'Asia/Makassar',
        dateStyle: 'medium',
        timeStyle: 'short',
      }) + ' WITA'
    : 'Data Terbitan Terakhir'

  return (
    <nav className="navbar navbar-dark bg-dark px-3 py-2 border-bottom border-secondary">
      <div className="container-lg d-flex align-items-center justify-content-between flex-wrap gap-2">

        {/* Brand & District Selector */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="navbar-brand d-flex align-items-center gap-2 mb-0 me-2">
            <i className="bi bi-sun-fill text-warning fs-5" />
            <span className="fw-bold tracking-wide">Prakiraan Solar Forecast</span>
          </span>

          {/* District Dropdown Selector */}
          <div className="input-group input-group-sm" style={{ width: 'auto' }}>
            <span className="input-group-text bg-secondary border-secondary text-light py-1 px-2">
              <i className="bi bi-geo-alt-fill text-danger me-1" />
              Wilayah
            </span>
            <select
              className="form-select form-select-sm bg-dark text-light border-secondary py-1"
              style={{ fontSize: '0.82rem', cursor: 'pointer', maxWidth: '240px' }}
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              {DISTRICTS.map((dist) => (
                <option key={dist.id} value={dist.id} disabled={!dist.active}>
                  {dist.name} {!dist.active ? '(Coming Soon)' : ''}
                </option>
              ))}
            </select>
          </div>

          <span className="badge text-bg-secondary fw-normal d-none d-sm-inline" style={{ fontSize: '0.72rem' }}>
            {currentDistrict.coords}
          </span>
        </div>

        {/* Right side: Data as of pill, Prototype badge, Clock */}
        <div className="d-flex align-items-center gap-2 gap-sm-3 flex-wrap ms-auto">
          <span className="badge text-bg-dark border border-secondary text-secondary fw-normal d-none d-md-inline">
            <i className="bi bi-clock-history me-1" />
            Data as of: {asOfLabel}
          </span>
          <span className="badge text-bg-warning text-dark fw-semibold">
            Prototype · baseline model
          </span>
          <span className="text-light fw-medium small ps-1">
            {time} WITA
          </span>
        </div>

      </div>
    </nav>
  )
}

function getWITA() {
  return new Date().toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Makassar',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}
