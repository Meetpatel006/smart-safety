import React, { useEffect, useState } from 'react'
import { Snackbar } from 'react-native-paper'
import { onToast } from '../utils/toast'

export default function ToastListener() {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [duration, setDuration] = useState(4000)

  useEffect(() => {
    const off = onToast(({ message, duration }) => {
      setMessage(message)
      setDuration(duration || 4000)
      setVisible(true)
    })
    return () => off()
  }, [])

  return (
    <Snackbar
      visible={visible}
      onDismiss={() => setVisible(false)}
      duration={duration}
    >
      {message}
    </Snackbar>
  )
}
