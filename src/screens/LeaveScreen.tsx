import { useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, ScrollView, ActivityIndicator,
  Alert, RefreshControl,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import { leaveApi } from '../api/client'

const NAVY = '#1e3a5f'
const COMPANY_ID = 1

const STATUS_COLOR: Record<string, string> = {
  pending:   '#f59e0b',
  approved:  '#22c55e',
  rejected:  '#ef4444',
  cancelled: '#6b7280',
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function LeaveScreen() {
  const { employee } = useAuth()
  const now = new Date()

  const [tab, setTab]             = useState<'requests' | 'balance'>('requests')
  const [requests, setRequests]   = useState<any[]>([])
  const [balances, setBalances]   = useState<any[]>([])
  const [leaveTypes, setLeaveTypes] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)

  const [form, setForm] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    total_days: '',
    reason: '',
  })
  const [formErr, setFormErr] = useState<Record<string, string>>({})

  const load = useCallback(async (isRefresh = false) => {
    if (!employee) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const [reqs, bals, types] = await Promise.all([
        leaveApi.myRequests(employee.id),
        leaveApi.balances(employee.id, now.getFullYear()),
        leaveApi.types(COMPANY_ID),
      ])
      setRequests(reqs)
      setBalances(bals)
      setLeaveTypes(types)
    } catch {
      setRequests([])
      setBalances([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [employee])

  useFocusEffect(useCallback(() => { load() }, [load]))

  function openForm() {
    setForm({ leave_type_id: '', start_date: '', end_date: '', total_days: '', reason: '' })
    setFormErr({})
    setShowForm(true)
  }

  async function handleSubmit() {
    const err: Record<string, string> = {}
    if (!form.leave_type_id) err.leave_type_id = 'Required'
    if (!form.start_date)    err.start_date    = 'Required (YYYY-MM-DD)'
    if (!form.end_date)      err.end_date      = 'Required (YYYY-MM-DD)'
    if (!form.total_days || isNaN(Number(form.total_days))) err.total_days = 'Enter number of days'
    if (Object.keys(err).length) { setFormErr(err); return }

    setSaving(true)
    try {
      await leaveApi.create({
        employee_id:   employee!.id,
        leave_type_id: Number(form.leave_type_id),
        start_date:    form.start_date,
        end_date:      form.end_date,
        total_days:    Number(form.total_days),
        reason:        form.reason || null,
      })
      setShowForm(false)
      Alert.alert('Success', 'Leave request submitted!')
      load(true)
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to submit')
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel(id: number) {
    Alert.alert('Cancel Request', 'Cancel this leave request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveApi.cancel(id)
            load(true)
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message || 'Failed to cancel')
          }
        },
      },
    ])
  }

  const pending = requests.filter(r => r.status === 'pending').length

  return (
    <View style={styles.root}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'requests' && styles.tabActive]}
          onPress={() => setTab('requests')}
        >
          <Text style={[styles.tabText, tab === 'requests' && styles.tabTextActive]}>
            Requests {pending > 0 ? `(${pending})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'balance' && styles.tabActive]}
          onPress={() => setTab('balance')}
        >
          <Text style={[styles.tabText, tab === 'balance' && styles.tabTextActive]}>Balance</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={NAVY} style={{ marginTop: 40 }} />
      ) : tab === 'requests' ? (
        <FlatList
          data={requests}
          keyExtractor={item => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <TouchableOpacity style={styles.addBtn} onPress={openForm} activeOpacity={0.85}>
              <Text style={styles.addBtnText}>+ Request Leave</Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No leave requests yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const color = STATUS_COLOR[item.status] ?? '#6b7280'
            return (
              <View style={styles.reqCard}>
                <View style={styles.reqTop}>
                  <View>
                    <Text style={styles.reqType}>{item.leave_type_name}</Text>
                    <Text style={styles.reqDates}>
                      {fmtDate(item.start_date)} – {fmtDate(item.end_date)}
                    </Text>
                    <Text style={styles.reqDays}>{item.total_days} day(s)</Text>
                  </View>
                  <View style={[styles.reqBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.reqStatus, { color }]}>{item.status}</Text>
                  </View>
                </View>
                {item.reason && <Text style={styles.reqReason}>{item.reason}</Text>}
                {item.rejection_note && (
                  <Text style={styles.rejNote}>Rejected: {item.rejection_note}</Text>
                )}
                {item.status === 'pending' && (
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
                    <Text style={styles.cancelBtnText}>Cancel Request</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        >
          <Text style={styles.balYear}>Balance {now.getFullYear()}</Text>
          {balances.length === 0
            ? <View style={styles.empty}><Text style={styles.emptyText}>No balance records</Text></View>
            : balances.map((b: any) => {
              const used = b.used_days ?? 0
              const total = (b.quota_days ?? 0) + (b.adjusted_days ?? 0) + (b.carried_over_days ?? 0)
              const remaining = total - used
              const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0
              return (
                <View key={b.id} style={styles.balCard}>
                  <View style={styles.balTop}>
                    <Text style={styles.balType}>{b.leave_type_name}</Text>
                    <Text style={styles.balRemaining}>{remaining} days left</Text>
                  </View>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${pct}%` as any }]} />
                  </View>
                  <View style={styles.balMeta}>
                    <Text style={styles.balMetaText}>Used: {used}</Text>
                    <Text style={styles.balMetaText}>Quota: {total}</Text>
                  </View>
                </View>
              )
            })
          }
        </ScrollView>
      )}

      {/* Request Form Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Request Leave</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            {/* Leave type picker */}
            <Text style={styles.fieldLabel}>Leave Type *</Text>
            <View style={styles.typePicker}>
              {leaveTypes.map((lt: any) => (
                <TouchableOpacity
                  key={lt.id}
                  style={[styles.typeChip, form.leave_type_id === String(lt.id) && styles.typeChipActive]}
                  onPress={() => setForm(f => ({ ...f, leave_type_id: String(lt.id) }))}
                >
                  <Text style={[styles.typeChipText, form.leave_type_id === String(lt.id) && styles.typeChipTextActive]}>
                    {lt.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {formErr.leave_type_id && <Text style={styles.err}>{formErr.leave_type_id}</Text>}

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Start Date *</Text>
            <TextInput
              style={[styles.input, formErr.start_date && styles.inputErr]}
              placeholder="YYYY-MM-DD"
              value={form.start_date}
              onChangeText={v => setForm(f => ({ ...f, start_date: v }))}
            />
            {formErr.start_date && <Text style={styles.err}>{formErr.start_date}</Text>}

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>End Date *</Text>
            <TextInput
              style={[styles.input, formErr.end_date && styles.inputErr]}
              placeholder="YYYY-MM-DD"
              value={form.end_date}
              onChangeText={v => setForm(f => ({ ...f, end_date: v }))}
            />
            {formErr.end_date && <Text style={styles.err}>{formErr.end_date}</Text>}

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Total Days *</Text>
            <TextInput
              style={[styles.input, formErr.total_days && styles.inputErr]}
              placeholder="e.g. 1"
              keyboardType="numeric"
              value={form.total_days}
              onChangeText={v => setForm(f => ({ ...f, total_days: v }))}
            />
            {formErr.total_days && <Text style={styles.err}>{formErr.total_days}</Text>}

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Reason</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Optional"
              multiline
              value={form.reason}
              onChangeText={v => setForm(f => ({ ...f, reason: v }))}
            />

            <TouchableOpacity
              style={[styles.submitBtn, saving && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitBtnText}>Submit Request</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },

  tabs: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  tab:           { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive:     { borderBottomWidth: 2, borderBottomColor: NAVY },
  tabText:       { fontSize: 13, fontWeight: '600', color: '#9ca3af' },
  tabTextActive: { color: NAVY },

  list: { padding: 16, paddingBottom: 32 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { color: '#9ca3af', fontSize: 14 },

  addBtn: {
    backgroundColor: NAVY, borderRadius: 10, paddingVertical: 12,
    alignItems: 'center', marginBottom: 16,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  reqCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 10, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04,
    shadowRadius: 4, elevation: 1,
  },
  reqTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reqType:   { fontSize: 14, fontWeight: '700', color: '#111827' },
  reqDates:  { fontSize: 12, color: '#6b7280', marginTop: 2 },
  reqDays:   { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  reqBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  reqStatus: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  reqReason: { marginTop: 8, fontSize: 12, color: '#6b7280', fontStyle: 'italic' },
  rejNote:   { marginTop: 6, fontSize: 12, color: '#ef4444' },
  cancelBtn: {
    marginTop: 10, paddingVertical: 7, alignItems: 'center',
    borderRadius: 8, borderWidth: 1, borderColor: '#ef444440',
  },
  cancelBtnText: { fontSize: 12, color: '#ef4444', fontWeight: '600' },

  balYear:  { fontSize: 14, fontWeight: '700', color: '#6b7280', marginBottom: 12 },
  balCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 10,
  },
  balTop:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  balType:       { fontSize: 14, fontWeight: '700', color: '#111827' },
  balRemaining:  { fontSize: 13, fontWeight: '600', color: NAVY },
  barBg:         { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  barFill:       { height: '100%', backgroundColor: NAVY, borderRadius: 3 },
  balMeta:       { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  balMetaText:   { fontSize: 11, color: '#9ca3af' },

  modal:       { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  modalClose: { fontSize: 18, color: '#6b7280', padding: 4 },
  modalBody:  { padding: 20 },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  typePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb',
  },
  typeChipActive:     { backgroundColor: NAVY, borderColor: NAVY },
  typeChipText:       { fontSize: 13, color: '#374151' },
  typeChipTextActive: { color: '#fff', fontWeight: '600' },

  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#111827', backgroundColor: '#f9fafb',
  },
  inputErr: { borderColor: '#ef4444' },
  err:      { fontSize: 11, color: '#ef4444', marginTop: 4 },

  submitBtn: {
    marginTop: 24, backgroundColor: NAVY, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
