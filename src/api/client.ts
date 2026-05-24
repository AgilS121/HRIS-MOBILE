import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Change this to your server IP when testing on a physical device
// e.g. 'http://192.168.1.x:3000/api'
// export const BASE_URL = 'http://10.0.2.2:3000/api' // Android emulator → localhost
export const BASE_URL = 'http://localhost:3000/api' // Web/iOS simulator

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string, device_id?: string) =>
    api.post('/auth/login', { email, password, device_id }).then((r) => r.data.data),
  me: () => api.get('/auth/me').then((r) => r.data.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
}

// ─── Employee ─────────────────────────────────────────────────────────────────

export const employeeApi = {
  me: () => api.get('/hr/employees/me').then((r) => r.data.data),
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export const attendanceApi = {
  today: () => api.get('/hr/attendance/today').then((r) => r.data.data),
  my: (year: number, month: number) =>
    api.get('/hr/attendance/my', { params: { year, month } }).then((r) => r.data.data),
  clockIn: (data: { lat?: number; lng?: number; selfie?: { uri: string; name: string; type: string } }) => {
    const fd = new FormData()
    if (data.lat != null) fd.append('lat', String(data.lat))
    if (data.lng != null) fd.append('lng', String(data.lng))
    if (data.selfie) fd.append('selfie', data.selfie as any)
    return api.post('/hr/attendance/clock-in', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data)
  },
  clockOut: (data: { lat?: number; lng?: number; selfie?: { uri: string; name: string; type: string } }) => {
    const fd = new FormData()
    if (data.lat != null) fd.append('lat', String(data.lat))
    if (data.lng != null) fd.append('lng', String(data.lng))
    if (data.selfie) fd.append('selfie', data.selfie as any)
    return api.post('/hr/attendance/clock-out', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data)
  },
}

// ─── Leave ────────────────────────────────────────────────────────────────────

export const leaveApi = {
  types: (company_id: number) =>
    api.get('/hr/leave-types', { params: { company_id } }).then((r) => r.data.data),
  balances: (employee_id: number, year: number) =>
    api.get('/hr/leave-balances', { params: { employee_id, year } }).then((r) => r.data.data),
  myRequests: (employee_id: number) =>
    api.get('/hr/leave-requests/mine', { params: { employee_id } }).then((r) => r.data.data),
  create: (d: object) =>
    api.post('/hr/leave-requests', d).then((r) => r.data.data),
  cancel: (id: number) =>
    api.put(`/hr/leave-requests/${id}/cancel`, {}).then((r) => r.data.data),
}
