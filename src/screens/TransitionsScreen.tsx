import { useEffect, useState } from 'react'
import { View, FlatList } from 'react-native'
import { List, Appbar, Text } from 'react-native-paper'
import transitionStore, { TransitionRecord } from '../geoFence/transitionStore'
import { t } from '../context/translations'
import { useApp } from '../context/AppContext'

export default function TransitionsScreen() {
  const { state } = useApp()
  const [items, setItems] = useState<TransitionRecord[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const data = await transitionStore.getTransitions()
      if (mounted) setItems(data)
    })()
    return () => { mounted = false }
  }, [])

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.Content title={t(state.language, 'transitions') || 'Transitions'} />
      </Appbar.Header>
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <List.Item
            title={`${item.type.toUpperCase()} — ${item.fenceName || item.fenceId}`}
            description={`${new Date(item.at).toLocaleString()} ${item.coords ? `@ ${item.coords.latitude.toFixed(4)},${item.coords.longitude.toFixed(4)}` : ''}`}
          />
        )}
        ListEmptyComponent={() => <Text style={{ padding: 12, textAlign: 'center' }}>No transitions recorded</Text>}
      />
    </View>
  )
}
