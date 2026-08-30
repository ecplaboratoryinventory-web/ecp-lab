import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Animated,
  Platform,
  ActivityIndicator,
} from "react-native";
let DateTimePicker: any = null;
if (Platform.OS !== "web") {
  DateTimePicker = require("@react-native-community/datetimepicker").default;
}
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { COLORS } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";

const SUBJECT_CATEGORIES = ["Electronics", "Chemistry", "Physics"];

function SkeletonBlock({ style }: { style: any }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: false }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);
  return (
    <Animated.View
      style={[{ backgroundColor: COLORS.border, borderRadius: 8 }, style, { opacity }]}
    />
  );
}

interface Equipment {
  id: string;
  name: string;
  available_quantity: number;
  category_id: string;
  status: string;
  department: string;
  subject_tags: string[] | null;
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
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [minReturnDate, setMinReturnDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const allowedCategoriesRef = useRef<string[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("enrolled_subjects")
          .eq("id", user.id)
          .single();
        const subjects = (profile?.enrolled_subjects || []) as string[];
        allowedCategoriesRef.current = subjects.filter((s) =>
          SUBJECT_CATEGORIES.includes(s)
        );
      }
      const { data } = await supabase
        .from("equipment")
        .select("*, categories(name)")
        .order("name");
      const all = (data || []) as Equipment[];
      const scoped = allowedCategoriesRef.current.length
        ? all.filter((e) =>
            allowedCategoriesRef.current.includes(e.categories?.name || "")
          )
        : all;
      setEquipment(scoped);
      setFiltered(scoped);
      setLoading(false);
    };
    fetch();
  }, []);

  useEffect(() => {
    let channel: any;
    channel = supabase
      .channel("borrow-equipment-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "equipment" },
        async () => {
          const { data } = await supabase
            .from("equipment")
            .select("*, categories(name)")
            .order("name");
          const all = (data || []) as Equipment[];
          const scoped = allowedCategoriesRef.current.length
            ? all.filter((e) =>
                allowedCategoriesRef.current.includes(e.categories?.name || "")
              )
            : all;
          setEquipment(scoped);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let result = equipment;
    if (search)
      result = result.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase())
      );
    if (selectedCategory) {
      result = result.filter(
        (e) =>
          (e.categories?.name || "").toLowerCase() ===
          selectedCategory.toLowerCase()
      );
    }
    if (selectedSubject) {
      result = result.filter((e) =>
        (e.subject_tags || []).some(
          (t) => t.toLowerCase() === selectedSubject.toLowerCase()
        )
      );
    }
    setFiltered(result);
  }, [search, selectedCategory, selectedSubject, equipment]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedItems = equipment.filter((e) => selected.includes(e.id));

  const availableFilteredIds = filtered
    .filter((e) => e.available_quantity >= 1 && e.status === "available")
    .map((e) => e.id);
  const allAvailableSelected =
    availableFilteredIds.length > 0 &&
    availableFilteredIds.every((id) => selected.includes(id));

  const dbCategories = [
    ...new Set(
      equipment.map((e) => e.categories?.name).filter(Boolean) as string[]
    ),
  ];
  const categories = ["All", ...dbCategories];

  const subjectTags = [
    ...new Set(
      equipment.flatMap((e) => e.subject_tags || []).filter(Boolean) as string[]
    ),
  ];
  const subjects = ["All Subjects", ...subjectTags];

  const handleSubmit = async () => {
    if (!purpose || !returnDate) {
      Alert.alert("Error", "Fill in purpose and return date");
      return;
    }
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

    const primaryItem = selectedItems[0];
    const eqName = primaryItem?.name || "equipment";
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

    await supabase.rpc("create_borrow_notification" as never, {
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_title: "Borrow Request Submitted",
      p_message: `Your request to borrow ${totalQty} ${eqName} has been submitted successfully.`,
      p_reference_id: data,
    } as never);

    const { data: profile } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", (await supabase.auth.getUser()).data.user?.id)
      .single();
    const studentName = profile?.full_name || "Student";
    await supabase.rpc("notify_role_users" as never, {
      p_role: "admin",
      p_title: "New Borrow Request",
      p_message: `${studentName} requested to borrow ${totalQty} ${eqName}.`,
      p_type: "borrow_status",
      p_reference_type: "borrow_request",
      p_reference_id: data,
    } as never);

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

  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (event.type === "dismissed" || !selectedDate) return;
    const iso = `${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1
    ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    setReturnDate(iso);
    setMinReturnDate(selectedDate);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View
            style={{
              width: 50,
              height: 18,
              backgroundColor: "rgba(255,255,255,0.3)",
              borderRadius: 4,
            }}
          />
          <View
            style={{
              width: 180,
              height: 24,
              backgroundColor: "rgba(255,255,255,0.3)",
              borderRadius: 4,
              marginTop: 8,
            }}
          />
        </View>
        <View style={[styles.searchWrap, { backgroundColor: COLORS.card }]}>
          <SkeletonBlock style={{ flex: 1, height: 20 }} />
        </View>
        <View style={styles.chipRowContent}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonBlock
              key={i}
              style={{ width: 90, height: 32, borderRadius: 20 }}
            />
          ))}
        </View>
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          numColumns={2}
          contentContainerStyle={{ padding: 12 }}
          columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
          renderItem={() => (
            <View
              style={[styles.itemCard, { backgroundColor: COLORS.card, padding: 14 }]}
            >
              <SkeletonBlock style={{ height: 14, width: "80%", marginBottom: 8 }} />
              <SkeletonBlock style={{ height: 11, width: "50%", marginBottom: 6 }} />
              <SkeletonBlock style={{ height: 11, width: "60%" }} />
            </View>
          )}
          keyExtractor={(_, i) => String(i)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {step === "browse" ? (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backBtn}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Borrow Equipment</Text>
            <Text style={styles.hint}>Tap to select equipment for borrowing</Text>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={COLORS.silver} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search equipment..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={COLORS.silver}
            />
          </View>

          {dbCategories.length > 1 && (
          <View style={styles.chipRowWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRowContent}
            >
              {categories.map((cat) => {
                const isActive =
                  (cat === "All" && selectedCategory === null) ||
                  cat === selectedCategory;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.chip,
                      isActive ? styles.chipActive : styles.chipInactive,
                    ]}
                    onPress={() =>
                      setSelectedCategory(cat === "All" ? null : cat)
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isActive
                          ? styles.chipTextActive
                          : styles.chipTextInactive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          )}

          {subjectTags.length > 1 && (
            <View style={styles.chipRowWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRowContent}
              >
                {subjects.map((sub) => {
                  const isActive =
                    (sub === "All Subjects" && selectedSubject === null) ||
                    sub === selectedSubject;
                  return (
                    <TouchableOpacity
                      key={sub}
                      style={[
                        styles.chip,
                        isActive ? styles.chipActive : styles.chipInactive,
                      ]}
                      onPress={() =>
                        setSelectedSubject(
                          sub === "All Subjects" ? null : sub
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isActive
                            ? styles.chipTextActive
                            : styles.chipTextInactive,
                        ]}
                      >
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {selected.length > 0 && (
            <View style={styles.selectBar}>
              <TouchableOpacity onPress={() => setSelected([])}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="close" size={16} color={COLORS.card} />
                  <Text style={{ color: COLORS.card, fontSize: 14 }}>Clear</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  setSelected(allAvailableSelected ? [] : availableFilteredIds)
                }
              >
                <Text style={{ color: COLORS.card, fontSize: 13, fontWeight: "600" }}>
                  {allAvailableSelected ? "Deselect All" : "Select All"}
                </Text>
              </TouchableOpacity>
              <Text style={{ color: COLORS.card, fontWeight: "bold" }}>
                {selected.length} selected
              </Text>
              <TouchableOpacity
                style={styles.borrowBtn}
                onPress={() => setStep("form")}
              >
                <Text style={{ color: COLORS.navy, fontWeight: "bold", fontSize: 13 }}>
                  Next →
                </Text>
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
              const unavailable =
                item.available_quantity < 1 || item.status !== "available";
              return (
                <TouchableOpacity
                  style={[
                    styles.itemCard,
                    isSelected && styles.itemSelected,
                    unavailable && styles.itemUnavailable,
                  ]}
                  onPress={() => toggleSelect(item.id)}
                  disabled={unavailable}
                  activeOpacity={0.7}
                >
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCat}>
                    {item.categories?.name || "—"}
                  </Text>
                  <Text
                    style={[
                      styles.itemQty,
                      { color: unavailable ? COLORS.destructive : COLORS.success },
                    ]}
                  >
                    {unavailable
                      ? "Unavailable"
                      : `${item.available_quantity} available`}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark" size={14} color={COLORS.card} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={{ padding: 40, alignItems: "center" }}>
                <Ionicons name="search" size={48} color={COLORS.slate} />
                <Text
                  style={{
                    fontSize: 16,
                    color: COLORS.slate,
                    fontWeight: "bold",
                  }}
                >
                  No equipment found
                </Text>
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
                    onPress={() =>
                      setQuantities((q) => ({
                        ...q,
                        [item.id]: Math.max(1, (q[item.id] || 1) - 1),
                      }))
                    }
                  >
                    <Text style={{ fontSize: 18, color: COLORS.slate }}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepCount}>
                    {quantities[item.id] || 1}
                  </Text>
                  <TouchableOpacity
                    style={[styles.stepBtn, { borderColor: COLORS.teal }]}
                    onPress={() =>
                      setQuantities((q) => ({
                        ...q,
                        [item.id]: Math.min(
                          item.available_quantity,
                          (q[item.id] || 1) + 1
                        ),
                      }))
                    }
                  >
                    <Text style={{ fontSize: 18, color: COLORS.teal }}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <Text style={styles.formLabel}>Purpose *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Briefly describe purpose..."
              value={purpose}
              onChangeText={setPurpose}
              multiline
              placeholderTextColor={COLORS.silver}
            />

            <Text style={styles.formLabel}>Return Date *</Text>
            <TouchableOpacity
              style={styles.formInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text
                style={{
                  fontSize: 15,
                  color: returnDate ? COLORS.navy : COLORS.silver,
                }}
              >
                {returnDate || "Tap to pick a date"}
              </Text>
            </TouchableOpacity>
            {showDatePicker && Platform.OS === "web" && (
              <input
                type="date"
                min={minReturnDate.toISOString().split("T")[0]}
                value={returnDate}
                onChange={(e) => {
                  setReturnDate(e.target.value);
                  setMinReturnDate(new Date(e.target.value));
                  setShowDatePicker(false);
                }}
                style={{
                  backgroundColor: COLORS.background,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  padding: 12,
                  fontSize: 15,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            )}
            {showDatePicker && Platform.OS !== "web" && DateTimePicker && (
              <DateTimePicker
                value={minReturnDate}
                mode="date"
                minimumDate={minReturnDate}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onChangeDate}
              />
            )}

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.card} />
              ) : (
                <Text style={styles.submitText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.navy, padding: 20, paddingTop: 50 },
  backBtn: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  title: { color: COLORS.card, fontSize: 22, fontWeight: "bold" },
  hint: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    margin: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  searchInput: { flex: 1, height: 48, fontSize: 15, color: COLORS.navy },
  selectBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.tealDark,
    padding: 12,
    marginHorizontal: 12,
    borderRadius: 10,
  },
  borrowBtn: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  itemCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    position: "relative",
  },
  itemSelected: { borderWidth: 2, borderColor: COLORS.teal, backgroundColor: COLORS.tealLight },
  itemUnavailable: { opacity: 0.5 },
  itemName: { fontSize: 13, fontWeight: "bold", color: COLORS.navy },
  itemCat: { fontSize: 11, color: COLORS.silver, marginTop: 2 },
  itemQty: { fontSize: 11, fontWeight: "bold", marginTop: 4 },
  checkmark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.teal,
    justifyContent: "center",
    alignItems: "center",
  },
  formCard: {
    backgroundColor: COLORS.card,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  formItem: { marginBottom: 16 },
  formItemName: { fontSize: 15, fontWeight: "bold", color: COLORS.navy },
  stepper: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 12 },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  stepCount: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.navy,
    width: 40,
    textAlign: "center",
  },
  formLabel: { fontSize: 13, color: COLORS.slate, marginTop: 12, marginBottom: 4 },
  formInput: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 15,
    minHeight: 52,
    justifyContent: "center",
    color: COLORS.navy,
  },
  submitBtn: {
    backgroundColor: COLORS.teal,
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  submitText: { color: COLORS.card, fontSize: 15, fontWeight: "bold" },
  chipRowWrap: { height: 48, marginBottom: 8 },
  chipRowContent: { paddingHorizontal: 12, gap: 8, alignItems: "center", flexDirection: "row" as const },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  chipActive: { backgroundColor: COLORS.teal },
  chipInactive: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: COLORS.card },
  chipTextInactive: { color: COLORS.slate },
});
