import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Animated,
  TouchableOpacity,
  Platform,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { COLORS } from "@/lib/theme";
import { statusColor, statusLabel } from "@/lib/status";
import { Ionicons } from "@expo/vector-icons";

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

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [dept, setDept] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ active: 0, pending: 0, returned: 0, total: 0 });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [recentNotifs, setRecentNotifs] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("users")
      .select("firstname, full_name, department")
      .eq("id", user.id)
      .single();
    setUserName(profile?.firstname || profile?.full_name?.split(" ")[0] || "Student");
    setDept(profile?.department || "");

    const { data: borrows } = await supabase
      .from("borrow_requests")
      .select("status")
      .eq("user_id", user.id);

    if (borrows) {
      setStats({
        total: borrows.length,
        active: borrows.filter((b) => b.status === "borrowed" || b.status === "approved" || b.status === "return_requested").length,
        pending: borrows.filter((b) => b.status === "pending").length,
        returned: borrows.filter((b) => b.status === "returned").length,
      });
    }

    const { data: recent } = await supabase
      .from("borrow_requests")
      .select("id, status, created_at, borrow_items(quantity, equipment:equipment_id(name))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);
    setRecentRequests(recent || []);

    const { data: notifs } = await supabase
      .from("notifications")
      .select("id, title, message, type, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);
    setRecentNotifs(notifs || []);

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <SkeletonBlock style={{ width: 140, height: 18, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 4 }} />
          <SkeletonBlock style={{ width: 100, height: 26, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 4, marginTop: 10 }} />
        </View>
        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[1, 2, 3].map((i) => <SkeletonBlock key={i} style={{ flex: 1, height: 90, borderRadius: 14 }} />)}
          </View>
          <SkeletonBlock style={{ height: 120, borderRadius: 14, marginTop: 16 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.navy]} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>ECP Laboratory</Text>
            <Text style={styles.school}>STI College Cotabato</Text>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: COLORS.tealLight }]}>
            <Ionicons name="clipboard-outline" size={20} color={COLORS.teal} />
            <Text style={[styles.statNum, { color: COLORS.teal }]}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.tealLight }]}>
            <Ionicons name="hourglass-outline" size={20} color={COLORS.warning} />
            <Text style={[styles.statNum, { color: COLORS.warning }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.tealLight }]}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={[styles.statNum, { color: COLORS.success }]}>{stats.returned}</Text>
            <Text style={styles.statLabel}>Returned</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.tealLight }]}
            onPress={() => router.push("/(student)/borrow")}
          >
            <Ionicons name="flask-outline" size={22} color={COLORS.teal} />
            <Text style={[styles.actionLabel, { color: COLORS.teal }]}>Borrow</Text>
            <Text style={styles.actionSub}>Equipment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.tealLight }]}
            onPress={() => router.push("/(student)/return")}
          >
            <Ionicons name="cube-outline" size={22} color={COLORS.success} />
            <Text style={[styles.actionLabel, { color: COLORS.success }]}>Return</Text>
            <Text style={styles.actionSub}>Equipment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.tealLight }]}
            onPress={() => router.push("/(student)/(tabs)/requests")}
          >
            <Ionicons name="clipboard-outline" size={22} color={COLORS.info} />
            <Text style={[styles.actionLabel, { color: COLORS.info }]}>My</Text>
            <Text style={styles.actionSub}>Requests</Text>
          </TouchableOpacity>
        </View>

        {recentRequests.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Requests</Text>
              <TouchableOpacity onPress={() => router.push("/(student)/(tabs)/requests")}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {recentRequests.map((req: any) => (
              <TouchableOpacity
                key={req.id}
                style={styles.requestCard}
                onPress={() => router.push(`/(student)/request/${req.id}`)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.requestName} numberOfLines={1}>
                    {req.borrow_items?.[0]?.equipment?.name || "Equipment request"}
                  </Text>
                  <Text style={styles.requestDate}>
                    {new Date(req.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusColor(req.status) + "18" }]}>
                  <Text style={[styles.statusText, { color: statusColor(req.status) }]}>
                    {statusLabel(req.status)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {recentNotifs.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => router.push("/(student)/(tabs)/notifications")}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {recentNotifs.map((n: any) => (
              <View key={n.id} style={[styles.notifCard, !n.is_read && styles.notifUnread]}>
                <View style={[styles.notifDot, { backgroundColor: n.is_read ? "transparent" : COLORS.teal }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle} numberOfLines={1}>{n.title}</Text>
                  <Text style={styles.notifMsg} numberOfLines={1}>{n.message}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.navy,
    padding: 20,
    paddingTop: 50,
    paddingBottom: 60,
  },
  brand: { color: COLORS.card, fontSize: 22, fontWeight: "bold" },
  school: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 },
  greeting: { color: "rgba(255,255,255,0.85)", fontSize: 14, marginTop: 16 },
  userName: { color: COLORS.card, fontSize: 26, fontWeight: "bold" },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginTop: -30,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  statNum: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 11, color: COLORS.slate, marginTop: 2 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: COLORS.navy },
  seeAll: { fontSize: 13, color: COLORS.teal, fontWeight: "600" },
  actionsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    elevation: 1,
  },
  actionLabel: { fontSize: 13, fontWeight: "bold" },
  actionSub: { fontSize: 11, color: COLORS.silver, marginTop: 1 },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  requestName: { fontSize: 14, fontWeight: "bold", color: COLORS.navy },
  requestDate: { fontSize: 12, color: COLORS.silver, marginTop: 3 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "bold", textTransform: "capitalize" },
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginBottom: 6,
    padding: 12,
    borderRadius: 10,
    elevation: 1,
  },
  notifUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.teal },
  notifDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  notifTitle: { fontSize: 13, fontWeight: "600", color: COLORS.navy },
  notifMsg: { fontSize: 12, color: COLORS.silver, marginTop: 2 },
});
