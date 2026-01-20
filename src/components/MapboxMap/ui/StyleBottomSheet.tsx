import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StyleSelector from '../StyleSelector';
import { MAPBOX_STYLES } from '../constants';

interface StyleBottomSheetProps {
  isExpanded: boolean;
  onToggle: () => void;
  selectedStyle: string;
  onSelectStyle: (style: string) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.45;

export default function StyleBottomSheet({
  isExpanded,
  onToggle,
  selectedStyle,
  onSelectStyle,
}: StyleBottomSheetProps) {
  const translateY = useSharedValue(SHEET_HEIGHT);

  useEffect(() => {
    translateY.value = withTiming(isExpanded ? 0 : SHEET_HEIGHT, {
      duration: 280,
      easing: Easing.out(Easing.ease),
    });
  }, [isExpanded]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    height: SHEET_HEIGHT,
  }));

  const currentStyleName = MAPBOX_STYLES[selectedStyle]?.name || 'Default';

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity style={styles.handleContainer} onPress={onToggle} activeOpacity={0.85}>
        <View style={styles.handle} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons name="layers-outline" size={18} color="#2563EB" />
          </View>
          <View>
            <Text style={styles.title}>Map styles</Text>
            <Text style={styles.subtitle}>Switch between light, dark, satellite and more.</Text>
          </View>
        </View>
        <View style={styles.currentChip}>
          <Text style={styles.currentChipText}>{currentStyleName}</Text>
        </View>
      </View>

      <View style={styles.selectorWrapper}>
        <StyleSelector selectedStyle={selectedStyle} onSelectStyle={onSelectStyle} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 18,
    zIndex: 205,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 48,
    height: 5,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  currentChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
  },
  currentChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  selectorWrapper: {
    paddingHorizontal: 16,
  },
});
