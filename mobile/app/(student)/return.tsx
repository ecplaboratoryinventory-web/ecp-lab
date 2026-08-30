import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { COLORS } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";

interface BorrowItem {
  id: string;
  quantity: number;
  returned_quantity: number;
  equipment: { id: string; name: string; available_quantity: number };
}

interface BorrowRequest {
  id: string;
  borrow_date: string;
  purpose: string;
  borrow_items: BorrowItem[];
}

export default function StudentReturnScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchRequests = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("borrow_requests")
      .select(
        "id, borrow_date, purpose, borrow_items(id, quantity, returned_quantity, equipment(id, name, available_quantity))"
      )
      .eq("user_id", user.id)
      .eq("request_type", "student")
      .in("status", ["approved", "borrowed"])
      .order("borrow_date", { ascending: false });

    const mapped = (data || []).map((r: any) => ({
      ...r,
      borrow_items: (r.borrow_items || []).map((bi: any) => ({
        ...bi,
        equipment: Array.isArray(bi.equipment)
          ? bi.equipment[0]
          : bi.equipment,
      })),
    })) as BorrowRequest[];
    setRequests(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const toggleExpand = (req: BorrowRequest) => {
    setExpandedId((prev) => (prev === req.id ? null : req.id));
  };

  const remaining = (bi: BorrowItem) => bi.quantity - bi.returned_quantity;

  const submitReturn = async (req: BorrowRequest) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("request_return", {
        p_borrow_request_id: req.id,
      });
      if (error) throw error;
      Alert.alert(
        "Return Request Submitted",
        "Your return request has been submitted and is awaiting processing.",
        [
          {
            text: "OK",
            onPress: () => {
              setExpandedId(null);
              fetchRequests();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to submit return request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color={COLORS.navy}
        style={{ flex: 1, backgroundColor: COLORS.background }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Return Equipment</Text>
        <Text style={styles.hint}>Select condition for each item</Text>
      </View>

      {submitting && (
        <View style={styles.returningBar}>
          <ActivityIndicator color={COLORS.card} size="small" />
          <Text style={{ color: COLORS.card, marginLeft: 8 }}>
            Processing return...
          </Text>
        </View>
      )}

      <FlatList
        data={requests}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item: req }) => {
          const expanded = expandedId === req.id;
          const remainingItems = req.borrow_items.filter(
            (bi) => remaining(bi) > 0
          );
          return (
            <View style={styles.card}>
              <TouchableOpacity
                onPress={() => toggleExpand(req)}
                disabled={submitting || remainingItems.length === 0}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.dateText}>
                    Borrowed: {req.borrow_date}
                  </Text>
                  {remainingItems.length > 0 ? (
                    <Text style={styles.returnBadge}>
                      {expanded ? "Tap to close" : "Return items"}
                    </Text>
                  ) : (
                    <Text style={styles.returnedBadge}>Returned</Text>
                  )}
                </View>
                {req.borrow_items.map((bi) => (
                  <View key={bi.id} style={styles.equipmentRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.equipmentName}>
                        {bi.equipment?.name || "Item"}
                      </Text>
                      <Text style={styles.equipmentQty}>
                        Qty: {bi.quantity} / Returned: {bi.returned_quantity}
                        {remaining(bi) > 0
                          ? ` / Remaining: ${remaining(bi)}`
                          : ""}
                      </Text>
                    </View>
                    {remaining(bi) > 0 ? (
                      <Ionicons name="cube-outline" size={24} color={COLORS.teal} />
                    ) : (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                    )}
                  </View>
                ))}
                {req.purpose ? (
                  <Text style={styles.purposeText} numberOfLines={2}>
                    {req.purpose}
                  </Text>
                ) : null}
              </TouchableOpacity>

              {expanded && remainingItems.length > 0 && (
                <View style={styles.itemPanel}>
                  {remainingItems.map((bi) => (
                    <View key={bi.id} style={styles.panelItem}>
                      <Text style={styles.panelItemName}>
                        {bi.equipment?.name || "Item"}
                      </Text>
                      <Text style={styles.panelItemQty}>
                        Remaining to return: {remaining(bi)}
                      </Text>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={() => submitReturn(req)}
                    disabled={submitting}
                  >
                    <Text style={styles.submitText}>Request Return</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={{ padding: 60, alignItems: "center" }}>
            <Ionicons name="archive-outline" size={48} color={COLORS.silver} />
            <Text
              style={{
                fontSize: 16,
                color: COLORS.slate,
                fontWeight: "bold",
                marginTop: 8,
              }}
            >
              No active borrows
            </Text>
            <Text
              style={{ fontSize: 13, color: COLORS.silver, marginTop: 4 }}
            >
              Your borrowed equipment will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.navy, padding: 20, paddingTop: 50 },
  backBtn: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  title: { color: COLORS.card, fontSize: 22, fontWeight: "bold" },
  hint: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 },
  returningBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.teal,
    padding: 10,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.teal,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dateText: { fontSize: 12, color: COLORS.silver },
  returnBadge: {
    fontSize: 11,
    color: COLORS.teal,
    fontWeight: "600",
    backgroundColor: COLORS.tealLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  returnedBadge: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: "600",
    backgroundColor: COLORS.tealLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  equipmentRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  equipmentName: { fontSize: 15, fontWeight: "bold", color: COLORS.navy },
  equipmentQty: { fontSize: 12, color: COLORS.silver, marginTop: 2 },
  purposeText: {
    fontSize: 12,
    color: COLORS.silver,
    marginTop: 4,
    fontStyle: "italic",
  },
  itemPanel: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  panelItem: {
    marginBottom: 14,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 10,
  },
  panelItemName: { fontSize: 14, fontWeight: "bold", color: COLORS.navy },
  panelItemQty: { fontSize: 12, color: COLORS.silver, marginTop: 2 },
  panelLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.slate,
    marginTop: 10,
    marginBottom: 6,
  },
  condRow: { flexDirection: "row", gap: 8 },
  condBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
  },
  condBtnActive: { borderColor: COLORS.teal, backgroundColor: COLORS.tealLight },
  condText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.slate,
    textTransform: "capitalize",
  },
  condTextActive: { color: COLORS.tealDark },
  severityRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  sevBtn: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  sevBtnActive: { backgroundColor: COLORS.destructive, borderColor: COLORS.destructive },
  sevText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.destructive,
    textTransform: "capitalize",
  },
  sevTextActive: { color: COLORS.card },
  notesInput: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    fontSize: 13,
    minHeight: 48,
    marginTop: 10,
    color: COLORS.navy,
  },
  submitBtn: {
    backgroundColor: COLORS.teal,
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  submitText: { color: COLORS.card, fontSize: 15, fontWeight: "bold" },
});
