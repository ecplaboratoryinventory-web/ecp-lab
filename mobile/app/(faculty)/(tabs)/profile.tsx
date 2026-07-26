import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput } from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

export default function FacultyProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, returned: 0 });
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstname: "", lastname: "", email: "", department: "" });

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
      setProfile(data);
      setForm({
        firstname: data?.firstname || "",
        lastname: data?.lastname || "",
        email: data?.email || "",
        department: data?.department || "",
      });
      const { data: borrows } = await supabase.from("borrow_requests").select("status").eq("user_id", user.id);
      if (borrows) {
        setStats({
          total: borrows.length,
          active: borrows.filter((b) => b.status === "borrowed" || b.status === "approved").length,
          returned: borrows.filter((b) => b.status === "returned").length,
        });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const openModal = () => {
    setForm({
      firstname: profile?.firstname || "",
      lastname: profile?.lastname || "",
      email: profile?.email || "",
      department: profile?.department || "",
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const fullName = `${form.firstname} ${form.lastname}`.trim();
    const { error } = await supabase
      .from("users")
      .update({
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email,
        department: form.department,
        full_name: fullName,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setProfile({ ...profile, ...form, full_name: fullName });
      setModalVisible(false);
      Alert.alert("Success", "Profile updated successfully.");
    }
  };

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
          <TouchableOpacity style={styles.editBtn} onPress={openModal}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
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

        <View style={styles.card}>
          <Text style={styles.cardHeader}>BORROW SUMMARY</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[
              { label: "Total Borrowed", value: stats.total, bg: "#E3F2FD", color: "#2196F3" },
              { label: "Active", value: stats.active, bg: "#E8F5E9", color: "#4CAF50" },
              { label: "Returned", value: stats.returned, bg: "#FFF3E0", color: "#FF9800" },
            ].map((s) => (
              <View key={s.label} style={[styles.statBox, { backgroundColor: s.bg }]}>
                <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput style={styles.input} value={form.firstname} onChangeText={(t) => setForm({ ...form, firstname: t })} placeholder="First Name" placeholderTextColor="#999" />

            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput style={styles.input} value={form.lastname} onChangeText={(t) => setForm({ ...form, lastname: t })} placeholder="Last Name" placeholderTextColor="#999" />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput style={styles.input} value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} placeholder="Email" placeholderTextColor="#999" keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.inputLabel}>Department</Text>
            <TextInput style={styles.input} value={form.department} onChangeText={(t) => setForm({ ...form, department: t })} placeholder="Department" placeholderTextColor="#999" />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  editBtn: { marginTop: 14, backgroundColor: "#0ea5a0", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  editBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  card: { backgroundColor: "#fff", margin: 16, borderRadius: 16, padding: 20, elevation: 4, marginTop: -10 },
  cardHeader: { fontSize: 11, fontWeight: "bold", color: "#1A2980", marginBottom: 12, letterSpacing: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  label: { fontSize: 11, color: "#9E9E9E" },
  value: { fontSize: 14, fontWeight: "bold", color: "#222" },
  divider: { height: 1, backgroundColor: "#F0F0F0" },
  statBox: { flex: 1, padding: 14, borderRadius: 8, alignItems: "center" },
  statNum: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 11, color: "#555", marginTop: 2, textAlign: "center" },
  logoutBtn: { backgroundColor: "#F44336", margin: 16, height: 52, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  logoutText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", width: "90%", borderRadius: 16, padding: 24, maxHeight: "85%" },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#1A2980", marginBottom: 20, textAlign: "center" },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: "#D0D0D0", borderRadius: 10, padding: 12, fontSize: 15, color: "#222", backgroundColor: "#F9F9F9" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center", backgroundColor: "#E0E0E0" },
  cancelBtnText: { color: "#555", fontSize: 15, fontWeight: "600" },
  saveBtn: { flex: 1, height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center", backgroundColor: "#0ea5a0" },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
