import { Tabs, useRouter } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    home: "🏠",
    requests: "📋",
    borrow: "🔬",
    notifications: "🔔",
    profile: "👤",
  };
  return <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.5 }}>{icons[name] || "•"}</Text>;
}

export default function StudentLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.bar,
        tabBarActiveTintColor: "#2196F3",
        tabBarInactiveTintColor: "#9E9E9E",
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="(tabs)/home"
        options={{ tabBarLabel: "Home", tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }}
      />
      <Tabs.Screen
        name="(tabs)/requests"
        options={{ tabBarLabel: "Requests", tabBarIcon: ({ focused }) => <TabIcon name="requests" focused={focused} /> }}
      />
      <Tabs.Screen
        name="borrow"
        options={{
          tabBarLabel: "",
          tabBarIcon: () => (
            <TouchableOpacity
              style={styles.fab}
              onPress={() => router.push("/(student)/borrow")}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 24, color: "#fff" }}>🔬</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="(tabs)/notifications"
        options={{ tabBarLabel: "Notif.", tabBarIcon: ({ focused }) => <TabIcon name="notifications" focused={focused} /> }}
      />
      <Tabs.Screen
        name="(tabs)/profile"
        options={{ tabBarLabel: "Profile", tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: "#fff",
    borderTopWidth: 0,
    elevation: 8,
    height: 65,
    paddingBottom: 8,
    paddingTop: 6,
  },
  label: { fontSize: 10, fontWeight: "600", marginTop: -2 },
  fab: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: "#2196F3", justifyContent: "center", alignItems: "center",
    marginTop: -26, elevation: 6, shadowColor: "#2196F3", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35,
  },
});
