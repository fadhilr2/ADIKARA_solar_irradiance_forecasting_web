import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
)

function witaLabel(hourUtc) {
  return `${String((hourUtc + 8) % 24).padStart(2, '0')}:00`
}

export default function DiurnalChart({ hourly }) {
  if (!hourly || hourly.length === 0) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center text-muted py-5">No forecast data available.</div>
      </div>
    )
  }

  // Chronological sort
  const sorted = [...hourly].sort((a, b) => a.step - b.step)

  const labels     = sorted.map(h => witaLabel(h.hour_utc))
  const clrData    = sorted.map(h => h.clear_sky_wm2)
  const meanData   = sorted.map(h => h.forecast_mean_wm2)
  const q10Data    = sorted.map(h => h.q10_wm2)
  const q90Data    = sorted.map(h => h.q90_wm2)

  const datasets = [
    // 1. Uncertainty Ribbon upper boundary (Q90 fills toward Q10)
    {
      label: 'Q90 Bound',
      data: q90Data,
      fill: '+1',
      backgroundColor: 'rgba(253, 126, 20, 0.16)',
      borderColor: 'transparent',
      pointRadius: 0,
      tension: 0.35,
    },
    // 2. Uncertainty Ribbon lower boundary (Q10)
    {
      label: 'Q10 Bound',
      data: q10Data,
      fill: false,
      borderColor: 'transparent',
      pointRadius: 0,
      tension: 0.35,
    },
    // 3. Clear-sky astronomical ceiling (dashed line)
    {
      label: 'Clear-sky max',
      data: clrData,
      fill: false,
      borderColor: '#adb5bd',
      borderDash: [5, 4],
      borderWidth: 1.5,
      pointRadius: 0,
      tension: 0.35,
    },
    // 4. Forecast mean (orange line)
    {
      label: 'Forecast (mean)',
      data: meanData,
      fill: false,
      borderColor: '#fd7e14',
      backgroundColor: '#fd7e14',
      borderWidth: 2.5,
      pointRadius: 3.5,
      pointHoverRadius: 6,
      tension: 0.35,
    },
  ]

  const data = { labels, datasets }

  const options = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          filter: item => !['Q90 Bound', 'Q10 Bound'].includes(item.text),
          usePointStyle: true,
          boxWidth: 10,
          font: { size: 12 },
        },
      },
      title: {
        display: true,
        text: 'Hourly Daylight Solar Irradiance Forecast (WITA)',
        font: { size: 14, weight: '600' },
        color: '#495057',
        padding: { bottom: 12 },
      },
      tooltip: {
        callbacks: {
          title: ctx => `${ctx[0].label} WITA`,
          label: ctx => {
            if (ctx.dataset.label === 'Q90 Bound') return `Likely range high: ${ctx.parsed.y} W/m²`
            if (ctx.dataset.label === 'Q10 Bound') return `Likely range low: ${ctx.parsed.y} W/m²`
            return `${ctx.dataset.label}: ${ctx.parsed.y} W/m²`
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Local Time (WITA)', color: '#6c757d', font: { size: 12 } },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      y: {
        title: { display: true, text: 'Solar Irradiance (W/m²)', color: '#6c757d', font: { size: 12 } },
        min: 0,
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
    },
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <Line data={data} options={options} />
        <div className="d-flex flex-wrap justify-content-center gap-3 mt-3 text-muted small">
          <span>
            <span style={{ display: 'inline-block', width: 20, borderTop: '2.5px solid #fd7e14', verticalAlign: 'middle', marginRight: 5 }} />
            Forecast (mean)
          </span>
          <span>
            <span style={{ display: 'inline-block', width: 20, borderTop: '1.5px dashed #adb5bd', verticalAlign: 'middle', marginRight: 5 }} />
            Clear-sky ceiling
          </span>
          <span>
            <span style={{ display: 'inline-block', width: 16, height: 10, background: 'rgba(253,126,20,0.2)', verticalAlign: 'middle', marginRight: 5 }} />
            Likely range (Q10–Q90)
          </span>
        </div>
      </div>
    </div>
  )
}
