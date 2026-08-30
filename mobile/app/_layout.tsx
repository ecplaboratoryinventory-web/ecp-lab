import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { COLORS } from "@/lib/theme";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const { data } = await supabase
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .single();
          if (data?.role === "student") {
            router.replace("/(student)/(tabs)/home");
          } else if (data?.role === "faculty") {
            router.replace("/(faculty)/(tabs)/home");
          } else {
            router.replace("/(auth)/login");
          }
        } catch {
          router.replace("/(auth)/login");
        }
      } else {
        router.replace("/(auth)/login");
      }
      setReady(true);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/(auth)/login");
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(student)" />
      <Stack.Screen name="(faculty)" />
    </Stack>
  );
}
