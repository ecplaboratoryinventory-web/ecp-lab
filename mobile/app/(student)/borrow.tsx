import { useEffect, useState } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

interface Equipment {
  id: string; name: string; available_quantity: number; category_id: string;
  status: string; department: string;
  categories?: { name: string };
}

export default function BorrowScreen() {
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filtered, setFiltered] = useState<Equipment[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [step, setStep] = useState<"browse" | "form">("browse");
  const [purpose, setPurpose] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("equipment").select("*, categories(name)").order("name");
      setEquipment(data || []);
      setFiltered(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  useEffect(() => {
    let result = equipment;
    if (search) result = result.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));
    setFiltered(result);
  }, [search, equipment]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const selectedItems = equipment.filter((e) => selected.includes(e.id));

  const handleSubmit = async () => {
    if (!purpose || !returnDate) { Alert.alert("Error", "Fill in purpose and return date"); return; }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: req, error } = await supabase.from("borrow_requests").insert({
      user_id: user.id, request_type: "student", status: "pending",
      purpose, return_date: returnDate, borrow_date: new Date().toISOString().split("T")[0],
    }).select("id").single();

    if (error || !req) { Alert.alert("Error", error?.message); setSubmitting(false); return; }

    for (const item of selectedItems) {
      await supabase.from("borrow_items").insert({
        borrow_request_id: req.id, equipment_id: item.id,
        quantity: quantities[item.id] || 1,
      });
    }

    setSubmitting(false);
    Alert.alert("Success", "Borrow request submitted!", [
      { text: "OK", onPress: () => router.replace("/(student)/(tabs)/requests") },
    ]);
  };

  if (loading) return <ActivityIndicator size="large" color="#1A2980" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      {step === "browse" ? (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backBtn}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Borrow Equipment</Text>
            <Text style={styles.hint}>Tap to select, long press for multi-select</Text>
          </View>

          <View style={styles.searchWrap}>
            <Text style={{ fontSize: 18, marginRight: 8 }}>🔍</Text>
            <TextInput style={styles.searchInput} placeholder="Search equipment..." value={search} onChangeText={setSearch} />
          </View>

          {selected.length > 0 && (
            <View style={styles.selectBar}>
              <TouchableOpacity onPress={() => setSelected([])}>
                <Text style={{ color: "#fff", fontSize: 14 }}>✕ Clear</Text>
              </TouchableOpacity>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>{selected.length} selected</Text>
              <TouchableOpacity style={styles.borrowBtn} onPress={() => setStep("form")}>
                <Text style={{ color: "#1A2980", fontWeight: "bold", fontSize: 13 }}>Next →</Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={filtered}
            numColumns={2}
            contentContainerStyle={{ padding: 12 }}
            columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
            renderItem={({ item }) => {
              const isSelected = selected.includes(item.id);
              const unavailable = item.available_quantity < 1 || item.status !== "available";
              return (
                <TouchableOpacity
                  style={[styles.itemCard, isSelected && styles.itemSelected, unavailable && styles.itemUnavailable]}
                  onPress={() => toggleSelect(item.id)}
                  disabled={unavailable}
                >
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCat}>{item.categories?.name || "—"}</Text>
                  <Text style={[styles.itemQty, { color: unavailable ? "#F44336" : "#4CAF50" }]}>
                    {unavailable ? "Unavailable" : `${item.available_quantity} available`}
                  </Text>
                  {isSelected && <View style={styles.checkmark}><Text style={{ color: "#fff", fontWeight: "bold" }}>✓</Text></View>}
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={{ padding: 40, alignItems: "center" }}>
                <Text style={{ fontSize: 48 }}>🔍</Text>
                <Text style={{ fontSize: 16, color: "#757575", fontWeight: "bold" }}>No equipment found</Text>
              </View>
            }
          />
        </>
      ) : (
        <ScrollView>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setStep("browse")}>
              <Text style={styles.backBtn}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Borrow Request</Text>
          </View>

          <View style={styles.formCard}>
            {selectedItems.map((item) => (
              <View key={item.id} style={styles.formItem}>
                <Text style={styles.formItemName}>{item.name}</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setQuantities((q) => ({ ...q, [item.id]: Math.max(1, (q[item.id] || 1) - 1) }))}
                  >
                    <Text style={{ fontSize: 18 }}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepCount}>{quantities[item.id] || 1}</Text>
                  <TouchableOpacity
                    style={[styles.stepBtn, { borderColor: "#2196F3" }]}
                    onPress={() => setQuantities((q) => ({ ...q, [item.id]: Math.min(item.available_quantity, (q[item.id] || 1) + 1) }))}
                  >
                    <Text style={{ fontSize: 18, color: "#2196F3" }}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <Text style={styles.formLabel}>Purpose *</Text>
            <TextInput style={styles.formInput} placeholder="Briefly describe purpose..." value={purpose} onChangeText={setPurpose} multiline />

            <Text style={styles.formLabel}>Return Date *</Text>
            <TextInput style={styles.formInput} placeholder="YYYY-MM-DD" value={returnDate} onChangeText={setReturnDate} />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Request</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4FF" },
  header: { backgroundColor: "#1A2980", padding: 20, paddingTop: 50 },
  backBtn: { color: "#D0E8FF", fontSize: 14 },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  hint: { color: "#D0E8FF", fontSize: 13, marginTop: 4 },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", margin: 12, borderRadius: 12, paddingHorizontal: 12, elevation: 2 },
  searchInput: { flex: 1, height: 48, fontSize: 15 },
  selectBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#1565C0", padding: 12, marginHorizontal: 12, borderRadius: 10,
  },
  borrowBtn: { backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18 },
  itemCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 14, elevation: 2, position: "relative",
  },
  itemSelected: { borderWidth: 2, borderColor: "#1565C0", backgroundColor: "#E8EAF6" },
  itemUnavailable: { opacity: 0.5 },
  itemName: { fontSize: 13, fontWeight: "bold", color: "#212121" },
  itemCat: { fontSize: 11, color: "#757575", marginTop: 2 },
  itemQty: { fontSize: 11, fontWeight: "bold", marginTop: 4 },
  checkmark: {
    position: "absolute", top: 8, right: 8,
    width: 24, height: 24, borderRadius: 12, backgroundColor: "#1565C0",
    justifyContent: "center", alignItems: "center",
  },
  formCard: { backgroundColor: "#fff", margin: 16, borderRadius: 16, padding: 20, elevation: 4 },
  formItem: { marginBottom: 16 },
  formItemName: { fontSize: 15, fontWeight: "bold", color: "#2C3E50" },
  stepper: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 12 },
  stepBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: "#E0E0E0", justifyContent: "center", alignItems: "center" },
  stepCount: { fontSize: 24, fontWeight: "bold", color: "#2C3E50", width: 40, textAlign: "center" },
  formLabel: { fontSize: 13, color: "#555", marginTop: 12, marginBottom: 4 },
  formInput: { backgroundColor: "#F5F7FA", borderRadius: 8, borderWidth: 1, borderColor: "#E0E5EC", padding: 12, fontSize: 15, minHeight: 52 },
  submitBtn: { backgroundColor: "#2196F3", height: 52, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 20 },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
});
