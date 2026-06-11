import { useState, useEffect, useRef, useCallback } from 'react'
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
  primary:'#003399', primaryLight:'#e8eef8', secondary:'#FF8800',
  border:'#e4e8f0', textMain:'#1a2340', textSub:'#7a85a0', textMuted:'#b0bac8',
}
const COLORS = ['#003399','#FF8800','#751D00','#164194','#5b8dee','#e07b00']
const jenisLabel = {
  'no-helmet':'No Helmet','no-vest':'No Vest','no-boots':'No Boots',
  'no-gloves':'No Gloves','no-glasses':'No Glasses',
}
const bulanList = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

const Tooltip_ = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:'8px', padding:'10px 14px', fontSize:'12px', boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ color:C.textMuted, marginBottom:'4px' }}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{ color:p.color }}>{p.name}: <strong style={{ color:C.textMain }}>{p.value}</strong></div>)}
    </div>
  )
}

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null
  const R = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.58
  const x = cx + r * Math.cos(-midAngle * R)
  const y = cy + r * Math.sin(-midAngle * R)
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="700">{`${(percent*100).toFixed(0)}%`}</text>
}

const PieLegend = ({ payload }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:'7px', paddingLeft:'4px' }}>
    {(payload || []).map((entry, i) => (
      <div key={i} style={{ display:'flex', alignItems:'center', gap:'7px', fontSize:'11px' }}>
        <div style={{ width:'9px', height:'9px', borderRadius:'2px', background:entry.color, flexShrink:0 }} />
        <span style={{ color:C.textSub, flex:1 }}>{jenisLabel[entry.value] ?? entry.value}</span>
        <span style={{ color:C.textMain, fontFamily:'monospace', fontWeight:'600', fontSize:'12px' }}>{entry.payload?.total ?? 0}</span>
      </div>
    ))}
  </div>
)

const BarLabel = ({ x, y, width, value }) => {
  if (!value) return null
  return <text x={x + width/2} y={y - 6} fill={C.textMuted} textAnchor="middle" fontSize={11} fontWeight="600">{value}</text>
}

