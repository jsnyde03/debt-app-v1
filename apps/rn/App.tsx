import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { allocatePaycheck } from "@core/engine/allocatePaycheck";

// Gate-1 parity proof: this screen runs the SHARED pure-TS engine from
// packages/core (imported via the @core alias, bundled by Metro) — identical
// to what the Capacitor app calls. If the numbers below render, the core works
// unchanged under React Native.
const result = allocatePaycheck({
  paycheckAmount: 2100,
  currentDate: "2026-05-23",
  nextPaycheckDate: "2026-06-05",
  strategy: "snowball",
  expenses: [
    { id: "phone", name: "Phone", amount: 90, dueDate: "2026-05-28", recurrence: "monthly" },
  ],
  debts: [
    {
      id: "visa",
      name: "Visa",
      balance: 700,
      minimumPayment: 70,
      apr: 19,
      dueDate: "2026-05-29",
      type: "debt",
      recurrence: "monthly",
    },
  ],
  goals: [
    { id: "ef", name: "Emergency Fund", targetAmount: 1000, currentAmount: 250, type: "emergency" },
  ],
});

const money = (n: number) => `$${n.toFixed(2)}`;

export default function App() {
  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Debt Planner · React Native (Gate 1)</Text>
        <Text style={styles.title}>Here's exactly what to pay this paycheck</Text>
        <Text style={styles.subtitle}>Rendered from @core/engine — the shared brain</Text>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>This paycheck</Text>
          <Text style={styles.heroValue}>{money(result.paycheckAmount)}</Text>
          <Text style={styles.heroMeta}>
            Required {money(result.totalRequired)} · Remaining {money(result.remaining)}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Allocations</Text>
        {result.allocations.map((a, i) => (
          <View key={`${a.category}-${i}`} style={styles.row}>
            <Text style={styles.rowLabel}>{a.label}</Text>
            <Text style={styles.rowAmount}>{money(a.amount)}</Text>
          </View>
        ))}
        {result.allocations.length === 0 && <Text style={styles.heroMeta}>No allocations</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#07111f" },
  content: { padding: 20, paddingTop: 64, gap: 8 },
  eyebrow: { color: "#7dd3fc", fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  title: { color: "#f8fafc", fontSize: 24, fontWeight: "800", marginTop: 4 },
  subtitle: { color: "#94a3b8", fontSize: 13, marginBottom: 12 },
  hero: { backgroundColor: "#0f1e33", borderRadius: 16, padding: 20, marginVertical: 12 },
  heroLabel: { color: "#94a3b8", fontSize: 13 },
  heroValue: { color: "#f8fafc", fontSize: 36, fontWeight: "800", marginVertical: 2 },
  heroMeta: { color: "#7dd3fc", fontSize: 13 },
  sectionTitle: { color: "#e2e8f0", fontSize: 16, fontWeight: "700", marginTop: 12, marginBottom: 4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1e293b",
  },
  rowLabel: { color: "#e2e8f0", fontSize: 15 },
  rowAmount: { color: "#f8fafc", fontSize: 15, fontWeight: "700" },
});
