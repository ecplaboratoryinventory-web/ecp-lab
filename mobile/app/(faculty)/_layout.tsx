import { Tabs, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export default function FacultyLayout() {
  const router = useRouter();

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
      <Tabs.Screen
        name="borrow"
        options={{
          tabBarLabel: "",
          tabBarIcon: () => (
            <TouchableOpacity
              style={styles.fabBorrow}
              onPress={() => router.push("/(faculty)/borrow")}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 22, color: "#fff" }}>📥</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="return"
        options={{
          tabBarLabel: "",
          tabBarIcon: () => (
            <TouchableOpacity
              style={styles.fabReturn}
              onPress={() => router.push("/(faculty)/return")}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 22, color: "#fff" }}>📤</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen name="(tabs)/notifications" options={{ tabBarLabel: "Notifications", tabBarIcon: () => <Text style={{ fontSize: 20 }}>🔔</Text> }} />
      <Tabs.Screen name="(tabs)/profile" options={{ tabBarLabel: "Profile", tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: "#fff", borderTopWidth: 0, elevation: 8, height: 60, paddingBottom: 6, paddingTop: 4 },
  label: { fontSize: 10, fontWeight: "600" },
  fabBorrow: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "#0ea5a0", justifyContent: "center", alignItems: "center",
    marginTop: -20, elevation: 6, shadowColor: "#0ea5a0", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35,
  },
  fabReturn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "#1A2980", justifyContent: "center", alignItems: "center",
    marginTop: -20, elevation: 6, shadowColor: "#1A2980", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35,
  },
});
