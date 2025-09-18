
import { useState } from "react"
import { View } from "react-native"
import { Text, TextInput, TouchableOpacity, Modal, View } from "react-native"
import { useApp } from "../context/AppContext"
import { t } from "../context/translations"

export default function EmergencyContacts({ compact = false }: { compact?: boolean }) {
  const { state, addContact, updateContact, removeContact } = useApp()
  const [visible, setVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")

  const openNew = () => {
    setEditingId(null)
    setName("")
    setPhone("")
    setVisible(true)
  }
  const openEdit = (id: string, n: string, p: string) => {
    setEditingId(id)
    setName(n)
    setPhone(p)
    setVisible(true)
  }
  const save = () => {
    if (editingId) updateContact(editingId, { name, phone })
    else addContact({ name, phone })
    setVisible(false)
  }

  return (
    <View style={{ padding: compact ? 8 : 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: compact ? 8 : 16 }}>
        <Text style={{ fontSize: compact ? 16 : 20, fontWeight: 'bold' }}>{t(state.language, "emergencyContacts")}</Text>
        {!compact && <TouchableOpacity onPress={openNew} style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#0077CC', borderRadius: 4 }}><Text style={{ color: '#fff' }}>{t(state.language, "add")}</Text></TouchableOpacity>}
      </View>

      {compact ? (
        <View style={{ gap: 8 }}>
          {state.contacts.map((c) => (
            <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f3f3f3', padding: 12, borderRadius: 12 }}>
              <View>
                <Text style={{ fontWeight: '600' }}>{c.name}</Text>
                <Text>{c.phone}</Text>
              </View>
              <TouchableOpacity onPress={() => {/* ideally initiate phone call */}} style={{ padding: 8 }}><Text>📞</Text></TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <View>
          {state.contacts.map((c) => (
            <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8f9fa', padding: 12, marginBottom: 8, borderRadius: 8 }}>
              <Text style={{ flex: 1 }}>{c.name} ({c.phone})</Text>
              <View style={{ flexDirection: "row" }}>
                <TouchableOpacity onPress={() => openEdit(c.id, c.name, c.phone)} style={{ padding: 8, marginRight: 4 }}><Text>✏️</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => removeContact(c.id)} style={{ padding: 8 }}><Text>🗑️</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: "white", padding: 16, margin: 16, borderRadius: 8, width: '90%' }}>
            <TextInput placeholder="Name" value={name} onChangeText={setName} style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 8, borderRadius: 4 }} />
            <TextInput
              placeholder="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 8, borderRadius: 4 }}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
              <TouchableOpacity onPress={() => setVisible(false)} style={{ paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 4 }}><Text>{t(state.language, "cancel")}</Text></TouchableOpacity>
              <TouchableOpacity onPress={save} style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#0077CC', borderRadius: 4 }}>
                <Text style={{ color: '#fff' }}>{t(state.language, "save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}
