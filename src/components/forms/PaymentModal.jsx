import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, KeyboardAvoidingView, TextInput, ActivityIndicator, Image } from 'react-native';
import { Wallet, Truck, X, ChevronDown, Camera, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react-native';

const HEADER_BG = '#134E3A';
const ROSE = '#E11D48';

export default function PaymentModal({
  visible,
  onClose,
  type, // 'client' or 'vendor'
  amount,
  setAmount,
  date,
  setDate,
  method,
  setMethod,
  image,
  setImage,
  onPickImage,
  onConfirm,
  isSaving,
  isDark,
  onCalendarPress,
  titleText,
  subtitleText,
  clientOrVendorName,
  invoiceRef
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  const cardBg = isDark ? '#1E1E1E' : '#FFF';
  const textMain = isDark ? '#F5F5F5' : '#0F172A';
  const textSub = isDark ? '#A1A1AA' : '#94A3B8';
  const inputBg = isDark ? '#2C2C2E' : '#F8FAFC';
  
  const isClient = type === 'client';
  const primaryColor = isClient ? '#10B981' : ROSE;
  const primaryBg = isClient ? (isDark ? '#0A2418' : '#ECFDF5') : (isDark ? '#3A2020' : '#FFF1F2');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: primaryBg, justifyContent: 'center', alignItems: 'center' }}>
                {isClient ? <Wallet size={18} color={primaryColor} strokeWidth={2.5} /> : <Truck size={18} color={primaryColor} strokeWidth={2.5} />}
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: textMain }]}>{titleText || (isClient ? 'Record Payment' : 'Vendor Payment')}</Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: textSub, marginTop: 1 }}>{subtitleText || (isClient ? 'Client Collection' : 'Vendor Expense')}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => { onClose(); setShowDropdown(false); }} style={[styles.modalClose, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}>
              <X size={18} color={textSub} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}>
            {/* Info Card */}
            {clientOrVendorName && (
              <View style={[{ backgroundColor: primaryBg, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: isClient ? (isDark ? '#134E3A' : '#D1FAE5') : (isDark ? '#881337' : '#FECDD3'), flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isClient ? (isDark ? '#134E3A' : '#D1FAE5') : (isDark ? '#881337' : '#FECDD3'), justifyContent: 'center', alignItems: 'center' }}>
                  {isClient ? <Wallet size={18} color={primaryColor} /> : <Truck size={18} color={primaryColor} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: textMain }}>
                    {clientOrVendorName}
                  </Text>
                  {invoiceRef && (
                    <Text style={{ fontSize: 11, fontWeight: '600', color: isClient ? (isDark ? '#6EE7B7' : '#059669') : (isDark ? '#FDA4AF' : '#E11D48'), marginTop: 2 }}>
                      {invoiceRef}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Amount Input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={[styles.label, { color: textSub, marginBottom: 8 }]}>AMOUNT (₹)</Text>
              <View style={{
                backgroundColor: isDark ? '#464646' : '#F9FAFB',
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: isDark ? '#6B7280' : '#E5E7EB',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
              }}>
                <Text style={{ fontSize: 24, color: textSub, fontWeight: '600', marginRight: 4 }}>₹</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={isDark ? '#6B7280' : '#CBD5E1'}
                  keyboardType="numeric"
                  autoFocus={true}
                  style={{ flex: 1, fontSize: 24, fontWeight: '900', color: textMain, paddingVertical: 16 }}
                />
              </View>
            </View>

            {/* Method & Date Row */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: textSub, marginBottom: 8 }]}>METHOD</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowDropdown(!showDropdown)}
                  style={{
                    backgroundColor: inputBg,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 13,
                    borderWidth: 1,
                    borderColor: showDropdown ? '#10B981' : (isDark ? '#3A3A3C' : '#E5E7EB'),
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: textMain }}>{method}</Text>
                  <ChevronDown size={16} color={textSub} style={showDropdown ? { transform: [{ rotate: '180deg' }] } : {}} />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: textSub, marginBottom: 8 }]}>DATE</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onCalendarPress}
                  style={{
                    backgroundColor: inputBg,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 13,
                    borderWidth: 1,
                    borderColor: isDark ? '#3A3A3C' : '#E5E7EB',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: textMain }}>
                    {date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Select'}
                  </Text>
                  <CalendarIcon size={15} color={textSub} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Dropdown */}
            {showDropdown && (
              <View style={{
                backgroundColor: isDark ? '#2C2C2E' : '#FFF',
                borderRadius: 12,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: isDark ? '#3A3A3C' : '#E5E7EB',
                overflow: 'hidden',
                elevation: 6,
              }}>
                {['UPI', 'Cash', 'Bank Transfer', 'Cheque', 'NEFT / RTGS', 'Card'].map((item, idx, arr) => {
                  const isSelected = method === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      activeOpacity={0.7}
                      onPress={() => { setMethod(item); setShowDropdown(false); }}
                      style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        paddingVertical: 13, paddingHorizontal: 16,
                        backgroundColor: isSelected ? (isDark ? '#0A2418' : '#F0FDF4') : 'transparent',
                        borderBottomWidth: idx < arr.length - 1 ? 1 : 0,
                        borderBottomColor: isDark ? '#3A3A3C' : '#F3F4F6',
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: isSelected ? '800' : '600', color: isSelected ? '#10B981' : textMain }}>{item}</Text>
                      {isSelected && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Screenshot */}
            <View style={[styles.imagePickerWrap, isDark && { backgroundColor: '#2C2C2E', borderColor: '#3A3A3C' }]}>
              {!image ? (
                <TouchableOpacity style={styles.imagePickerBtn} onPress={onPickImage}>
                  <View style={[styles.camIconWrap, isDark && { backgroundColor: '#3A3A3C' }]}>
                    <Camera size={22} color={isDark ? '#A1A1AA' : '#9CA3AF'} />
                  </View>
                  <Text style={[styles.label, { color: textSub }]}>ATTACH SCREENSHOT (OPTIONAL)</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden' }}>
                  <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImage(null)}>
                    <X size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Confirm */}
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: isClient ? HEADER_BG : ROSE }, isSaving && { opacity: 0.7 }]}
              onPress={onConfirm}
              activeOpacity={0.8}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#FFF" strokeWidth={2.5} />
                  <Text style={styles.confirmBtnText}>CONFIRM ENTRY</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: 20, paddingTop: 10, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, marginBottom: 20 },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  modalClose: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  imagePickerWrap: { borderRadius: 16, borderWidth: 2, borderColor: '#F1F5F9', borderStyle: 'dashed', backgroundColor: '#F8FAFC', marginBottom: 24 },
  imagePickerBtn: { padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 },
  camIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  removeImageBtn: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  confirmBtn: { paddingVertical: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 4, shadowColor: '#134E3A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  confirmBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});
