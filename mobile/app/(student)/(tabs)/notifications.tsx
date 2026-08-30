import { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { COLORS } from "@/lib/theme";
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
  return (
    <Animated.View
      style={[{ backgroundColor: COLORS.border, borderRadius: 8 }, style, { opacity }]}
    />
  );
}

function groupNotifications(items: any[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: { title: string; data: any[] }[] = [
    { title: "Today", data: [] },
    { title: "Yesterday", data: [] },
    { title: "This Week", data: [] },
    { title: "Older", data: [] },
  ];

  for (const item of items) {
    const d = new Date(item.created_at);
    if (d >= today) {
      groups[0].data.push(item);
    } else if (d >= yesterday) {
      groups[1].data.push(item);
    } else if (d >= weekAgo) {
      groups[2].data.push(item);
    } else {
      groups[3].data.push(item);
    }
  }
  return groups.filter((g) => g.data.length > 0);
}

function getIcon(item: any): IconName {
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
  };
  return icons[item.type] || "notifications-outline";
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setNotifs(data || []);
  };

  useEffect(() => {
    fetchData().finally(() => setLoading(false));

    let channel: any;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel(`student-notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchData()
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const openItem = (item: any) => {
    markRead(item.id);
    if (item.reference_type === "borrow_request" && item.reference_id) {
      router.push(`/(student)/request/${item.reference_id}`);
    } else if (item.type === "announcement") {
      router.push("/(student)/(tabs)/home");
    }
  };

  const markAllRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const sections = useMemo(() => groupNotifications(notifs), [notifs]);
  const hasUnread = notifs.some((n) => !n.is_read);

  const renderSectionHeader = ({ title }: { title: string }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.card, item.is_read && styles.cardRead]}
      onPress={() => openItem(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardIcon}>
        <Ionicons name={getIcon(item)} size={20} color={COLORS.teal} />
      </View>
      <View style={styles.cardBody}>
        <Text
          style={[styles.notifTitle, !item.is_read && styles.notifTitleUnread]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text style={styles.notifMsg} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notifTime}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const flatData = useMemo(() => {
    const result: any[] = [];
    for (const section of sections) {
      result.push({ type: "header", title: section.title });
      for (const item of section.data) {
        result.push({ type: "item", ...item });
      }
    }
    return result;
  }, [sections]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Notifications</Text>
        </View>
        <View style={{ padding: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.card, { backgroundColor: COLORS.card }]}>
              <View style={styles.cardIcon}>
                <SkeletonBlock style={{ width: 32, height: 32, borderRadius: 16 }} />
              </View>
              <View style={styles.cardBody}>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {hasUnread && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>
      {notifs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-outline" size={56} color={COLORS.silver} />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={flatData}
          contentContainerStyle={{ padding: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.navy]}
            />
          }
          renderItem={({ item }) => {
            if (item.type === "header") return renderSectionHeader({ title: item.title });
            return renderItem({ item });
          }}
          keyExtractor={(item, i) => item.id || `header-${item.title}-${i}`}
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
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.card },
  markAll: { fontSize: 13, color: COLORS.tealLight, fontWeight: "600" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: COLORS.silver, marginTop: 8 },
  sectionHeader: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.silver, textTransform: "uppercase", letterSpacing: 0.5 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 6,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cardRead: { opacity: 0.6 },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardBody: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: "600", color: COLORS.navy },
  notifTitleUnread: { fontWeight: "800" },
  notifMsg: { fontSize: 13, color: COLORS.slate, marginTop: 3, lineHeight: 18 },
  notifTime: { fontSize: 11, color: COLORS.silver, marginTop: 4 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.teal,
    marginTop: 6,
    marginLeft: 8,
  },
});
