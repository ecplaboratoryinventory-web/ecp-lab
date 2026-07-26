import { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from "react-native";
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
    return icons[item.type] || "📢";
  };

  if (loading) return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SkeletonBlock style={{ width: 150, height: 24, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 4 }} />
      </View>
      <View style={{ padding: 8 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[styles.card, { backgroundColor: "#fff" }]}>
            <View style={[styles.accent, { backgroundColor: "#E8ECF0" }]} />
            <View style={{ flex: 1 }}>
              <SkeletonBlock style={{ height: 14, width: "60%", marginBottom: 8 }} />
              <SkeletonBlock style={{ height: 12, width: "90%", marginBottom: 6 }} />
              <SkeletonBlock style={{ height: 10, width: "35%" }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );

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
                <Text style={styles.notifTitle}>{getIcon(item)} {item.title}</Text>
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
