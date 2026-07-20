import React, { useRef, useEffect } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useCheck } from '@/context/CheckContext';

function LogLine({ line, index }: { line: string; index: number }) {
  const colors = useColors();
  const isError = line.includes('✗') || line.includes('Error') || line.includes('Timeout');
  const isSuccess = line.includes('✓') || line.includes('complete');
  const isWarn = line.includes('⚠') || line.includes('Stopped');
  const isInfo = line.includes('started') || line.includes('URL:') || line.includes('MACs:') || line.includes('Loop ') || line.includes('Waiting');

  let lineColor = colors.mutedForeground;
  if (isError) lineColor = colors.destructive;
  else if (isSuccess) lineColor = colors.accent;
  else if (isWarn) lineColor = '#f0a500';
  else if (isInfo) lineColor = colors.primary;

  return (
    <View style={[styles.logLine, index % 2 === 0 ? {} : { backgroundColor: colors.card + '44' }]}>
      <Text style={[styles.logText, { color: lineColor }]}>{line}</Text>
    </View>
  );
}

export default function LogsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { logs, isRunning, clearLogs } = useCheck();
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (logs.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [logs.length]);

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearLogs();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.screenHeader, {
        paddingTop: Platform.OS === 'web' ? 67 + 16 : insets.top + 16,
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
      }]}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Logs</Text>
        {isRunning && (
          <View style={[styles.runBadge, { backgroundColor: colors.accent + '22', borderColor: colors.accent + '55' }]}>
            <View style={[styles.runDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.runText, { color: colors.accent }]}>Running</Text>
          </View>
        )}
        {logs.length > 0 && (
          <Pressable onPress={handleClear} hitSlop={8}>
            <Feather name="trash-2" size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {logs.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="file-text" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No logs yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Start a session check from the Dashboard to see activity logs here
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={logs}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 100 },
          ]}
          renderItem={({ item, index }) => <LogLine line={item} index={index} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  screenTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', flex: 1 },
  runBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  runDot: { width: 6, height: 6, borderRadius: 3 },
  runText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginTop: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  listContent: { paddingTop: 4 },
  logLine: { paddingHorizontal: 16, paddingVertical: 6 },
  logText: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
