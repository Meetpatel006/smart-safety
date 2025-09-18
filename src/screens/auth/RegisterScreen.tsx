
import { useState } from "react"
import { ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native"
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
      <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 16, elevation: 2 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>{t(lang, "register")}</Text>
        <Text style={{ marginBottom: 4 }}>{t(lang, "name")}</Text>
        <TextInput value={name} onChangeText={setName} style={{ marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', padding: 8, borderRadius: 4 }} />

        <Text style={{ marginBottom: 4 }}>{t(lang, "email")}</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" style={{ marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', padding: 8, borderRadius: 4 }} />

        <Text style={{ marginBottom: 4 }}>{t(lang, "password")}</Text>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry style={{ marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', padding: 8, borderRadius: 4 }} />

        <Text style={{ marginBottom: 4 }}>Gov ID</Text>
        <TextInput value={govId} onChangeText={setGovId} style={{ marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', padding: 8, borderRadius: 4 }} />

        <Text style={{ marginBottom: 4 }}>Phone</Text>
        <TextInput value={phone} onChangeText={setPhone} style={{ marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', padding: 8, borderRadius: 4 }} />

        <Text style={{ marginBottom: 4 }}>Itinerary (comma-separated)</Text>
        <TextInput value={itinerary} onChangeText={setItinerary} style={{ marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', padding: 8, borderRadius: 4 }} />

        <Text style={{ marginBottom: 4 }}>Emergency Contact Name</Text>
        <TextInput value={emergencyContactName} onChangeText={setEmergencyContactName} style={{ marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', padding: 8, borderRadius: 4 }} />

        <Text style={{ marginBottom: 4 }}>Emergency Contact Phone</Text>
        <TextInput value={emergencyContactPhone} onChangeText={setEmergencyContactPhone} style={{ marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', padding: 8, borderRadius: 4 }} />

        <Text style={{ marginBottom: 4 }}>Trip End Date (YYYY-MM-DD)</Text>
        <TextInput value={tripEndDate} onChangeText={setTripEndDate} style={{ marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', padding: 8, borderRadius: 4 }} />

        {msg && <Text style={{ color: msg.type === 'error' ? '#c53030' : '#2f855a', marginBottom: 8 }}>{msg.text}</Text>}

        <TouchableOpacity onPress={onSubmit} style={{ backgroundColor: '#0077CC', padding: 12, borderRadius: 6, alignItems: 'center' }}>
          <Text style={{ color: '#fff' }}>{t(lang, "signUp")}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 8, padding: 12, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' }}>
          <Text>{t(lang, "cancel")}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
