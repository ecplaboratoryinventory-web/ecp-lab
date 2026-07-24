import { View, Text, StyleSheet } from "react-native";

export default function StudentHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>Equipment browsing coming soon</Text>
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
