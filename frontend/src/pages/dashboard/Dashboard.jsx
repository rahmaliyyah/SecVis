import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import ExportLaporan from '../../components/ExportLaporan'
import api from '../../api/axios'
import { isAdmin, getUser } from '../../utils/auth'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts'

const COLORS = ['#7aa2f7', '#f7768e', '#e0af68', '#9ece6a', '#bb9af7']
const jenisLabel = {
  'no-helmet' : 'No Helmet',
  'no-vest'   : 'No Vest',
  'no-boots'  : 'No Boots',
  'no-gloves' : 'No Gloves',
  'no-glasses': 'No Glasses',
}
const bulanList = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#13151f', border: '1px solid #1e2130', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#a0a8bc' }}>
      <div style={{ color: '#5a6070', marginBottom: '4px' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  )
}

const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null
  const R = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.58
  const x = cx + radius * Math.cos(-midAngle * R)
  const y = cy + radius * Math.sin(-midAngle * R)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="700">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const renderPieLegend = ({ payload }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', paddingLeft: '4px' }}>
    {payload.map((entry, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px' }}>
        <div style={{ width: '9px', height: '9px', borderRadius: '2px', background: entry.color, flexShrink: 0 }} />
        <span style={{ color: '#5a6070', flex: 1 }}>{jenisLabel[entry.value] ?? entry.value}</span>
        <span style={{ color: '#c8ccd8', fontFamily: "'DM Mono', monospace", fontWeight: '600', fontSize: '12px' }}>
          {entry.payload.total}
        </span>
      </div>
    ))}
  </div>
)

const renderBarLabel = ({ x, y, width, value }) => {
  if (!value) return null
  return (
    <text x={x + width / 2} y={y - 6} fill="#5a6070" textAnchor="middle" fontSize={11} fontWeight="600" fontFamily="'DM Mono', monospace">
      {value}
    </text>
  )
}

const cardStyle = { background: '#13151f', border: '1px solid #1e2130', borderRadius: '12px', padding: '20px 22px' }
const inputStyle = {
  background: '#0f1117', border: '1px solid #1e2130', borderRadius: '8px',
  padding: '7px 10px', fontSize: '12px', color: '#a0a8bc', outline: 'none',
  fontFamily: 'inherit', cursor: 'pointer',
}

