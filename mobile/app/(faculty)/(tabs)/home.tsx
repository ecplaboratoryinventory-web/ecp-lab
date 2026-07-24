import { View, Text, StyleSheet } from "react-native";

export default function FacultyHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Faculty dashboard coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#18181b",
  },
  subtitle: {
    fontSize: 14,
    color: "#71717a",
    marginTop: 4,
  },
});
