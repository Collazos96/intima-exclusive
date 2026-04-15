import { Navigate, useLocation } from 'react-router-dom'
// Import desde lib/authFlag (módulo pequeño y sin dependencias)
// para que el bundle público NO arrastre todo useAdmin.
import { isAuthenticated } from '../lib/authFlag'

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }
  return children
}
