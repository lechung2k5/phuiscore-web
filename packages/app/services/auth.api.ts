import { API_BASE } from '../utils/api-config'

// ============================================================
// 🔑 AUTH SERVICE - Kết nối tất cả API Authentication
// ============================================================

/** Lấy Access Token từ localStorage */
export const getAccessToken = (): string | null =>
  typeof window !== 'undefined'
    ? localStorage.getItem('accessToken') || localStorage.getItem('token')
    : null

/** Headers mặc định có kèm token */
export const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getAccessToken()}`,
})

// ─── Đăng ký ────────────────────────────────────────────────
export const apiRegister = async (data: {
  fullName: string
  email: string
  phoneNumber: string
  username: string
  password: string
}) => {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Đăng ký thất bại')
  return json
}

// ─── Xác minh email bằng OTP ────────────────────────────────
export const apiVerifyEmail = async (username: string, otp: string) => {
  const res = await fetch(`${API_BASE}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, otp }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Xác minh thất bại')
  return json
}

// ─── Đăng nhập ──────────────────────────────────────────────
export const apiLogin = async (username: string, password: string) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',   // Gửi/nhận HttpOnly cookie refreshToken
    body: JSON.stringify({ username, password }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Đăng nhập thất bại')
  return json
}

// ─── Làm mới Access Token qua cookie ────────────────────────
export const apiRefreshToken = async () => {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message)
  return json
}

// ─── Đăng xuất ──────────────────────────────────────────────
export const apiLogout = async () => {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: authHeaders(),
    credentials: 'include',
  })
  return res.json()
}

// ─── Quên mật khẩu ──────────────────────────────────────────
export const apiForgotPassword = async (email: string) => {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Yêu cầu thất bại')
  return json
}

// ─── Đặt lại mật khẩu ───────────────────────────────────────
export const apiResetPassword = async (username: string, otp: string, newPassword: string) => {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, otp, newPassword }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Đặt lại mật khẩu thất bại')
  return json
}

// ─── Đổi mật khẩu (Đã đăng nhập) ───────────────────────────
export const apiChangePassword = async (oldPassword: string, newPassword: string) => {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: authHeaders(),
    credentials: 'include',
    body: JSON.stringify({ oldPassword, newPassword }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Đổi mật khẩu thất bại')
  return json
}
