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

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Manajemen Shift</h2>
          <button
            onClick={() => { setShowForm(true); setEditData(null); setForm({ nama_shift: '', jam_mulai: '', jam_selesai: '' }) }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            + Tambah Shift
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-4">{editData ? 'Edit Shift' : 'Tambah Shift'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nama Shift</label>
                <input
                  type="text"
                  value={form.nama_shift}
                  onChange={(e) => setForm({ ...form, nama_shift: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Shift 1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Jam Mulai</label>
                <input
                  type="time"
                  value={form.jam_mulai.slice(0, 5)}
                  onChange={(e) => setForm({ ...form, jam_mulai: e.target.value + ':00' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Jam Selesai</label>
                <input
                  type="time"
                  value={form.jam_selesai.slice(0, 5)}
                  onChange={(e) => setForm({ ...form, jam_selesai: e.target.value + ':00' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="md:col-span-3 flex gap-2">
                <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Nama Shift</th>
                <th className="px-4 py-3 text-left">Jam Mulai</th>
                <th className="px-4 py-3 text-left">Jam Selesai</th>
                <th className="px-4 py-3 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">Memuat data...</td></tr>
              ) : shifts.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.nama_shift}</td>
                  <td className="px-4 py-3">{s.jam_mulai}</td>
                  <td className="px-4 py-3">{s.jam_selesai}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => handleEdit(s)} className="text-xs px-3 py-1 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deleting === s.id}
                      className="text-xs px-3 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50"
                    >
                      {deleting === s.id ? '...' : 'Hapus'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}