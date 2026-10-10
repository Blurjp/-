import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { VaultProvider, useVault } from "./src/state/VaultContext";
import { ConsentScreen } from "./src/screens/ConsentScreen";
import { ImportScreen } from "./src/screens/ImportScreen";
import { ChatScreen } from "./src/screens/ChatScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { colors } from "./src/ui";

const TABS = [
  { key: "consent", label: "家人同意" },
  { key: "import", label: "导入资料" },
  { key: "chat", label: "对话" },
  { key: "settings", label: "设置" },
] as const;
type Tab = (typeof TABS)[number]["key"];

function Shell() {
  const { ready } = useVault();
  const [tab, setTab] = useState<Tab>("consent");
  if (!ready) return null;
  const body =
    tab === "consent" ? <ConsentScreen /> : tab === "import" ? <ImportScreen /> : tab === "chat" ? <ChatScreen /> : <SettingsScreen />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {tab === "chat" ? (
          <View style={{ flex: 1, padding: 12 }}>{body}</View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 12 }}>{body}</ScrollView>
        )}
      </KeyboardAvoidingView>
      <View style={{ flexDirection: "row", borderTopWidth: 0.5, borderColor: "#d8d0c6", backgroundColor: colors.card }}>
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => setTab(t.key)} style={{ flex: 1, paddingVertical: 12, alignItems: "center" }}>
            <Text style={{ color: tab === t.key ? colors.accent : colors.muted, fontWeight: tab === t.key ? "600" : "400" }}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <VaultProvider>
      <Shell />
    </VaultProvider>
  );
}
