import { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Animated } from "react-native";
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

export default function NotificationsScreen() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
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
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const getIcon = (item: any) => {
    if (item.type === "borrow_status") {
      const t = (item.title || "").toLowerCase();
      if (t.includes("approved") || t.includes("approuvé")) return "✅";
      if (t.includes("denied") || t.includes("rejected") || t.includes("refusé") || t.includes("rejeté")) return "❌";
      if (t.includes("returned") || t.includes("retourné")) return "🔄";
    }
    const icons: Record<string, string> = {
      damage_report: "⚠️", announcement: "📢", system: "🔔",
    };
    return icons[item.type] || "🔔";
  };

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
      {loading ? (
        <View style={{ padding: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.card, { backgroundColor: "#fff" }]}>
              <View style={[styles.accentBar, { backgroundColor: "#E8ECF0" }]} />
              <View style={{ flex: 1 }}>
                <SkeletonBlock style={{ height: 14, width: "60%", marginBottom: 8 }} />
                <SkeletonBlock style={{ height: 12, width: "90%", marginBottom: 6 }} />
                <SkeletonBlock style={{ height: 10, width: "35%" }} />
              </View>
            </View>
          ))}
        </View>
      ) : notifs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 56 }}>🔔</Text>
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifs}
          contentContainerStyle={{ padding: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#1A2980"]} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.card, item.is_read && styles.cardRead]} onPress={() => markRead(item.id)}>
              <View style={styles.accentBar} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.notifTitle, item.is_read && styles.textRead]}>
                  {getIcon(item)} {item.title}
                </Text>
                <Text style={[styles.notifMsg, item.is_read && styles.textRead]}>{item.message}</Text>
                <Text style={styles.notifTime}>{new Date(item.created_at).toLocaleString()}</Text>
              </View>
              {!item.is_read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC" },
  header: { backgroundColor: "#fff", padding: 20, paddingTop: 50, elevation: 2, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", color: "#1A1A2E" },
  markAll: { fontSize: 13, color: "#2196F3", fontWeight: "600" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#95A5A6", marginTop: 8 },
  card: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 6, elevation: 2,
    flexDirection: "row", alignItems: "flex-start",
  },
  cardRead: { opacity: 0.6 },
  accentBar: { width: 4, height: "100%", backgroundColor: "#2196F3", borderRadius: 2, marginRight: 10 },
  notifTitle: { fontSize: 15, fontWeight: "bold", color: "#2C3E50" },
  notifMsg: { fontSize: 13, color: "#7F8C8D", marginTop: 4 },
  notifTime: { fontSize: 12, color: "#95A5A6", marginTop: 4 },
  textRead: { fontWeight: "normal", opacity: 0.7 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2196F3", marginTop: 6 },
});
