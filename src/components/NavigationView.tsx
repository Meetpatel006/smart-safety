/**
 * NavigationView Component
 * Full-screen navigation view like Google Maps
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Text, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathDeviation, DeviationScenario, SimulationSpeed } from '../context/PathDeviationContext';
import NavigationBanner from './NavigationBanner';
import SpeedIndicator from './SpeedIndicator';
import NavigationInfoBar from './NavigationInfoBar';
import { RightActionButtons } from '../features/map/components/MapboxMap/ui';

interface NavigationViewProps {
  onLayersPress?: () => void;
  onSOSPress?: () => void;
  onLegendPress?: () => void;
}

export default function NavigationView({ onLayersPress, onSOSPress, onLegendPress }: NavigationViewProps) {
  const [showDeviationModal, setShowDeviationModal] = React.useState(false);
  const {
    isTracking,
    currentSpeed,
    distanceRemaining,
    estimatedTimeRemaining,
    currentInstruction,
    alerts,
    alertsMuted,
    dismissAlert,
    stopJourney,
    recenterMap,
    toggleMuteAlerts,
    deviationScenario,
    setDeviationScenario,
    isSimulating,
    simulationSpeed,
    simulationProgress,
    startSimulation,
    stopSimulation,
    setSimulationSpeed,
  } = usePathDeviation();

  // Format time remaining
  const formattedTime = useMemo(() => {
    const hours = Math.floor(estimatedTimeRemaining / 3600);
    const minutes = Math.floor((estimatedTimeRemaining % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  }, [estimatedTimeRemaining]);

  // Format distance
  const formattedDistance = useMemo(() => {
    const km = distanceRemaining / 1000;
    if (km >= 1) {
      return `${km.toFixed(1)} km`;
    }
    return `${Math.round(distanceRemaining)} m`;
  }, [distanceRemaining]);

  // Calculate ETA
  const formattedETA = useMemo(() => {
    const now = new Date();
    const eta = new Date(now.getTime() + estimatedTimeRemaining * 1000);
    return eta.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  }, [estimatedTimeRemaining]);

  const scenarios = [
    { id: 'normal', name: 'Normal Route', icon: '🚗', description: 'Follow route normally' },
    { id: 'deviation', name: 'Route Deviation', icon: '⚠️', description: 'Simulate wrong turn' },
    { id: 'stop', name: 'Extended Stop', icon: '🛑', description: 'Traffic or rest stop' },
    { id: 'slow', name: 'Slow Traffic', icon: '🐢', description: '15-30 km/h' },
    { id: 'fast', name: 'Highway Speed', icon: '🏎️', description: '90-120 km/h' },
  ];

  const speedOptions: { value: SimulationSpeed; label: string }[] = [
    { value: 1, label: '1x (Real-time)' },
    { value: 5, label: '5x (Fast)' },
    { value: 10, label: '10x (Very Fast)' },
    { value: 50, label: '50x (Ultra Fast)' },
    { value: 100, label: '100x (Maximum)' },
  ];

  const handleScenarioSelect = (scenarioId: DeviationScenario) => {
    setDeviationScenario(scenarioId);
    console.log('[NavigationView] Applied deviation scenario:', scenarioId);
  };

  const handleStartSimulation = () => {
    startSimulation(simulationSpeed);
    setShowDeviationModal(false);
    console.log('[NavigationView] Started simulation with speed:', simulationSpeed);
  };

  const handleStopSimulation = () => {
    stopSimulation();
    console.log('[NavigationView] Stopped simulation');
  };

  if (!isTracking) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Top Navigation Banner */}
      <NavigationBanner 
        instruction={currentInstruction?.instruction || "Follow the route"}
        distance={currentInstruction?.distance || formattedDistance}
        direction={currentInstruction?.direction || "straight"}
      />

      {/* Speed Indicator (Bottom Left) */}
      <SpeedIndicator speed={currentSpeed} />

      {/* Recenter/Compass Button - Separate from action buttons */}
      <TouchableOpacity 
        style={styles.recenterButton} 
        onPress={recenterMap}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons 
          name="crosshairs-gps" 
          size={24} 
          color="#374151" 
        />
      </TouchableOpacity>

      {/* Right Action Buttons (Layers, SOS) - No compass/directions button during navigation */}
      <RightActionButtons
        onLayersPress={onLayersPress}
        onSOSPress={onSOSPress}
        onLegendPress={onLegendPress}
        hideDirectionsButton={true}
        hideCompassButton={true}
        customBottom={100}
      />

      {/* Deviation Test Button (for testing) */}
      <TouchableOpacity 
        style={[
          styles.deviationTestButton,
          isSimulating && styles.deviationTestButtonActive
        ]} 
        onPress={() => setShowDeviationModal(true)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons 
          name={isSimulating ? "play-circle" : "flask-outline"} 
          size={24} 
          color="#fff" 
        />
      </TouchableOpacity>

      {/* Simulation Progress Indicator */}
      {isSimulating && (
        <View style={styles.simulationIndicator}>
          <Text style={styles.simulationText}>
            SIM {simulationProgress.toFixed(0)}%
          </Text>
        </View>
      )}

      {/* Deviation Scenario Modal */}
      <Modal
        visible={showDeviationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDeviationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>GPS Simulation & Testing</Text>
              <TouchableOpacity onPress={() => setShowDeviationModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.scenarioList}>
              {/* Simulation Controls Section */}
              <Text style={styles.sectionTitle}>Simulation Controls</Text>
              <View style={styles.simulationControls}>
                <Text style={styles.speedLabel}>Simulation Speed:</Text>
                <View style={styles.speedButtons}>
                  {speedOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.speedButton,
                        simulationSpeed === option.value && styles.speedButtonActive
                      ]}
                      onPress={() => setSimulationSpeed(option.value)}
                    >
                      <Text style={[
                        styles.speedButtonText,
                        simulationSpeed === option.value && styles.speedButtonTextActive
                      ]}>
                        {option.value}x
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Start/Stop Simulation Button */}
                <TouchableOpacity
                  style={[
                    styles.simulationButton,
                    isSimulating ? styles.stopButton : styles.startButton
                  ]}
                  onPress={isSimulating ? handleStopSimulation : handleStartSimulation}
                >
                  <MaterialCommunityIcons 
                    name={isSimulating ? "stop" : "play"} 
                    size={20} 
                    color="#fff" 
                  />
                  <Text style={styles.simulationButtonText}>
                    {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
                  </Text>
                </TouchableOpacity>

                {isSimulating && (
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${simulationProgress}%` }]} />
                  </View>
                )}
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Test Scenarios Section */}
              <Text style={styles.sectionTitle}>Test Scenarios</Text>
              {scenarios.map((scenario) => (
                <TouchableOpacity
                  key={scenario.id}
                  style={[
                    styles.scenarioItem,
                    deviationScenario === scenario.id && styles.scenarioItemActive
                  ]}
                  onPress={() => handleScenarioSelect(scenario.id as DeviationScenario)}
                >
                  <Text style={styles.scenarioIcon}>{scenario.icon}</Text>
                  <View style={styles.scenarioInfo}>
                    <Text style={styles.scenarioName}>{scenario.name}</Text>
                    <Text style={styles.scenarioDescription}>{scenario.description}</Text>
                  </View>
                  {deviationScenario === scenario.id && (
                    <MaterialCommunityIcons name="check-circle" size={24} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Info Bar */}
      <NavigationInfoBar
        duration={formattedTime}
        distance={formattedDistance}
        eta={formattedETA}
        onStopNavigation={stopJourney}
        alertsMuted={alertsMuted}
        onToggleMute={toggleMuteAlerts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 280,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 999,
    zIndex: 999,
  },
  deviationTestButton: {
    position: 'absolute',
    bottom: 340,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 999,
    zIndex: 999,
  },
  deviationTestButtonActive: {
    backgroundColor: '#22c55e', // Green when simulating
  },
  simulationIndicator: {
    position: 'absolute',
    bottom: 395,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#22c55e',
    borderRadius: 8,
    zIndex: 999,
    elevation: 999,
  },
  simulationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  scenarioList: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    marginTop: 8,
  },
  simulationControls: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  speedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  speedButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  speedButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  speedButtonActive: {
    backgroundColor: '#3b82f6',
  },
  speedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  speedButtonTextActive: {
    color: '#fff',
  },
  simulationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  startButton: {
    backgroundColor: '#22c55e',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  simulationButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  progressBar: {
    marginTop: 12,
    height: 6,
    backgroundColor: '#d1d5db',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  scenarioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  scenarioItemActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  scenarioIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  scenarioInfo: {
    flex: 1,
  },
  scenarioName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  scenarioDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
});
