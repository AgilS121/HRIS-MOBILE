import { useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, RefreshControl,
} from 'react-native'
import * as Location from 'expo-location'
import * as ImagePicker from 'expo-image-picker'
import { useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import { attendanceApi } from '../api/client'

const NAVY = '#1e3a5f'

const STATUS_COLOR: Record<string, string> = {
  present: '#22c55e',
  late:    '#f59e0b',
  absent:  '#ef4444',
  sick:    '#8b5cf6',
  permit:  '#06b6d4',
  leave:   '#3b82f6',
  holiday: '#6b7280',
  wfh:     '#14b8a6',
}

function fmt(ts: string | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export default function HomeScreen() {
  const { user, employee } = useAuth()
  const [today, setToday]       = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [clocking, setClocking] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await attendanceApi.today()
      setToday(data)
    } catch {
      setToday(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  async function takeSelfieAndLocation() {
    const [camPerm, locPerm] = await Promise.all([
      ImagePicker.requestCameraPermissionsAsync(),
      Location.requestForegroundPermissionsAsync(),
    ])

    let selfie = undefined
    if (camPerm.granted) {
      const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        quality: 0.6,
        allowsEditing: false,
      })
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        selfie = {
          uri:  asset.uri,
          name: 'selfie.jpg',
          type: 'image/jpeg',
        }
      }
    }

    let lat, lng
    if (locPerm.granted) {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      lat = loc.coords.latitude
      lng = loc.coords.longitude
    }

    return { selfie, lat, lng }
  }

  async function handleClockIn() {
    setClocking(true)
    try {
      const { selfie, lat, lng } = await takeSelfieAndLocation()
      await attendanceApi.clockIn({ selfie, lat, lng })
      Alert.alert('Success', 'Clock-in recorded!')
      load()
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Clock-in failed'
      Alert.alert('Error', msg)
    } finally {
      setClocking(false)
    }
  }

  async function handleClockOut() {
    setClocking(true)
    try {
      const { selfie, lat, lng } = await takeSelfieAndLocation()
      await attendanceApi.clockOut({ selfie, lat, lng })
      Alert.alert('Success', 'Clock-out recorded!')
      load()
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Clock-out failed'
      Alert.alert('Error', msg)
    } finally {
      setClocking(false)
    }
  }

  const hasClockedIn  = today?.clock_in_at != null
  const hasClockedOut = today?.clock_out_at != null
  const statusColor   = today?.status ? (STATUS_COLOR[today.status] ?? '#6b7280') : '#6b7280'

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {employee?.full_name?.split(' ')[0] ?? user?.name} 👋</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(employee?.full_name ?? user?.name ?? 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Today status card */}
      <View style={styles.statusCard}>
        <Text style={styles.cardLabel}>Today's Attendance</Text>
        {loading ? (
          <ActivityIndicator color={NAVY} style={{ marginVertical: 24 }} />
        ) : (
          <>
            {today?.status && (
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {today.status.toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.timeRow}>
              <View style={styles.timeBox}>
                <Text style={styles.timeLabel}>Clock In</Text>
                <Text style={styles.timeValue}>{fmt(today?.clock_in_at)}</Text>
              </View>
              <View style={styles.timeDivider} />
              <View style={styles.timeBox}>
                <Text style={styles.timeLabel}>Clock Out</Text>
                <Text style={styles.timeValue}>{fmt(today?.clock_out_at)}</Text>
              </View>
            </View>

            {today?.note && (
              <Text style={styles.note}>Note: {today.note}</Text>
            )}
          </>
        )}
      </View>

      {/* Action buttons */}
      {clocking ? (
        <View style={styles.clockingBox}>
          <ActivityIndicator color={NAVY} />
          <Text style={styles.clockingText}>Processing…</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.btnIn, hasClockedIn && styles.btnDone]}
            onPress={handleClockIn}
            disabled={hasClockedIn}
            activeOpacity={0.85}
          >
            <Text style={styles.actionIcon}>🟢</Text>
            <Text style={styles.actionLabel}>{hasClockedIn ? 'Clocked In' : 'Clock In'}</Text>
            <Text style={styles.actionSub}>
              {hasClockedIn ? fmt(today.clock_in_at) : 'Tap to check in'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.btnOut, (!hasClockedIn || hasClockedOut) && styles.btnDone]}
            onPress={handleClockOut}
            disabled={!hasClockedIn || hasClockedOut}
            activeOpacity={0.85}
          >
            <Text style={styles.actionIcon}>🔴</Text>
            <Text style={styles.actionLabel}>{hasClockedOut ? 'Clocked Out' : 'Clock Out'}</Text>
            <Text style={styles.actionSub}>
              {hasClockedOut ? fmt(today.clock_out_at) : 'Tap to check out'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Employee info */}
      {employee && (
        <View style={styles.empCard}>
          <Text style={styles.empNo}>{employee.employee_no}</Text>
          <Text style={styles.empDept}>
            {employee.department_name ?? '—'}
            {employee.position_name ? ` · ${employee.position_name}` : ''}
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: { fontSize: 20, fontWeight: '700', color: '#111827' },
  date:     { fontSize: 13, color: '#6b7280', marginTop: 2 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },

  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 12 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, marginBottom: 16,
  },
  statusDot:  { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  timeRow:     { flexDirection: 'row', alignItems: 'center' },
  timeBox:     { flex: 1, alignItems: 'center' },
  timeLabel:   { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  timeValue:   { fontSize: 22, fontWeight: '700', color: '#111827' },
  timeDivider: { width: 1, height: 40, backgroundColor: '#e5e7eb' },
  note:        { marginTop: 12, fontSize: 12, color: '#6b7280', fontStyle: 'italic' },

  clockingBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: 20,
  },
  clockingText: { fontSize: 14, color: NAVY, fontWeight: '600' },

  actions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionBtn: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    padding: 18, alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    borderWidth: 2, borderColor: 'transparent',
  },
  btnIn:   { borderColor: '#22c55e20' },
  btnOut:  { borderColor: '#ef444420' },
  btnDone: { opacity: 0.5 },
  actionIcon:  { fontSize: 24 },
  actionLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  actionSub:   { fontSize: 11, color: '#9ca3af' },

  empCard: {
    backgroundColor: NAVY, borderRadius: 12, padding: 16,
    alignItems: 'center',
  },
  empNo:   { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 1 },
  empDept: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 4 },
})
