import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Animated,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/lib/theme";
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
  return <Animated.View style={[{ backgroundColor: COLORS.border, borderRadius: 8 }, style, { opacity }]} />;
}

interface Schedule {
  id: string;
  subject: string;
  section: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string;
  semester: string;
  school_year: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function fmtTime(t: string | null) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${period}`;
}

export default function FacultyScheduleScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("class_schedules")
      .select("*")
      .eq("faculty_id", user.id)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });
    setSchedules((data || []) as Schedule[]);
  };

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const todayIdx = new Date().getDay();
  const todayName = DAYS[(todayIdx + 6) % 7];

  const grouped = DAYS.map((day) => ({
    day,
    items: schedules.filter((s) => s.day_of_week === day),
  }));

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <SkeletonBlock style={{ width: 180, height: 24, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 4 }} />
          <SkeletonBlock style={{ width: 220, height: 14, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 4, marginTop: 6 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.dayCard}>
              <SkeletonBlock style={{ height: 16, width: 120, marginBottom: 12 }} />
              <SkeletonBlock style={{ height: 80, borderRadius: 10 }} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Class Schedule</Text>
        <Text style={styles.subtitle}>Your laboratory classes this semester</Text>
      </View>

      {schedules.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={56} color={COLORS.silver} />
          <Text style={styles.emptyTitle}>No schedules yet</Text>
          <Text style={styles.emptySub}>
            Your class schedule will appear here once assigned by the admin.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.navy]} />}
        >
          {grouped.map(({ day, items }) => (
            <View key={day} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{day}</Text>
                {day === todayName && <Text style={styles.todayBadge}>Today</Text>}
              </View>
              {items.length === 0 ? (
                <Text style={styles.noClasses}>No classes</Text>
              ) : (
                items.map((s) => (
                  <View key={s.id} style={styles.classRow}>
                    <View style={styles.timeCol}>
                      <Text style={styles.time}>{fmtTime(s.start_time)}</Text>
                      <Text style={styles.timeEnd}>{fmtTime(s.end_time)}</Text>
                    </View>
                    <View style={styles.classInfo}>
                      <Text style={styles.subject}>{s.subject || "Subject"}</Text>
                      <Text style={styles.meta}>
                        {[s.section, s.room, s.semester && s.school_year ? `${s.semester} ${s.school_year}` : ""]
                          .filter(Boolean)
                          .join(" • ") || "—"}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.navy, padding: 24, paddingTop: 50, paddingBottom: 28 },
  title: { color: COLORS.card, fontSize: 22, fontWeight: "bold" },
  subtitle: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 },
  dayCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dayName: { fontSize: 15, fontWeight: "bold", color: COLORS.navy },
  todayBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.card,
    backgroundColor: COLORS.teal,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  noClasses: { fontSize: 13, color: COLORS.silver, fontStyle: "italic" },
  classRow: { flexDirection: "row", marginBottom: 10 },
  timeCol: {
    width: 72,
    alignItems: "flex-end",
    paddingRight: 12,
    borderRightWidth: 2,
    borderRightColor: COLORS.teal,
    marginRight: 12,
  },
  time: { fontSize: 13, fontWeight: "700", color: COLORS.navy },
  timeEnd: { fontSize: 11, color: COLORS.silver, marginTop: 2 },
  classInfo: { flex: 1 },
  subject: { fontSize: 15, fontWeight: "bold", color: COLORS.navy },
  meta: { fontSize: 12, color: COLORS.silver, marginTop: 3 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "bold", color: COLORS.navy, marginTop: 12 },
  emptySub: { fontSize: 13, color: COLORS.silver, marginTop: 4, textAlign: "center" },
});
