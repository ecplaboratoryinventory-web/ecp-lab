import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";

export default function NotificationsScreen() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setNotifs(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const typePrefix: Record<string, string> = {
    borrow_status: "✅", damage_report: "⚠️", announcement: "📢", system: "🔔",
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#1A2980" style={{ marginTop: 40 }} />
      ) : notifs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 56 }}>🔔</Text>
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifs}
          contentContainerStyle={{ padding: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.card, item.is_read && styles.cardRead]} onPress={() => markRead(item.id)}>
              <View style={styles.accentBar} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.notifTitle, item.is_read && styles.textRead]}>
                  {typePrefix[item.type] || "🔔"} {item.title}
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
  header: { backgroundColor: "#fff", padding: 20, paddingTop: 50, elevation: 2 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1A1A2E" },
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
