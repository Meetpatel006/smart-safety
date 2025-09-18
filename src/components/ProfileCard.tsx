
import { useState } from "react"
import { View, TouchableOpacity, Animated, Text, TextInput } from "react-native"
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
      useNativeDriver: false,
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
          <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#333' }}>{t(state.language, "profile")}</Text>
            <View>
              {!editing ? (
                <View style={{ gap: 1 }}>
                  <Text>Name: {state.user?.name}</Text>
                  <Text>Email: {state.user?.email}</Text>
                  {state.user?.touristId && <Text>Tourist ID: {state.user.touristId}</Text>}
                  {state.user?.audit?.eventId && <Text>Event ID: {state.user.audit.eventId}</Text>}
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  <Text style={{ marginBottom: 4, color: '#333' }}>{t(state.language, "name")}</Text>
                  <TextInput
                    placeholder={t(state.language, "name")}
                    value={name}
                    onChangeText={setName}
                    style={{ borderWidth: 1, borderColor: '#e2e8f0', padding: 8, borderRadius: 4 }}
                  />
                  <Text style={{ marginBottom: 4, color: '#333' }}>{t(state.language, "email")}</Text>
                  <TextInput
                    placeholder={t(state.language, "email")}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    style={{ borderWidth: 1, borderColor: '#e2e8f0', padding: 8, borderRadius: 4 }}
                  />
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
              {!editing ? (
                <TouchableOpacity onPress={() => setEditing(true)} style={{ paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 4 }}>
                  <Text>{t(state.language, "edit")}</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity onPress={() => setEditing(false)} style={{ paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 4 }}>
                    <Text>{t(state.language, "cancel")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      updateProfile({ name, email })
                      setEditing(false)
                    }}
                    style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#0077CC', borderRadius: 4 }}
                  >
                    <Text style={{ color: '#fff' }}>{t(state.language, "save")}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Animated.View>
        <Animated.View style={[backAnimatedStyle, { backfaceVisibility: "hidden", position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }]}>
          <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, height: "100%" }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#333' }}>QR Code</Text>
            <View style={{ 
              alignItems: "center", 
              justifyContent: "center",
              paddingVertical: 0
            }}>
              {state.user?.touristId ? (
                <QRCode value={state.user.touristId} size={140} />
              ) : (
                <Text>No Tourist ID available</Text>
              )}
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  )
}
