
import { useState } from "react"
import { View } from "react-native"
import { Button, Card, IconButton, List, Modal, Portal, TextInput } from "react-native-paper"
import { useApp } from "../context/AppContext"
import { t } from "../context/translations"

export default function ItineraryList() {
  const { state, addTrip, updateTrip, removeTrip } = useApp()
  const [visible, setVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [notes, setNotes] = useState("")

  const openNew = () => {
    setEditingId(null)
    setTitle("")
    setDate("")
    setNotes("")
    setVisible(true)
  }
  const openEdit = (id: string, ttitle: string, d: string, n?: string) => {
    setEditingId(id)
    setTitle(ttitle)
    setDate(d)
    setNotes(n || "")
    setVisible(true)
  }
  const save = () => {
    if (editingId) updateTrip(editingId, { title, date, notes })
    else addTrip({ title, date, notes })
    setVisible(false)
  }

  return (
    <Card>
      <Card.Title
        title={t(state.language, "itinerary")}
        right={() => <Button onPress={openNew}>{t(state.language, "addTrip")}</Button>}
      />
      <Card.Content>
        <List.Section>
          {state.trips.map((tr) => (
            <List.Item
              key={tr.id}
              title={`${tr.title} — ${tr.date}`}
              description={tr.notes}
              right={() => (
                <View style={{ flexDirection: "row" }}>
                  <IconButton icon="pencil" onPress={() => openEdit(tr.id, tr.title, tr.date, tr.notes)} />
                  <IconButton icon="delete" onPress={() => removeTrip(tr.id)} />
                </View>
              )}
            />
          ))}
        </List.Section>
      </Card.Content>

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={{ backgroundColor: "white", padding: 16, margin: 16, borderRadius: 8 }}
        >
          <TextInput label="Title" value={title} onChangeText={setTitle} style={{ marginBottom: 8 }} />
          <TextInput label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} style={{ marginBottom: 8 }} />
          <TextInput label="Notes" value={notes} onChangeText={setNotes} style={{ marginBottom: 8 }} />
          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
            <Button onPress={() => setVisible(false)}>{t(state.language, "cancel")}</Button>
            <Button mode="contained" onPress={save}>
              {t(state.language, "save")}
            </Button>
          </View>
        </Modal>
      </Portal>
    </Card>
  )
}
