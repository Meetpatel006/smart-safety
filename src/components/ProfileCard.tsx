
import { useState } from "react"
import { View } from "react-native"
import { Button, Card, Text, TextInput } from "react-native-paper"
import { useApp } from "../context/AppContext"
import { t } from "../context/translations"

export default function ProfileCard() {
  const { state, updateProfile } = useApp()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(state.user?.name || "")
  const [email, setEmail] = useState(state.user?.email || "")

  return (
    <Card>
      <Card.Title title={t(state.language, "profile")} />
      <Card.Content>
        {!editing ? (
          <View style={{ gap: 4 }}>
            <Text>Name: {state.user?.name}</Text>
            <Text>Email: {state.user?.email}</Text>
            <Text>Aadhaar: {state.user?.aadhaar}</Text>
            <Text>Blockchain ID: {state.user?.blockchainId}</Text>
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
  )
}
