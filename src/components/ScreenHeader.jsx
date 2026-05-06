import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRIMARY } from '../constants/colors';

/**
 * ScreenHeader — Reusable header component with back button + title + optional right actions.
 *
 * Props:
 *   title       — string, displayed in the header
 *   onBack      — function, called when back button is pressed
 *   rightItems  — ReactNode, optional content rendered on the right side
 *   bg          — string, background color (defaults to PRIMARY)
 */
const ScreenHeader = React.memo(({ title, onBack, rightItems, bg = PRIMARY }) => (
  <SafeAreaView style={{ backgroundColor: bg, zIndex: 10, elevation: 4 }} edges={['top']}>
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {!!onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} hitSlop={8}>
            <ArrowLeft size={24} color="#FFF" strokeWidth={2} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      </View>
      {rightItems && (
        <View style={styles.headerRight}>{rightItems}</View>
      )}
    </View>
  </SafeAreaView>
));

ScreenHeader.displayName = 'ScreenHeader';
export default ScreenHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20, fontWeight: '600', color: '#FFF',
    flexShrink: 1,
  },
});
