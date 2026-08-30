import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/lib/theme";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface Equipment {
  id: string;
  name: string;
  available_quantity: number;
  category_id: string;
  status: string;
  categories?: { name: string };
}

interface ClassSchedule {
  id: string;
  subject: string;
  section: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

export default function FacultyBorrowScreen() {
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filtered, setFiltered] = useState<Equipment[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [step, setStep] = useState<"browse" | "form">("browse");
  const [purpose, setPurpose] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      let query = supabase.from("equipment").select("*, categories(name)").order("name");

      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("department")
          .eq("id", user.id)
          .single();
        if (profile?.department) {
          query = query.eq("department", profile.department);
        }

        const { data: scheds } = await supabase
          .from("class_schedules")
          .select("id, subject, section, day_of_week, start_time, end_time")
          .eq("faculty_id", user.id)
          .order("day_of_week");
        setSchedules(scheds || []);
      }

      const { data } = await query;
      setEquipment(data || []);
      setFiltered(data || []);

      setLoading(false);
    };
    fetchData();
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
    if (!purpose) { Alert.alert("Error", "Please enter a purpose"); return; }
    setSubmitting(true);

    const items = selectedItems.map((item) => ({
      equipment_id: item.id,
      quantity: quantities[item.id] || 1,
    }));

    const { error } = await supabase.rpc("submit_faculty_borrow", {
      p_items: items,
      p_purpose: purpose,
      p_borrow_date: new Date().toISOString().split("T")[0],
      p_return_date: null,
      p_notes: null,
      p_class_schedule_id: selectedSchedule || null,
    });

    if (error) { Alert.alert("Error", error.message); setSubmitting(false); return; }

    setSubmitting(false);
    Alert.alert("Success", "Equipment borrowed successfully!", [
      { text: "OK", onPress: () => router.replace("/(faculty)/(tabs)/home") },
    ]);
  };

  if (loading) return <ActivityIndicator size="large" color={COLORS.navy} style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      {step === "browse" ? (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Borrow Equipment</Text>
            <Text style={styles.hint}>Select equipment and specify quantities</Text>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={COLORS.silver} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search equipment..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={COLORS.silver}
            />
          </View>

          {selected.length > 0 && (
            <View style={styles.selectBar}>
              <TouchableOpacity onPress={() => setSelected([])}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="close" size={16} color={COLORS.card} />
                  <Text style={styles.clearText}>Clear</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.selectedCount}>{selected.length} selected</Text>
              <TouchableOpacity style={styles.nextBtn} onPress={() => setStep("form")}>
                <Text style={styles.nextBtnText}>Next →</Text>
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
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemCat}>{item.categories?.name || "—"}</Text>
                  <Text style={[styles.itemQty, { color: unavailable ? COLORS.destructive : COLORS.success }]}>
                    {unavailable ? "Unavailable" : `${item.available_quantity} available`}
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
              <View style={styles.empty}>
                <Ionicons name="search" size={48} color={COLORS.silver} />
                <Text style={styles.emptyText}>No equipment found</Text>
              </View>
            }
          />
        </>
      ) : (
        <ScrollView>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setStep("browse")} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
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
                    <Text style={styles.stepBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepCount}>{quantities[item.id] || 1}</Text>
                  <TouchableOpacity
                    style={[styles.stepBtn, styles.stepBtnActive]}
                    onPress={() => setQuantities((q) => ({ ...q, [item.id]: Math.min(item.available_quantity, (q[item.id] || 1) + 1) }))}
                  >
                    <Text style={[styles.stepBtnText, { color: COLORS.teal }]}>+</Text>
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

            {schedules.length > 0 && (
              <>
                <Text style={styles.formLabel}>Class Schedule (Optional)</Text>
                <TouchableOpacity
                  style={styles.schedulePicker}
                  onPress={() => setShowSchedulePicker(!showSchedulePicker)}
                >
                  <Text style={styles.schedulePickerText}>
                    {selectedSchedule
                      ? schedules.find((s) => s.id === selectedSchedule)?.subject || "Selected"
                      : "Select a class schedule"}
                  </Text>
                  <Text style={styles.schedulePickerArrow}>{showSchedulePicker ? "▲" : "▼"}</Text>
                </TouchableOpacity>
                {showSchedulePicker && (
                  <View style={styles.scheduleList}>
                    <TouchableOpacity
                      style={[styles.scheduleOption, !selectedSchedule && styles.scheduleOptionActive]}
                      onPress={() => { setSelectedSchedule(null); setShowSchedulePicker(false); }}
                    >
                      <Text style={[styles.scheduleOptionText, !selectedSchedule && styles.scheduleOptionTextActive]}>
                        None
                      </Text>
                    </TouchableOpacity>
                    {schedules.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.scheduleOption, selectedSchedule === s.id && styles.scheduleOptionActive]}
                        onPress={() => { setSelectedSchedule(s.id); setShowSchedulePicker(false); }}
                      >
                        <Text style={[styles.scheduleOptionText, selectedSchedule === s.id && styles.scheduleOptionTextActive]}>
                          {s.subject} ({s.section})
                        </Text>
                        <Text style={styles.scheduleOptionMeta}>{s.day_of_week}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Faculty borrow requests are automatically approved.</Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.card} />
              ) : (
                <Text style={styles.submitText}>Confirm Borrow</Text>
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
  backBtn: { marginBottom: 8 },
  backBtnText: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
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
  },
  searchInput: { flex: 1, height: 48, fontSize: 15, color: COLORS.navy },
  selectBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.teal,
    padding: 12,
    marginHorizontal: 12,
    borderRadius: 10,
  },
  clearText: { color: COLORS.card, fontSize: 14 },
  selectedCount: { color: COLORS.card, fontWeight: "bold" },
  nextBtn: { backgroundColor: COLORS.card, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18 },
  nextBtnText: { color: COLORS.navy, fontWeight: "bold", fontSize: 13 },
  itemCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    elevation: 2,
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
  empty: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 16, color: COLORS.silver, fontWeight: "bold", marginTop: 8 },
  formCard: { backgroundColor: COLORS.card, margin: 16, borderRadius: 16, padding: 20, elevation: 4 },
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
  stepBtnActive: { borderColor: COLORS.teal },
  stepBtnText: { fontSize: 18, color: COLORS.slate },
  stepCount: { fontSize: 24, fontWeight: "bold", color: COLORS.navy, width: 40, textAlign: "center" },
  formLabel: { fontSize: 13, color: COLORS.slate, marginTop: 12, marginBottom: 4, fontWeight: "500" },
  formInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 15,
    minHeight: 52,
    color: COLORS.navy,
  },
  schedulePicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  schedulePickerText: { fontSize: 14, color: COLORS.slate },
  schedulePickerArrow: { fontSize: 12, color: COLORS.silver },
  scheduleList: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
    overflow: "hidden",
  },
  scheduleOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scheduleOptionActive: { backgroundColor: COLORS.tealLight },
  scheduleOptionText: { fontSize: 14, color: COLORS.slate, fontWeight: "500" },
  scheduleOptionTextActive: { color: COLORS.teal },
  scheduleOptionMeta: { fontSize: 12, color: COLORS.silver, marginTop: 2 },
  infoBox: { backgroundColor: COLORS.tealLight, borderRadius: 8, padding: 12, marginTop: 16 },
  infoText: { fontSize: 13, color: COLORS.teal, fontWeight: "500" },
  submitBtn: {
    backgroundColor: COLORS.teal,
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: COLORS.card, fontSize: 15, fontWeight: "bold" },
});
