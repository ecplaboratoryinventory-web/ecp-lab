import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { supabase } from "@/lib/supabase";

export default function DamageReportsScreen() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("damage_reports")
      .select("*, equipment:equipment_id(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setReports(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchReports(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  }, []);

  const severityColors: Record<string, string> = {
    minor: "#F59E0B",
    major: "#F97316",
    critical: "#EF4444",
  };

  const statusColors: Record<string, string> = {
    pending: "#F39C12",
    resolved: "#2ECC71",
    dismissed: "#95A5A6",
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Damage Reports</Text>
        <Text style={styles.subtitle}>Equipment damage submitted by you</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#1A2980" style={{ marginTop: 40 }} />
      ) : reports.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 56 }}>✅</Text>
          <Text style={styles.emptyTitle}>No damage reports</Text>
          <Text style={styles.emptySub}>All equipment is in good condition!</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          contentContainerStyle={{ padding: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1A2980"]} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.equipmentName}>{item.equipment?.name || "Unknown Equipment"}</Text>
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.date}>📅 {new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 6 }}>
                <View style={[styles.badge, { backgroundColor: severityColors[item.severity] + "20" }]}>
                  <Text style={[styles.badgeText, { color: severityColors[item.severity] || "#666" }]}>{item.severity}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: statusColors[item.status] + "20" }]}>
                  <Text style={[styles.badgeText, { color: statusColors[item.status] || "#666" }]}>{item.status}</Text>
                </View>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FB" },
  header: { backgroundColor: "#1A2980", padding: 20, paddingTop: 50, elevation: 4 },
  title: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "bold", color: "#1A1A2E", marginTop: 12 },
  emptySub: { fontSize: 13, color: "#8A8FA8", marginTop: 4 },
  card: {
    backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 8, elevation: 2,
    flexDirection: "row", alignItems: "flex-start",
  },
  equipmentName: { fontSize: 15, fontWeight: "bold", color: "#2C3E50" },
  description: { fontSize: 13, color: "#7F8C8D", marginTop: 4, lineHeight: 18 },
  date: { fontSize: 12, color: "#7F8C8D", marginTop: 6 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: "bold", textTransform: "uppercase" },
});
