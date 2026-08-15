import { useEffect, useState } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, TextInput,
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

interface ReturnState {
  returned_quantity: number;
  condition: "good" | "damaged" | "lost";
  notes: string;
  severity: "minor" | "major" | "critical";
}

const conditions = ["good", "damaged", "lost"] as const;

export default function FacultyReturnScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [states, setStates] = useState<Record<string, Record<string, ReturnState>>>({});

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

  const initState = (req: BorrowRequest): Record<string, Record<string, ReturnState>> => {
    const next: Record<string, Record<string, ReturnState>> = { ...states };
    next[req.id] = {};
    for (const bi of req.borrow_items) {
      next[req.id][bi.id] = {
        returned_quantity: Math.min(bi.quantity - bi.returned_quantity, bi.quantity),
        condition: "good",
        notes: "",
        severity: "minor",
      };
    }
    return next;
  };

  const toggleExpand = (req: BorrowRequest) => {
    if (expandedId === req.id) {
      setExpandedId(null);
    } else {
      setStates(initState(req));
      setExpandedId(req.id);
    }
  };

  const setItemState = (reqId: string, itemId: string, patch: Partial<ReturnState>) => {
    setStates((prev) => ({
      ...prev,
      [reqId]: { ...prev[reqId], [itemId]: { ...(prev[reqId]?.[itemId] as ReturnState), ...patch } },
    }));
  };

  const remaining = (bi: BorrowItem) => bi.quantity - bi.returned_quantity;

  const submitReturn = async (req: BorrowRequest) => {
    const itemStates = states[req.id];
    if (!itemStates) return;

    const payload = req.borrow_items
      .filter((bi) => remaining(bi) > 0)
      .map((bi) => {
        const s = itemStates[bi.id];
        return {
          borrow_item_id: bi.id,
          returned_quantity: Math.min(Math.max(s?.returned_quantity || 1, 1), remaining(bi)),
          condition: s?.condition || "good",
          notes: (s?.condition === "damaged" || s?.condition === "lost") ? (s?.notes || "") : null,
          severity: (s?.condition === "damaged") ? (s?.severity || "minor") : null,
        };
      });

    const hasDamagedOrLost = payload.some((p) => p.condition === "damaged" || p.condition === "lost");
    if (hasDamagedOrLost) {
      const unconfirmed = payload.filter((p) => p.condition !== "good" && !p.notes?.trim());
      if (unconfirmed.length > 0) {
        Alert.alert("Damage Details", "Please describe the damage/loss for reported items.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("complete_return_items", {
        p_borrow_request_id: req.id,
        p_items: payload,
      });
      if (error) throw error;
      Alert.alert("Returned", "Return recorded successfully.", [
        { text: "OK", onPress: () => { setExpandedId(null); fetchRequests(); } },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to return equipment.");
    } finally {
      setSubmitting(false);
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
        <Text style={styles.hint}>Select condition for each item being returned</Text>
      </View>

      {submitting && (
        <View style={styles.returningBar}>
          <ActivityIndicator color="#fff" size="small" />
          <Text style={{ color: "#fff", marginLeft: 8 }}>Processing return...</Text>
        </View>
      )}

      <FlatList
        data={requests}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item: req }) => {
          const expanded = expandedId === req.id;
          const remainingItems = req.borrow_items.filter((bi) => remaining(bi) > 0);
          return (
            <View style={styles.card}>
              <TouchableOpacity onPress={() => toggleExpand(req)} disabled={submitting || remainingItems.length === 0}>
                <View style={styles.cardHeader}>
                  <Text style={styles.dateText}>Borrowed: {req.borrow_date}</Text>
                  {remainingItems.length > 0 ? (
                    <Text style={styles.returnBadge}>{expanded ? "Tap to close" : "Return items"}</Text>
                  ) : (
                    <Text style={styles.returnedBadge}>Returned</Text>
                  )}
                </View>
                {req.borrow_items.map((bi) => (
                  <View key={bi.id} style={styles.equipmentRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.equipmentName}>{bi.equipment?.name || "Item"}</Text>
                      <Text style={styles.equipmentQty}>
                        Qty: {bi.quantity} / Returned: {bi.returned_quantity}
                        {remaining(bi) > 0 ? ` / Remaining: ${remaining(bi)}` : ""}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 28 }}>{remaining(bi) > 0 ? "📦" : "✅"}</Text>
                  </View>
                ))}
                {req.purpose ? (
                  <Text style={styles.purposeText} numberOfLines={2}>{req.purpose}</Text>
                ) : null}
              </TouchableOpacity>

              {expanded && remainingItems.length > 0 && (
                <View style={styles.itemPanel}>
                  {remainingItems.map((bi) => {
                    const s = states[req.id]?.[bi.id] || { returned_quantity: remaining(bi), condition: "good", notes: "", severity: "minor" };
                    const needsDetails = s.condition === "damaged" || s.condition === "lost";
                    return (
                      <View key={bi.id} style={styles.panelItem}>
                        <Text style={styles.panelItemName}>{bi.equipment?.name || "Item"}</Text>
                        <Text style={styles.panelItemQty}>Remaining to return: {remaining(bi)}</Text>

                        <Text style={styles.panelLabel}>Condition</Text>
                        <View style={styles.condRow}>
                          {conditions.map((c) => (
                            <TouchableOpacity
                              key={c}
                              style={[styles.condBtn, s.condition === c && styles.condBtnActive]}
                              onPress={() => setItemState(req.id, bi.id, { condition: c })}
                            >
                              <Text style={[styles.condText, s.condition === c && styles.condTextActive]}>{c}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {needsDetails && s.condition === "damaged" && (
                          <View style={styles.severityRow}>
                            {(["minor", "major", "critical"] as const).map((sev) => (
                              <TouchableOpacity
                                key={sev}
                                style={[styles.sevBtn, s.severity === sev && styles.sevBtnActive]}
                                onPress={() => setItemState(req.id, bi.id, { severity: sev })}
                              >
                                <Text style={[styles.sevText, s.severity === sev && styles.sevTextActive]}>
                                  {sev[0].toUpperCase() + sev.slice(1)}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}

                        {needsDetails && (
                          <TextInput
                            style={styles.notesInput}
                            placeholder={s.condition === "lost" ? "Describe the loss (required)..." : "Describe the damage (required)..."}
                            placeholderTextColor="#999"
                            value={s.notes}
                            onChangeText={(t) => setItemState(req.id, bi.id, { notes: t })}
                            multiline
                          />
                        )}
                      </View>
                    );
                  })}

                  <TouchableOpacity style={styles.submitBtn} onPress={() => submitReturn(req)} disabled={submitting}>
                    <Text style={styles.submitText}>Confirm Return</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
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
  returnedBadge: { fontSize: 11, color: "#2ECC71", fontWeight: "600", backgroundColor: "#E8F8EF", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  equipmentRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  equipmentName: { fontSize: 15, fontWeight: "bold", color: "#2C3E50" },
  equipmentQty: { fontSize: 12, color: "#757575", marginTop: 2 },
  purposeText: { fontSize: 12, color: "#999", marginTop: 4, fontStyle: "italic" },
  itemPanel: { marginTop: 10, borderTopWidth: 1, borderTopColor: "#EEF0F6", paddingTop: 12 },
  panelItem: { marginBottom: 14, padding: 12, backgroundColor: "#F7F9FD", borderRadius: 10 },
  panelItemName: { fontSize: 14, fontWeight: "bold", color: "#2C3E50" },
  panelItemQty: { fontSize: 12, color: "#757575", marginTop: 2 },
  panelLabel: { fontSize: 12, fontWeight: "600", color: "#444", marginTop: 10, marginBottom: 6 },
  condRow: { flexDirection: "row", gap: 8 },
  condBtn: { flex: 1, height: 38, borderRadius: 8, borderWidth: 1.5, borderColor: "#D0D7E8", backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  condBtnActive: { borderColor: "#0ea5a0", backgroundColor: "#E6FFFA" },
  condText: { fontSize: 12, fontWeight: "600", color: "#666", textTransform: "capitalize" },
  condTextActive: { color: "#0f766e" },
  severityRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  sevBtn: { flex: 1, height: 34, borderRadius: 8, borderWidth: 1, borderColor: "#E0B4B4", backgroundColor: "#FFF0F0", justifyContent: "center", alignItems: "center" },
  sevBtnActive: { backgroundColor: "#E53935", borderColor: "#E53935" },
  sevText: { fontSize: 11, fontWeight: "600", color: "#C62828", textTransform: "capitalize" },
  sevTextActive: { color: "#fff" },
  notesInput: {
    backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#E0B4B4",
    padding: 10, fontSize: 13, minHeight: 48, marginTop: 10, color: "#222",
  },
  submitBtn: { backgroundColor: "#0ea5a0", height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center", marginTop: 4 },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
});