import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image } from 'react-native';
import { X } from 'lucide-react-native';

export default function ImagePreviewModal({ visible, imageUrl, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.previewOverlay}>
        <View style={styles.previewHeader}>
          <Text style={styles.label}>SCREENSHOT PREVIEW</Text>
          <TouchableOpacity onPress={onClose} style={styles.previewClose}>
            <X size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '80%', resizeMode: 'contain' }} />
          ) : null}
        </View>
        <View style={{ alignItems: 'center', paddingBottom: 40 }}>
          <TouchableOpacity style={styles.previewCloseBtn} onPress={onClose}>
            <Text style={styles.previewCloseText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  previewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, color: '#FFF' },
  previewClose: { padding: 4 },
  previewCloseBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  previewCloseText: { color: '#FFF', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
});
