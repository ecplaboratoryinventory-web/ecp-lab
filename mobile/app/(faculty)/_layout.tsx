import { Tabs } from "expo-router";
import { StyleSheet, Text } from "react-native";

export default function FacultyLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.bar,
        tabBarActiveTintColor: "#1A2980",
        tabBarInactiveTintColor: "#9E9E9E",
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen name="(tabs)/home" options={{ tabBarLabel: "Dashboard", tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text> }} />
      <Tabs.Screen name="(tabs)/approvals" options={{ tabBarLabel: "Approvals", tabBarIcon: () => <Text style={{ fontSize: 20 }}>✅</Text> }} />
      <Tabs.Screen name="(tabs)/notifications" options={{ tabBarLabel: "Notifications", tabBarIcon: () => <Text style={{ fontSize: 20 }}>🔔</Text> }} />
      <Tabs.Screen name="(tabs)/profile" options={{ tabBarLabel: "Profile", tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: "#fff", borderTopWidth: 0, elevation: 8, height: 60, paddingBottom: 6, paddingTop: 4 },
  label: { fontSize: 10, fontWeight: "600" },
});
