import React, { useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useCheck } from '@/context/CheckContext';

function MacItem({ mac, onRemove }: { mac: string; onRemove: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.macItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.macIconWrap, { backgroundColor: colors.primary + '18' }]}>
        <Feather name="cpu" size={16} color={colors.primary} />
      </View>
      <Text style={[styles.macText, { color: colors.foreground }]}>{mac}</Text>
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onRemove(); }}
        style={styles.deleteBtn}
        hitSlop={8}
      >
        <Feather name="trash-2" size={16} color={colors.destructive} />
      </Pressable>
    </View>
  );
}

export default function MacsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { macList, addMac, removeMac } = useCheck();
  const [input, setInput] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addMac(trimmed);
    setInput('');
  };

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.screenHeader, {
        paddingTop: Platform.OS === 'web' ? 67 + 16 : insets.top + 16,
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
      }]}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>MAC Addresses</Text>
        {macList.length > 0 && (
          <View style={[styles.countBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}>
            <Text style={[styles.countText, { color: colors.primary }]}>{macList.length}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={macList}
        keyExtractor={(item) => item}
        scrollEnabled={macList.length > 0}
        contentContainerStyle={[
          styles.listContent,
          macList.length === 0 && styles.listEmpty,
          { paddingBottom: bottomPad + 80 },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="cpu" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No MAC addresses</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Add device MACs below to track them in sessions
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <MacItem mac={item} onRemove={() => removeMac(item)} />
        )}
      />

      {/* Add Input */}
      <View style={[styles.addBar, {
        backgroundColor: colors.card,
        borderTopColor: colors.border,
        paddingBottom: bottomPad + 8,
      }]}>
        <TextInput
          ref={inputRef}
          style={[styles.macInput, {
            backgroundColor: colors.secondary,
            borderColor: colors.border,
            color: colors.foreground,
            fontFamily: 'Inter_400Regular',
          }]}
          placeholder="00:11:22:33:44:55"
          placeholderTextColor={colors.mutedForeground}
          value={input}
          onChangeText={setInput}
          autoCapitalize="characters"
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
        <Pressable
          onPress={handleAdd}
          style={[styles.addBtn, { backgroundColor: colors.primary, opacity: input.trim() ? 1 : 0.5 }]}
          disabled={!input.trim()}
        >
          <Feather name="plus" size={20} color={colors.primaryForeground} />
        </Pressable>
      </View>
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
  countBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  countText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  listContent: { paddingHorizontal: 20, paddingTop: 12, gap: 10 },
  listEmpty: { flex: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginTop: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  macItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  macIconWrap: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  macText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', letterSpacing: 0.5 },
  deleteBtn: { padding: 4 },
  addBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1,
  },
  macInput: {
    flex: 1, height: 46, borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 14, fontSize: 14,
  },
  addBtn: { width: 46, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
