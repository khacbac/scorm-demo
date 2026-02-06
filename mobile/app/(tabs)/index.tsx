import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const handleOpenViewer = useCallback(() => {
    router.push("/scorm-viewer");
  }, []);

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        <ThemedText type="title">SCORM Viewer</ThemedText>
        <ThemedText style={styles.subtitle}>
          Launch the SCORM runtime and inspect API calls for the bundled
          package.
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={handleOpenViewer}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: theme.tint },
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <ThemedText style={styles.primaryButtonLabel}>
            Open SCORM Viewer
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    gap: 16,
  },
  subtitle: {
    opacity: 0.7,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonPressed: {
    opacity: 0.7,
  },
  primaryButtonLabel: {
    color: "#fff",
    fontWeight: "600",
  },
});
