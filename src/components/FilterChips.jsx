import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { PRIMARY } from '../constants/colors';

/**
 * FilterChips — Horizontal scrollable filter chip bar with counts.
 *
 * Props:
 *   tabs         — string[], list of filter names
 *   activeTab    — string, currently selected tab
 *   onSelect     — (tab: string) => void
 *   counts       — { [tab]: number }, optional counts per tab
 *   emojis       — { [tab]: string }, optional emoji prefix per tab
 *   cardBg       — string, inactive chip background
 *   borderCol    — string, inactive chip border
 *   textSub      — string, inactive chip text color
 */
const FilterChips = React.memo(({
  tabs, activeTab, onSelect,
  counts = {},
  emojis = {},
  cardBg = '#FFF',
  borderCol = '#E5E7EB',
  textSub = '#6B7280',
}) => (
  <View style={{ paddingTop: 12 }}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {tabs.map(tab => {
        const active = activeTab === tab;
        const count = counts[tab];
        const emoji = emojis[tab] || '';
        return (
          <TouchableOpacity
            key={tab}
            activeOpacity={0.8}
            onPress={() => onSelect(tab)}
            style={[
              styles.chip,
              active
                ? { backgroundColor: PRIMARY, borderColor: PRIMARY, elevation: 2 }
                : { backgroundColor: cardBg, borderColor: borderCol },
            ]}
          >
            <Text style={[styles.chipText, { color: active ? '#FFF' : textSub }]}>
              {emoji ? `${emoji} ` : ''}{tab}{count !== undefined ? ` (${count})` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </View>
));

FilterChips.displayName = 'FilterChips';
export default FilterChips;

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: { fontSize: 12, fontWeight: '700' },
});
