import { useEffect, useState, useRef, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, Dimensions, FlatList, RefreshControl,
  Animated, Image, TextInput, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

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

interface CarouselSlide {
  title: string; subtitle: string; color: string; imageUrl: string | null;
}
const fallbackSlides: CarouselSlide[] = [
  { title: "Laboratory Equipment", subtitle: "Browse available items", color: "#1A2980", imageUrl: null },
  { title: "Borrow & Return", subtitle: "Easy request process", color: "#1565C0", imageUrl: null },
  { title: "Track Requests", subtitle: "Real-time status updates", color: "#008080", imageUrl: null },
];

interface EquipmentItem {
  id: string; name: string; description: string | null; status: string; condition: string | null;
  available_quantity: number; quantity: number; image_url: string | null; department: string | null;
  subject_tags: string[] | null; location: string | null;
  categories?: { name: string } | { name: string }[];
}

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const slidesRef = useRef<CarouselSlide[]>(fallbackSlides);

  const [slides, setSlides] = useState<CarouselSlide[]>(fallbackSlides);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [filtered, setFiltered] = useState<EquipmentItem[]>([]);
  const [search, setSearch] = useState("");
  const [enrolledSubjects, setEnrolledSubjects] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const refresh = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("firstname, lastname, enrolled_subjects")
        .eq("id", user.id)
        .single();
      setUserName(profile?.firstname || "Student");
      setEnrolledSubjects(profile?.enrolled_subjects || []);
    }

    const { data } = await supabase.from("equipment").select("*, categories(name)").order("name");
    setEquipment(data || []);

    const img = await supabase
      .from("equipment")
      .select("name, image_url")
      .not("image_url", "is", null)
      .limit(5);
    if (img.data && img.data.length > 0) {
      const mapped = img.data.map((item) => ({
        title: item.name as string,
        subtitle: "Available now",
        color: "#1A2980",
        imageUrl: item.image_url as string | null,
      }));
      setSlides(mapped);
      slidesRef.current = mapped;
    }
  };

  const fetchData = useCallback(async () => {
    await refresh();
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      const count = slidesRef.current.length;
      if (count <= 1) return;
      setCurrentSlide((prev) => {
        const next = (prev + 1) % count;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel("student-home-equipment")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "equipment" },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let result = equipment;
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((e) => e.name.toLowerCase().includes(q));
    if (selectedCategory) {
      result = result.filter((e) => {
        const cat = Array.isArray(e.categories) ? e.categories[0]?.name : e.categories?.name;
        return (cat || "").toLowerCase() === selectedCategory.toLowerCase();
      });
    }
    if (selectedSubject) {
      result = result.filter((e) =>
        (e.subject_tags || []).some((t) => t.toLowerCase() === selectedSubject.toLowerCase())
      );
    }
    setFiltered(result);
  }, [search, selectedCategory, selectedSubject, equipment]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const catNames = [...new Set(equipment.map((e) => {
    const cat = Array.isArray(e.categories) ? e.categories[0]?.name : e.categories?.name;
    return cat;
  }).filter(Boolean) as string[])];

  const categoryChips = ["All", ...catNames];
  const subjectChips = ["All Subjects", ...enrolledSubjects];

  const statusColor: Record<string, string> = {
    available: "#2ECC71", borrowed: "#F39C12", damaged: "#E74C3C",
  };

  const renderEquipment = ({ item }: { item: EquipmentItem }) => {
    const isAvailable = item.status === "available" && item.available_quantity >= 1;
    const color = statusColor[item.status] || "#95A5A6";
    const cat = Array.isArray(item.categories) ? item.categories[0]?.name : item.categories?.name;
    return (
      <TouchableOpacity
        style={styles.equipCard}
        onPress={() => router.push("/(student)/borrow")}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.equipImage} resizeMode="cover" />
        ) : (
          <View style={[styles.equipImage, styles.equipImagePlaceholder]}>
            <Text style={{ fontSize: 28 }}>🧪</Text>
          </View>
        )}
        <View style={styles.equipBody}>
          <Text style={styles.equipName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.equipCat} numberOfLines={1}>{cat || "—"}</Text>
          <View style={styles.equipStatusRow}>
            <View style={[styles.statusPill, { backgroundColor: color + "22" }]}>
              <Text style={[styles.statusPillText, { color }]}>
                {item.status === "available" ? `${item.available_quantity} available` : item.status.replace("_", " ")}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SkeletonBlock style={{ width: 140, height: 18, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 4 }} />
        <SkeletonBlock style={{ width: 100, height: 26, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 4, marginTop: 10 }} />
      </View>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.carouselWrap}>
          <SkeletonBlock style={{ height: 160, borderRadius: 16, width: width - 48 }} />
        </View>
        <View style={[styles.searchWrap, { marginTop: 16 }]}>
          <SkeletonBlock style={{ flex: 1, height: 20 }} />
        </View>
        <View style={styles.chipsRowContent}>
          {[1, 2, 3, 4].map((i) => <SkeletonBlock key={i} style={{ width: 84, height: 32, borderRadius: 20 }} />)}
        </View>
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={[styles.equipCard, { backgroundColor: "#fff", padding: 12 }]}>
              <SkeletonBlock style={{ height: 90, borderRadius: 8 }} />
              <SkeletonBlock style={{ height: 13, width: "84%", marginTop: 10 }} />
              <SkeletonBlock style={{ height: 11, width: "55%", marginTop: 6 }} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#1A2980"]} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>ECP Laboratory</Text>
            <Text style={styles.school}>STI College Cotabato</Text>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
        </View>

        <View style={styles.carouselWrap}>
          {slides.length > 0 && (
            <>
              <FlatList
                ref={flatListRef}
                data={slides}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => setCurrentSlide(Math.round(e.nativeEvent.contentOffset.x / (width - 48)))}
                renderItem={({ item }) => (
                  <View style={[styles.slide, { backgroundColor: item.color, width: width - 48 }]}>
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={styles.slideImage} />
                    ) : null}
                    <View style={[styles.slideOverlay, item.imageUrl && styles.slideOverlayDark]}>
                      <Text style={styles.slideTitle}>{item.title}</Text>
                      <Text style={styles.slideSub}>{item.subtitle}</Text>
                    </View>
                  </View>
                )}
                keyExtractor={(_, i) => String(i)}
              />
              <View style={styles.dots}>
                {slides.map((_, i) => (
                  <View key={i} style={[styles.dot, i === currentSlide && styles.dotActive]} />
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.searchWrap}>
          <Text style={{ fontSize: 18, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search equipment..."
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
              <Text style={{ fontSize: 16, color: "#9AA3B2" }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {enrolledSubjects.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRowContent}>
            {subjectChips.map((sub) => {
              const isActive = (sub === "All Subjects" && selectedSubject === null) || sub === selectedSubject;
              return (
                <TouchableOpacity
                  key={sub}
                  style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
                  onPress={() => setSelectedSubject(sub === "All Subjects" ? null : sub)}
                >
                  <Text style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}>{sub}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRowContent}>
          {categoryChips.map((cat) => {
            const isActive = (cat === "All" && selectedCategory === null) || cat === selectedCategory;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
                onPress={() => setSelectedCategory(cat === "All" ? null : cat)}
              >
                <Text style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Available Equipment</Text>
          <Text style={styles.sectionCount}>{filtered.length} items</Text>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyActivity}>
            <Text style={{ fontSize: 40 }}>🔍</Text>
            <Text style={styles.emptyText}>No equipment found</Text>
            <Text style={styles.emptySub}>Try a different search or filter</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((item) => (
              <View key={item.id} style={{ flex: 1, maxWidth: "48%" }}>
                {renderEquipment({ item })}
              </View>
            ))}
          </View>
        )}

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push("/(student)/borrow")}>
            <Text style={{ fontSize: 20 }}>📋</Text>
            <Text style={styles.quickBtnText}>Borrow</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push("/(student)/return")}>
            <Text style={{ fontSize: 20 }}>📦</Text>
            <Text style={styles.quickBtnText}>Return</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push("/(student)/(tabs)/requests")}>
            <Text style={{ fontSize: 20 }}>🗂️</Text>
            <Text style={styles.quickBtnText}>Requests</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    backgroundColor: "#1A2980", padding: 20, paddingTop: 50, paddingBottom: 80,
    flexDirection: "row", justifyContent: "space-between",
  },
  brand: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  school: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 },
  greeting: { color: "rgba(255,255,255,0.85)", fontSize: 14, marginTop: 16 },
  userName: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  carouselWrap: { marginTop: -60, marginHorizontal: 24 },
  slide: { height: 160, borderRadius: 16, overflow: "hidden", marginRight: 8 },
  slideImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", borderRadius: 16 },
  slideOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20 },
  slideOverlayDark: { backgroundColor: "rgba(0,0,0,0.45)", paddingTop: 12 },
  slideTitle: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  slideSub: { color: "#E0E0E0", fontSize: 12, marginTop: 4 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 12 },
  dot: { width: 12, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)" },
  dotActive: { backgroundColor: "#4CAF50", width: 24 },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 24, marginTop: 16, borderRadius: 12, paddingHorizontal: 12, elevation: 2 },
  searchInput: { flex: 1, height: 46, fontSize: 15 },
  chipsRowContent: { paddingHorizontal: 24, gap: 8, alignItems: "center", paddingVertical: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  chipActive: { backgroundColor: "#1A2980" },
  chipInactive: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#D0D7E8" },
  chipText: { fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  chipTextInactive: { color: "#555" },
  sectionTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#1E293B" },
  sectionCount: { fontSize: 12, color: "#64748B" },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 24, gap: 8, paddingTop: 8 },
  equipCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", elevation: 2, marginBottom: 8,
  },
  equipImage: { width: "100%", height: 96, backgroundColor: "#E8ECF0" },
  equipImagePlaceholder: { justifyContent: "center", alignItems: "center" },
  equipBody: { padding: 10 },
  equipName: { fontSize: 13, fontWeight: "bold", color: "#212121" },
  equipCat: { fontSize: 11, color: "#757575", marginTop: 2 },
  equipStatusRow: { marginTop: 8 },
  statusPill: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusPillText: { fontSize: 10, fontWeight: "bold", textTransform: "capitalize" },
  emptyActivity: { alignItems: "center", padding: 32, backgroundColor: "#EEF2F7", borderRadius: 12, marginHorizontal: 24, marginTop: 8 },
  emptyText: { fontSize: 14, fontWeight: "bold", color: "#1E293B", marginTop: 8 },
  emptySub: { fontSize: 12, color: "#64748B", marginTop: 4 },
  quickActions: { flexDirection: "row", gap: 10, paddingHorizontal: 24, marginTop: 20 },
  quickBtn: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, paddingVertical: 14, alignItems: "center",
    elevation: 2,
  },
  quickBtnText: { fontSize: 12, fontWeight: "600", color: "#1E293B", marginTop: 4 },
});