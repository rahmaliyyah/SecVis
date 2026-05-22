import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import ExportLaporan from '../../components/ExportLaporan'
import api from '../../api/axios'
import { isAdmin } from '../../utils/auth'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts'

const C = {
  primary: '#003399', primaryLight: '#e8eef8',
  secondary: '#FF8800', border: '#e4e8f0',
  textMain: '#1a2340', textSub: '#7a85a0', textMuted: '#b0bac8',
  card: '#ffffff', bg: '#f4f6fb',
}
const COLORS = ['#003399', '#FF8800', '#751D00', '#164194', '#5b8dee', '#e07b00']
const jenisLabel = {
  'no-helmet':'No Helmet','no-vest':'No Vest','no-boots':'No Boots',
  'no-gloves':'No Gloves','no-glasses':'No Glasses',
}
const bulanList = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '10px 14px', fontSize: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ color: C.textMuted, marginBottom: '4px' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: <strong style={{ color: C.textMain }}>{p.value}</strong></div>
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
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="700">{`${(percent*100).toFixed(0)}%`}</text>
}

const renderPieLegend = ({ payload }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', paddingLeft: '4px' }}>
    {payload.map((entry, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px' }}>
        <div style={{ width: '9px', height: '9px', borderRadius: '2px', background: entry.color, flexShrink: 0 }} />
        <span style={{ color: C.textSub, flex: 1 }}>{jenisLabel[entry.value] ?? entry.value}</span>
        <span style={{ color: C.textMain, fontFamily: "'DM Mono', monospace", fontWeight: '600', fontSize: '12px' }}>{entry.payload.total}</span>
      </div>
    ))}
  </div>
)

const renderBarLabel = ({ x, y, width, value }) => {
  if (!value) return null
  return <text x={x + width / 2} y={y - 6} fill={C.textSub} textAnchor="middle" fontSize={11} fontWeight="600" fontFamily="'DM Mono', monospace">{value}</text>
}

