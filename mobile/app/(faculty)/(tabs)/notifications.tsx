import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";

export default function FacultyNotificationsScreen() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("notifications").select("*").or(`user_id.eq.${user.id},role.eq.faculty`).order("created_at", { ascending: false });
      setNotifs(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#1A2980" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
      </View>
      {notifs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 56 }}>🔔</Text>
          <Text style={styles.emptyText}>No notifications</Text>
        </View>
      ) : (
        <FlatList
          data={notifs}
          contentContainerStyle={{ padding: 8 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.notifTitle}>📢 {item.title}</Text>
                <Text style={styles.notifMsg}>{item.message}</Text>
                <Text style={styles.notifTime}>{new Date(item.created_at).toLocaleString()}</Text>
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
  container: { flex: 1, backgroundColor: "#F4F7FC" },
  header: { backgroundColor: "#1A2980", padding: 20, paddingTop: 50 },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#95A5A6", marginTop: 8 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 6, flexDirection: "row", elevation: 2 },
  accent: { width: 4, borderRadius: 2, backgroundColor: "#1A2980", marginRight: 10 },
  notifTitle: { fontSize: 15, fontWeight: "bold", color: "#2C3E50" },
  notifMsg: { fontSize: 13, color: "#7F8C8D", marginTop: 4 },
  notifTime: { fontSize: 12, color: "#95A5A6", marginTop: 4 },
});
