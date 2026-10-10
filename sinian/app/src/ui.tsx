import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

export const colors = {
  bg: "#f7f4ef",
  card: "#ffffff",
  ink: "#2b2622",
  muted: "#7a716a",
  accent: "#8a5a44",
  danger: "#b3261e",
  ai: "#e9e1d6",
};

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.h2}>{title}</Text>
      {children}
    </View>
  );
}

export function Button({ label, onPress, kind = "primary", disabled }: {
  label: string;
  onPress: () => void;
  kind?: "primary" | "plain" | "danger";
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[s.btn, kind === "plain" && s.btnPlain, kind === "danger" && s.btnDanger, disabled && { opacity: 0.4 }]}
    >
      <Text style={[s.btnText, kind === "plain" && { color: colors.accent }]}>{label}</Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={s.label}>{props.label}</Text>
      <TextInput placeholderTextColor={colors.muted} {...props} style={[s.input, props.multiline && { minHeight: 80 }]} />
    </View>
  );
}

export function Note({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "danger" }) {
  return <Text style={[s.note, tone === "danger" && { color: colors.danger }]}>{children}</Text>;
}

export const s = StyleSheet.create({
  section: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12 },
  h2: { fontSize: 17, fontWeight: "600", color: colors.ink, marginBottom: 10 },
  label: { fontSize: 13, color: colors.muted, marginBottom: 4 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderColor: "#cfc6bc", borderRadius: 8, padding: 10, fontSize: 16, color: colors.ink },
  btn: { backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center", marginTop: 8 },
  btnPlain: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.accent },
  btnDanger: { backgroundColor: colors.danger },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  note: { fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  chip: { borderRadius: 16, borderWidth: 1, borderColor: colors.accent, paddingHorizontal: 12, paddingVertical: 6 },
  chipOn: { backgroundColor: colors.accent },
});

export function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, on && s.chipOn]} accessibilityState={{ selected: on }}>
      <Text style={{ color: on ? "#fff" : colors.accent }}>{label}</Text>
    </Pressable>
  );
}
