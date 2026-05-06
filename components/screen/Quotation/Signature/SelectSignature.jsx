import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, StatusBar, Alert,
  TouchableOpacity, Modal, TextInput, Platform, Image, ScrollView, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../../../utils/customSecureStore';
import * as ImagePicker from 'expo-image-picker';
import {
  ChevronLeft, Plus, Trash2, CheckCircle2, PenTool,
  Camera, Image as ImageIcon, ShieldCheck, Check, X, Crop
} from 'lucide-react-native';

// -- Shared constants --
import { PRIMARY, HEADER_BG, ACCENT } from '../../../../src/constants/colors';

const DARK = '#032B20';
const BG_COLOR = '#F8FAFC';
const ORANGE = '#FF8A00';

export default function SelectSignature({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const onSelect = route?.params?.onSelect;

  const [signatures, setSignatures] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState('source'); // 'source' | 'name'
  const [tempName, setTempName] = useState('');
  const [tempImageUri, setTempImageUri] = useState(null);

  const loadSignatures = useCallback(async () => {
    try {
      const raw = await getItemAsync('signatures');
      const data = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(data) ? data : [];
      setSignatures(list);
      if (list.length > 0 && !selectedId) {
        setSelectedId(list[0].id);
      }
    } catch { setSignatures([]); }
  }, []);

  useFocusEffect(useCallback(() => { loadSignatures(); }, [loadSignatures]));

  const openAddFlow = () => {
    setModalStep('source');
    setTempName('');
    setTempImageUri(null);
    setIsModalOpen(true);
  };

  const closeAddFlow = () => {
    setIsModalOpen(false);
    setTempName('');
    setTempImageUri(null);
  };

  const pickImage = async (useCamera) => {
    try {
      let result;
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permission required', 'Camera access is needed.'); return; }
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true, base64: true });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permission required', 'Gallery access is needed.'); return; }
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true, base64: true });
      }
      if (!result.canceled && result.assets?.length > 0) {
        setTempImageUri(`data:image/jpeg;base64,${result.assets[0].base64}`);
        setModalStep('name');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  const handleSaveSignature = async () => {
    if (!tempName.trim()) return;
    const newSig = {
      id: Date.now().toString(),
      name: tempName.trim(),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      type: tempImageUri ? 'Uploaded' : 'Handwritten',
      imageUri: tempImageUri || null,
    };
    const updated = [newSig, ...signatures];
    try {
      await setItemAsync('signatures', JSON.stringify(updated));
      setSignatures(updated);
      setSelectedId(newSig.id);
      closeAddFlow();
    } catch {
      Alert.alert('Error', 'Could not save signature.');
    }
  };

  const deleteSignature = (item) => {
    Alert.alert('Delete', `Delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const filtered = signatures.filter(s => s.id !== item.id);
        await setItemAsync('signatures', JSON.stringify(filtered));
        setSignatures(filtered);
        if (selectedId === item.id) {
          setSelectedId(filtered.length > 0 ? filtered[0].id : null);
        }
      }}
    ]);
  };

  const handleApply = () => {
    const chosen = signatures.find(s => s.id === selectedId);
    if (onSelect && chosen) {
      onSelect(chosen);
      navigation.goBack();
    }
  };

  const renderItem = ({ item }) => {
    const isActive = selectedId === item.id;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSelectedId(item.id)}
        style={[styles.card, isActive ? styles.cardActive : styles.cardNormal]}
      >
        <View style={styles.cardInner}>
          {/* Signature Preview Box */}
          <View style={[styles.previewBox, isActive ? styles.previewBoxActive : styles.previewBoxNormal]}>
            {item.imageUri ? (
              <Image source={{ uri: item.imageUri }} style={{ width: '100%', height: '100%', borderRadius: 13, resizeMode: 'contain' }} />
            ) : (
              <Text style={styles.previewText} numberOfLines={1}>
                {item.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            )}
          </View>

          {/* Details */}
          <View style={{ flex: 1 }}>
            <Text style={[styles.sigName, isActive && { color: PRIMARY }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.sigMeta}>
              {item.type?.toUpperCase()} • {item.date}
            </Text>
          </View>

          {/* Right: Delete + Radio */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => deleteSignature(item)}
              hitSlop={8}
              style={{ padding: 4 }}
            >
              <Trash2 size={16} color={isActive ? '#FDA4AF' : '#CBD5E1'} strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={[styles.radioBtn, isActive ? styles.radioBtnActive : styles.radioBtnNormal]}>
              {isActive && <Check size={12} color="#FFF" strokeWidth={4} />}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={DARK} />

      {/* HEADER */}
      <SafeAreaView style={{ backgroundColor: DARK, zIndex: 20, elevation: 20 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7} hitSlop={8}>
              <ChevronLeft size={24} color="#FFF" strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Signatures</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* MAIN LIST */}
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <FlatList
          data={signatures}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 140 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={{ marginBottom: 20 }}>
              {/* Info Banner */}
              <View style={styles.infoBanner}>
                <ShieldCheck size={18} color="#059669" strokeWidth={2.5} />
                <Text style={styles.infoBannerText}>
                  Select the active signature to be displayed on your quotations.
                </Text>
              </View>

              {/* Section Header */}
              {signatures.length > 0 && (
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeaderLabel}>Saved Signatures</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{signatures.length} Total</Text>
                  </View>
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <PenTool size={48} color="#CBD5E1" strokeWidth={1} />
              <Text style={styles.emptyText}>No signatures saved</Text>
            </View>
          }
          renderItem={renderItem}
        />
      </View>

      {/* STICKY FOOTER */}
      <View style={[styles.stickyFooter, { paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 24 }]}>
        {selectedId && signatures.length > 0 && (
          <TouchableOpacity onPress={handleApply} style={styles.applyBtn} activeOpacity={0.8}>
            <CheckCircle2 size={18} color="#FFF" strokeWidth={3} />
            <Text style={styles.applyBtnText}>Apply Signature</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={openAddFlow} style={styles.addBtn} activeOpacity={0.8}>
          <Plus size={18} color="#FFF" strokeWidth={3} />
          <Text style={styles.addBtnText}>Add New Signature</Text>
        </TouchableOpacity>
      </View>

      {/* BOTTOM SHEET MODAL */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="slide"
        onRequestClose={closeAddFlow}
      >
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1} onPress={closeAddFlow} style={styles.modalBackdrop}>
            <View />
          </TouchableOpacity>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 32 }]}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalStep === 'source' ? 'New Signature' : 'Give it a Name'}
              </Text>
              <TouchableOpacity onPress={closeAddFlow} style={styles.modalCloseBtn}>
                <X size={20} color="#64748B" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* STEP 1: Source Select */}
            {modalStep === 'source' && (
              <View style={styles.sourceGrid}>
                <TouchableOpacity style={styles.sourceBtn} onPress={() => pickImage(true)} activeOpacity={0.8}>
                  <View style={[styles.sourceIconWrap, { backgroundColor: '#ECFDF5' }]}>
                    <Camera size={24} color={PRIMARY} strokeWidth={2} />
                  </View>
                  <Text style={styles.sourceBtnLabel}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sourceBtn} onPress={() => pickImage(false)} activeOpacity={0.8}>
                  <View style={[styles.sourceIconWrap, { backgroundColor: '#EFF6FF' }]}>
                    <ImageIcon size={24} color="#3B82F6" strokeWidth={2} />
                  </View>
                  <Text style={styles.sourceBtnLabel}>Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: Name Input */}
            {modalStep === 'name' && (
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" bounces={false}>
                {/* Crop Preview */}
                <View style={styles.cropArea}>
                  {tempImageUri ? (
                    <Image source={{ uri: tempImageUri }} style={{ width: '100%', height: '100%', borderRadius: 16, resizeMode: 'contain' }} />
                  ) : (
                    <View style={styles.cropFrame}>
                      <Text style={styles.cropPreviewText}>
                        {tempName || 'Your Signature'}
                      </Text>
                      <View style={styles.cropCornerTL} />
                      <View style={styles.cropCornerBR} />
                      <View style={{ position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 4, opacity: 0.5 }}>
                        <Crop size={14} color={ORANGE} />
                        <Text style={{ fontSize: 8, fontWeight: '900', color: ORANGE, textTransform: 'uppercase', letterSpacing: 2 }}>Crop Area</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Label Input */}
                <View style={[styles.nameInputCard, { marginTop: 16 }]}>
                  <Text style={styles.nameInputLabel}>Signature Label</Text>
                  <TextInput
                    autoFocus
                    style={styles.nameInput}
                    placeholder="e.g. Director Sign, Verified by..."
                    placeholderTextColor="#CBD5E1"
                    value={tempName}
                    onChangeText={setTempName}
                  />
                </View>

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 16 }}>
                  <TouchableOpacity
                    onPress={() => setModalStep('source')}
                    style={styles.backModalBtn}
                  >
                    <Text style={styles.backModalBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveSignature}
                    disabled={!tempName.trim()}
                    activeOpacity={0.8}
                    style={[styles.saveModalBtn, !tempName.trim() && styles.saveModalBtnDisabled]}
                  >
                    <Text style={[styles.saveModalBtnText, !tempName.trim() && { color: '#CBD5E1' }]}>
                      Save Signature
                    </Text>
                    <CheckCircle2 size={16} color={tempName.trim() ? '#FFF' : '#CBD5E1'} strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG_COLOR },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', letterSpacing: -0.5 },

  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#ECFDF5', borderColor: 'rgba(16,185,129,0.15)', borderWidth: 1,
    padding: 14, borderRadius: 16, marginBottom: 20
  },
  infoBannerText: { fontSize: 11, fontWeight: '800', color: '#065F46', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1, lineHeight: 16 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, marginBottom: 12 },
  sectionHeaderLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 2 },
  countBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  countBadgeText: { fontSize: 9, fontWeight: '800', color: '#64748B', textTransform: 'uppercase' },

  card: {
    backgroundColor: '#FFF', borderRadius: 20, marginBottom: 12,
    borderWidth: 1, overflow: 'hidden'
  },
  cardNormal: { borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  cardActive: { borderColor: PRIMARY, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 3 },
  cardInner: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 },

  previewBox: {
    width: 64, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1
  },
  previewBoxNormal: { backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' },
  previewBoxActive: { backgroundColor: 'rgba(19,78,58,0.06)', borderColor: 'rgba(19,78,58,0.1)' },
  previewText: { fontSize: 18, fontWeight: '700', color: '#94A3B8', fontStyle: 'italic' },

  sigName: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 3 },
  sigMeta: { fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 },

  radioBtn: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center'
  },
  radioBtnNormal: { borderColor: '#E2E8F0', backgroundColor: 'transparent' },
  radioBtnActive: { borderColor: PRIMARY, backgroundColor: PRIMARY },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '700', color: '#94A3B8' },

  stickyFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9',
    paddingHorizontal: 20, paddingTop: 16, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 10
  },
  applyBtn: {
    backgroundColor: ORANGE, paddingVertical: 14, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  applyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  addBtn: {
    backgroundColor: DARK, paddingVertical: 14, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: DARK, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4
  },
  addBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },

  // MODAL
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3,43,32,0.55)'
  },
  modalSheet: {
    backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingTop: 8,
    maxHeight: '80%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -20 }, shadowOpacity: 0.2, shadowRadius: 40, elevation: 20
  },
  modalHandle: { width: 48, height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },

  sourceGrid: { flexDirection: 'row', gap: 16, paddingBottom: 8 },
  sourceBtn: {
    flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 12, paddingVertical: 32, borderRadius: 24,
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9'
  },
  sourceIconWrap: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  sourceBtnLabel: { fontSize: 11, fontWeight: '900', color: '#334155', textTransform: 'uppercase', letterSpacing: 2 },

  cropArea: {
    backgroundColor: '#000', borderRadius: 16, overflow: 'hidden',
    height: 120, justifyContent: 'center', alignItems: 'center'
  },
  cropFrame: {
    position: 'absolute', inset: 0, borderWidth: 20, borderColor: 'rgba(0,0,0,0.35)',
    margin: 0, justifyContent: 'center', alignItems: 'center',
    borderStyle: 'solid'
  },
  cropCornerTL: { position: 'absolute', top: -2, left: -2, width: 16, height: 16, borderTopWidth: 2, borderLeftWidth: 2, borderColor: ORANGE },
  cropCornerBR: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderBottomWidth: 2, borderRightWidth: 2, borderColor: ORANGE },
  cropPreviewText: { fontSize: 28, fontStyle: 'italic', color: '#1E293B', fontWeight: '700', opacity: 0.75, transform: [{ rotate: '-3deg' }] },

  nameInputCard: {
    backgroundColor: '#F8FAFC', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  nameInputLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  nameInput: { fontSize: 14, fontWeight: '700', color: '#1E293B' },

  backModalBtn: { flex: 1, paddingVertical: 16, backgroundColor: '#F8FAFC', borderRadius: 16, alignItems: 'center' },
  backModalBtnText: { fontSize: 11, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 2 },
  saveModalBtn: {
    flex: 2, paddingVertical: 16, backgroundColor: ORANGE, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  saveModalBtnDisabled: { backgroundColor: '#F1F5F9', shadowOpacity: 0, elevation: 0 },
  saveModalBtnText: { fontSize: 11, fontWeight: '900', color: '#FFF', textTransform: 'uppercase', letterSpacing: 1 },
});


