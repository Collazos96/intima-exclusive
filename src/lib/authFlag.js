/**
 * Flag de sesión admin en localStorage.
 * Este archivo es PEQUEÑO y SIN DEPENDENCIAS para que ProtectedRoute
 * pueda importarlo sin arrastrar todo el bundle de useAdmin (API calls,
 * React Query, etc.) al bundle público.
 *
 * El auth real vive en la cookie JWT HttpOnly del API.
 */

const AUTH_FLAG = 'intima_admin_session'

export function isAuthenticated() {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(AUTH_FLAG) === '1'
}

export function setAuthFlag() {
  try { localStorage.setItem(AUTH_FLAG, '1') } catch { /* noop */ }
}

export function clearAuthFlag() {
  try { localStorage.removeItem(AUTH_FLAG) } catch { /* noop */ }
}
