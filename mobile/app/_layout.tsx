import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter, useSegments } from "expo-router";

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/(auth)/login");
      } else {
        checkRole(session.user.id);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.replace("/(auth)/login");
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const checkRole = async (userId: string) => {
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (data?.role === "student") {
      router.replace("/(student)/(tabs)/home");
    } else if (data?.role === "faculty") {
      router.replace("/(faculty)/(tabs)/home");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#18181b" />
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
