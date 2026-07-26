import { Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkRole(session.user.id);
      } else {
        setLoading(false);
        router.replace("/(auth)/login");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/(auth)/login");
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: false,
      }).start();
    }
  }, [loading]);

  const checkRole = async (userId: string) => {
    const { data } = await supabase.from("users").select("role").eq("id", userId).single();
    setLoading(false);
    if (data?.role === "student") {
      router.replace("/(student)/(tabs)/home");
    } else if (data?.role === "faculty") {
      router.replace("/(faculty)/(tabs)/home");
    } else {
      router.replace("/(auth)/login");
    }
  };

  if (loading) {
    return (
      <View style={styles.splash}>
        <Animated.Image
          source={require("@/assets/icon.png")}
          style={[styles.logo, { opacity: fadeAnim }]}
        />
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(student)" />
      <Stack.Screen name="(faculty)" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#0a2e3f",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { width: 120, height: 120, borderRadius: 20 },
  progressBarContainer: {
    width: "60%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 2,
    marginTop: 30,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#0ea5a0",
    borderRadius: 2,
  },
});
