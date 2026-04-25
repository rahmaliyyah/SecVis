import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function Violations() {
  const [violations, setViolations] = useState([])
  const [meta, setMeta] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedFoto, setSelectedFoto] = useState(null)
  const [filters, setFilters] = useState({
    shift_id: '',
    jenis_pelanggaran: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    page: 1,
  })

  const fetchViolations = async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      const res = await api.get('/violations', { params })
      setViolations(res.data.data)
      setMeta(res.data.meta)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchViolations() }, [filters])

  const jenisLabel = {
  'no-helmet'  : 'Tidak Pakai Helm',
  'no-vest'    : 'Tidak Pakai Rompi',
  'no-boots'   : 'Tidak Pakai Sepatu',
  'no-gloves'  : 'Tidak Pakai Sarung Tangan',
  'no-glasses' : 'Tidak Pakai Kacamata',
}
  return (
    <Layout>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Riwayat Pelanggaran</h2>

        {/* Filter */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3">
          <select
            value={filters.jenis_pelanggaran}
            onChange={(e) => setFilters({ ...filters, jenis_pelanggaran: e.target.value, page: 1 })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Semua Jenis</option>
            {Object.entries(jenisLabel).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.tanggal_mulai}
            onChange={(e) => setFilters({ ...filters, tanggal_mulai: e.target.value, page: 1 })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={filters.tanggal_selesai}
            onChange={(e) => setFilters({ ...filters, tanggal_selesai: e.target.value, page: 1 })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={() => setFilters({ shift_id: '', jenis_pelanggaran: '', tanggal_mulai: '', tanggal_selesai: '', page: 1 })}
            className="bg-gray-100 text-gray-600 rounded-lg px-3 py-2 text-sm hover:bg-gray-200"
          >
            Reset Filter
          </button>
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Waktu</th>
                <th className="px-4 py-3 text-left">Shift</th>
                <th className="px-4 py-3 text-left">Kamera</th>
                <th className="px-4 py-3 text-left">Pelanggaran</th>
                <th className="px-4 py-3 text-left">Confidence</th>
                <th className="px-4 py-3 text-left">Foto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Memuat data...</td></tr>
              ) : violations.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Tidak ada data</td></tr>
              ) : violations.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{new Date(v.timestamp_deteksi).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3">{v.nama_shift}</td>
                  <td className="px-4 py-3">{v.kode_kamera}</td>
                  <td className="px-4 py-3">
                    <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                      {jenisLabel[v.jenis_pelanggaran] ?? v.jenis_pelanggaran}
                    </span>
                  </td>
                  <td className="px-4 py-3">{v.confidence_score}%</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedFoto(v.id)}
                      className="text-blue-500 hover:underline text-xs"
                    >
                      Lihat Foto
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>Total: {meta.total ?? 0} data</span>
            <div className="flex gap-2">
              <button
                disabled={filters.page <= 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >Prev</button>
              <span className="px-3 py-1">Hal {filters.page}</span>
              <button
                disabled={filters.page >= Math.ceil((meta.total ?? 0) / 20)}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Foto */}
      {selectedFoto && (
        <FotoModal id={selectedFoto} onClose={() => setSelectedFoto(null)} />
      )}
    </Layout>
  )
}

function FotoModal({ id, onClose }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get(`/violations/${id}`).then(res => setData(res.data.data))
  }, [id])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800">Detail Pelanggaran</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        {data ? (
          <div className="space-y-3">
            <img src={data.foto_url} alt="Bukti" className="w-full rounded-lg bg-gray-100 min-h-32 object-cover" onError={(e) => e.target.src = 'https://placehold.co/400x300?text=Foto+tidak+tersedia'} />
            <div className="text-sm space-y-1 text-gray-600">
              <p><span className="font-medium">Shift:</span> {data.nama_shift}</p>
              <p><span className="font-medium">Kamera:</span> {data.kode_kamera} — {data.lokasi_kamera}</p>
              <p><span className="font-medium">Pelanggaran:</span> {data.jenis_pelanggaran}</p>
              <p><span className="font-medium">Confidence:</span> {data.confidence_score}%</p>
              <p><span className="font-medium">Waktu:</span> {new Date(data.timestamp_deteksi).toLocaleString('id-ID')}</p>
            </div>
          </div>
        ) : <p className="text-center text-gray-400">Memuat...</p>}
      </div>
    </div>
  )
}