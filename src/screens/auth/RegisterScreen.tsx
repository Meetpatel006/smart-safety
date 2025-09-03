
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
  const [aadhaar, setAadhaar] = useState("") // mock only
  const [blockchainId, setBlockchainId] = useState("") // mock only
  const [password, setPassword] = useState("")
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null)

  const onSubmit = async () => {
    const res = await register({ name, email, password, aadhaar, blockchainId })
    setMsg({ type: res.ok ? "success" : "error", text: res.message })
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
          <TextInput
            label={t(lang, "mockAadhaar")}
            value={aadhaar}
            onChangeText={setAadhaar}
            style={{ marginBottom: 8 }}
          />
          <TextInput
            label={t(lang, "blockchainId")}
            value={blockchainId}
            onChangeText={setBlockchainId}
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
