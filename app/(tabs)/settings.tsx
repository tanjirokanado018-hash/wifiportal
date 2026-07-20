import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { useCheck } from '@/context/CheckContext';

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>{title.toUpperCase()}</Text>
  );
}

function SettingInput({
  label, value, onChangeText, placeholder, keyboardType, icon,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; keyboardType?: any; icon: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon as any} size={16} color={colors.primary} style={styles.rowIcon} />
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <TextInput
          style={[styles.rowInput, { color: colors.foreground }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

function Stepper({ label, value, min, max, step = 1, onchange, unit }: {
  label: string; value: number; min: number; max: number;
  step?: number; onchange: (v: number) => void; unit?: string;
}) {
  const colors = useColors();
  const dec = () => { Haptics.selectionAsync(); onchange(Math.max(min, value - step)); };
  const inc = () => { Haptics.selectionAsync(); onchange(Math.min(max, value + step)); };
  return (
    <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.stepperContent}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.stepperRange, { color: colors.mutedForeground }]}>{min}–{max}{unit}</Text>
      </View>
      <View style={styles.stepperControls}>
        <Pressable onPress={dec} style={[styles.stepBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]} disabled={value <= min}>
          <Feather name="minus" size={14} color={value <= min ? colors.mutedForeground : colors.foreground} />
        </Pressable>
        <Text style={[styles.stepValue, { color: colors.foreground }]}>{value}{unit}</Text>
        <Pressable onPress={inc} style={[styles.stepBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]} disabled={value >= max}>
          <Feather name="plus" size={14} color={value >= max ? colors.mutedForeground : colors.foreground} />
        </Pressable>
      </View>
    </View>
  );
}

function ActionButton({ label, icon, color, onPress, disabled }: {
  label: string; icon: string; color: string; onPress: () => void; disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.actionBtn, { backgroundColor: color, opacity: disabled ? 0.5 : 1 }]}
    >
      <Feather name={icon as any} size={15} color="#fff" />
      <Text style={styles.actionBtnText}>{label}</Text>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPaired, isConnected, targetIp, pairPort, connectPort, setTargetIp, setPairPort, setConnectPort, markPaired, markConnected, disconnect } = useApp();
  const { sessionUrl, setSessionUrl, loopCount, setLoopCount, sleepDelaySec, setSleepDelaySec } = useCheck();

  const [localIp, setLocalIp] = useState(targetIp);
  const [localPairPort, setLocalPairPort] = useState(pairPort);
  const [localConnectPort, setLocalConnectPort] = useState(connectPort);
  const [localUrl, setLocalUrl] = useState(sessionUrl);

  const handleSaveAdb = () => {
    setTargetIp(localIp.trim());
    setPairPort(localPairPort.trim());
    setConnectPort(localConnectPort.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePair = () => {
    if (!localIp.trim() || !localPairPort.trim()) {
      Alert.alert('Missing Info', 'Enter IP and Pair Port first.');
      return;
    }
    markPaired(localIp.trim(), localPairPort.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleConnect = () => {
    if (!localIp.trim() || !localConnectPort.trim()) {
      Alert.alert('Missing Info', 'Enter IP and Connect Port first.');
      return;
    }
    markConnected(localIp.trim(), localConnectPort.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSaveUrl = () => {
    setSessionUrl(localUrl.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDisconnect = () => {
    Alert.alert('Disconnect', 'Mark device as disconnected?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: () => disconnect() },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Platform.OS === 'web' ? 67 + 16 : insets.top + 16,
          paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Settings</Text>

      {/* ADB WiFi */}
      <View style={styles.section}>
        <SectionHeader title="ADB WiFi" />
        <SettingInput label="Target IP" value={localIp} onChangeText={setLocalIp} placeholder="192.168.1.x" icon="globe" keyboardType="decimal-pad" />
        <SettingInput label="Pair Port" value={localPairPort} onChangeText={setLocalPairPort} placeholder="37865" icon="link" keyboardType="number-pad" />
        <SettingInput label="Connect Port" value={localConnectPort} onChangeText={setLocalConnectPort} placeholder="5555" icon="link-2" keyboardType="number-pad" />
        <View style={styles.btnRow}>
          <ActionButton label="Save" icon="save" color={colors.primary} onPress={handleSaveAdb} />
          <ActionButton label="Mark Paired" icon="check" color={colors.accent} onPress={handlePair} />
          <ActionButton label="Mark Connected" icon="zap" color={colors.secondary.length > 0 ? colors.primary : '#888'} onPress={handleConnect} />
        </View>
        {(isPaired || isConnected) && (
          <View style={styles.btnRow}>
            <ActionButton label="Disconnect" icon="wifi-off" color={colors.destructive} onPress={handleDisconnect} />
          </View>
        )}
        <View style={[styles.statusRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: isPaired ? colors.accent : colors.mutedForeground }]} />
            <Text style={[styles.statusText, { color: isPaired ? colors.accent : colors.mutedForeground }]}>
              {isPaired ? 'Paired' : 'Not Paired'}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? colors.accent : colors.mutedForeground }]} />
            <Text style={[styles.statusText, { color: isConnected ? colors.accent : colors.mutedForeground }]}>
              {isConnected ? 'Connected' : 'Not Connected'}
            </Text>
          </View>
        </View>
      </View>

      {/* Session URL */}
      <View style={styles.section}>
        <SectionHeader title="Session" />
        <SettingInput label="Session URL" value={localUrl} onChangeText={setLocalUrl} placeholder="http://192.168.1.1/portal" icon="link" />
        <View style={styles.btnRow}>
          <ActionButton label="Save URL" icon="save" color={colors.primary} onPress={handleSaveUrl} />
        </View>
      </View>

      {/* Loop Config */}
      <View style={styles.section}>
        <SectionHeader title="Check Configuration" />
        <Stepper label="Loop Count" value={loopCount} min={1} max={200} onchange={setLoopCount} />
        <Stepper label="Sleep Delay" value={sleepDelaySec} min={1} max={120} onchange={setSleepDelaySec} unit="s" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 4 },
  pageTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  section: { marginBottom: 24, gap: 8 },
  sectionHeader: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginBottom: 2 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 12, borderWidth: 1, gap: 12,
  },
  rowIcon: { marginTop: 2 },
  rowContent: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  rowInput: { fontSize: 14, fontFamily: 'Inter_400Regular', padding: 0 },
  btnRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
  },
  actionBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  statusItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  divider: { width: 1, height: 18 },
  stepperContent: { flex: 1 },
  stepperRange: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: 16, fontFamily: 'Inter_600SemiBold', minWidth: 40, textAlign: 'center' },
});
