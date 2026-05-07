import { useState } from 'react'
import api from '../api/axios'

export default function ExportLaporan() {
  const [show, setShow] = useState(false)
  const [tipe, setTipe] = useState('harian')
  const [tanggal, setTanggal] = useState('')
  const [bulan, setBulan] = useState('')
  const [tahun, setTahun] = useState(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      let params = { tipe }
      if (tipe === 'harian')  params.tanggal = tanggal
      if (tipe === 'bulanan') { params.bulan = bulan; params.tahun = tahun }
      if (tipe === 'tahunan') params.tahun = tahun

      const res = await api.get('/laporan/export', {
        params,
        responseType: 'blob',
      })

      const url  = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', `Laporan_K3_SecVis.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      setShow(false)
    } catch (err) {
      alert('Gagal generate laporan!')
      console.error(err)
    } finally {
      setLoading(false)
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

  const bulanList = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'
  ]

  return (
    <>
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Export Laporan
      </button>

      {show && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}
          onClick={() => setShow(false)}
        >
          <div
            style={{ background: '#13151f', border: '1px solid #1e2130', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '400px', margin: '0 16px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#c8ccd8' }}>Export Laporan PDF</span>
              <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', color: '#3e4455', cursor: 'pointer', fontSize: '18px', padding: 0 }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Tipe Laporan */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3e4455', marginBottom: '6px' }}>Tipe Laporan</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['harian', 'bulanan', 'tahunan'].map(t => (
                    <button
                      key={t}
                      onClick={() => setTipe(t)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: tipe === t ? '1px solid #7aa2f7' : '1px solid #1e2130',
                        background: tipe === t ? '#1a2035' : '#0f1117',
                        color: tipe === t ? '#7aa2f7' : '#5a6070',
                        fontSize: '12px',
                        fontWeight: tipe === t ? '600' : '400',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        textTransform: 'capitalize',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input berdasarkan tipe */}
              {tipe === 'harian' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3e4455', marginBottom: '6px' }}>Pilih Tanggal</label>
                  <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} style={inputStyle} />
                </div>
              )}

              {tipe === 'bulanan' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3e4455', marginBottom: '6px' }}>Bulan</label>
                    <select value={bulan} onChange={e => setBulan(e.target.value)} style={inputStyle}>
                      <option value="">Pilih bulan</option>
                      {bulanList.map((b, i) => (
                        <option key={i} value={i + 1}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3e4455', marginBottom: '6px' }}>Tahun</label>
                    <input type="number" value={tahun} onChange={e => setTahun(e.target.value)} style={inputStyle} min="2024" max="2099" />
                  </div>
                </div>
              )}

              {tipe === 'tahunan' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3e4455', marginBottom: '6px' }}>Pilih Tahun</label>
                  <input type="number" value={tahun} onChange={e => setTahun(e.target.value)} style={inputStyle} min="2024" max="2099" />
                </div>
              )}

              <button
                onClick={handleExport}
                disabled={loading || (tipe === 'harian' && !tanggal) || (tipe === 'bulanan' && (!bulan || !tahun))}
                style={{
                  background: 'linear-gradient(135deg, #3d59a1 0%, #7aa2f7 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '11px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  opacity: loading ? 0.6 : 1,
                  marginTop: '4px',
                }}
              >
                {loading ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}