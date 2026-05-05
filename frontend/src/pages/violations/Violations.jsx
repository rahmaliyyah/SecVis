import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

const jenisLabel = {
  'no-helmet'  : 'Tidak Pakai Helm',
  'no-vest'    : 'Tidak Pakai Rompi',
  'no-boots'   : 'Tidak Pakai Sepatu',
  'no-gloves'  : 'Tidak Pakai Sarung Tangan',
  'no-glasses' : 'Tidak Pakai Kacamata',
}

const jenisBadgeColor = {
  'no-helmet'  : { bg: '#1e1a2e', color: '#bb9af7' },
  'no-vest'    : { bg: '#1a1e2e', color: '#7aa2f7' },
  'no-boots'   : { bg: '#1e1a18', color: '#e0af68' },
  'no-gloves'  : { bg: '#1e1a18', color: '#ff9e64' },
  'no-glasses' : { bg: '#1a1e1a', color: '#9ece6a' },
}

export default function Violations() {
  const [violations, setViolations] = useState([])
  const [meta, setMeta] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [filters, setFilters] = useState({
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

  const inputStyle = {
    background: '#13151f',
    border: '1px solid #1e2130',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    color: '#a0a8bc',
    outline: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
  }

  return (
    <Layout>
      <style>{`
        .vio-row:hover { background: #13151f !important; }
        select option { background: #13151f; color: #a0a8bc; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.3); cursor: pointer; }
      `}</style>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#c8ccd8', margin: 0, letterSpacing: '-0.01em' }}>
          Riwayat Pelanggaran
        </h2>
        <p style={{ fontSize: '12px', color: '#3e4455', marginTop: '4px' }}>
          Seluruh event pelanggaran APD yang terdeteksi
        </p>
      </div>

      {/* Filter */}
      <div style={{ background: '#13151f', border: '1px solid #1e2130', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={filters.jenis_pelanggaran}
          onChange={(e) => setFilters({ ...filters, jenis_pelanggaran: e.target.value, page: 1 })}
          style={inputStyle}
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
          style={inputStyle}
        />
        <input
          type="date"
          value={filters.tanggal_selesai}
          onChange={(e) => setFilters({ ...filters, tanggal_selesai: e.target.value, page: 1 })}
          style={inputStyle}
        />
        <button
          onClick={() => setFilters({ jenis_pelanggaran: '', tanggal_mulai: '', tanggal_selesai: '', page: 1 })}
          style={{ ...inputStyle, color: '#5a6070', cursor: 'pointer', border: '1px solid #1e2130' }}
        >
          Reset
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#13151f', border: '1px solid #1e2130', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e2130' }}>
              {['Waktu', 'Shift', 'Kamera', 'Pelanggaran', 'Confidence', 'Foto'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3e4455' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#3e4455', fontSize: '13px' }}>Memuat data...</td></tr>
            ) : violations.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#3e4455', fontSize: '13px' }}>Tidak ada data</td></tr>
            ) : violations.map((v) => {
              const badge = jenisBadgeColor[v.jenis_pelanggaran] ?? { bg: '#1e2130', color: '#5a6070' }
              return (
                <tr key={v.id} className="vio-row" style={{ borderBottom: '1px solid #0f1117' }}>
                  <td style={{ padding: '12px 16px', color: '#5a6070', fontFamily: "'DM Mono', monospace", fontSize: '12px' }}>
                    {new Date(v.timestamp_deteksi).toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#a0a8bc' }}>{v.nama_shift}</td>
                  <td style={{ padding: '12px 16px', color: '#a0a8bc', fontFamily: "'DM Mono', monospace", fontSize: '12px' }}>{v.kode_kamera}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '500' }}>
                      {jenisLabel[v.jenis_pelanggaran] ?? v.jenis_pelanggaran}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#a0a8bc', fontFamily: "'DM Mono', monospace", fontSize: '12px' }}>
                    {v.confidence_score}%
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => setSelectedId(v.id)}
                      style={{ background: 'none', border: 'none', color: '#7aa2f7', fontSize: '12px', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                    >
                      Lihat Foto →
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #1e2130' }}>
          <span style={{ fontSize: '12px', color: '#3e4455' }}>Total: {meta.total ?? 0} data</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['Prev', `Hal ${filters.page}`, 'Next'].map((label, i) => (
              <button
                key={i}
                disabled={i === 0 ? filters.page <= 1 : i === 2 ? filters.page >= Math.ceil((meta.total ?? 0) / 20) : true}
                onClick={() => {
                  if (i === 0) setFilters({ ...filters, page: filters.page - 1 })
                  if (i === 2) setFilters({ ...filters, page: filters.page + 1 })
                }}
                style={{
                  background: i === 1 ? '#1a2035' : '#0f1117',
                  border: '1px solid #1e2130',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  color: i === 1 ? '#7aa2f7' : '#5a6070',
                  cursor: i === 1 ? 'default' : 'pointer',
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {label}
              </button>
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

  useEffect(() => {
    api.get(`/violations/${id}`).then(res => setData(res.data.data))
  }, [id])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#13151f', border: '1px solid #1e2130', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '460px', margin: '0 16px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#c8ccd8' }}>Detail Pelanggaran</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#3e4455', cursor: 'pointer', fontSize: '18px', padding: 0, lineHeight: 1 }}>✕</button>
        </div>
        {data ? (
          <div>
            <div style={{ background: '#0f1117', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={data.foto_url}
                alt="Bukti"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
              <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#3e4455', fontSize: '13px', flexDirection: 'column', gap: '8px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Foto tidak tersedia
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                ['Shift', data.nama_shift],
                ['Kamera', `${data.kode_kamera} — ${data.lokasi_kamera}`],
                ['Pelanggaran', data.jenis_pelanggaran],
                ['Confidence', `${data.confidence_score}%`],
                ['Waktu', new Date(data.timestamp_deteksi).toLocaleString('id-ID')],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                  <span style={{ color: '#3e4455' }}>{label}</span>
                  <span style={{ color: '#a0a8bc', fontFamily: "'DM Mono', monospace", fontSize: '12px' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#3e4455', fontSize: '13px' }}>Memuat...</div>
        )}
      </div>
    </div>
  )
}