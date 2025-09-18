import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet } from 'react-native'
import { onToast } from '../utils/toast'

export default function ToastListener() {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [duration, setDuration] = useState(4000)
  const [y] = useState(new Animated.Value(100))

  useEffect(() => {
    const off = onToast(({ message, duration }) => {
      setMessage(message)
      setDuration(duration || 4000)
      setVisible(true)
    })
    return () => off()
  }, [])

  useEffect(() => {
    if (visible) {
      Animated.timing(y, { toValue: 0, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }).start()
      const t = setTimeout(() => setVisible(false), duration)
      return () => clearTimeout(t)
    } else {
      Animated.timing(y, { toValue: 100, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true }).start()
    }
  }, [visible, duration, y])

  if (!visible) return null

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: y }] }]}> 
      <TouchableOpacity activeOpacity={0.9} onPress={() => setVisible(false)} style={styles.toast}>
        <Text style={styles.text}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    zIndex: 1000,
  },
  toast: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  text: {
    color: '#fff',
    fontSize: 14,
  },
})
