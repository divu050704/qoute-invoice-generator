import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FileText, ChevronRight } from 'lucide-react-native';

export default function TermsSection({
  termsAndConditions,
  onSelectPress,
  isDark
}) {
  const cardBg = isDark ? '#1E1E1E' : '#FFF';
  const cardBorder = isDark ? '#2C2C2E' : '#F1F5F9';
  const textSub = isDark ? '#A1A1AA' : '#94A3B8';
  const textMain = isDark ? '#F5F5F5' : '#0F172A';

  const selectedTerm = Array.isArray(termsAndConditions) && termsAndConditions.length > 0
    ? termsAndConditions[0]
    : null;

  return (
    <View>
      <Text style={[styles.sectionHeaderLabel, { color: textSub }]}>TERMS & CONDITIONS</Text>
      <View style={[styles.listContainer, { padding: 16, backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <FileText size={16} color="#134E3A" strokeWidth={2.5} />
            <Text style={styles.title}>Terms & Conditions</Text>
          </View>
          <TouchableOpacity onPress={onSelectPress} style={styles.changeBtn} activeOpacity={0.7}>
            <Text style={styles.changeBtnText}>{selectedTerm ? 'CHANGE' : 'SELECT'}</Text>
            <ChevronRight size={14} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {selectedTerm ? (
          <View style={styles.termContent}>
            <Text style={[styles.termTitle, { color: textMain }]}>{selectedTerm.title || 'Selected Term'}</Text>
            <Text style={[styles.termFullText, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
              {selectedTerm.content || selectedTerm.text || selectedTerm.term || ''}
            </Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>No terms selected. Tap "SELECT" to choose.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingHorizontal: 2
  },
  listContainer: {
    borderRadius: 16,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  title: {
    fontSize: 11,
    fontWeight: '900',
    color: '#134E3A',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(148,163,184,0.08)'
  },
  changeBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  termContent: {
    backgroundColor: 'rgba(19,78,58,0.03)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(19,78,58,0.08)'
  },
  termTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8
  },
  termFullText: {
    fontSize: 12,
    lineHeight: 20
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF'
  }
});