export default function Dashboard() {
  const navigate  = useNavigate()
  const admin     = isAdmin()
  const now       = new Date()

  // Filter state
  const [tipe,    setTipe]    = useState('bulanan')
  const [tanggal, setTanggal] = useState(now.toISOString().split('T')[0])
  const [bulan,   setBulan]   = useState(now.getMonth() + 1)
  const [tahun,   setTahun]   = useState(now.getFullYear())

  // Data state
  const [summary,      setSummary]      = useState(null)
  const [trend,        setTrend]        = useState([])
  const [byShift,      setByShift]      = useState([])
  const [byType,       setByType]       = useState([])
  const [totalPeriode, setTotalPeriode] = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [chartLoading, setChartLoading] = useState(false)

  // Hitung rentang tanggal dari filter
  function getRange() {
    const fmt = d => d.toISOString().split('T')[0]
    if (tipe === 'harian') return { start: tanggal, end: tanggal, apiPeriode: 'harian' }
    if (tipe === 'bulanan') {
      const start = new Date(tahun, bulan - 1, 1)
      const end   = new Date(tahun, bulan, 0) // last day of month
      const today = fmt(now)
      return { start: fmt(start), end: fmt(end) > today ? today : fmt(end), apiPeriode: 'bulanan' }
    }
    // tahunan
    const start = new Date(tahun, 0, 1)
    const end   = new Date(tahun, 11, 31)
    const today = fmt(now)
    return { start: fmt(start), end: fmt(end) > today ? today : fmt(end), apiPeriode: 'bulanan' }
  }

  const fetchSummary = async () => {
    const res = await api.get('/dashboard/summary')
    setSummary(res.data.data)
  }

  const fetchCharts = async () => {
    setChartLoading(true)
    try {
      const { start, end, apiPeriode } = getRange()
      const [t, sh, ty] = await Promise.all([
        api.get(`/dashboard/trend?tanggal_mulai=${start}&tanggal_selesai=${end}`),
        api.get(`/dashboard/by-shift?periode=${apiPeriode}`),
        api.get(`/dashboard/by-type?periode=${apiPeriode}`),
      ])
      setTrend(t.data.data)
      setByShift(sh.data.data)
      setByType(ty.data.data)
      setTotalPeriode(t.data.data.reduce((acc, d) => acc + d.total, 0))
    } catch (err) {
      console.error(err)
    } finally {
      setChartLoading(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
    fetchCharts()
    const interval = setInterval(fetchSummary, 10000)
    return () => clearInterval(interval)
  }, [])

  // Re-fetch saat filter berubah
  useEffect(() => {
    if (!loading) fetchCharts()
  }, [tipe, tanggal, bulan, tahun])

  const periodeLabel = tipe === 'harian'
    ? tanggal
    : tipe === 'bulanan'
    ? `${bulanList[bulan - 1]} ${tahun}`
    : `Tahun ${tahun}`

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#3e4455', fontSize: '13px' }}>
        Memuat data...
      </div>
    </Layout>
  )

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        .chart-container { background: #13151f; border: 1px solid #1e2130; border-radius: 12px; padding: 20px 22px; }
        .chart-title { font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #3e4455; margin-bottom: 18px; }
        input[type=date]::-webkit-calendar-picker-indicator,
        input[type=number]::-webkit-inner-spin-button { filter: invert(0.3); cursor: pointer; }
        select option { background: #13151f; color: #a0a8bc; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#c8ccd8', margin: 0, letterSpacing: '-0.01em' }}>
              Dashboard Monitoring
            </h2>
            <p style={{ fontSize: '12px', color: '#3e4455', marginTop: '4px' }}>
              Area Maintenance · PT Epson Indonesia
            </p>
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {admin ? (
              <>
                <button
                  onClick={() => navigate('/cameras')}
                  style={{ background: '#13151f', color: '#9ece6a', border: '1px solid #1e2130', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                    <line x1="8" y1="12" x2="8" y2="12"/><line x1="12" y1="9" x2="12" y2="15"/><line x1="9" y1="12" x2="15" y2="12"/>
                  </svg>
                  Tambah Kamera
                </button>
                <button
                  onClick={() => navigate('/shifts')}
                  style={{ background: '#13151f', color: '#e0af68', border: '1px solid #1e2130', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    <line x1="12" y1="2" x2="12" y2="4"/>
                  </svg>
                  Tambah Shift
                </button>
                <ExportLaporan />
              </>
            ) : (
              <ExportLaporan />
            )}
          </div>
        </div>

        {/* Filter tanggal */}
        <div style={{ marginTop: '16px', background: '#13151f', border: '1px solid #1e2130', borderRadius: '12px', padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#3e4455', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Periode</span>

          {/* Tipe */}
          <div style={{ display: 'flex', gap: '4px', background: '#0f1117', borderRadius: '7px', padding: '3px' }}>
            {['harian', 'bulanan', 'tahunan'].map(t => (
              <button key={t} onClick={() => setTipe(t)} style={{
                padding: '5px 12px', borderRadius: '5px', border: 'none', fontSize: '12px', fontWeight: tipe === t ? '600' : '400',
                cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
                background: tipe === t ? '#1a2035' : 'transparent',
                color: tipe === t ? '#7aa2f7' : '#3e4455',
                transition: 'all 0.15s',
              }}>{t}</button>
            ))}
          </div>

          {/* Input kondisional */}
          {tipe === 'harian' && (
            <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} style={inputStyle} />
          )}
          {tipe === 'bulanan' && (
            <>
              <select value={bulan} onChange={e => setBulan(Number(e.target.value))} style={inputStyle}>
                {bulanList.map((b, i) => <option key={i} value={i + 1}>{b}</option>)}
              </select>
              <input type="number" value={tahun} onChange={e => setTahun(Number(e.target.value))} style={{ ...inputStyle, width: '80px' }} min="2020" max="2099" />
            </>
          )}
          {tipe === 'tahunan' && (
            <input type="number" value={tahun} onChange={e => setTahun(Number(e.target.value))} style={{ ...inputStyle, width: '80px' }} min="2020" max="2099" />
          )}

          <span style={{ fontSize: '11px', color: '#2a2f3f', marginLeft: 'auto', fontFamily: "'DM Mono', monospace" }}>
            {periodeLabel}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px', opacity: chartLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        <div style={{ ...cardStyle, border: '1px solid #2a3558' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3e4455', marginBottom: '8px' }}>
            {tipe === 'harian' ? 'Tanggal Dipilih' : tipe === 'bulanan' ? 'Bulan Dipilih' : 'Tahun Dipilih'}
          </div>
          <div style={{ fontSize: '32px', fontWeight: '600', color: '#7aa2f7', fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{totalPeriode}</div>
          <div style={{ fontSize: '11.5px', color: '#3e4455', marginTop: '6px' }}>pelanggaran terdeteksi</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3e4455', marginBottom: '8px' }}>Hari Ini</div>
          <div style={{ fontSize: '32px', fontWeight: '600', color: '#e0af68', fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{summary?.total_hari_ini ?? 0}</div>
          <div style={{ fontSize: '11.5px', color: '#3e4455', marginTop: '6px' }}>pelanggaran terdeteksi</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3e4455', marginBottom: '8px' }}>Bulan Ini</div>
          <div style={{ fontSize: '32px', fontWeight: '600', color: '#f7768e', fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{summary?.total_bulan_ini ?? 0}</div>
          <div style={{ fontSize: '11.5px', color: '#3e4455', marginTop: '6px' }}>pelanggaran terdeteksi</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3e4455', marginBottom: '8px' }}>Shift Terbanyak</div>
          <div style={{ fontSize: '22px', fontWeight: '600', color: '#bb9af7', fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{summary?.shift_terbanyak?.nama_shift ?? '-'}</div>
          <div style={{ fontSize: '11.5px', color: '#3e4455', marginTop: '6px' }}>{summary?.shift_terbanyak?.total_pelanggaran ?? 0} pelanggaran</div>
        </div>
      </div>

      {/* Tren */}
      <div className="chart-container" style={{ marginBottom: '16px', opacity: chartLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        <div className="chart-title">Tren Pelanggaran — {periodeLabel}</div>
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={trend} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
            <XAxis dataKey="tanggal" tick={{ fontSize: 10, fill: '#3e4455' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#3e4455' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="total" name="Pelanggaran" stroke="#7aa2f7" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#7aa2f7' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar + Pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', opacity: chartLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        <div className="chart-container">
          <div className="chart-title">Per Shift — {periodeLabel}</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={byShift} barSize={36} margin={{ top: 20, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" vertical={false} />
              <XAxis dataKey="nama_shift" tick={{ fontSize: 11, fill: '#3e4455' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#3e4455' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total_pelanggaran" name="Pelanggaran" radius={[5, 5, 0, 0]} label={renderBarLabel}>
                {byShift.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <div className="chart-title">Jenis Pelanggaran — {periodeLabel}</div>
          {byType.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '210px', color: '#3e4455', fontSize: '13px' }}>
              Tidak ada data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={byType} dataKey="total" nameKey="jenis_pelanggaran" cx="38%" cy="50%" outerRadius={82} innerRadius={36} labelLine={false} label={renderPieLabel}>
                  {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend layout="vertical" align="right" verticalAlign="middle" content={renderPieLegend} />
                <Tooltip content={<CustomTooltip />} formatter={(val, name) => [val, jenisLabel[name] ?? name]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Layout>
  )
}