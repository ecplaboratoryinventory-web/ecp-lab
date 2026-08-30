import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/lib/theme";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type IconName = keyof typeof Ionicons.glyphMap;

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

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function FacultyHomeScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [activeBorrows, setActiveBorrows] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [todayClasses, setTodayClasses] = useState(0);
  const [nextClass, setNextClass] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("users")
      .select("full_name, department, firstname")
      .eq("id", user.id)
      .single();

    setName(profile?.firstname || profile?.full_name?.split(" ")[0] || "Faculty");
    setDept(profile?.department || "");

    const [{ count: active }, { count: pending }] = await Promise.all([
      supabase
        .from("borrow_requests")
        .select("*", { count: "exact", head: true })
        .in("status", ["approved", "borrowed"])
        .eq("user_id", user.id),
      supabase
        .from("borrow_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("request_type", "student"),
    ]);

    setActiveBorrows(active || 0);
    setPendingApprovals(pending || 0);

    const todayName = DAYS[new Date().getDay()];
    const { data: classes } = await supabase
      .from("class_schedules")
      .select("*")
      .eq("faculty_id", user.id)
      .eq("day_of_week", todayName)
      .order("start_time", { ascending: true });

    setTodayClasses(classes?.length || 0);

    if (classes && classes.length > 0) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const upcoming = classes.find((c: any) => {
        const [h, m] = (c.start_time || "00:00").split(":").map(Number);
        return h * 60 + m > currentMinutes;
      });
      setNextClass(upcoming || classes[classes.length - 1]);
    } else {
      setNextClass(null);
    }

    const { data: notifs } = await supabase
      .from("notifications")
      .select("*")
      .or(`user_id.eq.${user.id},role.eq.faculty`)
      .order("created_at", { ascending: false })
      .limit(3);

    setNotifications(notifs || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
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

  const fmtTime = (t: string | null) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}:${String(m).padStart(2, "0")} ${period}`;
  };

  const getNotifIcon = (type: string): IconName => {
    const icons: Record<string, IconName> = {
      borrow_status: "clipboard-outline",
      damage_report: "warning-outline",
      announcement: "megaphone-outline",
      system: "notifications-outline",
    };
    return icons[type] || "notifications-outline";
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <SkeletonBlock style={{ width: 140, height: 16, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 4 }} />
              <SkeletonBlock style={{ width: 100, height: 28, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 4, marginTop: 8 }} />
              <SkeletonBlock style={{ width: 80, height: 14, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 4, marginTop: 6 }} />
            </View>
            <SkeletonBlock style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.25)" }} />
          </View>
        </View>
        <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 8, marginTop: -16 }}>
          {[1, 2, 3].map((i) => (
            <SkeletonBlock key={i} style={{ flex: 1, height: 90, borderRadius: 14 }} />
          ))}
        </View>
        <View style={{ paddingHorizontal: 16, marginTop: 20, gap: 8 }}>
          {[1, 2].map((i) => (
            <SkeletonBlock key={i} style={{ height: 56, borderRadius: 14 }} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.navy]} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{greeting()},</Text>
              <Text style={styles.name}>{name}</Text>
              {dept ? <Text style={styles.dept}>{dept} Department</Text> : null}
            </View>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{name.charAt(0) || "F"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: COLORS.info + "1A" }]} onPress={() => router.push("/(faculty)/return")}>
            <Ionicons name="download-outline" size={22} color={COLORS.info} />
            <Text style={[styles.statNum, { color: COLORS.info }]}>{activeBorrows}</Text>
            <Text style={styles.statLabel}>Active Borrows</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: COLORS.warning + "1A" }]} onPress={() => router.push("/(faculty)/(tabs)/approvals")}>
            <Ionicons name="hourglass-outline" size={22} color={COLORS.warning} />
            <Text style={[styles.statNum, { color: COLORS.warning }]}>{pendingApprovals}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: COLORS.success + "1A" }]} onPress={() => router.push("/(faculty)/(tabs)/schedule")}>
            <Ionicons name="library-outline" size={22} color={COLORS.success} />
            <Text style={[styles.statNum, { color: COLORS.success }]}>{todayClasses}</Text>
            <Text style={styles.statLabel}>Today's Classes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.teal }]} onPress={() => router.push("/(faculty)/borrow")}>
            <Ionicons name="download-outline" size={18} color={COLORS.card} />
            <Text style={styles.actionLabel}>Borrow Equipment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.navy }]} onPress={() => router.push("/(faculty)/(tabs)/approvals")}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.card} />
            <Text style={styles.actionLabel}>Approve Requests</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <TouchableOpacity onPress={() => router.push("/(faculty)/(tabs)/schedule")}>
            <Text style={styles.seeAll}>See Schedule</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.scheduleCard}>
          {nextClass ? (
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleTimeCol}>
                <Text style={styles.scheduleTime}>{fmtTime(nextClass.start_time)}</Text>
                <Text style={styles.scheduleTimeEnd}>{fmtTime(nextClass.end_time)}</Text>
              </View>
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleSubject}>{nextClass.subject}</Text>
                <Text style={styles.scheduleMeta}>
                  {[nextClass.section, nextClass.room].filter(Boolean).join(" • ")}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptySchedule}>
              <Ionicons name="calendar-outline" size={32} color={COLORS.silver} />
              <Text style={styles.emptyScheduleText}>No classes today</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          <TouchableOpacity onPress={() => router.push("/(faculty)/(tabs)/notifications")}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <View key={n.id} style={styles.notifCard}>
              <Ionicons name={getNotifIcon(n.type)} size={20} color={COLORS.slate} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.notifTitle, !n.is_read && { fontWeight: "800" }]} numberOfLines={1}>
                  {n.title}
                </Text>
                <Text style={styles.notifMsg} numberOfLines={1}>{n.message}</Text>
              </View>
              <Text style={styles.notifTime}>{timeAgo(n.created_at)}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyNotifs}>
            <Ionicons name="notifications-outline" size={40} color={COLORS.silver} />
            <Text style={styles.emptyNotifText}>No notifications</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.navy, paddingTop: 56, paddingBottom: 36, paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
  name: { color: COLORS.card, fontSize: 26, fontWeight: "bold", marginTop: 4 },
  dept: { color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 2 },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: COLORS.card, fontSize: 22, fontWeight: "bold" },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginTop: -20,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statNum: { fontSize: 26, fontWeight: "bold" },
  statLabel: { fontSize: 10, color: COLORS.slate, marginTop: 2, textAlign: "center", fontWeight: "500" },
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
  actionsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 14,
    gap: 8,
    elevation: 2,
  },
  actionLabel: { color: COLORS.card, fontSize: 14, fontWeight: "bold" },
  scheduleCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    elevation: 2,
  },
  scheduleRow: { flexDirection: "row" },
  scheduleTimeCol: {
    width: 72,
    alignItems: "flex-end",
    paddingRight: 12,
    borderRightWidth: 2,
    borderRightColor: COLORS.teal,
    marginRight: 12,
  },
  scheduleTime: { fontSize: 13, fontWeight: "700", color: COLORS.navy },
  scheduleTimeEnd: { fontSize: 11, color: COLORS.silver, marginTop: 2 },
  scheduleInfo: { flex: 1 },
  scheduleSubject: { fontSize: 15, fontWeight: "bold", color: COLORS.navy },
  scheduleMeta: { fontSize: 12, color: COLORS.silver, marginTop: 3 },
  emptySchedule: { alignItems: "center", padding: 12 },
  emptyScheduleText: { fontSize: 14, color: COLORS.silver, marginTop: 6, fontWeight: "500" },
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginBottom: 6,
    padding: 14,
    borderRadius: 12,
    elevation: 1,
  },
  notifTitle: { fontSize: 14, fontWeight: "600", color: COLORS.navy },
  notifMsg: { fontSize: 12, color: COLORS.slate, marginTop: 2 },
  notifTime: { fontSize: 11, color: COLORS.silver, marginLeft: 8 },
  emptyNotifs: { alignItems: "center", padding: 32 },
  emptyNotifText: { fontSize: 14, color: COLORS.silver, marginTop: 6 },
});
