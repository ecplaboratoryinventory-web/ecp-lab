import { useEffect, useState, useRef } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, ScrollView, Animated, Platform,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

function SkeletonBlock({ style }: { style: any }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);
  return <Animated.View style={[{ backgroundColor: "#E8ECF0", borderRadius: 8 }, style, { opacity }]} />;
}

interface Equipment {
  id: string; name: string; available_quantity: number; category_id: string;
  status: string; department: string; subject_tags: string[] | null;
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [enrolledSubjects, setEnrolledSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [minReturnDate, setMinReturnDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("enrolled_subjects")
          .eq("id", user.id)
          .single();
        setEnrolledSubjects(profile?.enrolled_subjects || []);
      }
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
    if (selectedCategory) {
      result = result.filter((e) => (e.categories?.name || "").toLowerCase() === selectedCategory.toLowerCase());
    }
    if (selectedSubject) {
      result = result.filter((e) =>
        (e.subject_tags || []).some((t) => t.toLowerCase() === selectedSubject.toLowerCase())
      );
    }
    setFiltered(result);
  }, [search, selectedCategory, selectedSubject, equipment]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const selectedItems = equipment.filter((e) => selected.includes(e.id));

  const availableFilteredIds = filtered
    .filter((e) => e.available_quantity >= 1 && e.status === "available")
    .map((e) => e.id);
  const allAvailableSelected = availableFilteredIds.length > 0 && availableFilteredIds.every((id) => selected.includes(id));

  const hardcodedCategories = ["All", "Electronics", "Microcontrollers", "Single Board PCs", "Desktop PCs", "Components"];
  const dbCategories = [...new Set(equipment.map((e) => e.categories?.name).filter(Boolean) as string[])];
  const categories = dbCategories.length >= 5 ? ["All", ...dbCategories] : hardcodedCategories;

  const handleSubmit = async () => {
    if (!purpose || !returnDate) { Alert.alert("Error", "Fill in purpose and return date"); return; }
    setSubmitting(true);

    const items = selectedItems.map((item) => ({
      equipment_id: item.id,
      quantity: quantities[item.id] || 1,
    }));

    const { data, error } = await supabase.rpc("submit_student_borrow", {
      p_items: items,
      p_purpose: purpose,
      p_return_date: returnDate,
    });

    setSubmitting(false);
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    if (!data) {
      Alert.alert("Error", "Failed to submit borrow request.");
      return;
    }

    // Send notifications after successful submission
    const primaryItem = selectedItems[0];
    const eqName = primaryItem?.name || "equipment";
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

    // Notify student (confirmation)
    await supabase.rpc("create_borrow_notification" as never, {
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_title: "Borrow Request Submitted",
      p_message: `Your request to borrow ${totalQty} ${eqName} has been submitted successfully.`,
      p_reference_id: data,
    } as never);

    // Notify admin
    const { data: profile } = await supabase.from("users").select("full_name").eq("id", (await supabase.auth.getUser()).data.user?.id).single();
    const studentName = profile?.full_name || "Student";
    await supabase.rpc("notify_role_users" as never, {
      p_role: "admin",
      p_title: "New Borrow Request",
      p_message: `${studentName} requested to borrow ${totalQty} ${eqName}.`,
      p_type: "borrow_status",
      p_reference_type: "borrow_request",
      p_reference_id: data,
    } as never);

    // Notify faculty
    await supabase.rpc("notify_role_users" as never, {
      p_role: "faculty",
      p_title: "New Borrow Request",
      p_message: `${studentName} requested to borrow ${totalQty} ${eqName}. Please review the request.`,
      p_type: "borrow_status",
      p_reference_type: "borrow_request",
      p_reference_id: data,
    } as never);

    Alert.alert("Success", "Borrow request submitted!", [
      { text: "OK", onPress: () => router.replace("/(student)/(tabs)/requests") },
    ]);
  };

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (event.type === "dismissed" || !selectedDate) return;
    const iso = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    setReturnDate(iso);
    setMinReturnDate(selectedDate);
  };

  if (loading) return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 50, height: 18, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 4 }} />
        <View style={{ width: 180, height: 24, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 4, marginTop: 8 }} />
      </View>
      <View style={[styles.searchWrap, { backgroundColor: "#fff" }]}>
        <SkeletonBlock style={{ flex: 1, height: 20 }} />
      </View>
      <View style={styles.chipRowContent}>
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonBlock key={i} style={{ width: 90, height: 32, borderRadius: 20 }} />
        ))}
      </View>
      <FlatList
        data={[1, 2, 3, 4, 5, 6]}
        numColumns={2}
        contentContainerStyle={{ padding: 12 }}
        columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
        renderItem={() => (
          <View style={[styles.itemCard, { backgroundColor: "#fff", padding: 14 }]}>
            <SkeletonBlock style={{ height: 14, width: "80%", marginBottom: 8 }} />
            <SkeletonBlock style={{ height: 11, width: "50%", marginBottom: 6 }} />
            <SkeletonBlock style={{ height: 11, width: "60%" }} />
          </View>
        )}
        keyExtractor={(_, i) => String(i)}
      />
    </View>
  );

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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipRowContent}>
            {categories.map((cat) => {
              const isActive = (cat === "All" && selectedCategory === null) || cat === selectedCategory;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
                  onPress={() => setSelectedCategory(cat === "All" ? null : cat)}
                >
                  <Text style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {enrolledSubjects.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectRow} contentContainerStyle={styles.chipRowContent}>
              {["All Subjects", ...enrolledSubjects].map((sub) => {
                const isActive = (sub === "All Subjects" && selectedSubject === null) || sub === selectedSubject;
                return (
                  <TouchableOpacity
                    key={sub}
                    style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
                    onPress={() => setSelectedSubject(sub === "All Subjects" ? null : sub)}
                  >
                    <Text style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}>{sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {selected.length > 0 && (
            <View style={styles.selectBar}>
              <TouchableOpacity onPress={() => setSelected([])}>
                <Text style={{ color: "#fff", fontSize: 14 }}>✕ Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelected(allAvailableSelected ? [] : availableFilteredIds)}
              >
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                  {allAvailableSelected ? "Deselect All" : "Select All"}
                </Text>
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
            <TouchableOpacity style={styles.formInput} onPress={() => setShowDatePicker(true)}>
              <Text style={{ fontSize: 15, color: returnDate ? "#222" : "#999" }}>
                {returnDate || "Tap to pick a date"}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={minReturnDate}
                mode="date"
                minimumDate={minReturnDate}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onChangeDate}
              />
            )}

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
  formInput: { backgroundColor: "#F5F7FA", borderRadius: 8, borderWidth: 1, borderColor: "#E0E5EC", padding: 12, fontSize: 15, minHeight: 52, justifyContent: "center" },
  submitBtn: { backgroundColor: "#2196F3", height: 52, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 20 },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  chipRow: { maxHeight: 48 },
  subjectRow: { maxHeight: 48, marginTop: 8 },
  chipRowContent: { paddingHorizontal: 12, gap: 8, alignItems: "center" },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  chipActive: { backgroundColor: "#1A2980" },
  chipInactive: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#D0D7E8" },
  chipText: { fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  chipTextInactive: { color: "#555" },
});
