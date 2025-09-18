import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext'
import { TileProvider } from './types';

interface TileProviderSelectorProps {
  tileProvider: TileProvider;
  onChangeTileProvider: (provider: TileProvider) => void;
  providers: string[];
}

const TileProviderSelector = ({ 
  tileProvider, 
  onChangeTileProvider, 
  providers 
}: TileProviderSelectorProps) => {
  return (
    <View style={styles.providerContainer}>
      <Text style={styles.providerLabel}>Map Tile Provider:</Text>
      <View style={styles.providerChips}>
        {providers.map((provider) => (
          <TouchableOpacity
            key={provider}
            onPress={() => onChangeTileProvider(provider as TileProvider)}
            style={[styles.chip, tileProvider === provider ? styles.chipSelected : undefined, { borderColor: tileProvider === provider ? (useAppTheme()).colors.primary : undefined }]}
          >
            <Text style={[styles.chipText, tileProvider === provider ? styles.chipTextSelected : undefined]}>
              {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  providerContainer: {
    marginBottom: 16,
  },
  providerLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  providerChips: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  chipSelected: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  chipText: { color: '#111827' },
  chipTextSelected: { color: '#3b82f6', fontWeight: '600' },
});

export default TileProviderSelector;
