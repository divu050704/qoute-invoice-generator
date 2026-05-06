import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Switch, Platform } from 'react-native';
import { PenTool, Trash2 } from 'lucide-react-native';

export default function SignatureSection({
  signatureData,
  setSignatureData,
  showSignatureInPdf,
  setShowSignatureInPdf,
  onSelectPress,
  isDark
}) {
  const cardBg = isDark ? '#1E1E1E' : '#FFF';
  const cardBorder = isDark ? '#2C2C2E' : '#F1F5F9';
  const textMain = isDark ? '#F5F5F5' : '#0F172A';
  const textSub = isDark ? '#A1A1AA' : '#94A3B8';

  return (
    <View style={{ marginTop: 24 }}>
      <Text style={[styles.sectionHeaderLabel, { color: textSub }]}>AUTHORISED SIGNATORY</Text>
      <View style={[styles.listContainer, { padding: 16, backgroundColor: cardBg, borderColor: cardBorder }]}>
        {signatureData ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              {/* Signature Preview */}
              <View style={[styles.previewBox, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: isDark ? '#3A3A3C' : '#E2E8F0' }]}>
                {signatureData.imageUri ? (
                  <Image source={{ uri: signatureData.imageUri }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                ) : (
                  <PenTool size={22} color="#EA580C" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: textMain }}>{signatureData.name}</Text>
                <Text style={{ fontSize: 11, color: isDark ? '#A1A1AA' : '#94A3B8', fontWeight: '600', marginTop: 2 }}>
                  {signatureData.type?.toUpperCase()} {signatureData.date ? `• ${signatureData.date}` : ''}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <TouchableOpacity onPress={onSelectPress} style={styles.changeBtn}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#134E3A' }}>Change</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSignatureData(null)} style={{ padding: 8 }}>
                  <Trash2 size={16} color="#FB7185" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Show in PDF Toggle */}
            <View style={[styles.pdfToggleBox, { borderTopColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#A1A1AA' : '#64748B' }}>Show signature on PDF</Text>
              <Switch
                value={showSignatureInPdf}
                onValueChange={setShowSignatureInPdf}
                trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                thumbColor="#FFF"
                style={{ transform: [{ scale: Platform.OS === 'ios' ? 0.7 : 0.85 }] }}
              />
            </View>
          </>
        ) : (
          <TouchableOpacity onPress={onSelectPress} style={styles.addBtn}>
            <PenTool size={16} color="#134E3A" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#134E3A' }}>Add Authorized Signature</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeaderLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, paddingHorizontal: 2 },
  listContainer: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, elevation: 1, shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity: 0.02, shadowRadius: 4 },
  previewBox: { width: 56, height: 56, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  changeBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(19,78,58,0.05)', borderRadius: 10 },
  pdfToggleBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 }
});
