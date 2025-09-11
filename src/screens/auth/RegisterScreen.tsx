
import { useState } from "react"
import { ScrollView } from "react-native"
import { Button, Card, HelperText, TextInput } from "react-native-paper"
import { useApp } from "../../context/AppContext"
import { t } from "../../context/translations"

export default function RegisterScreen({ navigation }: any) {
  const { state, register } = useApp()
  const lang = state.language
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [govId, setGovId] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [itinerary, setItinerary] = useState("")
  const [emergencyContactName, setEmergencyContactName] = useState("")
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("")
  const [tripEndDate, setTripEndDate] = useState("")
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null)

  const onSubmit = async () => {
    const parsedItinerary = itinerary
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    const res = await register({
      name,
      email,
      password,
      govId,
      phone,
      itinerary: parsedItinerary,
      emergencyContact: { name: emergencyContactName, phone: emergencyContactPhone },
      language: lang,
      tripEndDate,
    })

    if (res.ok) {
      const successMessage = `${res.message} Your Blockchain ID is: ${res.regTxHash}`
      setMsg({ type: "success", text: successMessage })
    } else {
      setMsg({ type: "error", text: res.message })
    }
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}>
      <Card>
        <Card.Title title={t(lang, "register")} />
        <Card.Content>
          <TextInput label={t(lang, "name")} value={name} onChangeText={setName} style={{ marginBottom: 8 }} />
          <TextInput
            label={t(lang, "email")}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={{ marginBottom: 8 }}
          />
          <TextInput
            label={t(lang, "password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ marginBottom: 8 }}
          />
          <TextInput label="Gov ID" value={govId} onChangeText={setGovId} style={{ marginBottom: 8 }} />
          <TextInput label="Phone" value={phone} onChangeText={setPhone} style={{ marginBottom: 8 }} />
          <TextInput
            label="Itinerary (comma-separated)"
            value={itinerary}
            onChangeText={setItinerary}
            style={{ marginBottom: 8 }}
          />
          <TextInput
            label="Emergency Contact Name"
            value={emergencyContactName}
            onChangeText={setEmergencyContactName}
            style={{ marginBottom: 8 }}
          />
          <TextInput
            label="Emergency Contact Phone"
            value={emergencyContactPhone}
            onChangeText={setEmergencyContactPhone}
            style={{ marginBottom: 8 }}
          />
          <TextInput
            label="Trip End Date (YYYY-MM-DD)"
            value={tripEndDate}
            onChangeText={setTripEndDate}
            style={{ marginBottom: 8 }}
          />
          {msg && <HelperText type={msg.type === "error" ? "error" : "info"}>{msg.text}</HelperText>}
          <Button mode="contained" onPress={onSubmit}>
            {t(lang, "signUp")}
          </Button>
          <Button onPress={() => navigation.goBack()} style={{ marginTop: 8 }}>
            {t(lang, "cancel")}
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  )
}
