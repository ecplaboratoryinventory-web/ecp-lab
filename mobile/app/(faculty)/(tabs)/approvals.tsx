import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";

export default function FacultyApprovalsScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      let query = supabase.from("borrow_requests").select("*, users!borrow_requests_user_id_fkey(full_name, id_no), borrow_items(*, equipment:equipment_id(name))").eq("request_type", "student").order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter);
      const { data } = await query;
      setRequests(data || []);
      setLoading(false);
    };
    fetch();
  }, [filter]);

  const handleAction = async (id: string, action: "approved" | "denied") => {
    setActing(id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (action === "approved") {
      await supabase.from("borrow_requests").update({ status: "approved", approved_by: user.id, approved_at: new Date().toISOString() }).eq("id", id);
    } else {
      Alert.prompt("Denial Reason", "Enter reason:", async (reason) => {
        await supabase.from("borrow_requests").update({ status: "denied", denied_reason: reason || "No reason given" }).eq("id", id);
        setRequests((prev) => prev.filter((r) => r.id !== id));
      });
    }
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: action } : r)));
    setActing(null);
  };

  const filters = ["pending", "approved", "denied", "all"];

  if (loading) return <ActivityIndicator size="large" color="#1A2980" style={{ flex: 1 }} />;

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
                <TouchableOpacity style={styles.approveBtn} onPress={() => handleAction(item.id, "approved")} disabled={acting === item.id}>
                  {acting === item.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.approveText}>✓</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.denyBtn} onPress={() => handleAction(item.id, "denied")} disabled={acting === item.id}>
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
});
