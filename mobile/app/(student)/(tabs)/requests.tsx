import { useEffect, useState, useRef } from "react";
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
  return (
    <Animated.View
      style={[{ backgroundColor: COLORS.border, borderRadius: 8 }, style, { opacity }]}
    />
  );
}

export default function RequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("borrow_requests")
      .select(
        "*, borrow_items(equipment_id, quantity, equipment:equipment_id(name))"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Borrow Requests</Text>
        <Text style={styles.subtitle}>Track your equipment requests</Text>
      </View>
      {loading ? (
        <View style={{ padding: 12 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.card, { backgroundColor: COLORS.card }]}>
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
          <Ionicons name="clipboard-outline" size={56} color={COLORS.silver} />
          <Text style={styles.emptyTitle}>No borrow requests yet</Text>
          <Text style={styles.emptySub}>Tap the center button to get started</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          contentContainerStyle={{ padding: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.navy]}
            />
          }
          renderItem={({ item }) => {
            const color = statusColor(item.status);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/(student)/request/${item.id}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.statusBar, { backgroundColor: color }]} />
                <View style={styles.cardContent}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>
                      {item.borrow_items?.[0]?.equipment?.name ||
                        `Request #${item.id.slice(0, 6)}`}
                    </Text>
                    <View style={styles.itemDateRow}>
                      <Ionicons name="calendar-outline" size={12} color={COLORS.silver} />
                      <Text style={styles.itemDate}>
                        {new Date(
                          item.borrow_date || item.created_at
                        ).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.badge, { backgroundColor: color + "18" }]}>
                    <Text style={[styles.badgeText, { color }]}>
                      {statusLabel(item.status)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
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
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.card },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "bold", color: COLORS.navy, marginTop: 12 },
  emptySub: { fontSize: 13, color: COLORS.silver, marginTop: 4 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    flexDirection: "row",
    overflow: "hidden",
  },
  statusBar: { width: 4 },
  cardContent: {
    flex: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  itemName: { fontSize: 15, fontWeight: "bold", color: COLORS.navy },
  itemDateRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  itemDate: { fontSize: 12, color: COLORS.silver },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
});
