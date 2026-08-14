import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();
  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!studentNumber || !password) {
      Alert.alert("Error", "Please enter your school ID and password");
      return;
    }
    setLoading(true);
    const { data } = await supabase.rpc("lookup_login", { identifier: studentNumber });
    const profile = Array.isArray(data) ? data[0] : data;
    if (!profile?.email || !profile?.role) {
      Alert.alert("Login Failed", "Account not found. Check your ID.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: profile.email, password });
    if (error) {
      Alert.alert("Login Failed", "Invalid password.");
      setLoading(false);
      return;
    }
    if (profile.role === "faculty") {
      router.replace("/(faculty)/(tabs)/home");
    } else {
      router.replace("/(student)/(tabs)/home");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <Image source={require("@/assets/icon.png")} style={styles.logo} />
        <Text style={styles.brand}>ECP Laboratory</Text>
        <Text style={styles.subtitle}>Engineering Laboratory</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Login Account</Text>
        <Text style={styles.label}>ID Number</Text>
        <View style={styles.inputWrap}>
          <Text style={styles.inputIcon}>🎓</Text>
          <TextInput style={styles.input} placeholder="Enter your school ID" value={studentNumber} onChangeText={setStudentNumber} autoCapitalize="none" />
        </View>
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrap}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput style={styles.input} placeholder="Enter your password" value={password} onChangeText={setPassword} secureTextEntry />
        </View>
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login Account</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    height: 330, backgroundColor: "#1A2980",
    justifyContent: "center", alignItems: "center", paddingTop: 40,
  },
  logo: { width: 80, height: 80, borderRadius: 16 },
  brand: { fontSize: 28, fontWeight: "bold", color: "#fff", marginTop: 12 },
  subtitle: { fontSize: 12, color: "rgba(255,255,255,0.9)", marginTop: 4 },
  card: {
    flex: 1, backgroundColor: "#fff", marginTop: -30,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1,
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#2D3748", textAlign: "center", marginBottom: 24 },
  label: { fontSize: 13, color: "#2D3748", marginBottom: 6, marginTop: 12 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#F5F7FA", borderRadius: 8, borderWidth: 1, borderColor: "#E0E5EC" },
  inputIcon: { fontSize: 18, paddingHorizontal: 12 },
  input: { flex: 1, height: 52, fontSize: 15, color: "#2D3748" },
  button: { backgroundColor: "#2196F3", height: 52, borderRadius: 8, justifyContent: "center", alignItems: "center", marginTop: 24 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
});
