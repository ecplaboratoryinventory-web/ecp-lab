import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, Image, StyleSheet } from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
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

  const checkRole = async (userId: string) => {
    const { data } = await supabase.from("users").select("role").eq("id", userId).single();
    setLoading(false);
    if (data?.role === "student") {
      router.replace("/(student)/(tabs)/home");
    } else {
      router.replace("/(auth)/login");
    }
  };

  if (loading) {
    return (
      <View style={styles.splash}>
        <Image source={require("@/assets/icon.png")} style={styles.logo} />
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(student)" />
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
});
