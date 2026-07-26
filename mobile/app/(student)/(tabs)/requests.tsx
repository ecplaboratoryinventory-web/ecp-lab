import { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Animated } from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

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

export default function RequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("borrow_requests").select("*, borrow_items(equipment_id, quantity, equipment:equipment_id(name))").eq("user_id", user.id).order("created_at", { ascending: false });
    setRequests(data || []);
  };

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const statusColors: Record<string, string> = {
    pending: "#F39C12", approved: "#2196F3", borrowed: "#3498DB", returned: "#2ECC71", denied: "#E74C3C", rejected: "#E74C3C",
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Borrow Requests</Text>
        <Text style={styles.subtitle}>Track your equipment requests</Text>
      </View>
      {loading ? (
        <View style={{ padding: 12 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.card, { backgroundColor: "#fff" }]}>
              <View style={{ flex: 1 }}>
                <SkeletonBlock style={{ height: 14, width: "70%", marginBottom: 8 }} />
                <SkeletonBlock style={{ height: 12, width: "45%" }} />
              </View>
              <SkeletonBlock style={{ height: 24, width: 72, borderRadius: 12 }} />
            </View>
          ))}
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 56 }}>📋</Text>
          <Text style={styles.emptyTitle}>No borrow requests yet</Text>
          <Text style={styles.emptySub}>Tap the center button to get started</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          contentContainerStyle={{ padding: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#1A2980"]} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/(student)/request/${item.id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.borrow_items?.[0]?.equipment?.name || `Request #${item.id.slice(0, 6)}`}</Text>
                <Text style={styles.itemDate}>📅 {new Date(item.borrow_date || item.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: statusColors[item.status] + "20" }]}>
                <Text style={[styles.badgeText, { color: statusColors[item.status] || "#666" }]}>{item.status}</Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FB" },
  header: { backgroundColor: "#fff", padding: 20, paddingTop: 50, elevation: 4 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1A1A2E" },
  subtitle: { fontSize: 13, color: "#8A8FA8", marginTop: 4 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "bold", color: "#1A1A2E", marginTop: 12 },
  emptySub: { fontSize: 13, color: "#8A8FA8", marginTop: 4 },
  card: {
    backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 8, elevation: 2,
    flexDirection: "row", alignItems: "center",
  },
  itemName: { fontSize: 15, fontWeight: "bold", color: "#2C3E50" },
  itemDate: { fontSize: 12, color: "#7F8C8D", marginTop: 4 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: "bold", textTransform: "uppercase" },
});
