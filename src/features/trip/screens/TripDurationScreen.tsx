import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, IconButton, Card, Divider } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { showToast } from '../../../utils/toast';
import { useApp } from '../../../context/AppContext';

export default function TripDurationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { state } = useApp();
  const user = state.user as any;
  
  const [tripDuration, setTripDuration] = useState(7);
  const [startDate, setStartDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  
  // Calculate return date based on duration
  const returnDate = new Date(startDate);
  returnDate.setDate(startDate.getDate() + tripDuration);

  // Logging: lifecycle and state changes for analytics / debugging
  useEffect(() => {
    console.log('[TripDuration] mounted', { touristId: user?.touristId });
    return () => {
      console.log('[TripDuration] unmounted');
    };
  }, []);

  useEffect(() => {
    try {
      console.log('[TripDuration] state', {
        tripDuration,
        startDate: startDate.toISOString(),
      });
    } catch (e) {
      // safe-guard: logging should not break UI
      console.warn('[TripDuration] logging failed', e);
    }
  }, [tripDuration, startDate]);

  const handleIncrement = () => {
    if (tripDuration < 150) {
      const next = tripDuration + 1;
      console.log('[TripDuration] increment', { previous: tripDuration, next });
      setTripDuration(next);
    }
  };

  const handleDecrement = () => {
    if (tripDuration > 1) {
      const next = tripDuration - 1;
      console.log('[TripDuration] decrement', { previous: tripDuration, next });
      setTripDuration(next);
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      console.log('[TripDuration] startDate selected', { selected: selectedDate.toISOString() });
      setStartDate(selectedDate);
    }
  };

  const handleNext = () => {
    if (tripDuration < 1) {
      console.warn('[TripDuration] validation failed: duration < 1');
      showToast('Please select at least 1 day');
      return;
    }

    if (!user?.touristId) {
      console.error('[TripDuration] missing touristId on user object', { user });
      showToast('User information not found. Please login again.');
      return;
    }

    // Navigate to itinerary builder with trip info
    const payload = {
      tripDuration,
      startDate: startDate.toISOString(),
      returnDate: returnDate.toISOString(),
      touristId: user.touristId,
    };
    console.log('[TripDuration] navigate -> BuildItinerary', payload);
    (navigation.navigate as any)('BuildItinerary', payload);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            How long is your trip?
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Select the number of days you'll be traveling.
          </Text>

          <Divider style={styles.divider} />

          <Text variant="labelMedium" style={styles.label}>
            TOTAL DURATION
          </Text>

          <View style={styles.durationContainer}>
            <IconButton
              icon="minus"
              size={24}
              onPress={handleDecrement}
              disabled={tripDuration <= 1}
              style={styles.iconButton}
            />
            <View style={styles.durationDisplay}>
              <Text variant="displayLarge" style={styles.durationNumber}>
                {tripDuration}
              </Text>
              <Text variant="bodyMedium" style={styles.daysText}>
                Days
              </Text>
            </View>
            <IconButton
              icon="plus"
              size={24}
              onPress={handleIncrement}
              disabled={tripDuration >= 150}
              mode="contained"
              style={styles.iconButton}
            />
          </View>

          <Text variant="bodySmall" style={styles.rangeText}>
            Min 1 day, Max 150 days
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            When do you leave?
          </Text>

          <Text variant="labelMedium" style={styles.label}>
            Start Date
          </Text>
          <Button
            mode="outlined"
            icon="calendar"
            onPress={() => setShowStartPicker(true)}
            style={styles.dateButton}
            contentStyle={styles.dateButtonContent}
          >
            {startDate.toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
            })}
          </Button>

          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
              minimumDate={new Date()}
            />
          )}

          <Text variant="labelMedium" style={[styles.label, styles.labelMargin]}>
            Return Date (Auto-calculated)
          </Text>
          <Button
            mode="outlined"
            icon="calendar"
            disabled
            style={styles.dateButton}
            contentStyle={styles.dateButtonContent}
          >
            {returnDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Button>

          <View style={styles.infoContainer}>
            <Text variant="bodySmall" style={styles.infoText}>
              💡 We'll use these dates to monitor your safety status while you are traveling solo.
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleNext}
        style={styles.nextButton}
        contentStyle={styles.nextButtonContent}
        icon="arrow-right"
      >
        Next: Build Itinerary
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  label: {
    color: '#666',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  labelMargin: {
    marginTop: 16,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  iconButton: {
    margin: 8,
  },
  durationDisplay: {
    alignItems: 'center',
    marginHorizontal: 32,
  },
  durationNumber: {
    fontSize: 72,
    fontWeight: 'bold',
  },
  daysText: {
    fontSize: 18,
    color: '#666',
    marginTop: -8,
  },
  rangeText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 8,
  },
  dateButton: {
    justifyContent: 'flex-start',
    borderRadius: 8,
  },
  dateButtonContent: {
    justifyContent: 'flex-start',
    paddingVertical: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    color: '#1976d2',
    flex: 1,
  },
  nextButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  nextButtonContent: {
    paddingVertical: 8,
  },
});
