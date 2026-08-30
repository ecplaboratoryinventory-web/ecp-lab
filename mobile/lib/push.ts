import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";

if (Platform.OS !== "web") {
  const Notifications = require("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    const Notifications = require("expo-notifications");
    const Constants = require("expo-constants");

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0ea5a0",
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId || projectId === "00000000-0000-0000-0000-000000000000") {
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
}

export async function registerPushToken(): Promise<void> {
  if (Platform.OS === "web") return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const token = await getExpoPushToken();
  if (!token) return;

  const { data: existing } = await supabase
    .from("users")
    .select("push_token")
    .eq("id", user.id)
    .maybeSingle();

  if (existing?.push_token !== token) {
    await supabase
      .from("users")
      .update({ push_token: token })
      .eq("id", user.id);
  }
}
