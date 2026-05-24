import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'attendance_offline_queue'

export interface QueuedAction {
  type:      'clock-in' | 'clock-out'
  timestamp: string
  lat?:      number
  lng?:      number
}

export async function enqueue(action: Omit<QueuedAction, 'timestamp'>): Promise<void> {
  const raw = await AsyncStorage.getItem(KEY)
  const queue: QueuedAction[] = raw ? JSON.parse(raw) : []
  queue.push({ ...action, timestamp: new Date().toISOString() })
  await AsyncStorage.setItem(KEY, JSON.stringify(queue))
}

export async function getQueue(): Promise<QueuedAction[]> {
  const raw = await AsyncStorage.getItem(KEY)
  return raw ? JSON.parse(raw) : []
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(KEY)
}

export async function removeFirst(): Promise<void> {
  const queue = await getQueue()
  queue.shift()
  if (queue.length === 0) {
    await AsyncStorage.removeItem(KEY)
  } else {
    await AsyncStorage.setItem(KEY, JSON.stringify(queue))
  }
}

export function isNetworkError(e: any): boolean {
  return !e?.response && (e?.message === 'Network Error' || e?.code === 'ERR_NETWORK')
}
