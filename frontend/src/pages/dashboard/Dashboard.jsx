import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6']

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState([])
  const [byShift, setByShift] = useState([])
  const [byType, setByType] = useState([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const fetchData = async () => {
    try {
      const [summaryRes, trendRes, shiftRes, typeRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get(`/dashboard/trend?tanggal_mulai=${sevenDaysAgo}&tanggal_selesai=${today}`),
        api.get('/dashboard/by-shift?periode=bulanan'),
        api.get('/dashboard/by-type?periode=bulanan'),
      ])
      setSummary(summaryRes.data.data)
      setTrend(trendRes.data.data)
      setByShift(shiftRes.data.data)
      setByType(typeRes.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Polling tiap 10 detik untuk KPI
    const interval = setInterval(() => {
      api.get('/dashboard/summary').then(res => setSummary(res.data.data))
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64 text-gray-500">Memuat data...</div>
    </Layout>
  )

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-800">Dashboard Monitoring K3</h2>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Hari Ini</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{summary?.total_hari_ini ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">pelanggaran</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Minggu Ini</p>
            <p className="text-3xl font-bold text-yellow-500 mt-1">{summary?.total_minggu_ini ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">pelanggaran</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Bulan Ini</p>
            <p className="text-3xl font-bold text-red-500 mt-1">{summary?.total_bulan_ini ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">pelanggaran</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Shift Terbanyak</p>
            <p className="text-xl font-bold text-purple-600 mt-1">{summary?.shift_terbanyak?.nama_shift ?? '-'}</p>
            <p className="text-xs text-gray-400 mt-1">{summary?.shift_terbanyak?.total_pelanggaran ?? 0} pelanggaran</p>
          </div>
        </div>

        {/* Grafik Tren */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">Tren Pelanggaran 7 Hari Terakhir</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Grafik Per Shift & Per Jenis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-4">Pelanggaran Per Shift</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byShift}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nama_shift" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total_pelanggaran" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-4">Distribusi Jenis Pelanggaran</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byType} dataKey="total" nameKey="jenis_pelanggaran" cx="50%" cy="50%" outerRadius={80} label={({ jenis_pelanggaran, persentase }) => `${jenis_pelanggaran} ${persentase}%`}>
                  {byType.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  )
}