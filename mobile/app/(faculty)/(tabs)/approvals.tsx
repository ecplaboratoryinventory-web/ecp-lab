import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Modal,
  TextInput,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/lib/theme";
import { statusColor, statusLabel } from "@/lib/status";

function SkeletonBlock({ style }: { style: any }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: false }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);
  return <Animated.View style={[{ backgroundColor: COLORS.border, borderRadius: 8 }, style, { opacity }]} />;
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
    let query = supabase
      .from("borrow_requests")
      .select("*, users!borrow_requests_user_id_fkey(full_name, id_no), borrow_items(*, equipment:equipment_id(name))")
      .eq("request_type", "student")
      .order("created_at", { ascending: false });
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
    await supabase
      .from("borrow_requests")
      .update({ status: "approved", approved_by: user.id, approved_at: new Date().toISOString() })
      .eq("id", id);

    if (req) {
      const equipmentName = req.borrow_items?.[0]?.equipment?.name || "equipment";
      const totalQty = req.borrow_items?.reduce((sum: number, bi: any) => sum + bi.quantity, 0) || 0;
      const studentName = req.users?.full_name || "Student";
      await supabase.rpc("create_borrow_notification", {
        p_user_id: req.user_id,
        p_title: "Borrow Request Approved",
        p_message: `Your request to borrow ${totalQty} ${equipmentName} has been approved.`,
        p_reference_id: id,
      });
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
    await supabase.rpc("create_borrow_notification", {
      p_user_id: denyTarget.user_id,
      p_title: "Borrow Request Rejected",
      p_message: `Your request to borrow ${totalQty} ${equipmentName} has been rejected.`,
      p_reference_id: denyTarget.id,
    });
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <SkeletonBlock style={{ width: 180, height: 24, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 4 }} />
        </View>
        <View style={styles.filterRow}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} style={{ width: 72, height: 32, borderRadius: 20 }} />
          ))}
        </View>
        <FlatList
          data={[1, 2, 3, 4, 5]}
          contentContainerStyle={{ padding: 12 }}
          renderItem={() => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <SkeletonBlock style={{ width: 40, height: 40, borderRadius: 20 }} />
              </View>
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
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Student Approvals</Text>
      </View>

      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={requests}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.navy]} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.studentAvatar}>
                <Text style={styles.studentAvatarText}>
                  {(item.users?.full_name || "S").charAt(0)}
                </Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.studentName}>{item.users?.full_name || "Unknown"}</Text>
              <Text style={styles.studentId}>{item.users?.id_no || ""}</Text>
              <Text style={styles.items} numberOfLines={2}>
                {item.borrow_items?.map((bi: any) => `${bi.equipment?.name} (x${bi.quantity})`).join(", ")}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.date}>{formatDate(item.created_at)}</Text>
                {item.purpose ? <Text style={styles.purpose} numberOfLines={1}>{item.purpose}</Text> : null}
              </View>
            </View>
            {item.status === "pending" && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => handleApprove(item.id)}
                  disabled={acting === item.id}
                >
                  {acting === item.id ? (
                    <ActivityIndicator size="small" color={COLORS.card} />
                  ) : (
                    <Ionicons name="checkmark" size={20} color={COLORS.card} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.denyBtn}
                  onPress={() => openDeny(item)}
                  disabled={acting === item.id}
                >
                  <Ionicons name="close" size={20} color={COLORS.card} />
                </TouchableOpacity>
              </View>
            )}
            {item.status !== "pending" && (
              <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + "18" }]}>
                <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
                  {statusLabel(item.status)}
                </Text>
              </View>
            )}
          </View>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="clipboard-outline" size={40} color={COLORS.silver} />
            <Text style={styles.emptyText}>No {filter} requests</Text>
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
              placeholderTextColor={COLORS.silver}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setDenyTarget(null); setDenyReason(""); }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.denyConfirmBtn}
                onPress={confirmDeny}
                disabled={acting === denyTarget?.id}
              >
                {acting === denyTarget?.id ? (
                  <ActivityIndicator size="small" color={COLORS.card} />
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
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.navy, padding: 20, paddingTop: 50 },
  title: { color: COLORS.card, fontSize: 22, fontWeight: "bold" },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.card,
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  filterChipActive: { backgroundColor: COLORS.tealLight },
  filterText: { fontSize: 12, fontWeight: "600", color: COLORS.slate },
  filterTextActive: { color: COLORS.teal },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    elevation: 2,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  cardLeft: { marginTop: 2 },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.tealLight,
    justifyContent: "center",
    alignItems: "center",
  },
  studentAvatarText: { fontSize: 16, fontWeight: "bold", color: COLORS.navy },
  cardBody: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: "bold", color: COLORS.navy },
  studentId: { fontSize: 12, color: COLORS.silver, fontFamily: "monospace", marginTop: 1 },
  items: { fontSize: 13, color: COLORS.slate, marginTop: 4 },
  cardFooter: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 8 },
  date: { fontSize: 11, color: COLORS.silver },
  purpose: { fontSize: 11, color: COLORS.silver, flex: 1, fontStyle: "italic" },
  actions: { gap: 6, marginTop: 2 },
  approveBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.success,
    justifyContent: "center",
    alignItems: "center",
  },
  denyBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.destructive,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 2,
  },
  statusText: { fontSize: 11, fontWeight: "bold", textTransform: "capitalize" },
  empty: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 14, color: COLORS.silver, marginTop: 8, fontWeight: "500" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: { backgroundColor: COLORS.card, width: "90%", borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.navy, marginBottom: 6, textAlign: "center" },
  modalSubtitle: { fontSize: 13, color: COLORS.slate, textAlign: "center", marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: COLORS.slate, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.navy,
    backgroundColor: COLORS.background,
    minHeight: 90,
    textAlignVertical: "top",
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
  denyConfirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.destructive,
  },
  denyConfirmText: { color: COLORS.card, fontSize: 15, fontWeight: "600" },
});
