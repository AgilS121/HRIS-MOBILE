import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert,
} from 'react-native'
import { useAuth } from '../context/AuthContext'

const NAVY = '#1e3a5f'

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '—'}</Text>
    </View>
  )
}

export default function ProfileScreen() {
  const { user, employee, logout } = useAuth()

  function confirmLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ])
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Avatar header */}
      <View style={styles.heroCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(employee?.full_name ?? user?.name ?? 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.heroName}>{employee?.full_name ?? user?.name}</Text>
        <Text style={styles.heroNo}>{employee?.employee_no ?? ''}</Text>
        {employee?.department_name && (
          <Text style={styles.heroDept}>
            {employee.department_name}
            {employee.position_name ? ` · ${employee.position_name}` : ''}
          </Text>
        )}
      </View>

      {/* Employee info */}
      <View style={styles.card}>
        <Text style={styles.section}>Employee Information</Text>
        <Row label="Employee No" value={employee?.employee_no} />
        <Row label="Department"  value={employee?.department_name} />
        <Row label="Position"    value={employee?.position_name} />
        <Row label="Email"       value={employee?.email ?? user?.email} />
        <Row label="Phone"       value={employee?.phone} />
      </View>

      {/* Account info */}
      <View style={styles.card}>
        <Text style={styles.section}>Account</Text>
        <Row label="Login Email" value={user?.email} />
        <Row label="Account Type" value={user?.is_temp ? 'Temporary (change password)' : 'Permanent'} />
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout} activeOpacity={0.85}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 20, paddingBottom: 40 },

  heroCard: {
    backgroundColor: NAVY, borderRadius: 20, padding: 28,
    alignItems: 'center', marginBottom: 16,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '800' },
  heroName:   { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  heroNo:     { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4, letterSpacing: 1 },
  heroDept:   { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4, textAlign: 'center' },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 12, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04,
    shadowRadius: 4, elevation: 1,
  },
  section: {
    fontSize: 12, fontWeight: '700', color: '#9ca3af',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  rowLabel: { fontSize: 13, color: '#6b7280' },
  rowValue: { fontSize: 13, fontWeight: '600', color: '#111827', maxWidth: '60%', textAlign: 'right' },

  logoutBtn: {
    marginTop: 8, backgroundColor: '#fee2e2', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
})
