import { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Animated, Modal, TextInput } from "react-native";
import { supabase } from "@/lib/supabase";

function SkeletonBlock({ style }: { style: any }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);
  return <Animated.View style={[{ backgroundColor: "#E8ECF0", borderRadius: 8 }, style, { opacity }]} />;
}

export default function FacultyApprovalsScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [denyTarget, setDenyTarget] = useState<any>(null);
  const [denyReason, setDenyReason] = useState("");

  const fetchData = async () => {
    let query = supabase.from("borrow_requests").select("*, users!borrow_requests_user_id_fkey(full_name, id_no), borrow_items(*, equipment:equipment_id(name))").eq("request_type", "student").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    setRequests(data || []);
  };

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [filter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleApprove = async (id: string) => {
    setActing(id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const req = requests.find((r) => r.id === id);
    await supabase.from("borrow_requests").update({ status: "approved", approved_by: user.id, approved_at: new Date().toISOString() }).eq("id", id);
    if (req) {
      const equipmentName = req.borrow_items?.[0]?.equipment?.name || "equipment";
      const totalQty = req.borrow_items?.reduce((sum: number, bi: any) => sum + bi.quantity, 0) || 0;
      const studentName = req.users?.full_name || "Student";
      // Notify student
      await supabase.rpc("create_borrow_notification", {
        p_user_id: req.user_id,
        p_title: "Borrow Request Approved",
        p_message: `Your request to borrow ${totalQty} ${equipmentName} has been approved.`,
        p_reference_id: id,
      });
      // Notify admin
      await supabase.rpc("notify_role_users" as never, {
        p_role: "admin",
        p_title: "Borrow Request Approved",
        p_message: `${studentName}'s request for ${totalQty} ${equipmentName} has been approved by Faculty.`,
        p_type: "borrow_status",
        p_reference_type: "borrow_request",
        p_reference_id: id,
      } as never);
    }
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)));
    setActing(null);
  };

  const openDeny = (req: any) => {
    setDenyTarget(req);
    setDenyReason("");
  };

  const confirmDeny = async () => {
    if (!denyTarget) return;
    setActing(denyTarget.id);
    const reason = denyReason.trim() || "No reason given";
    await supabase.from("borrow_requests").update({ status: "denied", denied_reason: reason }).eq("id", denyTarget.id);
    const equipmentName = denyTarget.borrow_items?.[0]?.equipment?.name || "equipment";
    const totalQty = denyTarget.borrow_items?.reduce((sum: number, bi: any) => sum + bi.quantity, 0) || 0;
    const studentName = denyTarget.users?.full_name || "Student";
    // Notify student
    await supabase.rpc("create_borrow_notification", {
      p_user_id: denyTarget.user_id,
      p_title: "Borrow Request Rejected",
      p_message: `Your request to borrow ${totalQty} ${equipmentName} has been rejected.`,
      p_reference_id: denyTarget.id,
    });
    // Notify admin
    await supabase.rpc("notify_role_users" as never, {
      p_role: "admin",
      p_title: "Borrow Request Rejected",
      p_message: `${studentName}'s request for ${totalQty} ${equipmentName} has been rejected by Faculty.`,
      p_type: "borrow_status",
      p_reference_type: "borrow_request",
      p_reference_id: denyTarget.id,
    } as never);
    setRequests((prev) => prev.filter((r) => r.id !== denyTarget.id));
    setDenyTarget(null);
    setDenyReason("");
    setActing(null);
  };

  const filters = ["pending", "approved", "denied", "all"];

  if (loading) return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SkeletonBlock style={{ width: 180, height: 24, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 4 }} />
      </View>
      <View style={[styles.filterRow, { backgroundColor: "#fff" }]}>
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} style={{ width: 72, height: 32, borderRadius: 20 }} />
        ))}
      </View>
      <FlatList
        data={[1, 2, 3, 4, 5]}
        contentContainerStyle={{ padding: 12 }}
        renderItem={() => (
          <View style={[styles.card, { backgroundColor: "#fff" }]}>
            <View style={{ flex: 1 }}>
              <SkeletonBlock style={{ height: 15, width: "60%", marginBottom: 8 }} />
              <SkeletonBlock style={{ height: 12, width: "40%", marginBottom: 6 }} />
              <SkeletonBlock style={{ height: 13, width: "80%", marginBottom: 4 }} />
              <SkeletonBlock style={{ height: 12, width: "55%" }} />
            </View>
          </View>
        )}
        keyExtractor={(_, i) => String(i)}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Student Approvals</Text>
      </View>

      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={requests}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#1A2980"]} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.studentName}>{item.users?.full_name || "Unknown"}</Text>
              <Text style={styles.studentId}>{item.users?.id_no || ""}</Text>
              <Text style={styles.items}>
                {item.borrow_items?.map((bi: any) => `${bi.equipment?.name} (x${bi.quantity})`).join(", ")}
              </Text>
              <Text style={styles.purpose}>{item.purpose}</Text>
            </View>
            {item.status === "pending" && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.id)} disabled={acting === item.id}>
                  {acting === item.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.approveText}>✓</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.denyBtn} onPress={() => openDeny(item)} disabled={acting === item.id}>
                  <Text style={styles.denyText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            {item.status !== "pending" && (
              <View style={[styles.statusBadge, { backgroundColor: item.status === "approved" ? "#4CAF50" : "#E74C3C" }]}>
                <Text style={{ color: "#fff", fontSize: 11, fontWeight: "bold" }}>{item.status}</Text>
              </View>
            )}
          </View>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ fontSize: 40 }}>📋</Text>
            <Text style={{ fontSize: 14, color: "#8A8FA8", marginTop: 8 }}>No {filter} requests</Text>
          </View>
        }
      />

      <Modal visible={!!denyTarget} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Deny Borrow Request</Text>
            <Text style={styles.modalSubtitle}>
              {denyTarget?.users?.full_name || "Student"}&apos;s request will be denied.
            </Text>

            <Text style={styles.inputLabel}>Reason</Text>
            <TextInput
              style={styles.input}
              value={denyReason}
              onChangeText={setDenyReason}
              placeholder="Enter reason (optional)"
              placeholderTextColor="#999"
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setDenyTarget(null); setDenyReason(""); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.denyConfirmBtn} onPress={confirmDeny} disabled={acting === denyTarget?.id}>
                {acting === denyTarget?.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.denyConfirmText}>Deny Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FB" },
  header: { backgroundColor: "#1A2980", padding: 20, paddingTop: 50 },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  filterRow: { flexDirection: "row", gap: 8, padding: 12, backgroundColor: "#fff", elevation: 2 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F0F0F0" },
  filterChipActive: { backgroundColor: "#1A2980" },
  filterText: { fontSize: 12, fontWeight: "bold", color: "#666" },
  filterTextActive: { color: "#fff" },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 8, elevation: 2,
    flexDirection: "row", alignItems: "center",
  },
  studentName: { fontSize: 15, fontWeight: "bold", color: "#2C3E50" },
  studentId: { fontSize: 12, color: "#95A5A6", fontFamily: "monospace" },
  items: { fontSize: 13, color: "#555", marginTop: 4 },
  purpose: { fontSize: 12, color: "#8A8FA8", marginTop: 2 },
  actions: { flexDirection: "row", gap: 8 },
  approveBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#4CAF50", justifyContent: "center", alignItems: "center" },
  approveText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  denyBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#E74C3C", justifyContent: "center", alignItems: "center" },
  denyText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", width: "90%", borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#1A2980", marginBottom: 6, textAlign: "center" },
  modalSubtitle: { fontSize: 13, color: "#666", textAlign: "center", marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#D0D0D0", borderRadius: 10, padding: 12, fontSize: 15, color: "#222", backgroundColor: "#F9F9F9", minHeight: 90, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center", backgroundColor: "#E0E0E0" },
  cancelBtnText: { color: "#555", fontSize: 15, fontWeight: "600" },
  denyConfirmBtn: { flex: 1, height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center", backgroundColor: "#E74C3C" },
  denyConfirmText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
