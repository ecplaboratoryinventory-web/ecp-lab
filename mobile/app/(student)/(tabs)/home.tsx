import { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions, FlatList, RefreshControl, Animated, Image } from "react-native";
import { supabase } from "@/lib/supabase";

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

export default function HomeScreen() {
  const [userName, setUserName] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  interface CarouselSlide {
    title: string; subtitle: string; color: string; imageUrl: string | null;
  }
  const fallbackSlides: CarouselSlide[] = [
    { title: "Laboratory Equipment", subtitle: "Browse available items", color: "#1A2980", imageUrl: null },
    { title: "Borrow & Return", subtitle: "Easy request process", color: "#1565C0", imageUrl: null },
    { title: "Track Requests", subtitle: "Real-time status updates", color: "#008080", imageUrl: null },
  ];
  const [slides, setSlides] = useState<CarouselSlide[]>(fallbackSlides);

  const fetchCarouselImages = async () => {
    const { data } = await supabase
      .from("equipment")
      .select("name, image_url")
      .not("image_url", "is", null)
      .limit(5);
    if (data && data.length > 0) {
      setSlides(
        data.map((item) => ({
          title: item.name,
          subtitle: "Available now",
          color: "#1A2980",
          imageUrl: item.image_url as string | null,
        }))
      );
    }
  };

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("users").select("firstname, lastname").eq("id", user.id).single();
      setUserName(data?.firstname || "Student");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    fetchCarouselImages();
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % slides.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#1A2980"]} />}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>ECP Laboratory</Text>
            <Text style={styles.school}>STI College Cotabato</Text>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
        </View>

        {loading ? (
          <>
            <View style={styles.carouselWrap}>
              <SkeletonBlock style={{ height: 160, borderRadius: 16, width: width - 48 }} />
              <View style={styles.dots}>
                {slides.map((_, i) => (
                  <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
                ))}
              </View>
            </View>
            <View style={styles.section}>
              <SkeletonBlock style={{ height: 16, width: 120, marginBottom: 12 }} />
              <SkeletonBlock style={{ height: 120, borderRadius: 12 }} />
            </View>
          </>
        ) : (
          <>
            {/* Carousel */}
            <View style={styles.carouselWrap}>
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
            </View>

            {/* Recent Activity */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <View style={styles.emptyActivity}>
                <Text style={{ fontSize: 40 }}>📘</Text>
                <Text style={styles.emptyText}>Start browsing equipment</Text>
                <Text style={styles.emptySub}>Tap the center button to borrow</Text>
              </View>
            </View>
          </>
        )}
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
  section: { padding: 24, paddingTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#1E293B", marginBottom: 12 },
  emptyActivity: { alignItems: "center", padding: 32, backgroundColor: "#F0F4F8", borderRadius: 12 },
  emptyText: { fontSize: 14, fontWeight: "bold", color: "#1E293B", marginTop: 8 },
  emptySub: { fontSize: 12, color: "#64748B", marginTop: 4 },
});
