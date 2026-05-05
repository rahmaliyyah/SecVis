import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function Shifts() {
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({ nama_shift: '', jam_mulai: '', jam_selesai: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const fetchShifts = async () => {
    setLoading(true)
    try {
      const res = await api.get('/shifts')
      setShifts(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchShifts() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editData) {
        await api.put(`/shifts/${editData.id}`, form)
      } else {
        await api.post('/shifts', form)
      }
      setShowForm(false)
      setEditData(null)
      setForm({ nama_shift: '', jam_mulai: '', jam_selesai: '' })
      fetchShifts()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (shift) => {
    setEditData(shift)
    setForm({ nama_shift: shift.nama_shift, jam_mulai: shift.jam_mulai, jam_selesai: shift.jam_selesai })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus shift ini?')) return
    setDeleting(id)
    try {
      await api.delete(`/shifts/${id}`)
      fetchShifts()
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
      <style>{`
        .shift-row:hover { background: #0f1117 !important; }
        input[type=time]::-webkit-calendar-picker-indicator { filter: invert(0.3); }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#c8ccd8', margin: 0, letterSpacing: '-0.01em' }}>Manajemen Shift</h2>
          <p style={{ fontSize: '12px', color: '#3e4455', marginTop: '4px' }}>Kelola jadwal shift operasional</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditData(null); setForm({ nama_shift: '', jam_mulai: '', jam_selesai: '' }) }}
          style={{ background: 'linear-gradient(135deg, #3d59a1 0%, #7aa2f7 100%)', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          + Tambah Shift
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#13151f', border: '1px solid #1e2130', borderRadius: '12px', padding: '20px 22px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#c8ccd8', marginBottom: '16px' }}>
            {editData ? 'Edit Shift' : 'Tambah Shift Baru'}
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3e4455', marginBottom: '6px' }}>Nama Shift</label>
              <input type="text" value={form.nama_shift} onChange={(e) => setForm({ ...form, nama_shift: e.target.value })} style={inputStyle} placeholder="Shift 1" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3e4455', marginBottom: '6px' }}>Jam Mulai</label>
              <input type="time" value={form.jam_mulai.slice(0, 5)} onChange={(e) => setForm({ ...form, jam_mulai: e.target.value + ':00' })} style={inputStyle} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3e4455', marginBottom: '6px' }}>Jam Selesai</label>
              <input type="time" value={form.jam_selesai.slice(0, 5)} onChange={(e) => setForm({ ...form, jam_selesai: e.target.value + ':00' })} style={inputStyle} required />
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
              {['Nama Shift', 'Jam Mulai', 'Jam Selesai', 'Aksi'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3e4455' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#3e4455' }}>Memuat data...</td></tr>
            ) : shifts.map((s) => (
              <tr key={s.id} className="shift-row" style={{ borderBottom: '1px solid #0f1117' }}>
                <td style={{ padding: '12px 16px', color: '#c8ccd8', fontWeight: '500' }}>{s.nama_shift}</td>
                <td style={{ padding: '12px 16px', color: '#a0a8bc', fontFamily: "'DM Mono', monospace", fontSize: '12px' }}>{s.jam_mulai}</td>
                <td style={{ padding: '12px 16px', color: '#a0a8bc', fontFamily: "'DM Mono', monospace", fontSize: '12px' }}>{s.jam_selesai}</td>
                <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEdit(s)} style={{ background: '#1a2035', color: '#7aa2f7', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                  <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id} style={{ background: '#1e1520', color: '#f7768e', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', opacity: deleting === s.id ? 0.5 : 1 }}>
                    {deleting === s.id ? '...' : 'Hapus'}
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