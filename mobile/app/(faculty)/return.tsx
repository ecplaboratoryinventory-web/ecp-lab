import { useEffect, useState } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

interface BorrowItem {
  id: string; quantity: number; returned_quantity: number;
  equipment: { id: string; name: string; available_quantity: number };
}

interface BorrowRequest {
  id: string; borrow_date: string; purpose: string;
  borrow_items: BorrowItem[];
}

export default function FacultyReturnScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(false);

  const fetchRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("borrow_requests")
      .select("id, borrow_date, purpose, borrow_items(id, quantity, returned_quantity, equipment(id, name, available_quantity))")
      .eq("user_id", user.id)
      .eq("request_type", "faculty")
      .in("status", ["approved", "borrowed"])
      .order("borrow_date", { ascending: false });

    const mapped = (data || []).map((r: any) => ({
      ...r,
      borrow_items: (r.borrow_items || []).map((bi: any) => ({
        ...bi,
        equipment: Array.isArray(bi.equipment) ? bi.equipment[0] : bi.equipment,
      })),
    })) as BorrowRequest[];
    setRequests(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleReturn = (req: BorrowRequest) => {
    const itemList = req.borrow_items
      .filter((bi) => bi.returned_quantity < bi.quantity)
      .map((bi) => `  • ${bi.equipment.name} (${bi.quantity - bi.returned_quantity} to return)`)
      .join("\n");

    Alert.alert(
      "Return Equipment?",
      `Return the following items?\n\n${itemList}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Return", style: "destructive",
          onPress: () => doReturn(req),
        },
      ],
    );
  };

  const doReturn = async (req: BorrowRequest) => {
    setReturning(true);
    try {
      await supabase.from("borrow_requests").update({
        status: "returned",
        actual_return_date: new Date().toISOString(),
      }).eq("id", req.id);

      for (const bi of req.borrow_items) {
        const remaining = bi.quantity - bi.returned_quantity;
        if (remaining > 0) {
          await supabase.from("borrow_items").update({
            returned_quantity: bi.quantity,
          }).eq("id", bi.id);

          await supabase.from("equipment").update({
            available_quantity: bi.equipment.available_quantity + remaining,
          }).eq("id", bi.equipment.id);
        }
      }

      Alert.alert("Returned", "Equipment has been returned.", [
        { text: "OK", onPress: () => fetchRequests() },
      ]);
    } catch {
      Alert.alert("Error", "Failed to return equipment.");
    } finally {
      setReturning(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#1A2980" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Return Equipment</Text>
        <Text style={styles.hint}>Tap an item to return</Text>
      </View>

      {returning && (
        <View style={styles.returningBar}>
          <ActivityIndicator color="#fff" size="small" />
          <Text style={{ color: "#fff", marginLeft: 8 }}>Processing return...</Text>
        </View>
      )}

      <FlatList
        data={requests}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item: req }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleReturn(req)} disabled={returning}>
            <View style={styles.cardHeader}>
              <Text style={styles.dateText}>Borrowed: {req.borrow_date}</Text>
              <Text style={styles.returnBadge}>Tap to return</Text>
            </View>
            {req.borrow_items.map((bi) => (
              <View key={bi.id} style={styles.equipmentRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.equipmentName}>{bi.equipment.name}</Text>
                  <Text style={styles.equipmentQty}>
                    Qty: {bi.quantity} / Returning: {bi.quantity - bi.returned_quantity}
                  </Text>
                </View>
                <Text style={{ fontSize: 28 }}>📦</Text>
              </View>
            ))}
            {req.purpose ? (
              <Text style={styles.purposeText} numberOfLines={2}>{req.purpose}</Text>
            ) : null}
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={{ padding: 60, alignItems: "center" }}>
            <Text style={{ fontSize: 48 }}>📭</Text>
            <Text style={{ fontSize: 16, color: "#757575", fontWeight: "bold", marginTop: 8 }}>No active borrows</Text>
            <Text style={{ fontSize: 13, color: "#999", marginTop: 4 }}>Your borrowed equipment will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4FF" },
  header: { backgroundColor: "#1A2980", padding: 20, paddingTop: 50 },
  backBtn: { color: "#D0E8FF", fontSize: 14 },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  hint: { color: "#D0E8FF", fontSize: 13, marginTop: 4 },
  returningBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#0ea5a0", padding: 10,
  },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 10,
    elevation: 2, borderLeftWidth: 4, borderLeftColor: "#0ea5a0",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  dateText: { fontSize: 12, color: "#757575" },
  returnBadge: { fontSize: 11, color: "#0ea5a0", fontWeight: "600", backgroundColor: "#E6FFFA", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  equipmentRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  equipmentName: { fontSize: 15, fontWeight: "bold", color: "#2C3E50" },
  equipmentQty: { fontSize: 12, color: "#757575", marginTop: 2 },
  purposeText: { fontSize: 12, color: "#999", marginTop: 4, fontStyle: "italic" },
});