const inputStyle = {
  background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: '7px',
  padding: '6px 10px', fontSize: '12px', color: C.textMain,
  outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const admin    = isAdmin()
  const now      = new Date()

  const [tipe,    setTipe]    = useState('bulanan')
  const [tanggal, setTanggal] = useState(now.toISOString().split('T')[0])
  const [bulan,   setBulan]   = useState(now.getMonth() + 1)
  const [tahun,   setTahun]   = useState(now.getFullYear())

  const [summary,      setSummary]      = useState(null)
  const [trend,        setTrend]        = useState([])
  const [byShift,      setByShift]      = useState([])
  const [byType,       setByType]       = useState([])
  const [totalPeriode, setTotalPeriode] = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [chartLoading, setChartLoading] = useState(false)

  function getRange() {
    const fmt = d => d.toISOString().split('T')[0]
    const today = fmt(now)
    if (tipe === 'harian') return { start: tanggal, end: tanggal, apiPeriode: 'harian' }
    if (tipe === 'bulanan') {
      const start = new Date(tahun, bulan - 1, 1)
      const end   = new Date(tahun, bulan, 0)
      return { start: fmt(start), end: fmt(end) > today ? today : fmt(end), apiPeriode: 'bulanan' }
    }
    const start = new Date(tahun, 0, 1)
    const end   = new Date(tahun, 11, 31)
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
      setTrend(t.data.data); setByShift(sh.data.data); setByType(ty.data.data)
      setTotalPeriode(t.data.data.reduce((acc, d) => acc + d.total, 0))
    } catch (err) { console.error(err) }
    finally { setChartLoading(false); setLoading(false) }
  }

  useEffect(() => { fetchSummary(); fetchCharts(); const i = setInterval(fetchSummary, 10000); return () => clearInterval(i) }, [])
  useEffect(() => { if (!loading) fetchCharts() }, [tipe, tanggal, bulan, tahun])

  const periodeLabel = tipe === 'harian' ? tanggal : tipe === 'bulanan' ? `${bulanList[bulan-1]} ${tahun}` : `Tahun ${tahun}`

  const kpiCards = [
    { label: tipe === 'harian' ? 'Tanggal Dipilih' : tipe === 'bulanan' ? 'Bulan Dipilih' : 'Tahun Dipilih', value: totalPeriode, color: C.primary, highlight: true },
    { label: 'Hari Ini',   value: summary?.total_hari_ini  ?? 0, color: C.secondary },
    { label: 'Bulan Ini',  value: summary?.total_bulan_ini ?? 0, color: '#751D00'   },
    { label: 'Shift Terbanyak', value: summary?.shift_terbanyak?.nama_shift ?? '-', color: '#164194', isText: true, sub: `${summary?.shift_terbanyak?.total_pelanggaran ?? 0} pelanggaran` },
  ]

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: C.textMuted, fontSize: '13px' }}>Memuat data...</div>
    </Layout>
  )

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        .chart-card { background: #fff; border: 1px solid ${C.border}; border-radius: 12px; padding: 20px 22px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
        .chart-title { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: ${C.textMuted}; margin-bottom: 18px; }
        input[type=date]::-webkit-calendar-picker-indicator,
        input[type=number]::-webkit-inner-spin-button { filter: none; cursor: pointer; }
        select option { background: #fff; color: ${C.textMain}; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: C.textMain, margin: 0 }}>Dashboard Monitoring</h2>
            <p style={{ fontSize: '12px', color: C.textSub, marginTop: '3px' }}>Area Maintenance · PT Epson Indonesia</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {admin ? (
              <>
                <button onClick={() => navigate('/cameras')} style={{ background: '#fff', color: '#059669', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  + Kamera
                </button>
                <button onClick={() => navigate('/shifts')} style={{ background: '#fff', color: C.secondary, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  + Shift
                </button>
                <ExportLaporan />
              </>
            ) : (
              <ExportLaporan />
            )}
          </div>
        </div>

        {/* Filter */}
        <div style={{ marginTop: '16px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Periode</span>
          <div style={{ display: 'flex', gap: '3px', background: C.bg, borderRadius: '7px', padding: '3px' }}>
            {['harian','bulanan','tahunan'].map(t => (
              <button key={t} onClick={() => setTipe(t)} style={{
                padding: '5px 12px', borderRadius: '5px', border: 'none', fontSize: '12px',
                fontWeight: tipe === t ? '600' : '400', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
                background: tipe === t ? '#fff' : 'transparent',
                color: tipe === t ? C.primary : C.textSub,
                boxShadow: tipe === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}>{t}</button>
            ))}
          </div>
          {tipe === 'harian' && <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} style={inputStyle} />}
          {tipe === 'bulanan' && (
            <>
              <select value={bulan} onChange={e => setBulan(Number(e.target.value))} style={inputStyle}>
                {bulanList.map((b, i) => <option key={i} value={i+1}>{b}</option>)}
              </select>
              <input type="number" value={tahun} onChange={e => setTahun(Number(e.target.value))} style={{ ...inputStyle, width: '80px' }} min="2020" max="2099" />
            </>
          )}
          {tipe === 'tahunan' && <input type="number" value={tahun} onChange={e => setTahun(Number(e.target.value))} style={{ ...inputStyle, width: '80px' }} min="2020" max="2099" />}
          <span style={{ fontSize: '11px', color: C.textMuted, marginLeft: 'auto', fontFamily: "'DM Mono', monospace" }}>{periodeLabel}</span>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px', opacity: chartLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
        {kpiCards.map((k, i) => (
          <div key={i} style={{ background: k.highlight ? C.primary : '#fff', border: `1px solid ${k.highlight ? C.primary : C.border}`, borderRadius: '12px', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
            {!k.highlight && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: k.color }} />}
            <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', color: k.highlight ? 'rgba(255,255,255,0.7)' : C.textMuted, marginBottom: '8px' }}>{k.label}</div>
            <div style={{ fontSize: k.isText ? '20px' : '30px', fontWeight: '700', color: k.highlight ? '#fff' : k.color, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: '11px', color: k.highlight ? 'rgba(255,255,255,0.6)' : C.textMuted, marginTop: '6px' }}>{k.sub ?? 'pelanggaran terdeteksi'}</div>
          </div>
        ))}
      </div>

      {/* Tren */}
      <div className="chart-card" style={{ marginBottom: '16px', opacity: chartLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
        <div className="chart-title">Tren Pelanggaran — {periodeLabel}</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trend} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="tanggal" tick={{ fontSize: 10, fill: C.textMuted }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: C.textMuted }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="total" name="Pelanggaran" stroke={C.primary} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: C.primary }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar + Pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', opacity: chartLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
        <div className="chart-card">
          <div className="chart-title">Per Shift — {periodeLabel}</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byShift} barSize={36} margin={{ top: 20, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="nama_shift" tick={{ fontSize: 11, fill: C.textSub }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: C.textMuted }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total_pelanggaran" name="Pelanggaran" radius={[5,5,0,0]} label={renderBarLabel}>
                {byShift.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">Jenis Pelanggaran — {periodeLabel}</div>
          {byType.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: C.textMuted, fontSize: '13px' }}>Tidak ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byType} dataKey="total" nameKey="jenis_pelanggaran" cx="38%" cy="50%" outerRadius={80} innerRadius={34} labelLine={false} label={renderPieLabel}>
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