import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
  Platform,
} from "react-native";
let ImagePicker: any = null;
if (Platform.OS !== "web") {
  ImagePicker = require("expo-image-picker");
}
import { supabase } from "@/lib/supabase";
import { changePassword, uploadAvatar, deleteMyAccount } from "@/lib/profile";
import { useRouter } from "expo-router";
import { COLORS } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    course: "",
    section: "",
  });
  const [pwModal, setPwModal] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(p);
      setForm({
        firstname: p?.firstname || "",
        lastname: p?.lastname || "",
        email: p?.email || "",
        course: p?.course || "",
        section: p?.section || "",
      });
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
      const { error: authError } = await supabase.auth.updateUser({
        email: form.email,
      });
      if (authError) {
        Alert.alert(
          "Partial Update",
          `Profile saved, but email change requires confirmation: ${authError.message}`
        );
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
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        setUploading(true);
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result as string;
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            setUploading(false);
            return;
          }
          const ext = file.type.includes("png") ? "png" : "jpg";
          const path = `${user.id}/avatar.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(path, file, { upsert: true, cacheControl: "3600" });
          if (uploadError) {
            setUploading(false);
            Alert.alert("Error", "Failed to upload profile picture.");
            return;
          }
          const { data: publicUrl } = supabase.storage
            .from("avatars")
            .getPublicUrl(path);
          if (publicUrl?.publicUrl) {
            await supabase
              .from("users")
              .update({ profile_picture_url: publicUrl.publicUrl })
              .eq("id", user.id);
            setProfile((p: any) => ({
              ...p,
              profile_picture_url: publicUrl.publicUrl,
            }));
          }
          setUploading(false);
          Alert.alert("Success", "Profile picture updated.");
        };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Allow photo library access to upload a profile picture."
      );
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
    const url = await uploadAvatar(
      result.assets[0].uri,
      result.assets[0].mimeType
    );
    setUploading(false);
    if (url) {
      setProfile((p: any) => ({ ...p, profile_picture_url: url }));
      Alert.alert("Success", "Profile picture updated.");
    } else {
      Alert.alert("Error", "Failed to upload profile picture.");
    }
  };

  const handleDeleteAccount = () => {
    showConfirm(
      "Delete Account",
      "This will permanently delete your account and all your borrow records. This cannot be undone. Continue?",
      true,
      async () => {
        const err = await deleteMyAccount();
        if (err) {
          showConfirm("Error", err, false, () => {});
        } else {
          router.replace("/(auth)/login");
        }
      },
    );
  };

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{ title: string; message: string; destructive?: boolean; onConfirm: () => void }>({ title: "", message: "", onConfirm: () => {} });

  const showConfirm = (title: string, message: string, destructive: boolean, onConfirm: () => void) => {
    setConfirmConfig({ title, message, destructive, onConfirm });
    setConfirmVisible(true);
  };

  const handleLogout = () => {
    showConfirm("Logout", "Are you sure you want to log out?", true, async () => {
      await supabase.auth.signOut();
      router.replace("/(auth)/login");
    });
  };

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color={COLORS.navy}
        style={{ flex: 1, backgroundColor: COLORS.background }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePickAvatar} disabled={uploading}>
          {profile?.profile_picture_url ? (
            <Image
              source={{ uri: profile.profile_picture_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.firstname?.charAt(0) || "S"}
              </Text>
            </View>
          )}
          <View style={styles.cameraOverlay}>
            <Ionicons name="camera-outline" size={12} color={COLORS.navy} />
          </View>
          {uploading && (
            <ActivityIndicator style={styles.avatarSpinner} color={COLORS.card} />
          )}
        </TouchableOpacity>
        <Text style={styles.name}>
          {profile?.firstname} {profile?.lastname}
        </Text>
        <Text style={styles.email}>{profile?.email}</Text>
        <TouchableOpacity style={styles.editBtn} onPress={openModal}>
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
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
            <Text style={styles.label}>Section</Text>
            <Text style={styles.value}>{profile?.section || "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text
              style={[
                styles.value,
                {
                  color:
                    profile?.status === "active" ? COLORS.success : COLORS.destructive,
                },
              ]}
            >
              {profile?.status || "—"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setPwModal(true)}
        >
          <Ionicons name="lock-closed-outline" size={16} color={COLORS.navy} style={{ marginRight: 8 }} />
          <Text style={styles.actionBtnText}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.destructive} style={{ marginRight: 8 }} />
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={16} color={COLORS.card} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.input}
              value={form.firstname}
              onChangeText={(t) => setForm({ ...form, firstname: t })}
              placeholder="First Name"
              placeholderTextColor={COLORS.silver}
            />

            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={form.lastname}
              onChangeText={(t) => setForm({ ...form, lastname: t })}
              placeholder="Last Name"
              placeholderTextColor={COLORS.silver}
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(t) => setForm({ ...form, email: t })}
              placeholder="Email"
              placeholderTextColor={COLORS.silver}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Course</Text>
            <TextInput
              style={styles.input}
              value={form.course}
              onChangeText={(t) => setForm({ ...form, course: t })}
              placeholder="Course"
              placeholderTextColor={COLORS.silver}
            />

            <Text style={styles.inputLabel}>Section</Text>
            <TextInput
              style={styles.input}
              value={form.section}
              onChangeText={(t) => setForm({ ...form, section: t })}
              placeholder="Section"
              placeholderTextColor={COLORS.silver}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? "Saving..." : "Save"}
                </Text>
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
            <TextInput
              style={styles.input}
              value={pwForm.current}
              onChangeText={(t) => setPwForm({ ...pwForm, current: t })}
              placeholder="Current password"
              placeholderTextColor={COLORS.silver}
              secureTextEntry
            />

            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              value={pwForm.next}
              onChangeText={(t) => setPwForm({ ...pwForm, next: t })}
              placeholder="At least 6 characters"
              placeholderTextColor={COLORS.silver}
              secureTextEntry
            />

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={pwForm.confirm}
              onChangeText={(t) => setPwForm({ ...pwForm, confirm: t })}
              placeholder="Repeat new password"
              placeholderTextColor={COLORS.silver}
              secureTextEntry
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPwModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleChangePassword}
                disabled={pwSaving}
              >
                <Text style={styles.saveBtnText}>
                  {pwSaving ? "Saving..." : "Change Password"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>{confirmConfig.title}</Text>
            <Text style={styles.confirmMsg}>{confirmConfig.message}</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancel}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmOk, confirmConfig.destructive && styles.confirmDestructive]}
                onPress={() => {
                  setConfirmVisible(false);
                  confirmConfig.onConfirm();
                }}
              >
                <Text style={styles.confirmOkText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.navy,
    paddingTop: 50,
    paddingBottom: 24,
    alignItems: "center",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.teal,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarText: { color: COLORS.card, fontSize: 36, fontWeight: "bold" },
  avatarSpinner: { position: "absolute", top: 33, left: 33 },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: -4,
    backgroundColor: COLORS.card,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  name: { color: COLORS.card, fontSize: 18, fontWeight: "bold", marginTop: 10 },
  email: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 },
  editBtn: {
    marginTop: 14,
    backgroundColor: COLORS.teal,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editBtnText: { color: COLORS.card, fontSize: 13, fontWeight: "600" },
  card: {
    backgroundColor: COLORS.card,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    marginTop: -10,
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.teal,
    marginBottom: 12,
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  label: { fontSize: 13, color: COLORS.silver },
  value: { fontSize: 14, fontWeight: "700", color: COLORS.navy },
  divider: { height: 1, backgroundColor: COLORS.border },
  actionBtn: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 8,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 1,
  },
  actionBtnText: { fontSize: 15, fontWeight: "600", color: COLORS.navy },
  deleteBtn: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 8,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.destructive,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: { color: COLORS.destructive, fontSize: 15, fontWeight: "600" },
  logoutBtn: {
    backgroundColor: COLORS.destructive,
    margin: 16,
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: { color: COLORS.card, fontSize: 15, fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.card,
    width: "90%",
    borderRadius: 16,
    padding: 24,
    maxHeight: "85%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.navy,
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.slate,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.navy,
    backgroundColor: COLORS.background,
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.border,
  },
  cancelBtnText: { color: COLORS.slate, fontSize: 15, fontWeight: "600" },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.teal,
  },
  saveBtnText: { color: COLORS.card, fontSize: 15, fontWeight: "600" },
  confirmBox: {
    backgroundColor: COLORS.card,
    width: "85%",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  confirmTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.navy, marginBottom: 8 },
  confirmMsg: { fontSize: 14, color: COLORS.slate, textAlign: "center", marginBottom: 20, lineHeight: 20 },
  confirmActions: { flexDirection: "row", gap: 12, width: "100%" },
  confirmCancel: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.border,
  },
  confirmCancelText: { color: COLORS.slate, fontSize: 14, fontWeight: "600" },
  confirmOk: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.teal,
  },
  confirmDestructive: { backgroundColor: COLORS.destructive },
  confirmOkText: { color: COLORS.card, fontSize: 14, fontWeight: "600" },
});
