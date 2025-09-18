import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';

interface MapHeaderProps {
  title: string;
  loading: boolean;
  onRefresh: () => void;
}

const MapHeader = ({ title, loading, onRefresh }: MapHeaderProps) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity onPress={onRefresh} disabled={loading} style={styles.btn}>
        <Text style={styles.btnText}>{loading ? "Locating..." : "Refresh"}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
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

export default MapHeader;
