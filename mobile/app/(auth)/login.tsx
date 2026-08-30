import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/lib/theme";

type Role = "student" | "faculty";

export default function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Role>("student");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!identifier || !password) {
      setError(role === "faculty" ? "Please enter your email and password." : "Please enter your ID and password.");
      return;
    }
    setLoading(true);

    if (role === "faculty") {
      const email = identifier.trim().toLowerCase();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(`Login failed. Check your email and password.`);
        setLoading(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Session error."); setLoading(false); return; }
      const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
      if (profile?.role !== "faculty") {
        await supabase.auth.signOut();
        setError("This account is not a faculty account. Switch to the correct role.");
        setLoading(false);
        return;
      }
      router.replace("/(faculty)/(tabs)/home");
    } else {
      const { data, error: rpcError } = await supabase.rpc("lookup_login", { identifier });
      if (rpcError) {
        setError(`Lookup failed: ${rpcError.message}`);
        setLoading(false);
        return;
      }
      const profile = Array.isArray(data) ? data[0] : data;
      if (!profile?.email || !profile?.role) {
        setError("Account not found. Check your ID number.");
        setLoading(false);
        return;
      }
      if (profile.role !== role) {
        setError(`This ID belongs to a ${profile.role}. Switch to "${profile.role}" to login.`);
        setLoading(false);
        return;
      }
      const { error: authError } = await supabase.auth.signInWithPassword({ email: profile.email, password });
      if (authError) {
        setError(`Invalid password.`);
        setLoading(false);
        return;
      }
      router.replace("/(student)/(tabs)/home");
    }
  };

  const isFaculty = role === "faculty";

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <Image source={require("@/assets/icon.png")} style={styles.logo} />
        <Text style={styles.brand}>ECP Inventory Lab</Text>
        <Text style={styles.headerSub}>STI College Cotabato</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.cardSub}>Sign in to your account</Text>

        {/* Role Toggle */}
        <View style={styles.toggleWrap}>
          <TouchableOpacity
            style={[styles.toggleBtn, role === "student" && styles.toggleBtnActive]}
            onPress={() => { setRole("student"); setIdentifier(""); setError(""); }}
          >
            <Ionicons name="school-outline" size={16} color={role === "student" ? COLORS.teal : COLORS.silver} />
            <Text style={[styles.toggleText, role === "student" && styles.toggleTextActive]}>Student</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, role === "faculty" && styles.toggleBtnActive]}
            onPress={() => { setRole("faculty"); setIdentifier(""); setError(""); }}
          >
            <Ionicons name="person-outline" size={16} color={role === "faculty" ? COLORS.teal : COLORS.silver} />
            <Text style={[styles.toggleText, role === "faculty" && styles.toggleTextActive]}>Faculty</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>{isFaculty ? "Email Address" : "Student ID Number"}</Text>
        <View style={styles.inputWrap}>
          <Ionicons name={isFaculty ? "mail-outline" : "school-outline"} size={16} color={COLORS.silver} />
          <TextInput
            style={styles.input}
            placeholder={isFaculty ? "e.g. maria@school.edu" : "e.g. 2000220049"}
            placeholderTextColor={COLORS.silver}
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType={isFaculty ? "email-address" : "default"}
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={16} color={COLORS.silver} />
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={COLORS.silver}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footer}>
          {isFaculty ? "Faculty accounts use email to sign in." : "Use your Student ID number to sign in."}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    height: 280, backgroundColor: COLORS.navy,
    justifyContent: "center", alignItems: "center", paddingTop: 40,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  logo: { width: 72, height: 72, borderRadius: 18 },
  brand: { fontSize: 26, fontWeight: "bold", color: "#fff", marginTop: 12 },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  card: {
    backgroundColor: COLORS.card, marginTop: -20,
    marginHorizontal: 20, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 24, elevation: 4,
    shadowColor: COLORS.navy, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12,
  },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.navy, textAlign: "center" },
  cardSub: { fontSize: 13, color: COLORS.silver, textAlign: "center", marginTop: 4, marginBottom: 20 },
  toggleWrap: {
    flexDirection: "row", backgroundColor: COLORS.background, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: 12, padding: 4, marginBottom: 8,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", flexDirection: "row",
    justifyContent: "center", gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.tealLight, elevation: 2,
    shadowColor: COLORS.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  toggleText: { fontSize: 14, fontWeight: "600", color: COLORS.silver },
  toggleTextActive: { color: COLORS.teal },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.slate, marginBottom: 6, marginTop: 14 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12,
  },
  input: { flex: 1, height: 50, fontSize: 15, color: COLORS.navy },
  errorBox: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.destructive,
    borderRadius: 10, padding: 12, marginTop: 14,
  },
  errorText: { color: COLORS.destructive, fontSize: 13, textAlign: "center", lineHeight: 18 },
  button: {
    backgroundColor: COLORS.teal, height: 50, borderRadius: 12,
    justifyContent: "center", alignItems: "center", marginTop: 20,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  footer: { fontSize: 11, color: COLORS.silver, textAlign: "center", marginTop: 16 },
});
