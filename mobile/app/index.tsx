import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";

export default function Index() {
  const [redirect, setRedirect] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setRedirect("/(auth)/login");
        setChecking(false);
        return;
      }
      supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.role === "student") {
            setRedirect("/(student)/(tabs)/home");
          } else if (data?.role === "faculty") {
            setRedirect("/(faculty)/(tabs)/home");
          } else {
            setRedirect("/(auth)/login");
          }
          setChecking(false);
        });
    });
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a2e3f" }}>
        <ActivityIndicator size="large" color="#0ea5a0" />
      </View>
    );
  }

  if (redirect) return <Redirect href={redirect} />;

  return null;
}
