import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';

interface MapActionButtonsProps {
  locationAvailable: boolean;
  loadingLocation: boolean;
  onGetCurrentLocation: () => void;
  onOpenExternalMap: () => void;
  onShareLocation: () => void;
}

const MapActionButtons = ({
  locationAvailable,
  loadingLocation,
  onGetCurrentLocation,
  onOpenExternalMap,
  onShareLocation
}: MapActionButtonsProps) => {
  return (
    <View style={styles.actionsRow}>
      <Button
        mode="outlined"
        onPress={onGetCurrentLocation}
        disabled={loadingLocation}
        compact
        icon="crosshairs-gps"
      >
        My Location
      </Button>
      
      <Button
        mode="contained"
        onPress={onOpenExternalMap}
        disabled={!locationAvailable}
        compact
        icon="open-in-new"
      >
        Open Map
      </Button>
      
      <Button
        mode="outlined"
        onPress={onShareLocation}
        disabled={!locationAvailable}
        compact
        icon="share"
      >
        Share
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
});

export default MapActionButtons;
