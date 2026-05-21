import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#7aa2f7', '#f7768e', '#e0af68', '#9ece6a', '#bb9af7']

const jenisLabel = {
  'no-helmet'  : 'No Helmet',
  'no-vest'    : 'No Vest',
  'no-boots'   : 'No Boots',
  'no-gloves'  : 'No Gloves',
  'no-glasses' : 'No Glasses',
}

const cardStyle = {
  background: '#13151f',
  border: '1px solid #1e2130',
  borderRadius: '12px',
  padding: '20px 22px',
}

const labelStyle = {
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#3e4455',
  marginBottom: '8px',
}

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

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState([])
  const [byShift, setByShift] = useState([])
  const [byType, setByType] = useState([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const fetchAll = async () => {
    try {
      const [s, t, sh, ty] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get(`/dashboard/trend?tanggal_mulai=${sevenDaysAgo}&tanggal_selesai=${today}`),
        api.get('/dashboard/by-shift?periode=bulanan'),
        api.get('/dashboard/by-type?periode=bulanan'),
      ])
      setSummary(s.data.data)
      setTrend(t.data.data)
      setByShift(sh.data.data)
      setByType(ty.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    const interval = setInterval(() => {
      api.get('/dashboard/summary').then(res => setSummary(res.data.data))
    }, 10000)
    return () => clearInterval(interval)
  }, [])

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
        .chart-container { background: #13151f; border: 1px solid #1e2130; border-radius: 12px; padding: 20px 22px; }
        .chart-title { font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #3e4455; margin-bottom: 18px; }
      `}</style>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#c8ccd8', margin: 0, letterSpacing: '-0.01em' }}>
          Dashboard Monitoring
        </h2>
        <p style={{ fontSize: '12px', color: '#3e4455', marginTop: '4px' }}>
          Area Maintenance · PT Epson Indonesia
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        <div style={cardStyle}>
          <div style={labelStyle}>Hari Ini</div>
          <div style={{ fontSize: '32px', fontWeight: '600', color: '#7aa2f7', fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
            {summary?.total_hari_ini ?? 0}
          </div>
          <div style={{ fontSize: '11.5px', color: '#3e4455', marginTop: '6px' }}>pelanggaran terdeteksi</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Minggu Ini</div>
          <div style={{ fontSize: '32px', fontWeight: '600', color: '#e0af68', fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
            {summary?.total_minggu_ini ?? 0}
          </div>
          <div style={{ fontSize: '11.5px', color: '#3e4455', marginTop: '6px' }}>pelanggaran terdeteksi</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Bulan Ini</div>
          <div style={{ fontSize: '32px', fontWeight: '600', color: '#f7768e', fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
            {summary?.total_bulan_ini ?? 0}
          </div>
          <div style={{ fontSize: '11.5px', color: '#3e4455', marginTop: '6px' }}>pelanggaran terdeteksi</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Shift Terbanyak</div>
          <div style={{ fontSize: '22px', fontWeight: '600', color: '#bb9af7', fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
            {summary?.shift_terbanyak?.nama_shift ?? '-'}
          </div>
          <div style={{ fontSize: '11.5px', color: '#3e4455', marginTop: '6px' }}>
            {summary?.shift_terbanyak?.total_pelanggaran ?? 0} pelanggaran
          </div>
        </div>
      </div>

      {/* Tren */}
      <div className="chart-container" style={{ marginBottom: '20px' }}>
        <div className="chart-title">Tren Pelanggaran - 7 Hari Terakhir</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
            <XAxis dataKey="tanggal" tick={{ fontSize: 11, fill: '#3e4455' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#3e4455' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="total" name="Pelanggaran" stroke="#7aa2f7" strokeWidth={2} dot={{ r: 3, fill: '#7aa2f7' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per Shift & Per Jenis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div className="chart-container">
          <div className="chart-title">Per Shift - Bulan Ini</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byShift} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" vertical={false} />
              <XAxis dataKey="nama_shift" tick={{ fontSize: 11, fill: '#3e4455' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#3e4455' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total_pelanggaran" name="Pelanggaran" fill="#7aa2f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-container">
          <div className="chart-title">Jenis Pelanggaran - Bulan Ini</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byType} dataKey="total" nameKey="jenis_pelanggaran" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend
                formatter={(value) => <span style={{ fontSize: '11px', color: '#5a6070' }}>{jenisLabel[value] ?? value}</span>}
              />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  )
}