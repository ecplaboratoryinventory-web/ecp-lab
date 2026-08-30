import { Tabs, useRouter } from "expo-router";
import { StyleSheet, View, Platform, type ColorValue } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/lib/theme";

type IonName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: ColorValue }) {
  const icons: Record<string, { outline: IonName; filled: IonName }> = {
    dashboard: { outline: "grid-outline", filled: "grid" },
    approvals: { outline: "checkmark-circle-outline", filled: "checkmark-circle" },
    notifications: { outline: "notifications-outline", filled: "notifications" },
    profile: { outline: "person-outline", filled: "person" },
  };
  const icon = icons[name] || { outline: "ellipse-outline", filled: "ellipse-outline" };
  return <Ionicons name={focused ? icon.filled : icon.outline} size={focused ? 24 : 22} color={color} />;
}

export default function FacultyLayout() {
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.bar,
          tabBarActiveTintColor: COLORS.teal,
          tabBarInactiveTintColor: COLORS.silver,
          tabBarLabelStyle: styles.label,
        }}
      >
        <Tabs.Screen
          name="(tabs)/home"
          options={{
            tabBarLabel: "Dashboard",
            tabBarIcon: ({ focused, color }) => <TabIcon name="dashboard" focused={focused} color={color} />,
          }}
        />
        <Tabs.Screen
          name="(tabs)/approvals"
          options={{
            tabBarLabel: "Approvals",
            tabBarIcon: ({ focused, color }) => <TabIcon name="approvals" focused={focused} color={color} />,
          }}
        />
        <Tabs.Screen
          name="(tabs)/notifications"
          options={{
            tabBarLabel: "Alerts",
            tabBarIcon: ({ focused, color }) => <TabIcon name="notifications" focused={focused} color={color} />,
          }}
        />
        <Tabs.Screen
          name="(tabs)/profile"
          options={{
            tabBarLabel: "Profile",
            tabBarIcon: ({ focused, color }) => <TabIcon name="profile" focused={focused} color={color} />,
          }}
        />
        <Tabs.Screen name="(tabs)/schedule" options={{ href: null }} />
        <Tabs.Screen name="borrow" options={{ href: null }} />
        <Tabs.Screen name="return" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: Platform.OS === "web" ? 68 : 60,
    paddingBottom: Platform.OS === "web" ? 6 : 8,
    paddingTop: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
