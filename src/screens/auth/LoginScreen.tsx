
import { useState } from "react"
import { ScrollView, KeyboardAvoidingView, Platform } from "react-native"
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
    let res
    try {
      res = await login(email, password)
      try { console.log('LoginScreen: login result', { email, res }) } catch (e) { }
    } catch (e: any) {
      try { console.error('LoginScreen: login threw', { email, error: e?.message || e }) } catch (ee) { }
      res = { ok: false, message: e?.message || 'An error occurred' }
    }
    setMsg({ type: res.ok ? "success" : "error", text: res.message })
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      enabled
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}
      >
        <Card>
          <Card.Title title={t(lang, "login")} />
          <Card.Content>
            <Text style={{ marginBottom: 8 }}>{t(lang, "appTitle")}</Text>
            <TextInput
              label={t(lang, "email")}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              style={{ marginBottom: 8 }}
              disabled={loading}
            />
            <TextInput
              label={t(lang, "password")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCorrect={false}
              autoComplete="off"
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
    </KeyboardAvoidingView>
  )
}

