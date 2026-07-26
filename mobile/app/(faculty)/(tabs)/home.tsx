import { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Animated } from "react-native";
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

export default function FacultyHomeScreen() {
  const [name, setName] = useState("");
  const [stats, setStats] = useState({ total: 0, available: 0, active: 0, pending: 0 });
  const [dept, setDept] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("users").select("full_name, department").eq("id", user.id).single();
      setName(profile?.full_name?.split(" ")[0] || "Faculty");
      setDept(profile?.department || "");

      const eq = profile?.department ? (q: any) => q.eq("department", profile.department) : (q: any) => q;
      const [{ count: total }, { count: available }, { count: active }, { count: pending }] = await Promise.all([
        eq(supabase.from("equipment").select("*", { count: "exact", head: true })),
        eq(supabase.from("equipment").select("*", { count: "exact", head: true }).eq("status", "available")),
        supabase.from("borrow_requests").select("*", { count: "exact", head: true }).eq("status", "borrowed"),
        supabase.from("borrow_requests").select("*", { count: "exact", head: true }).eq("status", "pending").eq("request_type", "student"),
      ]);
      setStats({ total: total || 0, available: available || 0, active: active || 0, pending: pending || 0 });
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <SkeletonBlock style={{ width: 160, height: 16, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 4 }} />
          <SkeletonBlock style={{ width: 200, height: 26, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 4, marginTop: 8 }} />
          <SkeletonBlock style={{ width: 240, height: 13, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 4, marginTop: 6 }} />
        </View>
        <View style={styles.statsRow}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: "#E8ECF0" }]}>
              <SkeletonBlock style={{ height: 28, width: 60 }} />
              <SkeletonBlock style={{ height: 11, width: 80, marginTop: 6 }} />
            </View>
          ))}
        </View>
        <View style={[styles.card, { backgroundColor: "#fff" }]}>
          <SkeletonBlock style={{ height: 16, width: 140, marginBottom: 12 }} />
          <SkeletonBlock style={{ height: 13, width: "100%", marginBottom: 6 }} />
          <SkeletonBlock style={{ height: 13, width: "85%" }} />
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {name}!</Text>
          <Text style={styles.role}>{dept} Faculty</Text>
          <Text style={styles.subtitle}>Manage your laboratory activities</Text>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: "Total Equipment", value: stats.total, bg: "#E3F2FD", color: "#2196F3" },
            { label: "Available", value: stats.available, bg: "#E8F5E9", color: "#4CAF50" },
            { label: "Active Borrows", value: stats.active, bg: "#FFF3E0", color: "#FF9800" },
            { label: "Pending", value: stats.pending, bg: "#FCE4EC", color: "#E91E63" },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
              <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Overview</Text>
          <Text style={styles.cardText}>
            Monitor equipment availability, approve student borrowing requests, and track laboratory inventory from your mobile device.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { backgroundColor: "#1A2980", padding: 24, paddingTop: 50, paddingBottom: 32 },
  greeting: { color: "#fff", fontSize: 16 },
  role: { color: "#fff", fontSize: 24, fontWeight: "bold", marginTop: 4 },
  subtitle: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 8, marginTop: -16 },
  statCard: { flex: 1, minWidth: "45%", padding: 16, borderRadius: 12, elevation: 2 },
  statNum: { fontSize: 28, fontWeight: "bold" },
  statLabel: { fontSize: 11, color: "#555", marginTop: 4 },
  card: { backgroundColor: "#fff", margin: 12, borderRadius: 16, padding: 20, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#2C3E50", marginBottom: 8 },
  cardText: { fontSize: 13, color: "#718096", lineHeight: 20 },
});