export default function Dashboard() {
  const navigate    = useNavigate()
  const admin       = isAdmin()
  const intervalId  = useRef(null)
  const chartIntRef = useRef(null)
  const STREAM_URL  = 'http://localhost:5001/stream'
  const [camOnline, setCamOnline] = useState(false)

  useEffect(() => {
    const check = () => {
      fetch('http://localhost:5001/status')
        .then(() => setCamOnline(true))
        .catch(() => setCamOnline(false))
    }
    check()
    const i = setInterval(check, 8000)
    return () => clearInterval(i)
  }, [])

  const [mode,         setMode]         = useState('live')
  const [cameras,      setCameras]      = useState([])
  const [filterCamera, setFilterCamera] = useState('')
  const [lastUpdate,   setLastUpdate]   = useState('')

  const [tipe,    setTipe]    = useState('bulanan')
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split('T')[0])
  const [bulan,   setBulan]   = useState(() => new Date().getMonth() + 1)
  const [tahun,   setTahun]   = useState(() => new Date().getFullYear())

  const [summary,      setSummary]      = useState(null)
  const [trend,        setTrend]        = useState([])
  const [byShift,      setByShift]      = useState([])
  const [byType,       setByType]       = useState([])
  const [totalPeriode, setTotalPeriode] = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [chartLoading, setChartLoading] = useState(false)

  useEffect(() => {
    api.get('/cameras').then(r => {
      const d = r.data.data
      setCameras(Array.isArray(d) ? d : [])
    }).catch(() => {})
  }, [])

  const getToday = () => new Date().toISOString().split('T')[0]

  const fetchSummary = useCallback(async () => {
    try {
      const r = await api.get('/dashboard/summary')
      setSummary(r.data.data)
    } catch {}
  }, [])

  const fetchCharts = useCallback(async (opts = {}) => {
    setChartLoading(true)
    try {
      const today = getToday()
      let params = {}

      if (opts.mode === 'live' || (opts.mode === undefined && mode === 'live')) {
        params = {
          tanggal_mulai: today, tanggal_selesai: today,
          periode: 'harian', tanggal: today,
        }
        const ca = opts.filterCamera !== undefined ? opts.filterCamera : filterCamera
        if (ca) params.camera_id = ca
      } else {
        const t = opts.tipe    ?? tipe
        const b = opts.bulan   ?? bulan
        const y = opts.tahun   ?? tahun
        const d = opts.tanggal ?? tanggal
        const fmt = dt => dt.toISOString().split('T')[0]
        let start, end, apiPeriode
        if (t === 'harian') {
          start = d; end = d; apiPeriode = 'harian'
        } else if (t === 'bulanan') {
          start = fmt(new Date(y, b - 1, 1))
          const e = new Date(y, b, 0)
          end = fmt(e) > today ? today : fmt(e)
          apiPeriode = 'bulanan'
        } else {
          start = fmt(new Date(y, 0, 1))
          const e = new Date(y, 11, 31)
          end = fmt(e) > today ? today : fmt(e)
          apiPeriode = 'tahunan'
        }
        params = { tanggal_mulai: start, tanggal_selesai: end, periode: apiPeriode }
      }

      const [t1, sh, ty] = await Promise.all([
        api.get('/dashboard/trend',    { params }),
        api.get('/dashboard/by-shift', { params }),
        api.get('/dashboard/by-type',  { params }),
      ])
      setTrend(t1.data.data   || [])
      setByShift(sh.data.data || [])
      setByType(ty.data.data  || [])
      setTotalPeriode((t1.data.data || []).reduce((s, d) => s + d.total, 0))
      setLastUpdate(new Date().toLocaleTimeString('id-ID'))
    } catch (err) {
      console.error('fetchCharts error:', err)
    } finally {
      setChartLoading(false)
      setLoading(false)
    }
  }, [mode, filterCamera, tipe, bulan, tahun, tanggal])

  useEffect(() => {
    clearInterval(intervalId.current)
    clearInterval(chartIntRef.current)
    fetchSummary()
    fetchCharts({ mode })
    if (mode === 'live') {
      intervalId.current = setInterval(() => {
        fetchSummary()
      }, 3000)
      chartIntRef.current = setInterval(() => {
        fetchCharts({ mode: 'live' })
      }, 15000)
    }
    return () => {
      clearInterval(intervalId.current)
      clearInterval(chartIntRef.current)
    }
  }, [mode]) // eslint-disable-line

  useEffect(() => {
    if (mode === 'live' && !loading) {
      fetchCharts({ mode: 'live', filterCamera })
    }
  }, [filterCamera]) // eslint-disable-line

  useEffect(() => {
    if (mode === 'periode' && !loading) {
      fetchCharts({ mode: 'periode', tipe, tanggal, bulan, tahun })
    }
  }, [tipe, tanggal, bulan, tahun]) // eslint-disable-line

  const periodeLabel = mode === 'live' ? 'Hari Ini'
    : tipe === 'harian'  ? tanggal
    : tipe === 'bulanan' ? `${bulanList[bulan - 1]} ${tahun}`
    : `Tahun ${tahun}`

  const card    = { background:'#fff', border:`1px solid ${C.border}`, borderRadius:'12px', padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', position:'relative', overflow:'hidden' }
  const inStyle = { background:'#fff', border:`1.5px solid ${C.border}`, borderRadius:'7px', padding:'6px 10px', fontSize:'12px', color:C.textMain, outline:'none', fontFamily:'inherit' }

  if (loading) return (
    <Layout>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:C.textMuted, fontSize:'13px' }}>
        Memuat data...
      </div>
    </Layout>
  )

  const shiftTerbanyak = byShift.find(s => (s.total_pelanggaran ?? 0) > 0)

  const kpiCards = mode === 'live' ? [
    { label:'Live Hari Ini',   value: summary?.total_hari_ini  ?? 0, color:C.primary,  highlight:true },
    { label:'Hari Ini',        value: summary?.total_hari_ini  ?? 0, color:C.secondary },
    { label:'Bulan Ini',       value: summary?.total_bulan_ini ?? 0, color:'#751D00'   },
    { label:'Shift Terbanyak', value: summary?.shift_terbanyak?.nama_shift ?? '-', color:'#164194', isText:true, sub:`${summary?.shift_terbanyak?.total_pelanggaran ?? 0} pelanggaran` },
  ] : [
    { label: tipe==='harian'?'Tanggal Dipilih':tipe==='bulanan'?'Bulan Dipilih':'Tahun Dipilih', value: totalPeriode, color:C.primary, highlight:true },
    { label:'Shift Terbanyak', value: shiftTerbanyak?.nama_shift ?? '-', color:'#164194', isText:true, sub:`${shiftTerbanyak?.total_pelanggaran ?? 0} pelanggaran` },
  ]

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        .cc { background:#fff; border:1px solid ${C.border}; border-radius:12px; padding:20px 22px; box-shadow:0 1px 4px rgba(0,0,0,0.04); }
        .ct { font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:${C.textMuted}; margin-bottom:18px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .pulse { animation:pulse 1.8s ease-in-out infinite; }
        select,input { cursor:pointer; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
        <div>
          <h2 style={{ fontSize:'18px', fontWeight:'700', color:C.textMain, margin:0 }}>Dashboard Monitoring Kelengkapan APD</h2>
          <p style={{ fontSize:'12px', color:C.textSub, marginTop:'3px' }}> PT Epson Indonesia</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          {admin && <>
            <button onClick={() => navigate('/cameras')} style={{ background:'#fff', color:'#059669', border:`1px solid ${C.border}`, borderRadius:'8px', padding:'8px 14px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>+ Kamera</button>
            <button onClick={() => navigate('/shifts')}  style={{ background:'#fff', color:C.secondary, border:`1px solid ${C.border}`, borderRadius:'8px', padding:'8px 14px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>+ Shift</button>
          </>}
          <ExportLaporan />
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:'12px', padding:'12px 16px', marginBottom:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:'3px', background:'#f4f6fb', borderRadius:'8px', padding:'3px', flexShrink:0 }}>
            {[
              { key:'live',    label:'● Live' },
              { key:'periode', label:'Periode' },
            ].map(m => (
              <button key={m.key} onClick={() => setMode(m.key)} style={{ padding:'6px 14px', borderRadius:'6px', border:'none', fontSize:'12px', fontWeight: mode===m.key?'600':'400', cursor:'pointer', fontFamily:'inherit', background: mode===m.key?'#fff':'transparent', color: mode===m.key?C.primary:C.textSub, boxShadow: mode===m.key?'0 1px 3px rgba(0,0,0,0.1)':'none', transition:'all 0.15s' }}>
                {m.key==='live' && mode==='live'
                  ? <><span className="pulse" style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#22c55e', display:'inline-block', marginRight:'6px' }}/>Live</>
                  : m.label}
              </button>
            ))}
          </div>

          <div style={{ width:'1px', height:'22px', background:C.border }} />

          {mode === 'live' && <>
            <select value={filterCamera} onChange={e => setFilterCamera(e.target.value)} style={inStyle}>
              <option value="">Semua Kamera</option>
              {(cameras || []).map(c => <option key={c.id} value={c.id}>{c.kode_kamera} — {c.lokasi}</option>)}
            </select>
            {filterCamera && (
              <button onClick={() => setFilterCamera('')} style={{ fontSize:'11px', color:C.textSub, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>Reset</button>
            )}
            <span style={{ marginLeft:'auto', fontSize:'11px', color:C.textMuted, display:'flex', alignItems:'center', gap:'5px' }}>
              <span className="pulse" style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#22c55e', display:'inline-block' }} />
              {lastUpdate ? `Update: ${lastUpdate}` : 'Memuat...'}
            </span>
          </>}

          {mode === 'periode' && <>
            <div style={{ display:'flex', gap:'3px', background:'#f4f6fb', borderRadius:'7px', padding:'3px' }}>
              {['harian','bulanan','tahunan'].map(t => (
                <button key={t} onClick={() => setTipe(t)} style={{ padding:'5px 12px', borderRadius:'5px', border:'none', fontSize:'12px', fontWeight: tipe===t?'600':'400', cursor:'pointer', fontFamily:'inherit', textTransform:'capitalize', background: tipe===t?'#fff':'transparent', color: tipe===t?C.primary:C.textSub, boxShadow: tipe===t?'0 1px 3px rgba(0,0,0,0.1)':'none', transition:'all 0.15s' }}>{t}</button>
              ))}
            </div>
            {tipe==='harian'  && <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} style={inStyle} />}
            {tipe==='bulanan' && <>
              <select value={bulan} onChange={e => setBulan(Number(e.target.value))} style={inStyle}>
                {bulanList.map((b,i) => <option key={i} value={i+1}>{b}</option>)}
              </select>
              <input type="number" value={tahun} onChange={e => setTahun(Number(e.target.value))} style={{ ...inStyle, width:'80px' }} min="2020" max="2099" />
            </>}
            {tipe==='tahunan' && <input type="number" value={tahun} onChange={e => setTahun(Number(e.target.value))} style={{ ...inStyle, width:'80px' }} min="2020" max="2099" />}
            <span style={{ marginLeft:'auto', fontSize:'11px', color:C.textMuted, fontFamily:'monospace' }}>{periodeLabel}</span>
          </>}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns: mode==='live' ? 'repeat(4,1fr)' : 'repeat(2,1fr)', gap:'14px', marginBottom:'20px', opacity:chartLoading?0.6:1, transition:'opacity 0.2s' }}>
        {kpiCards.map((k,i) => (
          <div key={i} style={{ ...card, background:k.highlight?C.primary:'#fff', border:`1px solid ${k.highlight?C.primary:C.border}` }}>
            {!k.highlight && <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:k.color }} />}
            <div style={{ fontSize:'11px', fontWeight:'600', letterSpacing:'0.07em', textTransform:'uppercase', color:k.highlight?'rgba(255,255,255,0.7)':C.textMuted, marginBottom:'8px' }}>{k.label}</div>
            <div style={{ fontSize:k.isText?'20px':'30px', fontWeight:'700', color:k.highlight?'#fff':k.color, fontFamily:'monospace', lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:'11px', color:k.highlight?'rgba(255,255,255,0.6)':C.textMuted, marginTop:'6px' }}>{k.sub ?? 'pelanggaran terdeteksi'}</div>
          </div>
        ))}
      </div>

      {/* ── Main content ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'16px', alignItems:'start' }}>

        {/* Kiri: charts */}
        <div style={{ display:'flex', flexDirection:'column', gap:'16px', opacity:chartLoading?0.6:1, transition:'opacity 0.2s' }}>
          <div className="cc">
            <div className="ct">
              {mode==='live' ? 'Grafik Deteksi Hari Ini' : `Grafik Pelanggaran ${periodeLabel}`}
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={trend} margin={{ top:5, right:5, bottom:0, left:-10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="tanggal" tick={{ fontSize:10, fill:C.textMuted }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize:10, fill:C.textMuted }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tooltip_ />} />
                <Line type="monotone" dataKey="total" name="Pelanggaran" stroke={C.primary} strokeWidth={2.5} dot={false} activeDot={{ r:4, fill:C.primary }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
            <div className="cc">
              <div className="ct">Per Shift {periodeLabel}</div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={byShift} barSize={32} margin={{ top:20, right:10, bottom:0, left:-10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis dataKey="nama_shift" tick={{ fontSize:11, fill:C.textSub }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize:10, fill:C.textMuted }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tooltip_ />} />
                  <Bar dataKey="total_pelanggaran" name="Pelanggaran" radius={[5,5,0,0]} label={<BarLabel />}>
                    {byShift.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="cc">
              <div className="ct">Jenis Pelanggaran {periodeLabel}</div>
              {byType.length === 0
                ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'190px', color:C.textMuted, fontSize:'13px' }}>Tidak ada data</div>
                : <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie data={byType} dataKey="total" nameKey="jenis_pelanggaran" cx="38%" cy="50%" outerRadius={76} innerRadius={32} labelLine={false} label={<PieLabel />}>
                        {byType.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Legend layout="vertical" align="right" verticalAlign="middle" content={<PieLegend />} />
                      <Tooltip content={<Tooltip_ />} formatter={(v,n) => [v, jenisLabel[n] ?? n]} />
                    </PieChart>
                  </ResponsiveContainer>
              }
            </div>
          </div>
        </div>

        {/* Kanan: Live Camera */}
        <div className="cc" style={{ padding:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
              </svg>
              <span style={{ fontSize:'12px', fontWeight:'700', color:C.textMain, letterSpacing:'0.03em' }}>Live Camera</span>
            </div>
            <span style={{ fontSize:'11px', fontWeight:'600', padding:'2px 8px', borderRadius:'20px', background: camOnline ? '#f0fdf4' : '#f1f5f9', color: camOnline ? '#15803d' : C.textMuted }}>
              {camOnline ? '● Online' : '○ Offline'}
            </span>
          </div>

          <div style={{ background:'#0f172a', borderRadius:'8px', overflow:'hidden', aspectRatio:'4/3', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
            {camOnline ? (
              <img src={STREAM_URL} alt="Live Feed" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} onError={() => setCamOnline(false)} />
            ) : (
              <div style={{ textAlign:'center', color:'#475569' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom:'8px', opacity:0.4 }}>
                  <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
                <div style={{ fontSize:'12px', opacity:0.5 }}>Tidak terhubung</div>
                <div style={{ fontSize:'10px', opacity:0.35, marginTop:'4px' }}>Edge device offline</div>
              </div>
            )}
          </div>

          <div style={{ marginTop:'10px', display:'flex', flexDirection:'column', gap:'5px' }}>
            {[
              ['Kamera', 'CAM-01'],
              ['Lokasi', 'Area Maintenance'],
              ['Stream', 'localhost:5001'],
            ].map(([label, val]) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:'11px' }}>
                <span style={{ color:C.textMuted }}>{label}</span>
                <span style={{ color:C.textSub, fontFamily:'monospace' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  )
}