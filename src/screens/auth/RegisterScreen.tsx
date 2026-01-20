import { useState } from "react";
import { ScrollView, KeyboardAvoidingView, Platform, View, StyleSheet, TouchableOpacity } from "react-native";
import {
  Button,
  HelperText,
  TextInput,
  Text,
  useTheme,
  Surface
} from "react-native-paper";
import { useApp } from "../../context/AppContext";
import { t } from "../../context/translations";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function RegisterScreen({ navigation }: any) {
  const { state, register, login, setJustRegistered } = useApp();
  const theme = useTheme();
  const lang = state.language;

  const [role, setRole] = useState<"solo" | "group-member" | "tour-admin" | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [govId, setGovId] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  // Specific fields
  const [itinerary, setItinerary] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");

  const [msg, setMsg] = useState<{
    type: "error" | "success" | "info";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!role) {
        setMsg({ type: "error", text: "Please select a role first." });
        return;
    }
    setLoading(true);
    setMsg(null);

    // Parse itinerary (only for solo, maybe admin too but admin creates group later)
    const parsedItinerary = itinerary
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // **IMPORTANT**: Set this flag so that navigation knows to redirect
    // group members to JoinGroup after auto-login.
    setJustRegistered(true);

    try {
      // Step 1: Register
      const res = await register({
        role,
        name,
        email,
        password,
        govId,
        phone,
        dayWiseItinerary: role === "solo" ? parsedItinerary : [], // Group members inherit, admins create later
        emergencyContact:
          role === "solo"
            ? { name: emergencyContactName, phone: emergencyContactPhone }
            : { name: "Not Applicable", phone: "0000000000" }, // Backend requires this field
        language: lang,
        tripEndDate: role === "solo" ? tripEndDate : undefined,
      });

      if (!res.ok) {
        setMsg({ type: "error", text: res.message });
        setLoading(false);
        return;
      }

      // Registration successful. Now Auto-Login.
      const loginRes = await login(email, password);
      if (!loginRes.ok) {
        setMsg({
          type: "success",
          text: `${res.message}. Please login manually.`,
        }); 
        setLoading(false);
        return;
      }

      setMsg({ type: "success", text: "Welcome!" });
    } catch (e: any) {
      setMsg({ type: "error", text: e.message || "An error occurred" });
    }
    setLoading(false);
  };

  const renderRoleButton = (
    value: "solo" | "group-member" | "tour-admin", 
    label: string, 
    icon: string, 
    description: string
  ) => {
    const isSelected = role === value;
    return (
        <TouchableOpacity 
            onPress={() => setRole(value)}
            style={[
                styles.roleCard,
                isSelected && styles.roleCardSelected
            ]}
        >
            <View style={[styles.roleIcon, isSelected && styles.roleIconSelected]}>
                <MaterialCommunityIcons 
                    name={icon as any} 
                    size={28} 
                    color={isSelected ? "white" : "#0077CC"} 
                />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.roleTitle, isSelected && styles.roleTitleSelected]}>
                    {label}
                </Text>
                <Text style={[styles.roleDesc, isSelected && styles.roleDescSelected]}>
                    {description}
                </Text>
            </View>
        </TouchableOpacity>
    );
  };

  const renderForm = () => {
    return (
        <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>{t(lang, "name")}</Text>
                <TextInput
                    mode="outlined"
                    value={name}
                    onChangeText={setName}
                    placeholder="Full Name"
                    style={styles.textInput}
                    outlineStyle={styles.textInputOutline}
                    left={<TextInput.Icon icon="account-outline" color="#9CA3AF" />}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>{t(lang, "email")}</Text>
                <TextInput
                    mode="outlined"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email Address"
                    autoCapitalize="none"
                    style={styles.textInput}
                    outlineStyle={styles.textInputOutline}
                    left={<TextInput.Icon icon="email-outline" color="#9CA3AF" />}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>{t(lang, "password")}</Text>
                <TextInput
                    mode="outlined"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    secureTextEntry={secureTextEntry}
                    style={styles.textInput}
                    outlineStyle={styles.textInputOutline}
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

            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Gov ID</Text>
                    <TextInput
                    mode="outlined"
                    value={govId}
                    onChangeText={setGovId}
                    placeholder="Aadhaar/Passport"
                    style={styles.textInput}
                    outlineStyle={styles.textInputOutline}
                    left={<TextInput.Icon icon="card-account-details-outline" color="#9CA3AF" />}
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Phone</Text>
                    <TextInput
                    mode="outlined"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Mobile Number"
                    keyboardType="phone-pad"
                    style={styles.textInput}
                    outlineStyle={styles.textInputOutline}
                    left={<TextInput.Icon icon="phone-outline" color="#9CA3AF" />}
                    />
                </View>
            </View>

            {role === "solo" && (
                <Surface style={styles.soloSection} elevation={0}>
                  <Text style={styles.sectionHeader}>Emergency Details</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Contact Name</Text>
                    <TextInput
                        mode="outlined"
                        value={emergencyContactName}
                        onChangeText={setEmergencyContactName}
                        placeholder="Emergency Contact Name"
                        style={styles.textInput}
                        outlineStyle={styles.textInputOutline}
                        left={<TextInput.Icon icon="account-alert-outline" color="#9CA3AF" />}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Contact Phone</Text>
                    <TextInput
                        mode="outlined"
                        value={emergencyContactPhone}
                        onChangeText={setEmergencyContactPhone}
                        placeholder="Emergency Contact Phone"
                        keyboardType="phone-pad"
                        style={styles.textInput}
                        outlineStyle={styles.textInputOutline}
                        left={<TextInput.Icon icon="phone-alert-outline" color="#9CA3AF" />}
                    />
                  </View>
                  
                {/* 
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Trip End (YYYY-MM-DD)</Text>
                    <TextInput
                        mode="outlined"
                        value={tripEndDate}
                        onChangeText={setTripEndDate}
                        placeholder="YYYY-MM-DD"
                        style={styles.textInput}
                        outlineStyle={styles.textInputOutline}
                        left={<TextInput.Icon icon="calendar-outline" color="#9CA3AF" />}
                    />
                  </View>
                */}
                </Surface>
            )}

            {msg && (
                <HelperText type={msg.type === "error" ? "error" : "info"} style={styles.helperText}>
                    {msg.text}
                </HelperText>
            )}

            <Button
                mode="contained"
                onPress={onSubmit}
                loading={loading}
                disabled={loading}
                style={styles.submitButton}
                contentStyle={{ height: 50 }}
                labelStyle={styles.submitButtonLabel}
            >
                {t(lang, "signUp")}
            </Button>
            
            <TouchableOpacity onPress={() => setRole(null)} style={styles.backButton}>
                 <Text style={styles.backButtonText}>Change Role</Text>
            </TouchableOpacity>
        </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
        <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled
        >
            <ScrollView
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join the safety network</Text>
                </View>

                {!role ? (
                    <View style={styles.roleSelectionContainer}>
                        <Text style={styles.roleHeader}>I am a...</Text>
                        {renderRoleButton(
                            "solo", 
                            "Solo Traveler", 
                            "account", 
                            "Traveling alone or independently."
                        )}
                        {renderRoleButton(
                            "group-member", 
                            "Group Member", 
                            "account-group", 
                            "Joining a guided tour group."
                        )}
                        {renderRoleButton(
                            "tour-admin", 
                            "Tour Admin / Guide", 
                            "shield-account", 
                            "Organizing and managing a group."
                        )}
                         <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account?</Text>
                            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                                <Text style={styles.loginLink}>{t(lang, "signIn")}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    renderForm()
                )}

            </ScrollView>
        </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  roleSelectionContainer: {
    gap: 16,
  },
  roleHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  roleCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0077CC',
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  roleIconSelected: {
    backgroundColor: '#0077CC',
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  roleTitleSelected: {
    color: '#1F2937',
  },
  roleDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  roleDescSelected: {
    color: '#4B5563',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
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
    fontSize: 15,
  },
  textInputOutline: {
    borderRadius: 12,
    borderColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
  },
  soloSection: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  helperText: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  submitButton: {
    borderRadius: 12,
    backgroundColor: '#0077CC',
    elevation: 2,
    shadowColor: '#0077CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginTop: 8,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 8,
  },
  backButtonText: {
    color: '#6B7280',
    fontWeight: '500',
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
  loginLink: {
    color: '#0077CC',
    fontSize: 15,
    fontWeight: '600',
  },
});
