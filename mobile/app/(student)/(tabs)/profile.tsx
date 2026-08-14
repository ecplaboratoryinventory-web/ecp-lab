import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { changePassword, uploadAvatar, deleteMyAccount } from "@/lib/profile";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, returned: 0 });
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstname: "", lastname: "", email: "", course: "", section: "" });
  const [pwModal, setPwModal] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("users").select("*").eq("id", user.id).single();
      setProfile(p);
      setForm({
        firstname: p?.firstname || "",
        lastname: p?.lastname || "",
        email: p?.email || "",
        course: p?.course || "",
        section: p?.section || "",
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
      course: profile?.course || "",
      section: profile?.section || "",
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
        course: form.course,
        section: form.section,
        full_name: fullName,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    if (form.email && form.email !== user.email) {
      const { error: authError } = await supabase.auth.updateUser({ email: form.email });
      if (authError) {
        Alert.alert("Partial Update", `Profile saved, but email change requires confirmation: ${authError.message}`);
        setProfile({ ...profile, ...form, full_name: fullName });
        setModalVisible(false);
        return;
      }
    }
    setProfile({ ...profile, ...form, full_name: fullName });
    setModalVisible(false);
    Alert.alert("Success", "Profile updated successfully.");
  };

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.next) {
      Alert.alert("Error", "Please fill in all password fields.");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }
    setPwSaving(true);
    const err = await changePassword(pwForm.current, pwForm.next);
    setPwSaving(false);
    if (err) {
      Alert.alert("Error", err);
    } else {
      Alert.alert("Success", "Password changed successfully.");
      setPwForm({ current: "", next: "", confirm: "" });
      setPwModal(false);
    }
  };

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Allow photo library access to upload a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    const url = await uploadAvatar(result.assets[0].uri, result.assets[0].mimeType);
    setUploading(false);
    if (url) {
      setProfile((p: any) => ({ ...p, profile_picture_url: url }));
      Alert.alert("Success", "Profile picture updated.");
    } else {
      Alert.alert("Error", "Failed to upload profile picture.");
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your borrow records. This cannot be undone. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: async () => {
            const err = await deleteMyAccount();
            if (err) {
              Alert.alert("Error", err);
            } else {
              router.replace("/(auth)/login");
            }
          },
        },
      ],
    );
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePickAvatar} disabled={uploading}>
          {profile?.profile_picture_url ? (
            <Image source={{ uri: profile.profile_picture_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile?.firstname?.charAt(0) || "S"}</Text>
            </View>
          )}
          {uploading && (
            <ActivityIndicator style={styles.avatarSpinner} color="#fff" />
          )}
          <Text style={styles.changePhoto}>Change photo</Text>
        </TouchableOpacity>
        <Text style={styles.name}>{profile?.firstname} {profile?.lastname}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        <TouchableOpacity style={styles.editBtn} onPress={openModal}>
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>ACCOUNT INFORMATION</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Student ID</Text>
            <Text style={styles.value}>{profile?.id_no || "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{profile?.email || "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Course</Text>
            <Text style={styles.value}>{profile?.course || "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, { color: profile?.status === "active" ? "#4CAF50" : "#F44336" }]}>{profile?.status || "—"}</Text>
          </View>
        </View>

        {/* Stats */}
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

        <TouchableOpacity style={styles.actionBtn} onPress={() => setPwModal(true)}>
          <Text style={styles.actionBtnText}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
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

            <Text style={styles.inputLabel}>Course</Text>
            <TextInput style={styles.input} value={form.course} onChangeText={(t) => setForm({ ...form, course: t })} placeholder="Course" placeholderTextColor="#999" />

            <Text style={styles.inputLabel}>Section</Text>
            <TextInput style={styles.input} value={form.section} onChangeText={(t) => setForm({ ...form, section: t })} placeholder="Section" placeholderTextColor="#999" />

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

      <Modal visible={pwModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput style={styles.input} value={pwForm.current} onChangeText={(t) => setPwForm({ ...pwForm, current: t })} placeholder="Current password" placeholderTextColor="#999" secureTextEntry />

            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput style={styles.input} value={pwForm.next} onChangeText={(t) => setPwForm({ ...pwForm, next: t })} placeholder="At least 6 characters" placeholderTextColor="#999" secureTextEntry />

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput style={styles.input} value={pwForm.confirm} onChangeText={(t) => setPwForm({ ...pwForm, confirm: t })} placeholder="Repeat new password" placeholderTextColor="#999" secureTextEntry />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPwModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={pwSaving}>
                <Text style={styles.saveBtnText}>{pwSaving ? "Saving..." : "Change Password"}</Text>
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
  avatarSpinner: { position: "absolute", top: 33, left: 33 },
  changePhoto: { color: "#D0E8FF", fontSize: 12, marginTop: 6, textDecorationLine: "underline" },
  actionBtn: { backgroundColor: "#1A2980", marginHorizontal: 16, marginTop: 8, height: 52, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  actionBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  deleteBtn: { backgroundColor: "#fff", marginHorizontal: 16, marginTop: 8, height: 52, borderRadius: 14, borderWidth: 1, borderColor: "#F44336", justifyContent: "center", alignItems: "center" },
  deleteText: { color: "#F44336", fontSize: 15, fontWeight: "bold" },
  name: { color: "#fff", fontSize: 18, fontWeight: "bold", marginTop: 10 },
  email: { color: "#D0E8FF", fontSize: 13, marginTop: 2 },
  editBtn: { marginTop: 14, backgroundColor: "#0ea5a0", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  editBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  card: { backgroundColor: "#fff", margin: 16, borderRadius: 16, padding: 20, elevation: 4, marginTop: -10 },
  cardHeader: { fontSize: 11, fontWeight: "bold", color: "#2196F3", marginBottom: 12, letterSpacing: 1 },
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
