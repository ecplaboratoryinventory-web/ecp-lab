import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  Animated,
  RefreshControl,
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
  reference_type: string;
  reference_id: string;
}

export default function FacultyNotificationsScreen() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .or(`user_id.eq.${user.id},role.eq.faculty`)
      .order("created_at", { ascending: false });
    setNotifs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();

    let channel: any;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel(`faculty-notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `role=eq.faculty`,
          },
          () => fetchNotifications()
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const openItem = (item: Notification) => {
    markRead(item.id);
    if (item.reference_type === "borrow_request" && item.reference_id) {
      router.push("/(faculty)/(tabs)/approvals");
    } else if (item.type === "announcement") {
      router.push("/(faculty)/(tabs)/home");
    }
  };

  const getIcon = (item: Notification): IconName => {
    if (item.type === "borrow_status") {
      const t = (item.title || "").toLowerCase();
      if (t.includes("approved") || t.includes("approuvé")) return "checkmark-circle";
      if (t.includes("denied") || t.includes("rejected") || t.includes("refusé") || t.includes("rejeté")) return "close-circle";
      if (t.includes("returned") || t.includes("retourné")) return "refresh-outline";
    }
    const icons: Record<string, IconName> = {
      damage_report: "warning-outline",
      announcement: "megaphone-outline",
      system: "notifications-outline",
      schedule_reminder: "calendar-outline",
    };
    return icons[item.type] || "notifications-outline";
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

  const groupByDate = (items: Notification[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);

    const groups: { title: string; data: Notification[] }[] = [];
    const todayItems: Notification[] = [];
    const yesterdayItems: Notification[] = [];
    const weekItems: Notification[] = [];
    const olderItems: Notification[] = [];

    for (const n of items) {
      const d = new Date(n.created_at);
      if (d >= today) {
        todayItems.push(n);
      } else if (d >= yesterday) {
        yesterdayItems.push(n);
      } else if (d >= weekAgo) {
        weekItems.push(n);
      } else {
        olderItems.push(n);
      }
    }

    if (todayItems.length > 0) groups.push({ title: "Today", data: todayItems });
    if (yesterdayItems.length > 0) groups.push({ title: "Yesterday", data: yesterdayItems });
    if (weekItems.length > 0) groups.push({ title: "This Week", data: weekItems });
    if (olderItems.length > 0) groups.push({ title: "Older", data: olderItems });

    return groups;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <SkeletonBlock style={{ width: 150, height: 24, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 4 }} />
        </View>
        <View style={{ padding: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.card}>
              <SkeletonBlock style={{ width: 20, height: 20, borderRadius: 10 }} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <SkeletonBlock style={{ height: 14, width: "60%", marginBottom: 8 }} />
                <SkeletonBlock style={{ height: 12, width: "90%", marginBottom: 6 }} />
                <SkeletonBlock style={{ height: 10, width: "35%" }} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  const sections = groupByDate(notifs);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {notifs.length > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-outline" size={56} color={COLORS.silver} />
          <Text style={styles.emptyText}>No notifications</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          contentContainerStyle={{ padding: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.navy]} />}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, item.is_read && styles.cardRead]}
              onPress={() => openItem(item)}
            >
              <Ionicons name={getIcon(item)} size={20} color={COLORS.teal} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.notifTitle, !item.is_read && { fontWeight: "800" }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.notifMsg} numberOfLines={2}>{item.message}</Text>
                <Text style={styles.notifTime}>{timeAgo(item.created_at)}</Text>
              </View>
              {!item.is_read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: COLORS.card, fontSize: 22, fontWeight: "bold" },
  markAll: { color: COLORS.tealLight, fontSize: 13, fontWeight: "600" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: COLORS.silver, marginTop: 8 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.silver,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 6,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "flex-start",
    elevation: 1,
    gap: 10,
  },
  cardRead: { opacity: 0.6 },
  notifTitle: { fontSize: 15, fontWeight: "600", color: COLORS.navy },
  notifMsg: { fontSize: 13, color: COLORS.slate, marginTop: 4 },
  notifTime: { fontSize: 12, color: COLORS.silver, marginTop: 4 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.info,
    marginTop: 6,
  },
});
