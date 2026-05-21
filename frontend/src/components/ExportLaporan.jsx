import { useState } from 'react'
import api from '../api/axios'

const bulanList = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
]

/**
 * Bangun nama file sesuai format yang diinginkan:
 *   Tahunan : REPORT PELANGGARAN K3 PT. EPSON INDONESIA_2025
 *   Bulanan : REPORT PELANGGARAN K3 PT. EPSON INDONESIA_02/2025
 *   Harian  : REPORT PELANGGARAN K3 PT. EPSON INDONESIA_02/02/2025
 */
function buildFileName(tipe, { tanggal, bulan, tahun }, ext) {
  const prefix = 'REPORT PELANGGARAN K3 PT. EPSON INDONESIA_'
  if (tipe === 'harian' && tanggal) {
    // tanggal dalam format YYYY-MM-DD
    const [y, m, d] = tanggal.split('-')
    return `${prefix}${d}/${m}/${y}.${ext}`
  }
  if (tipe === 'bulanan' && bulan && tahun) {
    const m = String(bulan).padStart(2, '0')
    return `${prefix}${m}/${tahun}.${ext}`
  }
  if (tipe === 'tahunan' && tahun) {
    return `${prefix}${tahun}.${ext}`
  }
  return `REPORT_K3.${ext}`
}

export default function ExportLaporan() {
  const [show,    setShow]    = useState(false)
  const [format,  setFormat]  = useState('pdf')   // 'pdf' | 'excel'
  const [tipe,    setTipe]    = useState('harian')
  const [tanggal, setTanggal] = useState('')
  const [bulan,   setBulan]   = useState('')
  const [tahun,   setTahun]   = useState(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const isDisabled =
    loading ||
    (tipe === 'harian'  && !tanggal) ||
    (tipe === 'bulanan' && (!bulan || !tahun))

  const handleExport = async () => {
    setLoading(true)
    setError('')
    try {
      const params = { tipe }
      if (tipe === 'harian')  params.tanggal = tanggal
      if (tipe === 'bulanan') { params.bulan = bulan; params.tahun = tahun }
      if (tipe === 'tahunan') params.tahun = tahun

      const endpoint  = format === 'excel' ? '/laporan/export-excel' : '/laporan/export'
      const mimeType  = format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf'
      const ext       = format === 'excel' ? 'xlsx' : 'pdf'
      const fileName  = buildFileName(tipe, { tanggal, bulan, tahun }, ext)

      const res = await api.get(endpoint, { params, responseType: 'blob' })

      const blob = new Blob([res.data], { type: mimeType })
      const url  = window.URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.setAttribute('download', fileName)
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      setShow(false)
    } catch (err) {
      setError('Gagal generate laporan. Pastikan parameter sudah benar.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ─── Styles ────────────────────────────────────────────────────────────────
  const s = {
    input: {
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
    },
    label: {
      display: 'block',
      fontSize: '11px',
      fontWeight: '600',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: '#3e4455',
      marginBottom: '6px',
    },
    chipActive: {
      flex: 1, padding: '7px 6px', borderRadius: '7px', fontSize: '12px',
      fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
      border: '1px solid #7aa2f7', background: '#1a2035', color: '#7aa2f7',
      textTransform: 'capitalize',
    },
    chipIdle: {
      flex: 1, padding: '7px 6px', borderRadius: '7px', fontSize: '12px',
      fontWeight: '400', cursor: 'pointer', fontFamily: 'inherit',
      border: '1px solid #1e2130', background: '#0f1117', color: '#5a6070',
      textTransform: 'capitalize',
    },
  }

  return (
    <>
      {/* ── Tombol trigger ── */}
      <button
        onClick={() => setShow(true)}
        style={{
          background: '#1a2035',
          color: '#7aa2f7',
          border: '1px solid #2a3558',
          borderRadius: '8px',
          padding: '9px 16px',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Export Laporan
      </button>

      {/* ── Modal ── */}
      {show && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.72)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50, backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShow(false)}
        >
          <div
            style={{
              background: '#13151f',
              border: '1px solid #1e2130',
              borderRadius: '14px',
              padding: '28px',
              width: '100%',
              maxWidth: '420px',
              margin: '0 16px',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#c8ccd8' }}>
                Export Laporan
              </span>
              <button onClick={() => setShow(false)}
                style={{ background: 'none', border: 'none', color: '#3e4455', cursor: 'pointer', fontSize: '18px', padding: 0 }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* ── Format: PDF / Excel ── */}
              <div>
                <label style={s.label}>Format</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { key: 'pdf',   icon: '📄', label: 'PDF' },
                    { key: 'excel', icon: '📊', label: 'Excel (.xlsx)' },
                  ].map(f => (
                    <button key={f.key} onClick={() => setFormat(f.key)}
                      style={format === f.key ? s.chipActive : s.chipIdle}>
                      {f.icon} {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Tipe: harian / bulanan / tahunan ── */}
              <div>
                <label style={s.label}>Periode</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['harian', 'bulanan', 'tahunan'].map(t => (
                    <button key={t} onClick={() => setTipe(t)}
                      style={tipe === t ? s.chipActive : s.chipIdle}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Input kondisional ── */}
              {tipe === 'harian' && (
                <div>
                  <label style={s.label}>Tanggal</label>
                  <input type="date" value={tanggal}
                    onChange={e => setTanggal(e.target.value)}
                    style={s.input} />
                </div>
              )}

              {tipe === 'bulanan' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={s.label}>Bulan</label>
                    <select value={bulan} onChange={e => setBulan(e.target.value)}
                      style={{ ...s.input, cursor: 'pointer' }}>
                      <option value="">Pilih bulan</option>
                      {bulanList.map((b, i) => (
                        <option key={i} value={i + 1}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Tahun</label>
                    <input type="number" value={tahun}
                      onChange={e => setTahun(e.target.value)}
                      style={s.input} min="2024" max="2099" />
                  </div>
                </div>
              )}

              {tipe === 'tahunan' && (
                <div>
                  <label style={s.label}>Tahun</label>
                  <input type="number" value={tahun}
                    onChange={e => setTahun(e.target.value)}
                    style={s.input} min="2024" max="2099" />
                </div>
              )}

              {/* Preview nama file */}
              {!isDisabled && (
                <div style={{
                  background: '#0f1117',
                  border: '1px solid #1e2130',
                  borderRadius: '7px',
                  padding: '8px 12px',
                  fontSize: '11px',
                  color: '#4e5870',
                  wordBreak: 'break-all',
                }}>
                  <span style={{ color: '#3e4455', fontWeight: '600' }}>File: </span>
                  <span style={{ color: '#7aa2f7' }}>
                    {buildFileName(tipe, { tanggal, bulan, tahun }, format === 'excel' ? 'xlsx' : 'pdf')}
                  </span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{
                  background: '#1e1520', border: '1px solid #3d2030',
                  borderRadius: '7px', padding: '9px 12px',
                  fontSize: '12px', color: '#f7768e',
                }}>
                  {error}
                </div>
              )}

              {/* Tombol download */}
              <button
                onClick={handleExport}
                disabled={isDisabled}
                style={{
                  background: isDisabled
                    ? '#1a2035'
                    : 'linear-gradient(135deg, #3d59a1 0%, #7aa2f7 100%)',
                  color: isDisabled ? '#3e4455' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '11px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  marginTop: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'opacity 0.15s',
                }}
              >
                {loading ? (
                  <>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                    Generating...
                  </>
                ) : (
                  <>
                    {format === 'excel' ? '' : ''}
                    Download {format === 'excel' ? 'Excel' : 'PDF'}
                  </>
                )}
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  )
}