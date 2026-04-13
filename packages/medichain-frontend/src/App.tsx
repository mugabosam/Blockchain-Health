import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import DoctorPage from './pages/DoctorPage'
import NursePage from './pages/NursePage'
import RecordsPage from './pages/RecordsPage'
import PharmacyPage from './pages/PharmacyPage'
import AccessPage from './pages/AccessPage'
import AuditPage from './pages/AuditPage'
import AdminPage from './pages/AdminPage'
import EmergencyPage from './pages/EmergencyPage'
import SharingPage from './pages/SharingPage'
import NetworkPage from './pages/NetworkPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/doctor" element={<DoctorPage />} />
          <Route path="/nurse" element={<NursePage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/pharmacy" element={<PharmacyPage />} />
          <Route path="/access" element={<AccessPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/emergency" element={<EmergencyPage />} />
          <Route path="/sharing" element={<SharingPage />} />
          <Route path="/network" element={<NetworkPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
