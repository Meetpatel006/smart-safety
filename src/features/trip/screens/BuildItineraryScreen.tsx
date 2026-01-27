import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, SegmentedButtons, Chip } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { showToast } from '../../../utils/toast';
import { useApp } from '../../../context/AppContext';
import ActivityNodeForm from '../components/ActivityNodeForm';
import { SERVER_URL } from '../../../config';

interface ActivityNode {
  type: 'start' | 'visit' | 'stay' | 'transit' | 'end';
  name: string;
  location: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  address?: string;
  scheduledTime?: string;
  description?: string;
}

interface DayItinerary {
  date: string;
  dayNumber: number;
  nodes: ActivityNode[];
}

export default function BuildItineraryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { setJustRegistered } = useApp();
  const { tripDuration, startDate, returnDate, touristId } = route.params as {
    tripDuration: number;
    startDate: string;
    returnDate: string;
    touristId: string;
  };

  const [currentDay, setCurrentDay] = useState(1);
  const [itinerary, setItinerary] = useState<DayItinerary[]>([]);
  const [currentDayNodes, setCurrentDayNodes] = useState<ActivityNode[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize current day's date
  const getCurrentDayDate = () => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (currentDay - 1));
    return date.toISOString();
  };

  const handleAddNode = (node: ActivityNode) => {
    console.log('[BuildItinerary] add node', { currentDay, nodeName: node.name, type: node.type });
    setCurrentDayNodes([...currentDayNodes, node]);
  };

  const handleRemoveNode = (index: number) => {
    console.log('[BuildItinerary] remove node', { currentDay, index });
    const updated = currentDayNodes.filter((_, i) => i !== index);
    setCurrentDayNodes(updated);
  };

  const handleSaveDay = () => {
    if (currentDayNodes.length === 0) {
      showToast('Please add at least one activity for the day');
      return;
    }

    console.log('[BuildItinerary] save day', { currentDay, nodeCount: currentDayNodes.length });
    const dayData: DayItinerary = {
      date: getCurrentDayDate(),
      dayNumber: currentDay,
      nodes: currentDayNodes,
    };

    // Update or add day to itinerary
    const existingDayIndex = itinerary.findIndex((d) => d.dayNumber === currentDay);
    const updatedItinerary = [...itinerary];

    if (existingDayIndex >= 0) {
      updatedItinerary[existingDayIndex] = dayData;
    } else {
      updatedItinerary.push(dayData);
    }

    setItinerary(updatedItinerary);
    showToast(`Day ${currentDay} saved!`);

    // Move to next day if not last day
    if (currentDay < tripDuration) {
      setCurrentDay(currentDay + 1);
      // Load nodes for next day if already saved
      const nextDay = updatedItinerary.find((d) => d.dayNumber === currentDay + 1);
      setCurrentDayNodes(nextDay?.nodes || []);
    }
  };

  const handleChangeDay = (day: number) => {
    console.log('[BuildItinerary] change day', { from: currentDay, to: day });
    setCurrentDay(day);
    // Load saved nodes for this day
    const dayData = itinerary.find((d) => d.dayNumber === day);
    setCurrentDayNodes(dayData?.nodes || []);
  };

  const handleSubmitItinerary = async () => {
    if (itinerary.length === 0) {
      showToast('Please add at least one day to your itinerary');
      return;
    }

    console.log('[BuildItinerary] submit itinerary attempt', { daysFilled: itinerary.length, tripDuration });
    // Check if all days are filled
    if (itinerary.length < tripDuration) {
      Alert.alert(
        'Incomplete Itinerary',
        `You have only filled ${itinerary.length} out of ${tripDuration} days. Do you want to submit with partial data?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit Anyway', onPress: () => submitToBackend() },
        ]
      );
    } else {
      submitToBackend();
    }
  };

  const submitToBackend = async () => {
    setIsSubmitting(true);
    try {
      // Sort itinerary by day number
      const sortedItinerary = [...itinerary].sort((a, b) => a.dayNumber - b.dayNumber);

      const response = await fetch(`${SERVER_URL}/api/itinerary/${touristId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itinerary: sortedItinerary,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('Itinerary created successfully!');
        // Clear the justRegistered flag to prevent redirect loops
        setJustRegistered(false);
        // Navigate to main dashboard
        (navigation.navigate as any)('Main');
      } else {
        showToast(data.message || 'Failed to create itinerary');
      }
    } catch (error) {
      console.error('Error submitting itinerary:', error);
      showToast('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentDayDateFormatted = () => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (currentDay - 1));
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      {/* Day Navigation */}
      <Card style={styles.dayNavCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.dayNavTitle}>
            Build Your Itinerary
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayChipsContainer}>
            {Array.from({ length: tripDuration }, (_, i) => i + 1).map((day) => {
              const isSaved = itinerary.some((d) => d.dayNumber === day);
              return (
                <Chip
                  key={day}
                  selected={currentDay === day}
                  onPress={() => handleChangeDay(day)}
                  style={styles.dayChip}
                  icon={isSaved ? 'check' : undefined}
                >
                  Day {day}
                </Chip>
              );
            })}
          </ScrollView>
        </Card.Content>
      </Card>

      {/* Current Day Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              Day {currentDay} - {getCurrentDayDateFormatted()}
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Add your activities and stops for this day.
            </Text>

            {/* Display saved nodes */}
            {currentDayNodes.map((node, index) => (
              <Card key={index} style={styles.nodeCard} mode="outlined">
                <Card.Content>
                  <View style={styles.nodeHeader}>
                    <Text variant="titleMedium">{node.name}</Text>
                    <Button
                      icon="delete"
                      mode="text"
                      onPress={() => handleRemoveNode(index)}
                      compact
                    >
                      Remove
                    </Button>
                  </View>
                  <Text variant="bodySmall" style={styles.nodeDetail}>
                    Type: {node.type}
                  </Text>
                  {node.scheduledTime && (
                    <Text variant="bodySmall" style={styles.nodeDetail}>
                      Time: {node.scheduledTime}
                    </Text>
                  )}
                  {node.address && (
                    <Text variant="bodySmall" style={styles.nodeDetail}>
                      📍 {node.address}
                    </Text>
                  )}
                  {node.description && (
                    <Text variant="bodySmall" style={styles.nodeDetail}>
                      📝 {node.description}
                    </Text>
                  )}
                </Card.Content>
              </Card>
            ))}

            {/* Add Activity Form */}
            <ActivityNodeForm onAddNode={handleAddNode} />

            <View style={styles.infoContainer}>
              <Text variant="bodySmall" style={styles.infoText}>
                💡 Smart Safety Tip: Adding specific locations helps us provide real-time alerts if you're near a high-risk area.
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleSaveDay}
          style={styles.saveDayButton}
          icon="check"
          disabled={currentDayNodes.length === 0}
        >
          Save Day {currentDay}
        </Button>

        {/* Final Submit Button */}
        {itinerary.length > 0 && (
          <Button
            mode="contained-tonal"
            onPress={handleSubmitItinerary}
            style={styles.submitButton}
            icon="upload"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Submit Complete Itinerary ({itinerary.length}/{tripDuration} days)
          </Button>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  dayNavCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  dayNavTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dayChipsContainer: {
    marginTop: 8,
  },
  dayChip: {
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
    marginBottom: 16,
  },
  nodeCard: {
    marginBottom: 12,
    borderRadius: 8,
  },
  nodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nodeDetail: {
    color: '#666',
    marginTop: 4,
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    color: '#1976d2',
  },
  saveDayButton: {
    marginBottom: 12,
    borderRadius: 8,
  },
  submitButton: {
    marginBottom: 16,
    borderRadius: 8,
  },
});
