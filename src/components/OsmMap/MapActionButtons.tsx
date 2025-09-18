import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';

interface MapActionButtonsProps {
  locationAvailable: boolean;
  loadingLocation: boolean;
  onGetCurrentLocation: () => void;
  onOpenExternalMap: () => void;
  onShareLocation: () => void;
  onToggleFullScreen?: () => void;
  isFullScreen?: boolean;
}

const MapActionButtons = ({
  locationAvailable,
  loadingLocation,
  onGetCurrentLocation,
  onOpenExternalMap,
  onShareLocation,
  onToggleFullScreen,
  isFullScreen
}: MapActionButtonsProps) => {
  return (
    <View style={styles.actionsRow}>
      <TouchableOpacity onPress={onGetCurrentLocation} disabled={loadingLocation} style={styles.btn}>
        <Text style={styles.btnText}>My Location</Text>
      </TouchableOpacity>
      
      {/* <Button
        mode="contained"
        onPress={onOpenExternalMap}
        disabled={!locationAvailable}
        compact
        icon="open-in-new"
      >
        Open Map
      </Button> */}
      
      {onToggleFullScreen && (
        <TouchableOpacity onPress={onToggleFullScreen} style={styles.btn}>
          <Text style={styles.btnText}>{isFullScreen ? 'Exit Full' : 'Full Screen'}</Text>
        </TouchableOpacity>
      )}

      {/* <Button
        mode="outlined"
        onPress={onShareLocation}
        disabled={!locationAvailable}
        compact
        icon="share"
      >
        Share
      </Button> */}
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
  btn: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnText: {
    color: '#111827',
    fontWeight: '600',
  },
});

export default MapActionButtons;
