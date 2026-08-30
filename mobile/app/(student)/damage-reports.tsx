import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";

export default function DamageReportsScreen() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("damage_reports")
      .select("*, equipment:equipment_id(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setReports(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReports();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  }, []);

  const severityColors: Record<string, string> = {
    minor: COLORS.warning,
    major: COLORS.info,
    critical: COLORS.destructive,
  };

  const statusColors: Record<string, string> = {
    pending: COLORS.warning,
    resolved: COLORS.success,
    dismissed: COLORS.silver,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Damage Reports</Text>
        <Text style={styles.subtitle}>Equipment damage submitted by you</Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.card, { backgroundColor: COLORS.card }]}>
              <View style={{ flex: 1 }}>
                <View style={[styles.skeletonLine, { width: "60%" }]} />
                <View style={[styles.skeletonLine, { width: "90%", marginTop: 8 }]} />
                <View style={[styles.skeletonLine, { width: "40%", marginTop: 6 }]} />
              </View>
            </View>
          ))}
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="checkmark-circle" size={56} color={COLORS.success} />
          <Text style={styles.emptyTitle}>No damage reports</Text>
          <Text style={styles.emptySub}>
            All equipment is in good condition!
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          contentContainerStyle={{ padding: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.navy]}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.equipmentName}>
                  {item.equipment?.name || "Unknown Equipment"}
                </Text>
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={12} color={COLORS.silver} />
                  <Text style={styles.date}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end", gap: 6 }}>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        (severityColors[item.severity] || COLORS.silver) + "18",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: severityColors[item.severity] || COLORS.silver },
                    ]}
                  >
                    {item.severity}
                  </Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        (statusColors[item.status] || COLORS.silver) + "18",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: statusColors[item.status] || COLORS.silver },
                    ]}
                  >
                    {item.status}
                  </Text>
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
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.navy,
    padding: 20,
    paddingTop: 50,
    elevation: 4,
  },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.card },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  loadingContainer: { padding: 12 },
  skeletonLine: {
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: 4,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.navy,
    marginTop: 12,
  },
  emptySub: { fontSize: 13, color: COLORS.silver, marginTop: 4 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  equipmentName: { fontSize: 15, fontWeight: "bold", color: COLORS.navy },
  description: {
    fontSize: 13,
    color: COLORS.slate,
    marginTop: 4,
    lineHeight: 18,
  },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  date: { fontSize: 12, color: COLORS.silver },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});
