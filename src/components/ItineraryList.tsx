
import { useState, forwardRef, useImperativeHandle } from "react"
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator } from "react-native"
import { useApp } from "../context/AppContext"
import { t } from "../context/translations"
import { useAppTheme } from "../context/ThemeContext"

const ItineraryList = forwardRef<{ openNew: () => void }>((props, ref) => {
  const { state, addTrip, updateTrip, removeTrip } = useApp()
  const [visible, setVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  useImperativeHandle(ref, () => ({
    openNew: () => {
      setEditingId(null)
      setTitle("")
      setDate("")
      setNotes("")
      setVisible(true)
    }
  }))

  const openEdit = (id: string, ttitle: string, d: string, n?: string) => {
    setEditingId(id)
    setTitle(ttitle)
    setDate(d)
    setNotes(n || "")
    setVisible(true)
  }

  const save = async () => {
    setLoading(true)
    try {
      if (editingId) {
        await updateTrip(editingId, { title, date, notes })
      } else {
        await addTrip({ title, date, notes })
      }
      setVisible(false)
    } catch (error) {
      console.error('Failed to save trip:', error)
      // Could show an error message to user here
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const isUpcoming = (dateString: string) => {
    if (!dateString) return false
    const tripDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return tripDate >= today
  }

  const isPast = (dateString: string) => {
    if (!dateString) return false
    const tripDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return tripDate < today
  }

  return (
    <View>
      {state.trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No trips planned yet</Text>
          <Text style={styles.emptySubtitle}>Start planning your safe travels by adding your first trip</Text>
          <TouchableOpacity
            onPress={() => {
              setEditingId(null)
              setTitle("")
              setDate("")
              setNotes("")
              setVisible(true)
            }}
            style={[styles.emptyButtonTouchable, { backgroundColor: useAppTheme().colors.secondary }]}
          >
            <Text style={{ color: 'white' }}>{t(state.language, "addTrip")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {state.trips.map((tr) => (
            <View key={tr.id} style={[styles.tripItem, { padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '600' }}>{tr.title}</Text>
                {tr.date && (
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateIcon}>📅</Text>
                    <Text style={[
                      styles.tripDate,
                      isUpcoming(tr.date) && styles.upcomingDate,
                      isPast(tr.date) && styles.pastDate
                    ]}>
                      {formatDate(tr.date)}
                      {isUpcoming(tr.date) && " (Upcoming)"}
                      {isPast(tr.date) && " (Completed)"}
                    </Text>
                  </View>
                )}
                {tr.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesIcon}>📝</Text>
                    <Text style={styles.tripNotes}>{tr.notes}</Text>
                  </View>
                )}
              </View>
              <View style={styles.tripActions}>
                <TouchableOpacity onPress={() => openEdit(tr.id, tr.title, tr.date, tr.notes)} style={styles.editButton}>
                  <Text>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={async () => { try { await removeTrip(tr.id) } catch (error) { console.error('Failed to remove trip:', error) } }} style={styles.deleteButton}>
                  <Text>🗑️</Text>
                </TouchableOpacity>
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
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            {editingId ? 'Edit Trip' : 'Add New Trip'}
          </Text>

          <TextInput
            placeholder="Trip Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            accessible
          />

          <TextInput
            placeholder="Date (YYYY-MM-DD)"
            value={date}
            onChangeText={setDate}
            style={styles.input}
            placeholderTextColor="#888"
          />

          <TextInput
            placeholder="Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            style={styles.input}
            multiline
            numberOfLines={3}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity onPress={() => setVisible(false)} style={[styles.cancelButtonTouchable, { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 4 }]}> 
              <Text>{t(state.language, "cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={save} disabled={loading || !title.trim()} style={[styles.saveButtonTouchable, { backgroundColor: useAppTheme().colors.secondary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4 }]}> 
              {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white' }}>{t(state.language, "save")}</Text>}
            </TouchableOpacity>
          </View>
          </View>
        </View>
      </Modal>
    </View>
  )
})

export default ItineraryList

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    minWidth: 150,
  },
  tripItem: {
    backgroundColor: '#F8F9FA',
    marginBottom: 8,
    borderRadius: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tripDate: {
    fontSize: 14,
    color: '#666',
  },
  upcomingDate: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  pastDate: {
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  tripActions: {
    flexDirection: 'row',
  },
  editButton: {
    margin: 0,
  },
  deleteButton: {
    margin: 0,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notesIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  tripNotes: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    marginRight: 8,
  },
  emptyButtonTouchable: {
    minWidth: 150,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonTouchable: {
    // placeholder for additional styles
  },
  saveButtonTouchable: {
    // placeholder for additional styles
  },
})
