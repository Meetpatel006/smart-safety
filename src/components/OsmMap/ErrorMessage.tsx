import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';

interface ErrorMessageProps {
  errorMsg: string | null;
  onRetry: () => void;
}

const ErrorMessage = ({ errorMsg, onRetry }: ErrorMessageProps) => {
  if (!errorMsg) return null;

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{errorMsg}</Text>
      <TouchableOpacity onPress={onRetry} style={styles.btn}>
        <Text style={styles.btnText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: "#d32f2f",
    flex: 1,
    marginRight: 8,
  },
  btn: {
    borderWidth: 1,
    borderColor: '#ef9a9a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  btnText: {
    color: '#c62828',
    fontWeight: '600',
  },
});

export default ErrorMessage;
