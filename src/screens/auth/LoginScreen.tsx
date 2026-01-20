
import { useState } from "react"
import { ScrollView, KeyboardAvoidingView, Platform, View, StyleSheet, TouchableOpacity } from "react-native"
import { Button, HelperText, Text, TextInput, useTheme } from "react-native-paper"
import { useApp } from "../../context/AppContext"
import { t } from "../../context/translations"
import { MaterialCommunityIcons } from "@expo/vector-icons"

export default function LoginScreen({ navigation }: any) {
  const { state, login } = useApp()
  const theme = useTheme()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: "info" | "error" | "success"; text: string } | null>(null)
  const lang = state.language
  const [secureTextEntry, setSecureTextEntry] = useState(true)

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
    <View style={styles.screenContainer}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        enabled
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="shield-check" size={40} color="#0077CC" />
            </View>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>{t(lang, "appTitle")}</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t(lang, "email")}</Text>
              <TextInput
                mode="outlined"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                contentStyle={styles.textInputContent}
                outlineStyle={styles.textInputOutline}
                style={styles.textInput}
                disabled={loading}
                left={<TextInput.Icon icon="email-outline" color="#9CA3AF" />}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t(lang, "password")}</Text>
              <TextInput
                mode="outlined"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={secureTextEntry}
                autoCorrect={false}
                autoComplete="password"
                contentStyle={styles.textInputContent}
                outlineStyle={styles.textInputOutline}
                style={styles.textInput}
                disabled={loading}
                left={<TextInput.Icon icon="lock-outline" color="#9CA3AF" />}
                right={
                  <TextInput.Icon 
                    icon={secureTextEntry ? "eye-off-outline" : "eye-outline"} 
                    color="#9CA3AF" 
                    onPress={() => setSecureTextEntry(!secureTextEntry)} 
                  />
                }
              />
            </View>

            {msg && (
              <HelperText 
                type={msg.type === "error" ? "error" : "info"}
                style={styles.helperText}
              >
                {msg.text}
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={onSubmit}
              style={styles.loginButton}
              contentStyle={{ height: 50 }}
              labelStyle={styles.loginButtonLabel}
              loading={loading}
              disabled={loading}
            >
              {t(lang, "signIn")}
            </Button>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")} disabled={loading}>
                <Text style={styles.registerLink}>{t(lang, "register")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  textInputContent: {
    backgroundColor: '#FFFFFF',
  },
  textInputOutline: {
    borderRadius: 12,
    borderColor: '#E5E7EB',
  },
  helperText: {
    marginBottom: 10,
    fontSize: 14,
  },
  loginButton: {
    borderRadius: 12,
    backgroundColor: '#0077CC',
    marginTop: 8,
    elevation: 2,
    shadowColor: '#0077CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  loginButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 15,
  },
  registerLink: {
    color: '#0077CC',
    fontSize: 15,
    fontWeight: '600',
  },
})

