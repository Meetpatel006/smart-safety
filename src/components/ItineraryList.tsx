import { useState, forwardRef, useImperativeHandle } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Button,
  IconButton,
  Modal,
  Portal,
  TextInput,
  Text,
  useTheme,
  Switch,
} from "react-native-paper";
import { useApp } from "../context/AppContext";
import { t } from "../context/translations";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { FilterType } from "../screens/ItineraryScreen";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;

// Placeholder destination images
const destinationImages: { [key: string]: string } = {
  default: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
  beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
  mountain:
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
  city: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800",
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
  tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800",
  santorini:
    "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800",
};

const getImageForDestination = (title: string): string => {
  const lowerTitle = title.toLowerCase();
  for (const [key, url] of Object.entries(destinationImages)) {
    if (lowerTitle.includes(key)) return url;
  }
  // Rotate through images based on title hash
  const hash = title
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const imageKeys = Object.keys(destinationImages);
  return destinationImages[imageKeys[hash % imageKeys.length]];
};

interface ItineraryListProps {
  filter?: FilterType;
}

const ItineraryList = forwardRef<{ openNew: () => void }, ItineraryListProps>(
  ({ filter = "all" }, ref) => {
    const { state, addTrip, updateTrip, removeTrip } = useApp();
    const theme = useTheme();
    const [visible, setVisible] = useState(false);
    const [isExtending, setIsExtending] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [notes, setNotes] = useState("");
    const [notifyAuthorities, setNotifyAuthorities] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [pickerMode, setPickerMode] = useState<"start" | "end">("start");
    const [loading, setLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(true);

    useImperativeHandle(ref, () => ({
      openNew: () => {
        setEditingId(null);
        setIsExtending(false);
        setTitle("");
        setDate("");
        setEndDate("");
        setNotes("");
        setNotifyAuthorities(false);
        setVisible(true);
      },
    }));

    const openEdit = (id: string, ttitle: string, d: string, n?: string) => {
      setEditingId(id);
      setIsExtending(false);
      setTitle(ttitle);
      setDate(d);
      setEndDate("");
      setNotes(n || "");
      setNotifyAuthorities(false);
      setVisible(true);
    };

    const openExtend = (id: string, ttitle: string, d: string, n?: string) => {
      setEditingId(id);
      setIsExtending(true);
      setTitle(ttitle);
      setDate(d);
      setEndDate("01/28/2025"); // Default mock date
      setNotes(""); // Reason
      setNotifyAuthorities(false);
      setVisible(true);
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
      setShowDatePicker(false);
      if (selectedDate) {
        if (pickerMode === "start") {
          const formattedDate = selectedDate.toISOString().split("T")[0];
          setDate(formattedDate);
        } else {
          const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
          const dd = String(selectedDate.getDate()).padStart(2, "0");
          const yyyy = selectedDate.getFullYear();
          const displayFormat = `${mm}/${dd}/${yyyy}`;
          setEndDate(displayFormat);
        }
      }
    };

    const openDatePicker = (mode: "start" | "end") => {
      setPickerMode(mode);
      setShowDatePicker(true);
    };

    const save = async () => {
      setLoading(true);
      try {
        if (isExtending) {
          if (editingId) {
            const updatedNotes = notes
              ? `${state.trips.find((t) => t.id === editingId)?.notes || ""}\nExtended Reason: ${notes}`
              : undefined;
            await updateTrip(editingId, { date: endDate, notes: updatedNotes });
          }
        } else {
          if (editingId) {
            await updateTrip(editingId, { title, date, notes });
          } else {
            await addTrip({ title, date, notes });
          }
        }
        setVisible(false);
      } catch (error) {
        console.error("Failed to save trip:", error);
      } finally {
        setLoading(false);
      }
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      } catch {
        return dateString;
      }
    };

    const formatDateRange = (startDate: string, endDate?: string) => {
      const start = formatDate(startDate);
      if (endDate) {
        const end = formatDate(endDate);
        return `${start} - ${end}`;
      }
      return start;
    };

    const isUpcoming = (dateString: string) => {
      if (!dateString) return false;
      const tripDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return tripDate >= today;
    };

    const isPast = (dateString: string) => {
      if (!dateString) return false;
      const tripDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return tripDate < today;
    };

    const getStatus = (dateString: string): "upcoming" | "completed" => {
      return isUpcoming(dateString) ? "upcoming" : "completed";
    };

    // Filter trips based on active filter
    const filteredTrips = state.trips.filter((trip) => {
      if (filter === "all") return true;
      if (filter === "upcoming") return isUpcoming(trip.date);
      if (filter === "completed") return isPast(trip.date);
      return true;
    });

    const renderTripCard = (trip: {
      id: string;
      title: string;
      date: string;
      notes?: string;
    }) => {
      const status = getStatus(trip.date);
      const imageUrl = getImageForDestination(trip.title);

      return (
        <View key={trip.id} style={styles.cardContainer}>
          <View style={styles.card}>
            {/* Image with gradient overlay */}
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.7)"]}
                style={styles.imageGradient}
              />

              {/* Status Badge */}
              <View
                style={[
                  styles.statusBadge,
                  status === "upcoming"
                    ? styles.upcomingBadge
                    : styles.completedBadge,
                ]}
              >
                <Text style={styles.statusText}>
                  {status === "upcoming" ? "ACTIVE" : "COMPLETED"}
                </Text>
              </View>

              {/* Destination info on image */}
              <View style={styles.imageContent}>
                <Text style={styles.destinationTitle}>{trip.title}</Text>
                <View style={styles.dateRow}>
                  <MaterialCommunityIcons
                    name="calendar-blank"
                    size={16}
                    color="white"
                  />
                  <Text style={styles.dateText}>
                    {formatDateRange(trip.date)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Progress Section */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>PROGRESS</Text>
                <Text style={styles.daysLeft}>
                  {isUpcoming(trip.date) ? "Upcoming" : "Completed"}
                </Text>
              </View>
              <Text style={styles.progressText}>
                {trip.notes || "Add trip details"}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: isPast(trip.date) ? "100%" : "70%" },
                  ]}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openEdit(trip.id, trip.title, trip.date, trip.notes)}
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={18}
                  color="#374151"
                />
                <Text style={styles.editButtonText}>Edit Trip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.extendButton}
                onPress={() => openExtend(trip.id, trip.title, trip.date, trip.notes)}
              >
                <MaterialCommunityIcons
                  name="calendar-refresh"
                  size={18}
                  color="#3B82F6"
                />
                <Text style={styles.extendButtonText}>Extend Stay</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Detailed Itinerary View */}
          <View style={styles.detailsContainer}>
            {/* Today's Plan Card */}
            <View style={styles.planCard}>
              <Text style={styles.planTitle}>Today's Plan</Text>

              <View style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[styles.timelineDot, { backgroundColor: "#22C55E" }]}
                  />
                  <View style={styles.timelineLine} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTime}>10:00 AM</Text>
                  <Text style={styles.timelineTitle}>Depart Hotel</Text>
                  <Text style={styles.timelineSubtitle}>
                    The Grand Northeast Inn
                  </Text>
                </View>
              </View>

              <View style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[styles.timelineDot, { backgroundColor: "#3B82F6" }]}
                  />
                  <View style={styles.timelineLine} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTime}>12:30 PM</Text>
                  <Text style={styles.timelineTitle}>Train to Boston</Text>
                  <View style={styles.timelineTagRow}>
                    <View style={styles.tagContainer}>
                      <Text style={styles.tagText}>Amtrak 174</Text>
                    </View>
                    <Text style={styles.timelineSubtitle}>Seat 4A</Text>
                  </View>
                </View>
              </View>

              <View style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[styles.timelineDot, { backgroundColor: "#D1D5DB" }]}
                  />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTime}>04:00 PM</Text>
                  <Text style={styles.timelineTitle}>
                    Check-in at Boston Harbor Hotel
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      );
    };

    return (
      <View style={styles.container}>
        {filteredTrips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons
                name="airplane"
                size={64}
                color="#CBD5E1"
              />
            </View>
            <Text style={styles.emptyTitle}>
              No trips {filter !== "all" ? filter : ""} yet
            </Text>
            <Text style={styles.emptySubtitle}>
              Start planning your safe travels by adding your first trip
            </Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => {
                setEditingId(null);
                setTitle("");
                setDate("");
                setNotes("");
                setVisible(true);
              }}
            >
              <LinearGradient
                colors={["#FF7A00", "#FF9A40"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyButtonGradient}
              >
                <MaterialCommunityIcons name="plus" size={20} color="white" />
                <Text style={styles.emptyButtonText}>Add Your First Trip</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {filteredTrips
              .filter((t) => isUpcoming(t.date))
              .map(renderTripCard)}

            {filteredTrips.some((t) => !isUpcoming(t.date)) && (
              <View style={styles.historySection}>
                <TouchableOpacity
                  style={styles.historyHeader}
                  onPress={() => setShowHistory(!showHistory)}
                >
                  <Text style={styles.historyTitle}>
                    Past Trips (
                    {filteredTrips.filter((t) => !isUpcoming(t.date)).length})
                  </Text>
                  <MaterialCommunityIcons
                    name={showHistory ? "chevron-down" : "chevron-right"}
                    size={24}
                    color="#6B7280"
                  />
                </TouchableOpacity>

                {showHistory &&
                  filteredTrips
                    .filter((t) => !isUpcoming(t.date))
                    .map((trip) => (
                      <View key={trip.id} style={styles.historyCard}>
                        <Image
                          source={{ uri: getImageForDestination(trip.title) }}
                          style={styles.historyThumb}
                        />
                        <View style={styles.historyInfo}>
                          <Text style={styles.historyTripTitle}>
                            {trip.title}
                          </Text>
                          <Text style={styles.historyTripDate}>
                            {formatDateRange(trip.date)}
                          </Text>
                        </View>
                        <View style={styles.historyBadge}>
                          <Text style={styles.historyBadgeText}>COMPLETED</Text>
                        </View>
                      </View>
                    ))}
              </View>
            )}
          </ScrollView>
        )}

        {/* Add/Edit Modal */}
        <Portal>
          <Modal
            visible={visible}
            onDismiss={() => setVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            {isExtending ? (
              <>
                <View style={styles.modalHeader}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="calendar-edit"
                      size={24}
                      color="#3B82F6"
                    />
                    <Text style={styles.modalTitle}>Request Extension</Text>
                  </View>
                </View>

                <Text style={styles.inputLabel}>NEW END DATE</Text>
                <TouchableOpacity onPress={() => openDatePicker("end")}>
                  <TextInput
                    value={endDate}
                    editable={false} // Make it read-only, click handled by TouchableOpacity
                    style={styles.cleanInput}
                    mode="outlined"
                    outlineColor="#E5E7EB"
                    activeOutlineColor="#3B82F6"
                    right={
                      <TextInput.Icon
                        icon="calendar"
                        onPress={() => openDatePicker("end")}
                      />
                    }
                  />
                </TouchableOpacity>

                <Text style={styles.inputLabel}>REASON FOR EXTENSION</Text>
                <TextInput
                  placeholder="e.g., Flight delayed, enjoying the city..."
                  value={notes}
                  onChangeText={setNotes}
                  style={styles.cleanInput}
                  mode="outlined"
                  outlineColor="#E5E7EB"
                  activeOutlineColor="#3B82F6"
                />

                <View style={styles.toggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleLabel}>Notify authorities</Text>
                    <Text style={styles.toggleSubLabel}>
                      Update local safety registry
                    </Text>
                  </View>
                  <Switch
                    value={notifyAuthorities}
                    onValueChange={setNotifyAuthorities}
                    color="#3B82F6"
                  />
                </View>

                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={save}
                  disabled={loading}
                >
                  <Text style={styles.confirmButtonText}>
                    Confirm Extension
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {editingId ? "Edit Trip" : "Plan New Trip"}
                  </Text>
                  <TouchableOpacity onPress={() => setVisible(false)}>
                    <MaterialCommunityIcons
                      name="close"
                      size={24}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>

                <TextInput
                  label="Destination"
                  value={title}
                  onChangeText={setTitle}
                  style={styles.input}
                  mode="outlined"
                  outlineColor="#E5E7EB"
                  activeOutlineColor="#3B82F6"
                  left={<TextInput.Icon icon="map-marker" />}
                />

                <TouchableOpacity onPress={() => openDatePicker("start")}>
                  <TextInput
                    label="Start Date"
                    value={date}
                    editable={false}
                    style={styles.input}
                    mode="outlined"
                    outlineColor="#E5E7EB"
                    activeOutlineColor="#3B82F6"
                    placeholder="YYYY-MM-DD"
                    left={
                      <TextInput.Icon
                        icon="calendar"
                        onPress={() => openDatePicker("start")}
                      />
                    }
                  />
                </TouchableOpacity>

                <TextInput
                  label="Notes (Optional)"
                  value={notes}
                  onChangeText={setNotes}
                  style={styles.input}
                  mode="outlined"
                  outlineColor="#E5E7EB"
                  activeOutlineColor="#3B82F6"
                  multiline
                  numberOfLines={3}
                  left={<TextInput.Icon icon="note-text" />}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>
                      {t(state.language, "cancel")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      (!title.trim() || loading) && styles.saveButtonDisabled,
                    ]}
                    onPress={save}
                    disabled={loading || !title.trim()}
                  >
                    <LinearGradient
                      colors={
                        title.trim() && !loading
                          ? ["#3B82F6", "#1E3A8A"]
                          : ["#CBD5E1", "#CBD5E1"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.saveButtonGradient}
                    >
                      {loading ? (
                        <Text style={styles.saveButtonText}>Saving...</Text>
                      ) : (
                        <Text style={styles.saveButtonText}>
                          {t(state.language, "save")}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Modal>
        </Portal>

        {showDatePicker && (
          <DateTimePicker
            value={new Date()} // Default to today, or parse existing date if valid
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={handleDateChange}
            minimumDate={new Date()} // Optional constraint
          />
        )}
      </View>
    );
  },
);

export default ItineraryList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  imageContainer: {
    height: 180,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "60%",
  },
  statusBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  upcomingBadge: {
    backgroundColor: "#22C55E",
  },
  completedBadge: {
    backgroundColor: "#6B7280",
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  imageContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  imageTopContent: {
    marginBottom: 12,
  },
  destinationInfo: {
    flex: 1,
  },
  destinationTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    color: "white",
    fontSize: 14,
    opacity: 0.9,
  },
  // Progress Section
  progressSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
    letterSpacing: 0.5,
  },
  daysLeft: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  progressText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 3,
  },
  // Card Actions
  cardActions: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    gap: 8,
  },
  editButtonText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "600",
  },
  extendButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    gap: 8,
  },
  extendButtonText: {
    color: "#3B82F6",
    fontSize: 15,
    fontWeight: "600",
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyAddButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  emptyButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  emptyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Modal styles
  modalContainer: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "white",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Extend Modal specific styles
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  cleanInput: {
    marginBottom: 16,
    backgroundColor: "white",
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  toggleSubLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  confirmButton: {
    backgroundColor: "#111827",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Details Section Styles
  detailsContainer: {
    marginTop: 16,
  },

  planCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 24,
  },
  timelineLeft: {
    alignItems: "center",
    marginRight: 16,
    width: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
    marginTop: 6,
    borderWidth: 2,
    borderColor: "white",
    elevation: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E5E7EB",
    position: "absolute",
    top: 20,
    bottom: -24,
    zIndex: -1,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTime: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 2,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  timelineSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  timelineTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  tagContainer: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3B82F6",
  },
  // History Section Styles
  historySection: {
    marginTop: 24,
    paddingBottom: 24,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6B7280",
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  historyThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: "#E5E7EB",
  },
  historyInfo: {
    flex: 1,
  },
  historyTripTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  historyTripDate: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  historyBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  historyBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#6B7280",
  },
});
