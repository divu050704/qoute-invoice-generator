import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Landmark } from 'lucide-react-native';

export default function BankDetailsSection({
  bankDetails,
  onSelectPress,
  isDark
}) {
  const cardBg = isDark ? '#1E1E1E' : '#FFF';
  const cardBorder = isDark ? '#2C2C2E' : '#F1F5F9';
  const textMain = isDark ? '#F5F5F5' : '#0F172A';

  return (
    <View style={{ marginTop: 24 }}>
      <View style={[styles.listContainer, { padding: 16, backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.headerRow}>
          <Landmark size={16} color="#94A3B8" />
          <Text style={[styles.title, { color: textMain }]}>Settlement Details</Text>
        </View>
        <View style={{ gap: 14 }}>
          <View style={styles.row}>
            <Text style={styles.label}>Bank Name</Text>
            <Text style={[styles.value, { color: textMain }]}>{bankDetails?.bankName || '---'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Account No</Text>
            <Text style={[styles.value, { color: textMain, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]}>
              {bankDetails?.accountNumber || '---'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>IFSC Code</Text>
            <Text style={[styles.value, { color: textMain, textDecorationLine: 'underline' }]}>
              {bankDetails?.ifscCode || '---'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.changeAccBtn} onPress={onSelectPress}>
          <Text style={styles.changeAccText}>Change Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    marginBottom: 14
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  label: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  value: {
    fontSize: 13,
    fontWeight: '700'
  },
  changeAccBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(19,78,58,0.05)',
    alignItems: 'center'
  },
  changeAccText: {
    color: '#134E3A',
    fontSize: 13,
    fontWeight: '700'
  }
});
