import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS } from '../constants/colors';

/**
 * StatusBadge — Displays client status with emoji and colored badge.
 *
 * Props:
 *   statusKey   — 'ACTIVE' | 'INACTIVE' | 'QUOTED' | 'CONVERTED'
 *   label       — string, display text (e.g. '😊 ACTIVE', '📋 QUOTED 2x')
 */
const StatusBadge = React.memo(({ statusKey, label }) => {
  const ss = STATUS[statusKey] || { bg: '#F3F4F6', text: '#6B7280' };
  return (
    <View style={[styles.badge, { backgroundColor: ss.bg }]}>
      <Text style={[styles.text, { color: ss.text }]}>{label}</Text>
    </View>
  );
});

StatusBadge.displayName = 'StatusBadge';
export default StatusBadge;

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  text: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
});
