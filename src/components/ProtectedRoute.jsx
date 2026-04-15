import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated } from '../hooks/useAdmin'

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }
  return children
}
