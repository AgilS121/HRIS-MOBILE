import React, { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { authApi, employeeApi } from '../api/client'

interface AuthUser {
  id: number
  email: string
  name: string
  is_temp: boolean
}

interface Employee {
  id: number
  full_name: string
  employee_no: string
  department_name: string | null
  position_name: string | null
  company_id: number
  email: string | null
  phone: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  employee: Employee | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<AuthUser | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    restore()
  }, [])

  async function restore() {
    try {
      const token = await AsyncStorage.getItem('token')
      if (!token) return
      const [me, emp] = await Promise.all([authApi.me(), employeeApi.me().catch(() => null)])
      setUser(me)
      setEmployee(emp)
    } catch {
      await AsyncStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  async function getOrCreateDeviceId(): Promise<string> {
    let id = await AsyncStorage.getItem('device_id')
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2)
      await AsyncStorage.setItem('device_id', id)
    }
    return id
  }

  async function login(email: string, password: string) {
    const device_id = await getOrCreateDeviceId()
    const data = await authApi.login(email, password, device_id)
    await AsyncStorage.setItem('token', data.token)
    setUser(data.user)
    const emp = await employeeApi.me().catch(() => null)
    setEmployee(emp)
  }

  async function logout() {
    await authApi.logout().catch(() => {})
    await AsyncStorage.removeItem('token')
    setUser(null)
    setEmployee(null)
  }

  return (
    <AuthContext.Provider value={{ user, employee, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
