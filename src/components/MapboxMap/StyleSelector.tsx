
import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext'
import { MAPBOX_STYLES } from './constants';

interface StyleSelectorProps {
  selectedStyle: string;
  onSelectStyle: (style: string) => void;
}

const StyleSelector = ({ 
  selectedStyle, 
  onSelectStyle, 
}: StyleSelectorProps) => {
  const stylesKeys = Object.keys(MAPBOX_STYLES);

  return (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Map Style:</Text>
      <View style={styles.selectorChips}>
        {stylesKeys.map((styleKey) => (
          <TouchableOpacity key={styleKey} onPress={() => onSelectStyle(styleKey)} style={[styles.chip, selectedStyle === styleKey ? { borderColor: (useAppTheme()).colors.primary, backgroundColor: '#eff6ff' } : undefined]}>
            <Text style={[styles.chipText, selectedStyle === styleKey ? { color: (useAppTheme()).colors.primary, fontWeight: '600' } : undefined]}>
              {MAPBOX_STYLES[styleKey].name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  selectorContainer: {
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  selectorChips: {
    flexDirection: "row",
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: '#fff',
  },
  chipSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  chipText: {
    color: '#111827',
  },
  chipTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});

export default StyleSelector;
