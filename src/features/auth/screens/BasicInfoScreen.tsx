import { useState } from "react";
import { ScrollView, KeyboardAvoidingView, Platform, View, StyleSheet, TouchableOpacity } from "react-native";
import { Button, TextInput, Text, IconButton, Menu, HelperText } from "react-native-paper";
import { useApp } from "../../../context/AppContext";
import { t } from "../../../context/translations";

export default function BasicInfoScreen({ navigation, route }: any) {
  const { state } = useApp();
  const lang = state.language;
  const role = route?.params?.role as "solo" | "group-member" | "tour-admin" | undefined;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [genderMenuVisible, setGenderMenuVisible] = useState(false);
  const [msg, setMsg] = useState<{ type: "info" | "error" | "success"; text: string } | null>(null);

  const genderOptions = ["Male", "Female", "Other", "Prefer not to say"];

  const onNext = () => {
    setMsg(null);

    // Full name validation
    if (!name.trim()) {
      setMsg({ type: "error", text: "Please enter your full name" });
      return;
    }

    // Email validation
    if (!email.trim()) {
      setMsg({ type: "error", text: "Please enter your email" });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMsg({ type: "error", text: "Please enter a valid email address" });
      return;
    }

    // Password validation
    if (!password.trim()) {
      setMsg({ type: "error", text: "Please enter your password" });
      return;
    }

    if (password.length < 6) {
      setMsg({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    // Age validation
    if (!age.trim()) {
      setMsg({ type: "error", text: "Please enter your age" });
      return;
    }

    // Gender validation
    if (!gender) {
      setMsg({ type: "error", text: "Please select your gender" });
      return;
    }

    // Navigate to next screen with data
    navigation.navigate("AdditionalInfo", {
      role,
      basicInfo: {
        name,
        email,
        password,
        age,
        gender,
      },
    });
  };

  return (
    <View style={styles.screenContainer}>
      <IconButton
        icon="arrow-left"
        size={24}
        onPress={() => navigation.goBack()}
        style={styles.backIcon}
      />
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
                    <Text style={styles.title}>Create account</Text>
                    {role && (
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>
                          {role === 'solo' ? 'Solo Traveler' : role === 'group-member' ? 'Group Member' : role === 'tour-admin' ? 'Tour Admin' : role}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.subtitle}>Step 1 of 2 — Basic information</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                mode="flat"
                value={name}
                onChangeText={setName}
                placeholder="Enter name"
                cursorColor="#0C87DE"
                selectionColor="#0C87DE"
                style={styles.textInput}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                placeholderTextColor="#9CA4AB"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                mode="flat"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
                autoCapitalize="none"
                keyboardType="email-address"
                cursorColor="#0C87DE"
                selectionColor="#0C87DE"
                style={styles.textInput}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                placeholderTextColor="#9CA4AB"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                mode="flat"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                secureTextEntry={secureTextEntry}
                cursorColor="#0C87DE"
                selectionColor="#0C87DE"
                style={styles.textInput}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                placeholderTextColor="#9CA4AB"
                right={
                  <TextInput.Icon
                    icon={secureTextEntry ? "eye-off-outline" : "eye-outline"}
                    color="#9CA3AF"
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                  />
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                mode="flat"
                value={age}
                onChangeText={setAge}
                placeholder="Enter age"
                keyboardType="number-pad"
                cursorColor="#0C87DE"
                selectionColor="#0C87DE"
                style={styles.textInput}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                placeholderTextColor="#9CA4AB"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <Menu
                visible={genderMenuVisible}
                onDismiss={() => setGenderMenuVisible(false)}
                anchor={
                  <TouchableOpacity
                    style={styles.genderSelector}
                    onPress={() => setGenderMenuVisible(true)}
                  >
                    <Text style={gender ? styles.genderSelectedText : styles.genderPlaceholder}>
                      {gender || "Select gender"}
                    </Text>
                    <IconButton icon="chevron-down" size={20} style={styles.chevronIcon} />
                  </TouchableOpacity>
                }
                contentStyle={styles.menuContent}
              >
                {genderOptions.map((option) => (
                  <Menu.Item
                    key={option}
                    onPress={() => {
                      setGender(option);
                      setGenderMenuVisible(false);
                    }}
                    title={option}
                    titleStyle={styles.menuItemTitle}
                  />
                ))}
              </Menu>
            </View>

            {msg && (
              <Text style={styles.errorText}>{msg.text}</Text>
            )}

            <Button
              mode="contained"
              onPress={onNext}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
              labelStyle={styles.submitButtonLabel}
            >
              Next
            </Button>

            <TouchableOpacity onPress={() => navigation.navigate("Login", { role })} style={styles.signInLink}>
              <Text style={styles.signInLinkText}>Already have account? Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  backIcon: {
    position: "absolute",
    top: 67,
    left: 20,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 28,
    paddingTop: 48,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: "Jost",
    fontWeight: "700",
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: 0.2,
    color: "#0F172A",
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: "Jost",
    fontWeight: "400",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
    color: "#6B7280",
    marginTop: 6,
  },
  formContainer: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: "Jost",
    fontWeight: "600",
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.5,
    color: "#171725",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#F6F6F6",
    borderRadius: 12,
    height: 52,
    paddingLeft: 16,
    fontSize: 14,
  },
  genderSelector: {
    backgroundColor: "#F6F6F6",
    borderRadius: 12,
    height: 52,
    paddingLeft: 16,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  genderPlaceholder: {
    fontFamily: "Jost",
    fontSize: 14,
    color: "#9CA4AB",
  },
  genderSelectedText: {
    fontFamily: "Jost",
    fontSize: 14,
    color: "#171725",
  },
  chevronIcon: {
    margin: 0,
  },
  menuContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginTop: 8,
  },
  menuItemTitle: {
    fontFamily: "Jost",
    fontSize: 14,
  },
  errorText: {
    fontFamily: "Jost",
    fontSize: 14,
    color: "#EF4444",
    marginBottom: 16,
    textAlign: "center",
  },
  submitButton: {
    borderRadius: 12,
    backgroundColor: "#0C87DE",
    marginTop: 32,
  },
  submitButtonContent: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  submitButtonLabel: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: 0.5,
    color: "#FEFEFE",
  },
  signInLink: {
    marginTop: 18,
    alignItems: "center",
  },
  signInLinkText: {
    fontFamily: "Jost",
    fontWeight: "600",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.5,
    color: "#2853AF",
  },
  roleBadge: {
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#EEF6FF',
    borderWidth: 1,
    borderColor: '#D3EFFF',
  },
  roleBadgeText: {
    color: '#0C87DE',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
});
