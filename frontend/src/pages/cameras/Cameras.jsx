import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

const C = { primary:'#003399', primaryLight:'#e8eef8', border:'#e4e8f0', textMain:'#1a2340', textSub:'#7a85a0', textMuted:'#b0bac8' }

function DeleteDialog({ item, label, onConfirm, onCancel, deleting }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, backdropFilter:'blur(4px)' }} onClick={onCancel}>
      <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'380px', margin:'0 16px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
        <div style={{ width:'44px', height:'44px', background:'#fff0f0', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'16px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </div>
        <div style={{ fontSize:'15px', fontWeight:'700', color:C.textMain, marginBottom:'8px' }}>Hapus {label}?</div>
        <div style={{ fontSize:'13px', color:C.textSub, marginBottom:'24px', lineHeight:'1.5' }}>
          Data <strong style={{ color:C.textMain }}>{item}</strong> akan dihapus secara permanen dan tidak dapat dikembalikan.
        </div>
        <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
          <button onClick={onCancel} style={{ background:C.primaryLight, color:C.primary, border:'none', borderRadius:'8px', padding:'9px 18px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>Batal</button>
          <button onClick={onConfirm} disabled={deleting} style={{ background:'#dc2626', color:'#fff', border:'none', borderRadius:'8px', padding:'9px 18px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', opacity:deleting?0.6:1 }}>
            {deleting ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Cameras() {
  const [cameras,     setCameras]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [editData,    setEditData]    = useState(null)
  const [form,        setForm]        = useState({ kode_kamera:'', lokasi:'' })
  const [saving,      setSaving]      = useState(false)
  const [deleting,    setDeleting]    = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchCameras = async () => { setLoading(true); try { const res = await api.get('/cameras'); setCameras(res.data.data) } catch(err){console.error(err)} finally{setLoading(false)} }
  useEffect(() => { fetchCameras() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try { editData ? await api.put(`/cameras/${editData.id}`, form) : await api.post('/cameras', form); setShowForm(false); setEditData(null); setForm({kode_kamera:'',lokasi:''}); fetchCameras() }
    catch(err){console.error(err)} finally{setSaving(false)}
  }
  const handleEdit = (c) => { setEditData(c); setForm({kode_kamera:c.kode_kamera,lokasi:c.lokasi}); setShowForm(true) }
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(deleteTarget.id)
    try { await api.delete(`/cameras/${deleteTarget.id}`); fetchCameras() }
    catch(err){console.error(err)}
    finally { setDeleting(null); setDeleteTarget(null) }
  }

  const inStyle = { width:'100%', background:'#fff', border:`1.5px solid ${C.border}`, borderRadius:'8px', padding:'8px 12px', fontSize:'13px', color:C.textMain, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }

  return (
    <Layout>
      <style>{`.cam-row:hover{background:${C.primaryLight}!important}`}</style>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
        <div>
          <h2 style={{ fontSize:'18px', fontWeight:'700', color:C.textMain, margin:0 }}>Manajemen Kamera</h2>
          <p style={{ fontSize:'12px', color:C.textSub, marginTop:'3px' }}>Kelola kamera yang terpasang di area maintenance</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditData(null); setForm({kode_kamera:'',lokasi:''}) }} style={{ background:C.primary, color:'white', border:'none', borderRadius:'8px', padding:'9px 16px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>
          + Tambah Kamera
        </button>
      </div>

      {showForm && (
        <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:'12px', padding:'20px 22px', marginBottom:'16px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:'13px', fontWeight:'600', color:C.textMain, marginBottom:'16px' }}>{editData ? 'Edit Kamera' : 'Tambah Kamera Baru'}</div>
          <form onSubmit={handleSubmit} style={{ display:'grid', gridTemplateColumns:'1fr 2fr auto', gap:'12px', alignItems:'end' }}>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:'600', letterSpacing:'0.07em', textTransform:'uppercase', color:C.textMuted, marginBottom:'6px' }}>Kode Kamera</label>
              <input type="text" value={form.kode_kamera} onChange={e => setForm({...form,kode_kamera:e.target.value})} style={inStyle} placeholder="CAM-02" required />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:'600', letterSpacing:'0.07em', textTransform:'uppercase', color:C.textMuted, marginBottom:'6px' }}>Lokasi</label>
              <input type="text" value={form.lokasi} onChange={e => setForm({...form,lokasi:e.target.value})} style={inStyle} placeholder="Pintu Masuk Area Maintenance" required />
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              <button type="submit" disabled={saving} style={{ background:C.primary, color:'white', border:'none', borderRadius:'8px', padding:'9px 16px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', opacity:saving?0.6:1 }}>{saving?'...':'Simpan'}</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ background:C.primaryLight, color:C.primary, border:'none', borderRadius:'8px', padding:'9px 14px', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>Batal</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:'12px', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}`, background:'#f4f6fb' }}>
              {['Kode Kamera','Lokasi','Status','Aksi'].map(h => (
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:'600', letterSpacing:'0.07em', textTransform:'uppercase', color:C.textMuted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={4} style={{ padding:'40px', textAlign:'center', color:C.textMuted }}>Memuat data...</td></tr>
            : cameras.map(c => (
              <tr key={c.id} className="cam-row" style={{ borderBottom:`1px solid ${C.border}` }}>
                <td style={{ padding:'12px 16px', color:C.primary, fontWeight:'700', fontFamily:"'DM Mono',monospace", fontSize:'12px' }}>{c.kode_kamera}</td>
                <td style={{ padding:'12px 16px', color:C.textMain }}>{c.lokasi}</td>
                <td style={{ padding:'12px 16px' }}>
                  <span style={{ background:c.status==='aktif'?'#f0fdf4':'#fff0f0', color:c.status==='aktif'?'#15803d':'#dc2626', padding:'3px 10px', borderRadius:'20px', fontSize:'11.5px', fontWeight:'600' }}>{c.status}</span>
                </td>
                <td style={{ padding:'12px 16px', display:'flex', gap:'8px' }}>
                  <button onClick={() => handleEdit(c)} style={{ background:C.primaryLight, color:C.primary, border:'none', borderRadius:'6px', padding:'5px 12px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>Edit</button>
                  <button onClick={() => setDeleteTarget(c)} disabled={deleting===c.id} style={{ background:'#fff0f0', color:'#dc2626', border:'none', borderRadius:'6px', padding:'5px 12px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', opacity:deleting===c.id?0.5:1 }}>{deleting===c.id?'...':'Hapus'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <DeleteDialog
          item={deleteTarget.kode_kamera}
          label="Kamera"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting === deleteTarget.id}
        />
      )}
    </Layout>
  )
}