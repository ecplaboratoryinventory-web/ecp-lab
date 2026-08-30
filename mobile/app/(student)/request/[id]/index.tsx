import { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, TextInput, Animated } from "react-native";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS } from "@/lib/theme";
import { statusColor, statusLabel } from "@/lib/status";
import { Ionicons } from "@expo/vector-icons";

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
  return <Animated.View style={[{ backgroundColor: COLORS.border, borderRadius: 8 }, style, { opacity }]} />;
}

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [damageOpen, setDamageOpen] = useState(false);
  const [damageDesc, setDamageDesc] = useState("");
  const [damageSeverity, setDamageSeverity] = useState("minor");
  const [reporting, setReporting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("borrow_requests").select("*, borrow_items(*, equipment:equipment_id(id, name)), users!borrow_requests_user_id_fkey(full_name, id_no)").eq("id", id).single();
      setRequest(data);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const steps = ["Pending", "Borrowed", "Returned"];
  const statusIndex: Record<string, number> = { pending: 0, approved: 0, borrowed: 1, return_requested: 1, returned: 2, damaged: 2 };
  const currentStep = statusIndex[request?.status] ?? -1;

  const handleDamageReport = async () => {
    if (!damageDesc) { Alert.alert("Error", "Describe the damage"); return; }
    setReporting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("damage_reports").insert({
      user_id: user.id,
      equipment_id: request?.borrow_items?.[0]?.equipment_id,
      borrow_request_id: id,
      description: damageDesc,
      severity: damageSeverity,
      status: "pending",
    });
    setReporting(false);
    if (error) { Alert.alert("Error", error.message); return; }
    setDamageOpen(false);
    setDamageDesc("");
    setDamageSeverity("minor");
    Alert.alert("Reported", "Damage report submitted");
  };

  const handleCancel = async () => {
    Alert.alert("Cancel Request?", "This will cancel your pending borrow request.", [
      { text: "Keep Request", style: "cancel" },
      {
        text: "Cancel", style: "destructive",
        onPress: async () => {
          setCancelling(true);
          const { error } = await supabase.rpc("cancel_borrow_request", { p_request_id: id });
          setCancelling(false);
          if (error) { Alert.alert("Error", error.message); return; }
          Alert.alert("Cancelled", "Your borrow request has been cancelled.", [
            { text: "OK", onPress: () => router.back() },
          ]);
        },
      },
    ]);
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
        <View style={[styles.card, { margin: 16, borderRadius: 16, padding: 20, backgroundColor: COLORS.card }]}>
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
          <View style={[styles.statusBadge, { backgroundColor: statusColor(request.status) }]}>
            <Text style={styles.statusText}>{statusLabel(request.status)}</Text>
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

        {/* Return request submitted notice */}
        {request.status === "return_requested" && (
          <View style={styles.returnRequestCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="time-outline" size={14} color={COLORS.tealDark} />
              <Text style={styles.returnRequestTitle}>Return Request Submitted</Text>
            </View>
            <Text style={styles.returnRequestText}>
              Awaiting confirmation from the laboratory custodian.
            </Text>
          </View>
        )}

        {/* Damaged notice */}
        {request.status === "damaged" && (
          <View style={styles.damagedNoticeCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="warning" size={14} color={COLORS.destructive} />
              <Text style={styles.damagedNoticeTitle}>Equipment Damaged</Text>
            </View>
            <Text style={styles.damagedNoticeText}>
              This equipment was reported as damaged. Refer to your damage reports for details.
            </Text>
          </View>
        )}

        {/* Damage Report (only when borrowed) */}
        {request.status === "borrowed" && (
          <View style={styles.damageCard}>
            {!damageOpen ? (
              <TouchableOpacity onPress={() => setDamageOpen(true)}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="warning" size={14} color={COLORS.destructive} />
                  <Text style={styles.damageTitle}>Report Equipment Damage</Text>
                </View>
                <Text style={styles.damageHint}>Noticed damage? Let us know.</Text>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.damageTitle}>Report Damage</Text>
                <Text style={styles.damageHint}>Select severity</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                  {["minor", "major", "critical"].map((sev) => (
                    <TouchableOpacity
                      key={sev}
                      style={[
                        styles.severityBtn,
                        damageSeverity === sev && { backgroundColor: COLORS.destructive, borderColor: COLORS.destructive },
                      ]}
                      onPress={() => setDamageSeverity(sev)}
                    >
                      <Text style={[styles.severityText, damageSeverity === sev && { color: COLORS.card }]}>
                        {sev[0].toUpperCase() + sev.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.damageInput}
                  placeholder="Describe the damage..."
                  value={damageDesc}
                  onChangeText={setDamageDesc}
                  multiline
                />
                <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setDamageOpen(false)}>
                    <Text style={{ color: COLORS.slate }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.reportBtn} onPress={handleDamageReport} disabled={reporting}>
                    {reporting ? <ActivityIndicator color={COLORS.card} /> : <Text style={{ color: COLORS.card, fontWeight: "bold" }}>Submit Report</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        {/* Return (when active) */}
        {(request.status === "borrowed" || request.status === "approved") && (
          <View style={styles.returnCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="cube-outline" size={14} color={COLORS.tealDark} />
              <Text style={styles.returnTitle}>Return Equipment</Text>
            </View>
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

        {/* Cancel (only when pending) */}
        {request.status === "pending" && (
          <View style={styles.cancelCard}>
            <Text style={styles.cancelTitle}>Changed your mind?</Text>
            <TouchableOpacity style={styles.cancelActionBtn} onPress={handleCancel} disabled={cancelling}>
              {cancelling ? <ActivityIndicator color={COLORS.destructive} /> : <Text style={styles.cancelActionText}>Cancel Request</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.navy, padding: 20, paddingTop: 50 },
  backBtn: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
  title: { color: COLORS.card, fontSize: 18, fontWeight: "bold", marginTop: 8 },
  statusBadge: { position: "absolute", top: 50, right: 20, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 14 },
  statusText: { color: COLORS.card, fontSize: 11, fontWeight: "bold", textTransform: "uppercase" },
  tracker: { flexDirection: "row", alignItems: "flex-start", padding: 24, paddingBottom: 8 },
  stepWrap: { flex: 1, alignItems: "center" },
  stepDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.border },
  stepDone: { backgroundColor: COLORS.success },
  stepActive: { backgroundColor: COLORS.info },
  stepDenied: { backgroundColor: COLORS.destructive },
  stepLine: { position: "absolute", top: 8, right: "-50%", width: "100%", height: 2, backgroundColor: COLORS.border, zIndex: -1 },
  stepLineDone: { backgroundColor: COLORS.teal },
  stepLabel: { fontSize: 10, color: COLORS.silver, marginTop: 6 },
  card: { backgroundColor: COLORS.card, margin: 16, borderRadius: 16, padding: 20, elevation: 4 },
  sectionLabel: { fontSize: 10, fontWeight: "bold", color: COLORS.teal, marginBottom: 14, letterSpacing: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  dLabel: { fontSize: 12, fontWeight: "bold", color: COLORS.silver, width: 100 },
  dValue: { fontSize: 13, color: COLORS.navy, flex: 1, textAlign: "right" },
  divider: { height: 1, backgroundColor: COLORS.border },
  damageCard: { margin: 16, backgroundColor: COLORS.background, borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: COLORS.destructive },
  damageTitle: { fontSize: 14, fontWeight: "bold", color: COLORS.destructive },
  damageHint: { fontSize: 12, color: COLORS.silver, marginTop: 4 },
  damageInput: { backgroundColor: COLORS.card, borderRadius: 8, borderWidth: 1, borderColor: COLORS.destructive, padding: 10, fontSize: 14, minHeight: 60, marginTop: 8 },
  severityBtn: { flex: 1, height: 40, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center" },
  severityText: { fontSize: 13, fontWeight: "bold", color: COLORS.destructive },
  cancelBtn: { flex: 1, height: 44, borderRadius: 10, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center" },
  reportBtn: { flex: 1, height: 44, borderRadius: 10, backgroundColor: COLORS.destructive, justifyContent: "center", alignItems: "center" },
  deniedCard: { margin: 16, backgroundColor: COLORS.background, borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: COLORS.destructive },
  deniedTitle: { fontSize: 14, fontWeight: "bold", color: COLORS.destructive },
  deniedText: { fontSize: 13, color: COLORS.slate, marginTop: 4 },
  returnCard: { margin: 16, backgroundColor: COLORS.tealLight, borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: COLORS.teal },
  returnRequestCard: { margin: 16, backgroundColor: COLORS.tealLight, borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: COLORS.teal },
  returnRequestTitle: { fontSize: 14, fontWeight: "bold", color: COLORS.tealDark },
  returnRequestText: { fontSize: 12, color: COLORS.slate, marginTop: 4 },
  damagedNoticeCard: { margin: 16, backgroundColor: COLORS.background, borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: COLORS.destructive },
  damagedNoticeTitle: { fontSize: 14, fontWeight: "bold", color: COLORS.destructive },
  damagedNoticeText: { fontSize: 12, color: COLORS.slate, marginTop: 4 },
  returnTitle: { fontSize: 14, fontWeight: "bold", color: COLORS.tealDark },
  returnHint: { fontSize: 12, color: COLORS.slate, marginTop: 4 },
  returnBtn: { marginTop: 12, backgroundColor: COLORS.teal, height: 46, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  returnBtnText: { color: COLORS.card, fontSize: 14, fontWeight: "bold" },
  cancelCard: { margin: 16, backgroundColor: COLORS.background, borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: COLORS.destructive },
  cancelTitle: { fontSize: 14, fontWeight: "bold", color: COLORS.destructive },
  cancelActionBtn: {
    marginTop: 10, height: 46, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.destructive,
    justifyContent: "center", alignItems: "center",
  },
  cancelActionText: { color: COLORS.destructive, fontSize: 14, fontWeight: "bold" },
});
