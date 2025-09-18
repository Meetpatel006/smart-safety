
import { useState } from "react"
import { ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native"
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
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 16, elevation: 2 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>{t(lang, "login")}</Text>
        <Text style={{ marginBottom: 8 }}>{t(lang, "appTitle")}</Text>

        <Text style={{ marginBottom: 4 }}>{t(lang, "email")}</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" style={{ marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', padding: 8, borderRadius: 4 }} editable={!loading} />

        <Text style={{ marginBottom: 4 }}>{t(lang, "password")}</Text>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry style={{ marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', padding: 8, borderRadius: 4 }} editable={!loading} />

        {msg && <Text style={{ color: msg.type === 'error' ? '#c53030' : '#2f855a', marginBottom: 8 }}>{msg.text}</Text>}

        <TouchableOpacity onPress={onSubmit} style={{ backgroundColor: '#0077CC', padding: 12, borderRadius: 6, alignItems: 'center', marginTop: 8 }} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff' }}>{t(lang, "signIn")}</Text>}
        </TouchableOpacity>

        <Text style={{ marginVertical: 8, textAlign: 'center' }}>{t(lang, "or")}</Text>

        <TouchableOpacity onPress={() => navigation.navigate("Register")} disabled={loading} style={{ padding: 12, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' }}>
          <Text>{t(lang, "register")}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

