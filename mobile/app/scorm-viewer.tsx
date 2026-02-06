import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { buildScormRuntimeScript, ScormState } from "@/scorm/scormRuntime";

const PACKAGE_ID = "Quiz18092025";
const STORAGE_KEY = `scorm12_cmi_${PACKAGE_ID}`;
const SCORM_INDEX = require("@/assets/scorm/res/index.html");

const WEBVIEW_SOURCE = Platform.select({
  ios: SCORM_INDEX,
  android: { uri: "file:///android_asset/scorm/res/index.html" },
  default: null,
});

type ScormMessage = {
  type: "SCORM_STATE";
  payload: ScormState;
};

export default function ScormViewerScreen() {
  const colorScheme = useColorScheme();
  const webViewRef = useRef<WebView>(null);
  const theme = Colors[colorScheme ?? "light"];
  const [initialCmi, setInitialCmi] = useState<ScormState["cmi"] | null>(null);
  const [scormState, setScormState] = useState<ScormState | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadCmi = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!isMounted) return;
        if (raw) {
          setInitialCmi(JSON.parse(raw));
        } else {
          setInitialCmi(null);
        }
      } catch {
        if (isMounted) {
          setInitialCmi(null);
        }
      }
    };
    loadCmi();
    return () => {
      isMounted = false;
    };
  }, []);

  const injectedRuntime = useMemo(() => {
    return buildScormRuntimeScript({
      packageId: PACKAGE_ID,
      initialCmi: initialCmi ?? undefined,
    });
  }, [initialCmi]);

  const handleMessage = useCallback(async (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as ScormMessage;
      if (message.type === "SCORM_STATE") {
        setScormState(message.payload);
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(message.payload.cmi),
        );
      }
    } catch {
      // ignore malformed messages
    }
  }, []);

  const handleReset = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setScormState(null);
    webViewRef.current?.injectJavaScript(
      "window.__SCORM_RESET__ && window.__SCORM_RESET__(); true;",
    );
  }, []);

  const handleRefreshInspector = useCallback(() => {
    webViewRef.current?.injectJavaScript(
      "window.__SCORM_GET_STATE__ && window.__SCORM_GET_STATE__(); true;",
    );
  }, []);

  if (Platform.OS === "web") {
    return (
      <ThemedView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <ThemedText type="title">SCORM Viewer</ThemedText>
        <ThemedText style={styles.notice}>
          The SCORM WebView is only available on iOS and Android builds.
        </ThemedText>
      </ThemedView>
    );
  }

  if (!WEBVIEW_SOURCE || !injectedRuntime) {
    return (
      <ThemedView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <ThemedText type="title">SCORM Viewer</ThemedText>
        <ThemedText style={styles.notice}>Preparing SCORM runtime…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View
        style={[styles.header, { borderBottomColor: theme.icon + "22" }]}
      >
        <View style={styles.headerText}>
          <ThemedText type="title">SCORM Viewer</ThemedText>
          <ThemedText style={styles.subtitle}>
            Package: <ThemedText style={styles.code}>{PACKAGE_ID}</ThemedText>
          </ThemedText>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            onPress={handleRefreshInspector}
            style={({ pressed }) => [
              styles.actionButton,
              { borderColor: theme.icon + "44" },
              pressed && styles.actionButtonPressed,
            ]}
          >
            <ThemedText style={styles.actionLabel}>Refresh</ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={handleReset}
            style={({ pressed }) => [
              styles.actionButton,
              { borderColor: theme.icon + "44" },
              pressed && styles.actionButtonPressed,
            ]}
          >
            <ThemedText style={styles.actionLabel}>Reset</ThemedText>
          </Pressable>
        </View>
      </View>

      <View
        style={[styles.viewerSection, { borderBottomColor: theme.icon + "22" }]}
      >
        <WebView
          ref={webViewRef}
          source={WEBVIEW_SOURCE}
          originWhitelist={["*"]}
          allowFileAccess
          injectedJavaScriptBeforeContentLoaded={injectedRuntime}
          onMessage={handleMessage}
          onLoadEnd={() => {
            setIsReady(true);
            webViewRef.current?.injectJavaScript(
              "window.__SCORM_GET_STATE__ && window.__SCORM_GET_STATE__(); true;",
            );
          }}
          style={styles.webview}
        />
        {!isReady && (
          <View
            style={[
              styles.loadingOverlay,
              { backgroundColor: theme.background + "CC" },
            ]}
          >
            <ThemedText>Loading SCORM package…</ThemedText>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.inspector}
        contentContainerStyle={styles.inspectorContent}
      >
        <ThemedText type="subtitle">Runtime Inspector</ThemedText>
        {!scormState && (
          <ThemedText style={styles.notice}>
            Waiting for SCORM API state…
          </ThemedText>
        )}
        {scormState && (
          <>
            <View style={[styles.card, { borderColor: theme.icon + "22" }]}>
              <ThemedText type="defaultSemiBold">Session</ThemedText>
              <ThemedText style={styles.statusLine}>
                Status:{" "}
                <ThemedText style={styles.code}>{scormState.status}</ThemedText>
              </ThemedText>
              <ThemedText style={styles.codeBlock}>
                {JSON.stringify(scormState.cmi, null, 2)}
              </ThemedText>
            </View>

            <View style={[styles.card, { borderColor: theme.icon + "22" }]}>
              <ThemedText type="defaultSemiBold">Recent API Calls</ThemedText>
              {scormState.logs.length === 0 ? (
                <ThemedText style={styles.notice}>
                  No calls yet. Launch the SCO and interact with it.
                </ThemedText>
              ) : (
                scormState.logs
                  .slice()
                  .reverse()
                  .slice(0, 50)
                  .map((log, index) => (
                    <View
                      key={`${log.time}-${index}`}
                      style={[
                        styles.logItem,
                        { borderTopColor: theme.icon + "22" },
                      ]}
                    >
                      <View style={styles.logHeader}>
                        <ThemedText style={styles.logMethod}>
                          {log.method}
                        </ThemedText>
                        <ThemedText style={styles.logTime}>
                          {log.time}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.codeBlock}>
                        {JSON.stringify(
                          { args: log.args, result: log.result },
                          null,
                          2,
                        )}
                      </ThemedText>
                    </View>
                  ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  subtitle: {
    marginTop: 4,
  },
  code: {
    fontFamily: "monospace",
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonPressed: {
    opacity: 0.6,
  },
  actionLabel: {
    fontSize: 12,
  },
  viewerSection: {
    flex: 1,
    minHeight: 260,
    borderBottomWidth: 1,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  inspector: {
    flex: 1,
  },
  inspectorContent: {
    padding: 20,
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.02)",
    gap: 8,
  },
  statusLine: {
    marginTop: 4,
  },
  codeBlock: {
    fontFamily: "monospace",
    fontSize: 12,
    marginTop: 8,
  },
  logItem: {
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 6,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  logMethod: {
    fontSize: 12,
    fontWeight: "600",
  },
  logTime: {
    fontSize: 10,
    opacity: 0.6,
  },
  notice: {
    opacity: 0.7,
    marginTop: 8,
  },
});
