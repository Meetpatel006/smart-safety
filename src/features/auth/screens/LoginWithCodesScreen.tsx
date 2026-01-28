import { useState } from "react";
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import {
  Button,
  HelperText,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useApp } from "../../../context/AppContext";

export default function LoginWithCodesScreen({ navigation }: any) {
  const theme = useTheme();
  const { loginWithCodes } = useApp() as any;
  const [guideId, setGuideId] = useState("");
  const [touristId, setTouristId] = useState("");
  const [groupAccessCode, setGroupAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "info" | "error" | "success";
    text: string;
  } | null>(null);

  const onSubmit = async () => {
    // Validate inputs
    if (!guideId || !touristId || !groupAccessCode) {
      setMsg({
        type: "error",
        text: "All three codes are required",
      });
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      // Call AppContext function which handles everything
      const result = await loginWithCodes(guideId, touristId, groupAccessCode);

      if (result.ok) {
        setMsg({
          type: "success",
          text: "Welcome! Logging you in...",
        });
        // Navigation happens automatically via RootNavigator watching state.user
      } else {
        setMsg({
          type: "error",
          text: result.message || "Login failed. Please check your codes.",
        });
      }
    } catch (e: any) {
      console.error("LoginWithCodes error:", e);
      setMsg({
        type: "error",
        text: e?.message || "Login failed. Please check your codes and try again.",
      });
    } finally {
      setLoading(false);
    }
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
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="account-group"
                size={40}
                color="#3B82F6"
              />
            </View>
            <Text style={styles.title}>Group Member Login</Text>
            <Text style={styles.subtitle}>
              Enter your 3 codes from the welcome email
            </Text>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons
              name="information"
              size={20}
              color="#3B82F6"
            />
            <Text style={styles.infoText}>
              You should have received an email from your tour guide with three
              unique codes. Enter them below to access your group.
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <MaterialCommunityIcons name="map-marker" size={14} /> Guide ID
              </Text>
              <TextInput
                mode="outlined"
                value={guideId}
                onChangeText={setGuideId}
                placeholder="e.g., T1738034567123"
                autoCapitalize="characters"
                autoCorrect={false}
                contentStyle={styles.textInputContent}
                outlineStyle={styles.textInputOutline}
                style={styles.textInput}
                disabled={loading}
                left={<TextInput.Icon icon="account-star" color="#9CA3AF" />}
              />
              <HelperText type="info" style={styles.helperText}>
                Your tour guide's unique ID
              </HelperText>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <MaterialCommunityIcons name="account" size={14} /> Tourist ID
              </Text>
              <TextInput
                mode="outlined"
                value={touristId}
                onChangeText={setTouristId}
                placeholder="e.g., T1738034890456"
                autoCapitalize="characters"
                autoCorrect={false}
                contentStyle={styles.textInputContent}
                outlineStyle={styles.textInputOutline}
                style={styles.textInput}
                disabled={loading}
                left={<TextInput.Icon icon="account" color="#9CA3AF" />}
              />
              <HelperText type="info" style={styles.helperText}>
                Your unique tourist ID
              </HelperText>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <MaterialCommunityIcons name="key" size={14} /> Group Access
                Code
              </Text>
              <TextInput
                mode="outlined"
                value={groupAccessCode}
                onChangeText={setGroupAccessCode}
                placeholder="e.g., ABC123XYZ"
                autoCapitalize="characters"
                autoCorrect={false}
                contentStyle={styles.textInputContent}
                outlineStyle={styles.textInputOutline}
                style={styles.textInput}
                disabled={loading}
                left={<TextInput.Icon icon="key" color="#9CA3AF" />}
              />
              <HelperText type="info" style={styles.helperText}>
                Your group's unique access code
              </HelperText>
            </View>

            {msg && (
              <HelperText
                type={msg.type === "error" ? "error" : "info"}
                style={[
                  styles.message,
                  msg.type === "success" && styles.successMessage,
                ]}
              >
                {msg.text}
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={onSubmit}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            {/* Back to normal login */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.linkContainer}
              disabled={loading}
            >
              <Text style={styles.linkText}>
                Not a group member?{" "}
                <Text style={styles.linkTextBold}>Login with Email</Text>
              </Text>
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
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  infoBox: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1E40AF",
    marginLeft: 12,
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#FFFFFF",
  },
  textInputContent: {
    fontSize: 15,
  },
  textInputOutline: {
    borderRadius: 10,
    borderColor: "#D1D5DB",
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  message: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  successMessage: {
    color: "#059669",
  },
  button: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: "#3B82F6",
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  linkContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
    color: "#6B7280",
  },
  linkTextBold: {
    color: "#3B82F6",
    fontWeight: "600",
  },
});
