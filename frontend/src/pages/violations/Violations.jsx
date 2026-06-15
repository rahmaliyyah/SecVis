import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import ExportLaporan from '../../components/ExportLaporan'

const C = { primary:'#003399', primaryLight:'#e8eef8', secondary:'#FF8800', border:'#e4e8f0', textMain:'#1a2340', textSub:'#7a85a0', textMuted:'#b0bac8', card:'#ffffff', bg:'#f4f6fb' }

const jenisLabel = { 'no-helmet':'Tidak Pakai Helm','no-vest':'Tidak Pakai Rompi','no-boots':'Tidak Pakai Sepatu','no-gloves':'Tidak Pakai Sarung Tangan','no-glasses':'Tidak Pakai Kacamata' }
const jenisBadge = {
  'no-helmet' : { bg:'#fef2f2', color:'#dc2626' },
  'no-vest'   : { bg:'#eff6ff', color:'#1d4ed8' },
  'no-boots'  : { bg:'#fffbeb', color:'#d97706' },
  'no-gloves' : { bg:'#fff7ed', color:'#c2410c' },
  'no-glasses': { bg:'#f0fdf4', color:'#15803d' },
}

export default function Violations() {
  const [violations, setViolations] = useState([])
  const [meta,       setMeta]       = useState({})
  const [loading,    setLoading]    = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [filters,    setFilters]    = useState({ jenis_pelanggaran:'', tanggal_mulai:'', tanggal_selesai:'', page:1 })

  const fetchViolations = async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([_,v]) => v !== ''))
      const res = await api.get('/violations', { params })
      setViolations(res.data.data); setMeta(res.data.meta)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchViolations() }, [filters])

  const inStyle = { background:'#fff', border:`1.5px solid ${C.border}`, borderRadius:'8px', padding:'7px 11px', fontSize:'13px', color:C.textMain, outline:'none', fontFamily:'inherit', cursor:'pointer' }

  return (
    <Layout>
      <style>{`
        .vio-row:hover { background: ${C.primaryLight} !important; }
        select option { background: #fff; color: ${C.textMain}; }
        input[type=date]::-webkit-calendar-picker-indicator { cursor: pointer; }
      `}</style>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
        <div>
          <h2 style={{ fontSize:'18px', fontWeight:'700', color:C.textMain, margin:0 }}>Riwayat Pelanggaran</h2>
          <p style={{ fontSize:'12px', color:C.textSub, marginTop:'3px' }}>Seluruh event pelanggaran APD yang terdeteksi</p>
        </div>
        <ExportLaporan />
      </div>

      {/* Filter */}
    
<div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:'12px', padding:'14px 16px', marginBottom:'16px', display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'flex-end', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
  <select value={filters.jenis_pelanggaran} onChange={e => setFilters({...filters, jenis_pelanggaran:e.target.value, page:1})} style={inStyle}>
    <option value="">Semua Jenis</option>
    {Object.entries(jenisLabel).map(([val,label]) => <option key={val} value={val}>{label}</option>)}
  </select>
  <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
    <span style={{ fontSize:'11px', color:C.textMuted, fontWeight:'600', letterSpacing:'0.05em' }}>DARI TANGGAL</span>
    <input type="date" value={filters.tanggal_mulai} onChange={e => setFilters({...filters, tanggal_mulai:e.target.value, page:1})} style={inStyle} />
  </div>
  <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
    <span style={{ fontSize:'11px', color:C.textMuted, fontWeight:'600', letterSpacing:'0.05em' }}>SAMPAI TANGGAL</span>
    <input type="date" value={filters.tanggal_selesai} onChange={e => setFilters({...filters, tanggal_selesai:e.target.value, page:1})} style={inStyle} />
  </div>
  <button onClick={() => setFilters({jenis_pelanggaran:'',tanggal_mulai:'',tanggal_selesai:'',page:1})} style={{ ...inStyle, color:C.textSub }}>Reset</button>
</div>

      {/* Table */}
      <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:'12px', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}`, background:C.bg }}>
              {['Waktu','Shift','Kamera','Pelanggaran','Confidence','Foto'].map(h => (
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:'600', letterSpacing:'0.07em', textTransform:'uppercase', color:C.textMuted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding:'40px', textAlign:'center', color:C.textMuted }}>Memuat data...</td></tr>
            ) : violations.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:'40px', textAlign:'center', color:C.textMuted }}>Tidak ada data</td></tr>
            ) : violations.map(v => {
              const badge = jenisBadge[v.jenis_pelanggaran] ?? { bg:'#f3f4f6', color:C.textSub }
              return (
                <tr key={v.id} className="vio-row" style={{ borderBottom:`1px solid ${C.border}` }}>
                  <td style={{ padding:'12px 16px', color:C.textSub, fontFamily:"'DM Mono',monospace", fontSize:'12px' }}>{new Date(v.timestamp_deteksi).toLocaleString('id-ID')}</td>
                  <td style={{ padding:'12px 16px', color:C.textMain, fontWeight:'500' }}>{v.nama_shift}</td>
                  <td style={{ padding:'12px 16px', color:C.textSub, fontFamily:"'DM Mono',monospace", fontSize:'12px' }}>{v.kode_kamera}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ background:badge.bg, color:badge.color, padding:'3px 10px', borderRadius:'20px', fontSize:'11.5px', fontWeight:'600' }}>
                      {jenisLabel[v.jenis_pelanggaran] ?? v.jenis_pelanggaran}
                    </span>
                  </td>
                  <td style={{ padding:'12px 16px', color:C.textSub, fontFamily:"'DM Mono',monospace", fontSize:'12px' }}>{v.confidence_score}%</td>
                  <td style={{ padding:'12px 16px' }}>
                    <button onClick={() => setSelectedId(v.id)} style={{ background:'none', border:'none', color:C.primary, fontSize:'12px', cursor:'pointer', padding:0, fontFamily:'inherit', fontWeight:'600' }}>
                      Lihat →
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:`1px solid ${C.border}` }}>
          <span style={{ fontSize:'12px', color:C.textSub }}>Total: {meta.total ?? 0} data</span>
          <div style={{ display:'flex', gap:'6px' }}>
            {['Prev', `Hal ${filters.page}`, 'Next'].map((label, i) => (
              <button key={i}
                disabled={i===0?filters.page<=1:i===2?filters.page>=Math.ceil((meta.total??0)/20):true}
                onClick={() => { if(i===0) setFilters({...filters,page:filters.page-1}); if(i===2) setFilters({...filters,page:filters.page+1}) }}
                style={{ background:i===1?C.primaryLight:'#fff', border:`1px solid ${C.border}`, borderRadius:'6px', padding:'5px 12px', fontSize:'12px', color:i===1?C.primary:C.textSub, cursor:i===1?'default':'pointer', fontFamily:"'DM Mono',monospace" }}
              >{label}</button>
            ))}
          </div>
        </div>
      </div>
      {selectedId && <FotoModal id={selectedId} onClose={() => setSelectedId(null)} />}
    </Layout>
  )
}

function FotoModal({ id, onClose }) {
  const [data, setData] = useState(null)
  const C = { primary:'#003399', border:'#e4e8f0', textMain:'#1a2340', textSub:'#7a85a0', textMuted:'#b0bac8' }
  useEffect(() => { api.get(`/violations/${id}`).then(res => setData(res.data.data)) }, [id])
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, backdropFilter:'blur(4px)' }} onClick={onClose}>
      <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'460px', margin:'0 16px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <span style={{ fontSize:'14px', fontWeight:'700', color:C.textMain }}>Detail Pelanggaran</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.textMuted, cursor:'pointer', fontSize:'18px', padding:0, lineHeight:1 }}>✕</button>
        </div>
        {data ? (
          <div>
            <div style={{ background:C.border, borderRadius:'10px', overflow:'hidden', marginBottom:'16px', aspectRatio:'4/3', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <img src={data.foto_url} alt="Bukti" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
              <div style={{ display:'none', alignItems:'center', justifyContent:'center', width:'100%', height:'100%', color:C.textMuted, fontSize:'13px', flexDirection:'column', gap:'8px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Foto tidak tersedia
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {[['Shift',data.nama_shift],['Kamera',`${data.kode_kamera} — ${data.lokasi_kamera}`],['Pelanggaran',data.jenis_pelanggaran],['Confidence',`${data.confidence_score}%`],['Waktu',new Date(data.timestamp_deteksi).toLocaleString('id-ID')]].map(([label,value]) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:'12.5px' }}>
                  <span style={{ color:C.textMuted }}>{label}</span>
                  <span style={{ color:C.textMain, fontFamily:"'DM Mono',monospace", fontSize:'12px' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : <div style={{ textAlign:'center', padding:'40px', color:C.textMuted, fontSize:'13px' }}>Memuat...</div>}
      </div>
    </div>
  )
}