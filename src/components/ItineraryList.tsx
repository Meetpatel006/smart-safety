
import { useState, forwardRef, useImperativeHandle } from "react"
import { View, StyleSheet } from "react-native"
import { Text, TextInput, TouchableOpacity, Modal, View } from "react-native"
import { useApp } from "../context/AppContext"
import { t } from "../context/translations"

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
          <Button
            mode="contained"
            onPress={() => {
              setEditingId(null)
              setTitle("")
              setDate("")
              setNotes("")
              setVisible(true)
            }}
            style={styles.emptyButton}
            buttonColor={theme.colors.secondary}
          >
            {t(state.language, "addTrip")}
          </Button>
        </View>
      ) : (
        <List.Section>
          {state.trips.map((tr) => (
            <List.Item
              key={tr.id}
              title={tr.title}
              description={() => (
                <View>
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
              )}
              left={(props) => <List.Icon {...props} icon="map-marker" />}
              right={() => (
                <View style={styles.tripActions}>
                  <IconButton
                    icon="pencil"
                    size={20}
                    onPress={() => openEdit(tr.id, tr.title, tr.date, tr.notes)}
                    style={styles.editButton}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={async () => {
                      try {
                        await removeTrip(tr.id)
                      } catch (error) {
                        console.error('Failed to remove trip:', error)
                      }
                    }}
                    style={styles.deleteButton}
                  />
                </View>
              )}
              style={styles.tripItem}
            />
          ))}
        </List.Section>
      )}

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>
            {editingId ? 'Edit Trip' : 'Add New Trip'}
          </Text>

          <TextInput
            label="Trip Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Date (YYYY-MM-DD)"
            value={date}
            onChangeText={setDate}
            style={styles.input}
            mode="outlined"
            placeholder="2025-01-15"
          />

          <TextInput
            label="Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
          />

          <View style={styles.modalActions}>
            <Button
              onPress={() => setVisible(false)}
              style={styles.cancelButton}
            >
              {t(state.language, "cancel")}
            </Button>
            <Button
              mode="contained"
              onPress={save}
              disabled={loading || !title.trim()}
              loading={loading}
              buttonColor={theme.colors.secondary}
            >
              {t(state.language, "save")}
            </Button>
          </View>
        </Modal>
      </Portal>
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
})
