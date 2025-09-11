
import { useState } from "react"
import { ScrollView } from "react-native"
import { Button, Card, HelperText, Text, TextInput } from "react-native-paper"
import { useApp } from "../../context/AppContext"
import { t } from "../../context/translations"

export default function LoginScreen({ navigation }: any) {
  const { state, login } = useApp()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: "info" | "error" | "success"; text: string } | null>(null)
  const lang = state.language

  const onSubmit = async () => {
    setLoading(true)
    const res = await login(email, password)
    setMsg({ type: res.ok ? "success" : "error", text: res.message })
    setLoading(false)
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}>
      <Card>
        <Card.Title title={t(lang, "login")} />
        <Card.Content>
          <Text style={{ marginBottom: 8 }}>{t(lang, "appTitle")}</Text>
          <TextInput
            label={t(lang, "email")}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={{ marginBottom: 8 }}
            disabled={loading}
          />
          <TextInput
            label={t(lang, "password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ marginBottom: 8 }}
            disabled={loading}
          />
          {msg && <HelperText type={msg.type === "error" ? "error" : "info"}>{msg.text}</HelperText>}
          <Button mode="contained" onPress={onSubmit} style={{ marginTop: 8 }} loading={loading} disabled={loading}>
            {t(lang, "signIn")}
          </Button>
          <HelperText type="info" visible>
            {t(lang, "or")}
          </HelperText>
          <Button onPress={() => navigation.navigate("Register")} disabled={loading}>{t(lang, "register")}</Button>
        </Card.Content>
      </Card>
    </ScrollView>
  )
}

