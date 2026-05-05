import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function Cameras() {
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({ kode_kamera: '', lokasi: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const fetchCameras = async () => {
    setLoading(true)
    try {
      const res = await api.get('/cameras')
      setCameras(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCameras() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editData) {
        await api.put(`/cameras/${editData.id}`, form)
      } else {
        await api.post('/cameras', form)
      }
      setShowForm(false)
      setEditData(null)
      setForm({ kode_kamera: '', lokasi: '' })
      fetchCameras()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (camera) => {
    setEditData(camera)
    setForm({ kode_kamera: camera.kode_kamera, lokasi: camera.lokasi })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus kamera ini?')) return
    setDeleting(id)
    try {
      await api.delete(`/cameras/${id}`)
      fetchCameras()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(null)
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#0f1117',
    border: '1px solid #1e2130',
    borderRadius: '8px',
    padding: '9px 12px',
    fontSize: '13px',
    color: '#a0a8bc',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  return (
    <Layout>
      <style>{`.cam-row:hover { background: #0f1117 !important; }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#c8ccd8', margin: 0, letterSpacing: '-0.01em' }}>Manajemen Kamera</h2>
          <p style={{ fontSize: '12px', color: '#3e4455', marginTop: '4px' }}>Kelola kamera yang terpasang di area maintenance</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditData(null); setForm({ kode_kamera: '', lokasi: '' }) }}
          style={{ background: 'linear-gradient(135deg, #3d59a1 0%, #7aa2f7 100%)', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          + Tambah Kamera
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#13151f', border: '1px solid #1e2130', borderRadius: '12px', padding: '20px 22px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#c8ccd8', marginBottom: '16px' }}>
            {editData ? 'Edit Kamera' : 'Tambah Kamera Baru'}
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3e4455', marginBottom: '6px' }}>Kode Kamera</label>
              <input type="text" value={form.kode_kamera} onChange={(e) => setForm({ ...form, kode_kamera: e.target.value })} style={inputStyle} placeholder="CAM-02" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3e4455', marginBottom: '6px' }}>Lokasi</label>
              <input type="text" value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} style={inputStyle} placeholder="Pintu Masuk Area Maintenance" required />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" disabled={saving} style={{ background: 'linear-gradient(135deg, #3d59a1 0%, #7aa2f7 100%)', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.5 : 1 }}>
                {saving ? '...' : 'Simpan'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: '#1e2130', color: '#5a6070', border: 'none', borderRadius: '8px', padding: '9px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: '#13151f', border: '1px solid #1e2130', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e2130' }}>
              {['Kode Kamera', 'Lokasi', 'Status', 'Aksi'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3e4455' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#3e4455' }}>Memuat data...</td></tr>
            ) : cameras.map((c) => (
              <tr key={c.id} className="cam-row" style={{ borderBottom: '1px solid #0f1117' }}>
                <td style={{ padding: '12px 16px', color: '#c8ccd8', fontWeight: '500', fontFamily: "'DM Mono', monospace", fontSize: '12px' }}>{c.kode_kamera}</td>
                <td style={{ padding: '12px 16px', color: '#a0a8bc' }}>{c.lokasi}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    background: c.status === 'aktif' ? '#1a2e1a' : '#1e1a1a',
                    color: c.status === 'aktif' ? '#9ece6a' : '#f7768e',
                    padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '500'
                  }}>
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEdit(c)} style={{ background: '#1a2035', color: '#7aa2f7', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                  <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id} style={{ background: '#1e1520', color: '#f7768e', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', opacity: deleting === c.id ? 0.5 : 1 }}>
                    {deleting === c.id ? '...' : 'Hapus'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}