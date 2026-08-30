import { Tabs } from "expo-router";
import { View, StyleSheet, Platform, type ColorValue } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/lib/theme";

type IonName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: ColorValue }) {
  const icons: Record<string, { outline: IonName; filled: IonName }> = {
    home: { outline: "home-outline", filled: "home" },
    borrow: { outline: "flask-outline", filled: "flask" },
    requests: { outline: "clipboard-outline", filled: "clipboard" },
    notifications: { outline: "notifications-outline", filled: "notifications" },
    profile: { outline: "person-outline", filled: "person" },
  };
  const icon = icons[name] || { outline: "ellipse-outline", filled: "ellipse-outline" };
  return <Ionicons name={focused ? icon.filled : icon.outline} size={focused ? 24 : 22} color={color} />;
}

export default function StudentLayout() {
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
            tabBarLabel: "Home",
            tabBarIcon: ({ focused, color }) => <TabIcon name="home" focused={focused} color={color} />,
          }}
        />
        <Tabs.Screen
          name="borrow"
          options={{
            tabBarLabel: "Borrow",
            tabBarIcon: ({ focused, color }) => <TabIcon name="borrow" focused={focused} color={color} />,
          }}
        />
        <Tabs.Screen
          name="(tabs)/requests"
          options={{
            tabBarLabel: "Requests",
            tabBarIcon: ({ focused, color }) => <TabIcon name="requests" focused={focused} color={color} />,
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
        <Tabs.Screen name="return" options={{ href: null }} />
        <Tabs.Screen name="damage-reports" options={{ href: null }} />
        <Tabs.Screen name="request/[id]" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: Platform.OS === "web" ? 64 : 65,
    paddingBottom: Platform.OS === "web" ? 4 : 8,
    paddingTop: 6,
  },
  label: { fontSize: 10, fontWeight: "600", marginTop: -2 },
});
