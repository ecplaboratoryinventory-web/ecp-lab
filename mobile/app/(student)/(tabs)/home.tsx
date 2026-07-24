import { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions, FlatList } from "react-native";
import { supabase } from "@/lib/supabase";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const [userName, setUserName] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const slides = [
    { title: "Laboratory Equipment", subtitle: "Browse available items", color: "#1A2980" },
    { title: "Borrow & Return", subtitle: "Easy request process", color: "#1565C0" },
    { title: "Track Requests", subtitle: "Real-time status updates", color: "#008080" },
  ];

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("users").select("firstname, lastname").eq("id", user.id).single();
        setUserName(data?.firstname || "Student");
      }
    };
    fetch();
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % slides.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>ECP Laboratory</Text>
            <Text style={styles.school}>STI College Cotabato</Text>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
        </View>

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
                <Text style={styles.slideTitle}>{item.title}</Text>
                <Text style={styles.slideSub}>{item.subtitle}</Text>
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
  slide: { height: 160, borderRadius: 16, justifyContent: "flex-end", padding: 20, marginRight: 8 },
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
