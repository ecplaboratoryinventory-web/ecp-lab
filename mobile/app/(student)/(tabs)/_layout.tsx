import { Stack } from "expo-router";

export default function TabsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="requests" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
