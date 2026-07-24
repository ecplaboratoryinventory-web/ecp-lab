import { View, Text, StyleSheet } from "react-native";

export default function FacultyApprovalsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Approvals</Text>
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
});
