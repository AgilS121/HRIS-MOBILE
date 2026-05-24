import { useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import { attendanceApi } from '../api/client'

const NAVY = '#1e3a5f'

const STATUS_COLOR: Record<string, string> = {
  present: '#22c55e', late: '#f59e0b', absent: '#ef4444',
  sick: '#8b5cf6', permit: '#06b6d4', leave: '#3b82f6',
  holiday: '#6b7280', wfh: '#14b8a6',
}

function fmt(ts: string | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function AttendanceScreen() {
  const { employee } = useAuth()
  const now = new Date()
  const [year, setYear]       = useState(now.getFullYear())
  const [month, setMonth]     = useState(now.getMonth() + 1)
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await attendanceApi.my(year, month)
      setRecords(data)
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [year, month])

  useFocusEffect(useCallback(() => { load() }, [load]))

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    const n = new Date()
    if (year === n.getFullYear() && month === n.getMonth() + 1) return
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const present  = records.filter(r => r.status === 'present').length
  const late     = records.filter(r => r.status === 'late').length
  const absent   = records.filter(r => r.status === 'absent').length

  return (
    <View style={styles.root}>
      {/* Month picker */}
      <View style={styles.monthBar}>
        <TouchableOpacity onPress={prevMonth} style={styles.arrow}>
          <Text style={styles.arrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTHS[month - 1]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.arrow}>
          <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Summary chips */}
      <View style={styles.chips}>
        {[
          { label: 'Present', count: present, color: '#22c55e' },
          { label: 'Late',    count: late,    color: '#f59e0b' },
          { label: 'Absent',  count: absent,  color: '#ef4444' },
          { label: 'Total',   count: records.length, color: NAVY },
        ].map(({ label, count, color }) => (
          <View key={label} style={[styles.chip, { borderColor: color + '30', backgroundColor: color + '10' }]}>
            <Text style={[styles.chipCount, { color }]}>{count}</Text>
            <Text style={[styles.chipLabel, { color }]}>{label}</Text>
          </View>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator color={NAVY} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No records for {MONTHS[month - 1]} {year}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const color = STATUS_COLOR[item.status] ?? '#6b7280'
            return (
              <View style={styles.row}>
                <View style={[styles.dateBox, { backgroundColor: color + '15' }]}>
                  <Text style={[styles.dateDay, { color }]}>
                    {new Date(item.work_date).getDate()}
                  </Text>
                  <Text style={[styles.dateMon, { color }]}>
                    {MONTHS[new Date(item.work_date).getMonth()]}
                  </Text>
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowDate}>{fmtDate(item.work_date)}</Text>
                  <View style={[styles.rowBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.rowStatus, { color }]}>{item.status}</Text>
                  </View>
                </View>
                <View style={styles.rowTimes}>
                  <Text style={styles.rowTime}>{fmt(item.clock_in_at)}</Text>
                  <Text style={styles.rowTimeSep}>→</Text>
                  <Text style={styles.rowTime}>{fmt(item.clock_out_at)}</Text>
                </View>
              </View>
            )
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },

  monthBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  arrow:      { padding: 8 },
  arrowText:  { fontSize: 24, color: NAVY, fontWeight: '300' },
  monthLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },

  chips: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12,
  },
  chip: {
    flex: 1, borderRadius: 10, borderWidth: 1,
    paddingVertical: 8, alignItems: 'center',
  },
  chipCount: { fontSize: 18, fontWeight: '700' },
  chipLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },

  list: { paddingHorizontal: 16, paddingBottom: 20 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#9ca3af', fontSize: 14 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  dateBox: {
    width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  dateDay: { fontSize: 16, fontWeight: '700' },
  dateMon: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase' },

  rowInfo: { flex: 1 },
  rowDate: { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 4 },
  rowBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6,
  },
  rowStatus: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

  rowTimes:  { alignItems: 'flex-end', gap: 2 },
  rowTime:   { fontSize: 13, fontWeight: '600', color: '#374151' },
  rowTimeSep:{ fontSize: 10, color: '#9ca3af', textAlign: 'center' },
})
