import { Navigate, Route, Routes } from 'react-router-dom'
import { SuperAdminPage } from '@/pages/super-admin-page'

/**
 * Super-admin entry — role already verified in App.
 * Canonical path: /admin (other paths redirect here).
 */
export function SuperAdminGate() {
  return (
    <Routes>
      <Route path="/admin" element={<SuperAdminPage />} />
      <Route path="/admin/*" element={<SuperAdminPage />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
