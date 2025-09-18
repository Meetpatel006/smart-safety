import { useEffect, useState, useCallback } from 'react'
import { View, FlatList, Text, TouchableOpacity } from 'react-native'
import transitionStore, { TransitionRecord } from '../geoFence/transitionStore'
import { t } from '../context/translations'
import { useApp } from '../context/AppContext'
import { syncTransitions } from '../geoFence/syncTransitions'
import { clearTransitions } from '../geoFence/transitionStore'

export default function TransitionsScreen() {
  const { state } = useApp()
  const [items, setItems] = useState<TransitionRecord[]>([])
  const [unsyncedCount, setUnsyncedCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const load = useCallback(async () => {
    const data = await transitionStore.getTransitions()
    setItems(data)
    setUnsyncedCount(data.length)
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => { if (mounted) await load() })()
    return () => { mounted = false }
  }, [load])

  useEffect(() => {
    // Refresh count when screen focus happens is handled by navigation; simple approach: poll on interval while mounted
    const iv = setInterval(() => load(), 5000)
    return () => clearInterval(iv)
  }, [load])

  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 56, backgroundColor: '#0077CC', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{t(state.language, 'transitions') || 'Transitions'}</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={async () => { setSyncing(true); try { await syncTransitions(); await load(); } finally { setSyncing(false) } }}>
            <Text style={{ color: '#fff' }}>{syncing ? 'Syncing…' : 'Sync'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={async () => { await clearTransitions(); await load() }}>
            <Text style={{ color: '#fff' }}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <Text style={{ fontWeight: '600', color: '#111827' }}>{`${item.type.toUpperCase()} — ${item.fenceName || item.fenceId}`}</Text>
            <Text style={{ color: '#6b7280', marginTop: 2 }}>{`${new Date(item.at).toLocaleString()} ${item.coords ? `@ ${item.coords.latitude.toFixed(4)},${item.coords.longitude.toFixed(4)}` : ''}`}</Text>
          </View>
        )}
        ListEmptyComponent={() => <Text style={{ padding: 12, textAlign: 'center' }}>No transitions recorded</Text>}
      />
    </View>
  )
}
