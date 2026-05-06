import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PRIMARY } from '../constants/colors';

/**
 * EmptyState — Full-screen empty state placeholder.
 *
 * Props:
 *   icon        — ReactNode, icon component to render
 *   title       — string
 *   subtitle    — string
 *   actionLabel — string, optional button text
 *   onAction    — function, optional button handler
 *   isDark      — boolean, for dark mode support
 */
const EmptyState = React.memo(({ icon, title, subtitle, actionLabel, onAction, isDark = false }) => (
  <View style={styles.container}>
    <View style={[styles.iconWrap, isDark && { backgroundColor: '#2C2C2E' }]}>
      {icon}
    </View>
    <Text style={[styles.title, isDark && { color: '#F5F5F5' }]}>{title}</Text>
    <Text style={[styles.subtitle, isDark && { color: '#A1A1AA' }]}>{subtitle}</Text>
    {!!actionLabel && !!onAction && (
      <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.85}>
        <Text style={styles.buttonText}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
));

EmptyState.displayName = 'EmptyState';
export default EmptyState;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 20 },
  button: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: PRIMARY,
    paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 14,
  },
  buttonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
