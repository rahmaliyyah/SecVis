import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Violations from './pages/violations/Violations'
import Shifts from './pages/shifts/Shifts'
import Cameras from './pages/cameras/Cameras'
import ProtectedRoute from './components/ProtectedRoute'
import { isAuthenticated } from './utils/auth'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/violations" element={
          <ProtectedRoute><Violations /></ProtectedRoute>
        } />
        <Route path="/shifts" element={
          <ProtectedRoute><Shifts /></ProtectedRoute>
        } />
        <Route path="/cameras" element={
          <ProtectedRoute><Cameras /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}