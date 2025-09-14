
import { useState } from "react"
import { View, TouchableOpacity, Animated } from "react-native"
import { Button, Card, Text, TextInput } from "react-native-paper"
import QRCode from "react-native-qrcode-svg"
import { useApp } from "../context/AppContext"
import { t } from "../context/translations"

export default function ProfileCard() {
  const { state, updateProfile } = useApp()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(state.user?.name || "")
  const [email, setEmail] = useState(state.user?.email || "")
  const [flipped, setFlipped] = useState(false)
  const flipAnim = useState(new Animated.Value(0))[0]

  const flipCard = () => {
    if (editing) return // Don't flip while editing
    Animated.timing(flipAnim, {
      toValue: flipped ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
    setFlipped(!flipped)
  }

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  })

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  })

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  }

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  }

  return (
    <View style={{ position: "relative", marginBottom: 16 }}>
      <TouchableOpacity onPress={flipCard} activeOpacity={0.9} style={{ position: "relative" }}>
        <Animated.View style={[frontAnimatedStyle, { backfaceVisibility: "hidden" }]}>
          <Card>
            <Card.Title title={t(state.language, "profile")} />
            <Card.Content>
              {!editing ? (
                <View style={{ gap: 1 }}>
                  <Text>Name: {state.user?.name}</Text>
                  <Text>Email: {state.user?.email}</Text>
                  {state.user?.touristId && <Text>Tourist ID: {state.user.touristId}</Text>}
                  {state.user?.audit?.eventId && <Text>Event ID: {state.user.audit.eventId}</Text>}
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  <TextInput label={t(state.language, "name")} value={name} onChangeText={setName} />
                  <TextInput label={t(state.language, "email")} value={email} onChangeText={setEmail} autoCapitalize="none" />
                </View>
              )}
            </Card.Content>
            <Card.Actions>
              {!editing ? (
                <Button onPress={() => setEditing(true)}>{t(state.language, "edit")}</Button>
              ) : (
                <>
                  <Button onPress={() => setEditing(false)}>{t(state.language, "cancel")}</Button>
                  <Button
                    mode="contained"
                    onPress={() => {
                      updateProfile({ name, email })
                      setEditing(false)
                    }}
                  >
                    {t(state.language, "save")}
                  </Button>
                </>
              )}
            </Card.Actions>
          </Card>
        </Animated.View>
        <Animated.View style={[backAnimatedStyle, { backfaceVisibility: "hidden", position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }]}>
          <Card style={{ height: "100%" }}>
            <Card.Title title="QR Code" />
            <Card.Content style={{ 
              alignItems: "center", 
              justifyContent: "center",
              paddingVertical: 0
            }}>
              {state.user?.touristId ? (
                <QRCode value={state.user.touristId} size={140} />
              ) : (
                <Text>No Tourist ID available</Text>
              )}
            </Card.Content>
          </Card>
        </Animated.View>
      </TouchableOpacity>
    </View>
  )
}
