import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { useCheck } from '@/context/CheckContext';

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  const colors = useColors();
  return (
    <View style={[styles.badge, { backgroundColor: active ? colors.accent + '22' : colors.muted, borderColor: active ? colors.accent : colors.border }]}>
      <View style={[styles.dot, { backgroundColor: active ? colors.accent : colors.mutedForeground }]} />
      <Text style={[styles.badgeText, { color: active ? colors.accent : colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon as any} size={18} color={color} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function PulseRing({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.5, duration: 900, useNativeDriver: false }),
          Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: false }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 900, useNativeDriver: false }),
          Animated.timing(opacity, { toValue: 0.6, duration: 900, useNativeDriver: false }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [scale, opacity]);

  return (
    <Animated.View
      style={[styles.pulseRing, { borderColor: color, transform: [{ scale }], opacity }]}
    />
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPaired, isConnected, targetIp, connectPort } = useApp();
  const { isRunning, macList, sessionUrl, loopCount, sleepDelaySec, startCheck, stopCheck } = useCheck();

  const btnScale = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRunning) stopCheck();
    else startCheck();
  };

  const btnColor = isRunning ? colors.destructive : colors.primary;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Platform.OS === 'web' ? 67 + 16 : 16,
          paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.appTitle, { color: colors.foreground }]}>WifiPortal</Text>
          <Text style={[styles.appSub, { color: colors.mutedForeground }]}>Session Check Tool</Text>
        </View>
        <View style={styles.badges}>
          <StatusBadge active={isPaired} label="Paired" />
          <StatusBadge active={isConnected} label="Connected" />
        </View>
      </View>

      {/* Connection Info */}
      {(targetIp || connectPort) ? (
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="wifi" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            {targetIp || '—'}{connectPort ? `:${connectPort}` : ''}
          </Text>
        </View>
      ) : null}

      {/* Session URL */}
      <View style={[styles.urlCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.urlLabel, { color: colors.mutedForeground }]}>Session URL</Text>
        <Text style={[styles.urlValue, { color: sessionUrl ? colors.foreground : colors.mutedForeground }]} numberOfLines={1}>
          {sessionUrl || 'Not configured — go to Settings'}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard icon="cpu" label="MACs" value={String(macList.length)} color={colors.primary} />
        <StatCard icon="repeat" label="Loops" value={String(loopCount)} color={colors.accent} />
        <StatCard icon="clock" label="Delay" value={`${sleepDelaySec}s`} color={colors.mutedForeground} />
      </View>

      {/* Main Action Button */}
      <View style={styles.btnWrapper}>
        {isRunning && <PulseRing color={btnColor} />}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable
            onPress={handleToggle}
            style={[styles.mainBtn, { backgroundColor: btnColor }]}
          >
            <Ionicons
              name={isRunning ? 'stop' : 'play'}
              size={32}
              color={isRunning ? colors.destructiveForeground : colors.primaryForeground}
            />
          </Pressable>
        </Animated.View>
      </View>
      <Text style={[styles.btnHint, { color: colors.mutedForeground }]}>
        {isRunning ? 'Tap to stop session check' : 'Tap to start session check'}
      </Text>

      {/* Running Status */}
      {isRunning && (
        <View style={[styles.runningCard, { backgroundColor: colors.accent + '18', borderColor: colors.accent + '44' }]}>
          <View style={[styles.dot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.runningText, { color: colors.accent }]}>Session check is running...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  appTitle: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  appSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  badges: { gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  infoText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  urlCard: { padding: 14, borderRadius: 12, borderWidth: 1, gap: 4 },
  urlLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.8 },
  urlValue: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 4 },
  statValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  btnWrapper: { alignItems: 'center', justifyContent: 'center', marginTop: 16, height: 110 },
  mainBtn: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  pulseRing: { position: 'absolute', width: 88, height: 88, borderRadius: 44, borderWidth: 2 },
  btnHint: { textAlign: 'center', fontSize: 13, fontFamily: 'Inter_400Regular' },
  runningCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  runningText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
