import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

export default function FacultyProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
      setProfile(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => { await supabase.auth.signOut(); router.replace("/(auth)/login"); } },
    ]);
  };

  if (loading) return <ActivityIndicator size="large" color="#1A2980" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile?.full_name?.charAt(0) || "F"}</Text>
          </View>
          <Text style={styles.name}>{profile?.full_name}</Text>
          <Text style={styles.role}>{profile?.department} Faculty</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeader}>ACCOUNT INFORMATION</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{profile?.email || "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>ID Number</Text>
            <Text style={[styles.value, { fontFamily: "monospace" }]}>{profile?.id_no || "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Department</Text>
            <Text style={styles.value}>{profile?.department || "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, { color: profile?.status === "active" ? "#4CAF50" : "#F44336" }]}>{profile?.status || "—"}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4FF" },
  header: { backgroundColor: "#1A2980", paddingTop: 50, paddingBottom: 24, alignItems: "center" },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#2196F3", justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: "#fff" },
  avatarText: { color: "#fff", fontSize: 36, fontWeight: "bold" },
  name: { color: "#fff", fontSize: 18, fontWeight: "bold", marginTop: 10 },
  role: { color: "#D0E8FF", fontSize: 13, marginTop: 2 },
  card: { backgroundColor: "#fff", margin: 16, borderRadius: 16, padding: 20, elevation: 4, marginTop: -10 },
  cardHeader: { fontSize: 11, fontWeight: "bold", color: "#1A2980", marginBottom: 12, letterSpacing: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  label: { fontSize: 11, color: "#9E9E9E" },
  value: { fontSize: 14, fontWeight: "bold", color: "#222" },
  divider: { height: 1, backgroundColor: "#F0F0F0" },
  logoutBtn: { backgroundColor: "#F44336", margin: 16, height: 52, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  logoutText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
});
