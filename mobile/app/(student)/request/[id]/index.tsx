import { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, TextInput, Animated } from "react-native";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";

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

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [damageOpen, setDamageOpen] = useState(false);
  const [damageDesc, setDamageDesc] = useState("");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("borrow_requests").select("*, borrow_items(*, equipment:equipment_id(id, name)), users!borrow_requests_user_id_fkey(full_name, id_no)").eq("id", id).single();
      setRequest(data);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const steps = ["Pending", "Borrowed", "Returned"];
  const statusIndex: Record<string, number> = { pending: 0, approved: 0, borrowed: 1, returned: 2 };
  const currentStep = statusIndex[request?.status] ?? -1;

  const handleDamageReport = async () => {
    if (!damageDesc) { Alert.alert("Error", "Describe the damage"); return; }
    setReporting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("damage_reports").insert({
      user_id: user.id,
      equipment_id: request?.borrow_items?.[0]?.equipment_id,
      borrow_request_id: id,
      description: damageDesc,
      severity: "minor",
      status: "pending",
    });
    setReporting(false);
    setDamageOpen(false);
    Alert.alert("Reported", "Damage report submitted");
  };

  if (loading) return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <SkeletonBlock style={{ width: 60, height: 14, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 4 }} />
          <SkeletonBlock style={{ width: 200, height: 20, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 4, marginTop: 10 }} />
        </View>
        <View style={[styles.tracker, { flexDirection: "row" }]}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ flex: 1, alignItems: "center" }}>
              <SkeletonBlock style={{ width: 16, height: 16, borderRadius: 8 }} />
              <SkeletonBlock style={{ width: 50, height: 10, marginTop: 6 }} />
            </View>
          ))}
        </View>
        <View style={[styles.card, { margin: 16, borderRadius: 16, padding: 20, backgroundColor: "#fff" }]}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i}>
              <View style={[styles.row, { marginBottom: i < 5 ? 0 : 0 }]}>
                <SkeletonBlock style={{ height: 12, width: 80 }} />
                <SkeletonBlock style={{ height: 13, width: 140 }} />
              </View>
              {i < 5 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
  if (!request) return <Text style={{ textAlign: "center", marginTop: 60 }}>Request not found</Text>;

  const isDenied = request.status === "denied" || request.status === "rejected";

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Borrow Request Tracking</Text>
          <View style={[styles.statusBadge, { backgroundColor: isDenied ? "#E74C3C" : "#008080" }]}>
            <Text style={styles.statusText}>{request.status}</Text>
          </View>
        </View>

        {/* Step Progress */}
        <View style={styles.tracker}>
          {steps.map((step, i) => {
            const done = i <= currentStep;
            const active = i === currentStep;
            return (
              <View key={step} style={styles.stepWrap}>
                <View style={[styles.stepDot, done && styles.stepDone, active && styles.stepActive, isDenied && styles.stepDenied]} />
                {i < steps.length - 1 && <View style={[styles.stepLine, done && styles.stepLineDone]} />}
                <Text style={styles.stepLabel}>{step}</Text>
              </View>
            );
          })}
        </View>

        {/* Details */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>REQUEST DETAILS</Text>
          <View style={styles.row}>
            <Text style={styles.dLabel}>Student</Text>
            <Text style={styles.dValue}>{request.users?.full_name || "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.dLabel}>Equipment</Text>
            <Text style={styles.dValue}>{request.borrow_items?.map((bi: any) => `${bi.equipment?.name} (x${bi.quantity})`).join(", ") || "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.dLabel}>Borrow Date</Text>
            <Text style={styles.dValue}>{request.borrow_date ? new Date(request.borrow_date).toLocaleDateString() : "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.dLabel}>Return By</Text>
            <Text style={styles.dValue}>{request.return_date ? new Date(request.return_date).toLocaleDateString() : "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.dLabel}>Purpose</Text>
            <Text style={styles.dValue}>{request.purpose || "—"}</Text>
          </View>
        </View>

        {/* Damage Report (only when borrowed) */}
        {request.status === "borrowed" && (
          <View style={styles.damageCard}>
            {!damageOpen ? (
              <TouchableOpacity onPress={() => setDamageOpen(true)}>
                <Text style={styles.damageTitle}>⚠ Report Equipment Damage</Text>
                <Text style={styles.damageHint}>Noticed damage? Let us know.</Text>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.damageTitle}>Report Damage</Text>
                <TextInput
                  style={styles.damageInput}
                  placeholder="Describe the damage..."
                  value={damageDesc}
                  onChangeText={setDamageDesc}
                  multiline
                />
                <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setDamageOpen(false)}>
                    <Text style={{ color: "#757575" }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.reportBtn} onPress={handleDamageReport} disabled={reporting}>
                    {reporting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "bold" }}>Submit Report</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        {/* Return (when active) */}
        {(request.status === "borrowed" || request.status === "approved") && (
          <View style={styles.returnCard}>
            <Text style={styles.returnTitle}>📦 Return Equipment</Text>
            <Text style={styles.returnHint}>
              {request.status === "borrowed" ? "Done using these items? Return them now." : "Items are ready for pickup. Return them after use."}
            </Text>
            <TouchableOpacity
              style={styles.returnBtn}
              onPress={() => router.push("/(student)/return")}
            >
              <Text style={styles.returnBtnText}>Return Items</Text>
            </TouchableOpacity>
          </View>
        )}

        {isDenied && request.denied_reason && (
          <View style={styles.deniedCard}>
            <Text style={styles.deniedTitle}>Reason for Denial</Text>
            <Text style={styles.deniedText}>{request.denied_reason}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4FF" },
  header: { backgroundColor: "#1A2980", padding: 20, paddingTop: 50 },
  backBtn: { color: "#D0E8FF", fontSize: 14 },
  title: { color: "#fff", fontSize: 18, fontWeight: "bold", marginTop: 8 },
  statusBadge: { position: "absolute", top: 50, right: 20, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 14 },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "bold", textTransform: "uppercase" },
  tracker: { flexDirection: "row", alignItems: "flex-start", padding: 24, paddingBottom: 8 },
  stepWrap: { flex: 1, alignItems: "center" },
  stepDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#e0e0e0" },
  stepDone: { backgroundColor: "#2ECC71" },
  stepActive: { backgroundColor: "#3498DB" },
  stepDenied: { backgroundColor: "#E74C3C" },
  stepLine: { position: "absolute", top: 8, right: "-50%", width: "100%", height: 2, backgroundColor: "#E0E4EF", zIndex: -1 },
  stepLineDone: { backgroundColor: "#008080" },
  stepLabel: { fontSize: 10, color: "#8A8FA8", marginTop: 6 },
  card: { backgroundColor: "#fff", margin: 16, borderRadius: 16, padding: 20, elevation: 4 },
  sectionLabel: { fontSize: 10, fontWeight: "bold", color: "#008080", marginBottom: 14, letterSpacing: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  dLabel: { fontSize: 12, fontWeight: "bold", color: "#8A8FA8", width: 100 },
  dValue: { fontSize: 13, color: "#1A1A2E", flex: 1, textAlign: "right" },
  divider: { height: 1, backgroundColor: "#F2F4F8" },
  damageCard: { margin: 16, backgroundColor: "#FFF8F8", borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: "#E53935" },
  damageTitle: { fontSize: 14, fontWeight: "bold", color: "#C62828" },
  damageHint: { fontSize: 12, color: "#B0B5C8", marginTop: 4 },
  damageInput: { backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#E53935", padding: 10, fontSize: 14, minHeight: 60, marginTop: 8 },
  cancelBtn: { flex: 1, height: 44, borderRadius: 10, backgroundColor: "#E0E0E0", justifyContent: "center", alignItems: "center" },
  reportBtn: { flex: 1, height: 44, borderRadius: 10, backgroundColor: "#E53935", justifyContent: "center", alignItems: "center" },
  deniedCard: { margin: 16, backgroundColor: "#FFF5F5", borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: "#E74C3C" },
  deniedTitle: { fontSize: 14, fontWeight: "bold", color: "#C62828" },
  deniedText: { fontSize: 13, color: "#555", marginTop: 4 },
  returnCard: { margin: 16, backgroundColor: "#E6FFFA", borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: "#0ea5a0" },
  returnTitle: { fontSize: 14, fontWeight: "bold", color: "#0f766e" },
  returnHint: { fontSize: 12, color: "#64748B", marginTop: 4 },
  returnBtn: { marginTop: 12, backgroundColor: "#0ea5a0", height: 46, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  returnBtnText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
});
