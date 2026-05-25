import { useState } from 'react'
import api from '../api/axios'
import { getUser } from '../utils/auth'

const C = { primary:'#003399', primaryLight:'#e8eef8', border:'#e4e8f0', textMain:'#1a2340', textSub:'#7a85a0', textMuted:'#b0bac8' }
const bulanList = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

function buildFileName(tipe, { tanggal, bulan, tahun }, ext) {
  const prefix = 'REPORT PELANGGARAN K3 PT. EPSON INDONESIA_'
  if (tipe === 'harian' && tanggal) { const [y,m,d] = tanggal.split('-'); return `${prefix}${d}/${m}/${y}.${ext}` }
  if (tipe === 'bulanan' && bulan && tahun) return `${prefix}${String(bulan).padStart(2,'0')}/${tahun}.${ext}`
  if (tipe === 'tahunan' && tahun) return `${prefix}${tahun}.${ext}`
  return `REPORT_K3.${ext}`
}

export default function ExportLaporan() {
  const user     = getUser()
  const canExcel = user?.role === 'admin' || user?.role === 'manager'

  const [show,       setShow]       = useState(false)
  const [format,     setFormat]     = useState('pdf')
  const [tipe,       setTipe]       = useState('harian')
  const [tanggal,    setTanggal]    = useState('')
  const [bulan,      setBulan]      = useState('')
  const [tahun,      setTahun]      = useState(new Date().getFullYear().toString())
  const [withFoto,   setWithFoto]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const isDisabled = loading || (tipe==='harian'&&!tanggal) || (tipe==='bulanan'&&(!bulan||!tahun))

  // Foto tersedia untuk semua periode
  const showFotoToggle = true

  const handleExport = async () => {
    setLoading(true); setError('')
    try {
      const params = { tipe }
      if (tipe==='harian') params.tanggal = tanggal
      if (tipe==='bulanan') { params.bulan=bulan; params.tahun=tahun }
      if (tipe==='tahunan') params.tahun = tahun
      if (showFotoToggle && withFoto) params.include_foto = 1

      const endpoint = format==='excel' ? '/laporan/export-excel' : '/laporan/export'
      const ext      = format==='excel' ? 'xlsx' : 'pdf'
      const fileName = buildFileName(tipe, {tanggal,bulan,tahun}, ext)

      const res = await api.get(endpoint, { params, responseType:'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href=url; a.setAttribute('download', fileName)
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url)
      setShow(false)
    } catch(err) { setError('Gagal generate laporan. Pastikan parameter sudah benar.'); console.error(err) }
    finally { setLoading(false) }
  }

  const inStyle = { width:'100%', background:'#fff', border:`1.5px solid ${C.border}`, borderRadius:'8px', padding:'8px 12px', fontSize:'13px', color:C.textMain, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }
  const chipActive = { flex:1, padding:'7px 6px', borderRadius:'7px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', border:`1.5px solid ${C.primary}`, background:C.primaryLight, color:C.primary, textTransform:'capitalize' }
  const chipIdle   = { flex:1, padding:'7px 6px', borderRadius:'7px', fontSize:'12px', fontWeight:'400', cursor:'pointer', fontFamily:'inherit', border:`1.5px solid ${C.border}`, background:'#fff', color:C.textSub, textTransform:'capitalize' }

  return (
    <>
      <button onClick={() => setShow(true)} style={{ background:'#fff', color:C.primary, border:`1px solid ${C.border}`, borderRadius:'8px', padding:'8px 16px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'7px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Export Laporan
      </button>

      {show && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, backdropFilter:'blur(4px)' }} onClick={() => setShow(false)}>
          <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'420px', margin:'0 16px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <span style={{ fontSize:'15px', fontWeight:'700', color:C.textMain }}>Export Laporan</span>
              <button onClick={() => setShow(false)} style={{ background:'none', border:'none', color:C.textMuted, cursor:'pointer', fontSize:'18px', padding:0 }}>✕</button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              {/* Format */}
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'600', letterSpacing:'0.07em', textTransform:'uppercase', color:C.textMuted, marginBottom:'6px' }}>Format</label>
                <div style={{ display:'flex', gap:'8px' }}>
                  {[{key:'pdf',icon:'📄',label:'PDF'},{key:'excel',icon:'📊',label:'Excel (.xlsx)'}]
                    .filter(f => f.key === 'pdf' || canExcel)
                    .map(f => (
                      <button key={f.key} onClick={() => setFormat(f.key)} style={format===f.key?chipActive:chipIdle}>
                        {f.icon} {f.label}
                      </button>
                    ))}
                </div>
              </div>

              {/* Periode */}
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'600', letterSpacing:'0.07em', textTransform:'uppercase', color:C.textMuted, marginBottom:'6px' }}>Periode</label>
                <div style={{ display:'flex', gap:'8px' }}>
                  {['harian','bulanan','tahunan'].map(t => (
                    <button key={t} onClick={() => setTipe(t)} style={tipe===t?chipActive:chipIdle}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Input tanggal */}
              {tipe==='harian' && (
                <div>
                  <label style={{ display:'block', fontSize:'11px', fontWeight:'600', letterSpacing:'0.07em', textTransform:'uppercase', color:C.textMuted, marginBottom:'6px' }}>Tanggal</label>
                  <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} style={inStyle} />
                </div>
              )}
              {tipe==='bulanan' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  <div>
                    <label style={{ display:'block', fontSize:'11px', fontWeight:'600', letterSpacing:'0.07em', textTransform:'uppercase', color:C.textMuted, marginBottom:'6px' }}>Bulan</label>
                    <select value={bulan} onChange={e => setBulan(e.target.value)} style={inStyle}>
                      <option value="">Pilih bulan</option>
                      {bulanList.map((b,i) => <option key={i} value={i+1}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'11px', fontWeight:'600', letterSpacing:'0.07em', textTransform:'uppercase', color:C.textMuted, marginBottom:'6px' }}>Tahun</label>
                    <input type="number" value={tahun} onChange={e => setTahun(e.target.value)} style={inStyle} min="2024" max="2099" />
                  </div>
                </div>
              )}
              {tipe==='tahunan' && (
                <div>
                  <label style={{ display:'block', fontSize:'11px', fontWeight:'600', letterSpacing:'0.07em', textTransform:'uppercase', color:C.textMuted, marginBottom:'6px' }}>Tahun</label>
                  <input type="number" value={tahun} onChange={e => setTahun(e.target.value)} style={inStyle} min="2024" max="2099" />
                </div>
              )}

              {/* Toggle foto bukti — hanya PDF harian */}
              {showFotoToggle && (
                <div style={{ background: withFoto ? C.primaryLight : '#f8f9fb', border: `1px solid ${withFoto ? C.primary+'40' : C.border}`, borderRadius:'10px', padding:'12px 14px', transition:'all 0.15s' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:'600', color:C.textMain }}>Sertakan Foto Bukti</div>
                      <div style={{ fontSize:'11px', color:C.textSub, marginTop:'2px' }}>Tampilkan foto pelanggaran di laporan PDF</div>
                    </div>
                    {/* Toggle switch */}
                    <div onClick={() => setWithFoto(!withFoto)} style={{ width:'40px', height:'22px', borderRadius:'11px', background: withFoto ? C.primary : '#d1d5db', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                      <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:'#fff', position:'absolute', top:'2px', left: withFoto ? '20px' : '2px', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                  </div>
                  {withFoto && (
                    <div style={{ marginTop:'8px', fontSize:'11px', color:'#d97706', display:'flex', alignItems:'center', gap:'5px' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      Ukuran file PDF akan lebih besar
                    </div>
                  )}
                </div>
              )}

              {/* Preview nama file */}
              {!isDisabled && (
                <div style={{ background:C.primaryLight, border:`1px solid ${C.border}`, borderRadius:'7px', padding:'8px 12px', fontSize:'11px', color:C.textSub, wordBreak:'break-all' }}>
                  <span style={{ color:C.textMuted, fontWeight:'600' }}>File: </span>
                  <span style={{ color:C.primary }}>{buildFileName(tipe,{tanggal,bulan,tahun},format==='excel'?'xlsx':'pdf')}</span>
                </div>
              )}

              {error && <div style={{ background:'#fff5f5', border:'1px solid #fecaca', borderRadius:'7px', padding:'9px 12px', fontSize:'12px', color:'#dc2626' }}>{error}</div>}

              <button onClick={handleExport} disabled={isDisabled} style={{ background:isDisabled?C.primaryLight:C.primary, color:isDisabled?C.textMuted:'white', border:'none', borderRadius:'8px', padding:'11px', fontSize:'13px', fontWeight:'600', cursor:isDisabled?'not-allowed':'pointer', fontFamily:'inherit', marginTop:'2px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'opacity 0.15s' }}>
                {loading ? 'Generating...' : `${format==='excel'?'📊':'📄'} Download ${format==='excel'?'Excel':'PDF'}${withFoto&&showFotoToggle?' + Foto':''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}