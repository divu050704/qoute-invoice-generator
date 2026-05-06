import React, { useState, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TextInput, StatusBar, Alert, 
  TouchableOpacity, Platform 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import addAndSave from '../../../utils/addAndSave';
import { 
  ChevronLeft, Lock, CheckCircle2, AlertCircle, 
  Landmark, User, CreditCard, Hash, MapPin, Save
} from 'lucide-react-native';

// -- Shared constants --
import { PRIMARY, HEADER_BG, ACCENT } from '../../../../src/constants/colors';

const BG_COLOR = '#F8FAFC';

export default function AddBankDetails({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const existing = route?.params?.bank || null;

  const [formData, setFormData] = useState({
    holderName: existing?.accountName || '',
    bankName: existing?.bankName || '',
    accountNumber: existing?.accountNumber || '',
    confirmAccountNumber: existing?.accountNumber || '',
    ifscCode: existing?.ifsc || '',
    branchName: existing?.branch || ''
  });

  const [touched, setTouched] = useState({});

  // Real-time Validation & Logic
  const validations = useMemo(() => {
    const isMatching = !!formData.accountNumber && formData.accountNumber === formData.confirmAccountNumber;
    const isValidIFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(formData.ifscCode);
    const maskedAccount = formData.accountNumber.length >= 4 
      ? `•••• ${formData.accountNumber.slice(-4)}` 
      : '•••• ----';

    return {
      isMatching,
      isValidIFSC,
      maskedAccount,
      // Simulated bank fetch logic
      bankInfo: isValidIFSC ? "Verified IFSC Format" : null
    };
  }, [formData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (!touched[field]) setTouched(prev => ({ ...prev, [field]: true }));
  };

  const isFormValid = formData.holderName.trim().length > 0 && 
                      formData.bankName.trim().length > 0 && 
                      validations.isMatching && 
                      formData.accountNumber.length >= 6; // Basic length check

  const handleSave = async () => {
    if (!isFormValid) return;
    try {
      const payload = {
        bankName: formData.bankName.trim(),
        accountName: formData.holderName.trim(),
        accountNumber: formData.accountNumber.trim(),
        ifsc: formData.ifscCode.trim(),
        branch: formData.branchName.trim(),
      };
      await addAndSave({ propertyName: 'bankdetails', newValue: payload, propertyCheck: 'accountNumber' });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not save bank details.');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      
      {/* HEADER */}
      <SafeAreaView style={{ backgroundColor: PRIMARY, zIndex: 10, elevation: 10 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7} hitSlop={8}>
              <ChevronLeft size={24} color="#FFF" strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{existing ? 'Edit Bank Account' : 'Add Bank Account'}</Text>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAwareScrollView 
        keyboardOpeningTime={0} 
        enableOnAndroid
        extraScrollHeight={80}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 120 }}
      >
        
        {/* Security Badge */}
        <View style={styles.securityBadge}>
          <Lock size={14} color="#134E3A" strokeWidth={2.5} />
          <Text style={styles.securityBadgeText}>Encrypted & Secure Bank Integration</Text>
        </View>

        {/* LIVE PREVIEW SECTION */}
        <View style={styles.previewSection}>
          <View style={styles.previewDividerWrap}>
             <View style={styles.previewDivider} />
             <Text style={styles.previewLabel}>Invoice Preview</Text>
             <View style={styles.previewDivider} />
          </View>
          
          <View style={styles.previewCard}>
            <View style={styles.previewHeaderRow}>
              <View style={styles.previewIconWrap}>
                <Landmark size={20} color="#134E3A" strokeWidth={2} />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.previewCardType}>Settlement Card</Text>
                <View style={styles.previewDash} />
              </View>
            </View>

            <View style={{ gap: 12 }}>
              <View>
                <Text style={styles.previewBankName}>{formData.bankName || 'Your Bank Name'}</Text>
                <Text style={styles.previewAccountMask}>{validations.maskedAccount}</Text>
              </View>

              <View style={styles.previewDataGrid}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewDataLabel}>IFSC Code</Text>
                  <Text style={styles.previewDataValue}>{formData.ifscCode || '•••••••••••'}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={styles.previewDataLabel}>Account Holder</Text>
                  <Text style={styles.previewDataValue} numberOfLines={1}>{formData.holderName || 'Card Holder Name'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* INPUT FIELDS */}
        <View style={{ gap: 20, paddingTop: 8 }}>
          
          {/* Account Holder Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account Holder Name</Text>
            <View style={[styles.inputWrapper, formData.holderName ? styles.inputActive : null]}>
              <TextInput 
                style={styles.input}
                placeholder="e.g. Ashish Kumar"
                placeholderTextColor="#94A3B8"
                value={formData.holderName}
                onChangeText={(v) => handleInputChange('holderName', v)}
              />
              <User size={16} color="#CBD5E1" strokeWidth={2.5} />
            </View>
            <Text style={styles.helperText}>Enter name exactly as per bank records</Text>
          </View>

          {/* Bank Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bank Name</Text>
            <View style={[styles.inputWrapper, formData.bankName ? styles.inputActive : null]}>
              <TextInput 
                style={styles.input}
                placeholder="e.g. HDFC Bank"
                placeholderTextColor="#94A3B8"
                value={formData.bankName}
                onChangeText={(v) => handleInputChange('bankName', v)}
              />
              <Landmark size={16} color="#CBD5E1" strokeWidth={2.5} />
            </View>
            <Text style={styles.helperText}>Enter your registered financial institution</Text>
          </View>

          {/* Account Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account Number</Text>
            <View style={[styles.inputWrapper, formData.accountNumber ? styles.inputActive : null]}>
              <TextInput 
                style={styles.input}
                placeholder="•••• •••• •••• ••••"
                placeholderTextColor="#94A3B8"
                value={formData.accountNumber}
                onChangeText={(v) => handleInputChange('accountNumber', v)}
                secureTextEntry
                keyboardType="numeric"
              />
              <CreditCard size={16} color="#CBD5E1" strokeWidth={2.5} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Lock size={10} color="#94A3B8" />
                <Text style={styles.helperText}>Your account number is kept secure</Text>
              </View>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#CBD5E1', fontStyle: 'italic', flex: 1, textAlign: 'right' }}>
                Will appear as {validations.maskedAccount} in invoices
              </Text>
            </View>
          </View>

          {/* Confirm Account Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Account Number</Text>
            <View style={[
              styles.inputWrapper, 
              touched.confirmAccountNumber && validations.isMatching ? styles.inputSuccess : null,
              touched.confirmAccountNumber && !validations.isMatching && formData.confirmAccountNumber ? styles.inputError : null
            ]}>
              <TextInput 
                style={styles.input}
                placeholder="Re-enter account number"
                placeholderTextColor="#94A3B8"
                value={formData.confirmAccountNumber}
                onChangeText={(v) => handleInputChange('confirmAccountNumber', v)}
                keyboardType="numeric"
              />
              {touched.confirmAccountNumber && formData.confirmAccountNumber.length > 0 && (
                validations.isMatching 
                  ? <CheckCircle2 size={16} color="#10B981" strokeWidth={3} /> 
                  : <AlertCircle size={16} color="#F43F5E" strokeWidth={3} />
              )}
            </View>
            {touched.confirmAccountNumber && !validations.isMatching && formData.confirmAccountNumber ? (
              <Text style={[styles.helperText, { color: '#F43F5E' }]}>Account numbers do not match</Text>
            ) : (
              <Text style={[styles.helperText, validations.isMatching && formData.confirmAccountNumber ? { color: '#059669' } : {}]}>
                Account numbers must match for verification
              </Text>
            )}
          </View>

          {/* IFSC Code */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>IFSC Code</Text>
            <View style={[styles.inputWrapper, formData.ifscCode ? styles.inputActive : null]}>
              <TextInput 
                style={[styles.input, { textTransform: 'uppercase' }]}
                placeholder="HDFC0001234"
                placeholderTextColor="#94A3B8"
                maxLength={11}
                value={formData.ifscCode}
                onChangeText={(v) => handleInputChange('ifscCode', v.toUpperCase())}
                autoCapitalize="characters"
              />
              <Hash size={16} color="#CBD5E1" strokeWidth={2.5} />
            </View>
            {validations.isValidIFSC ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={10} color="#059669" strokeWidth={3} />
                <Text style={[styles.helperText, { color: '#059669', fontWeight: '700' }]}>{validations.bankInfo}</Text>
              </View>
            ) : (
              <Text style={[styles.helperText, touched.ifscCode && !validations.isValidIFSC && formData.ifscCode ? { color: '#F43F5E' } : {}]}>
                {touched.ifscCode && !validations.isValidIFSC && formData.ifscCode ? 'Invalid IFSC format' : 'Enter 11-character bank branch code'}
              </Text>
            )}
          </View>

          {/* Branch Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Branch Name (Optional)</Text>
            <View style={[styles.inputWrapper, formData.branchName ? styles.inputActive : null]}>
              <TextInput 
                style={styles.input}
                placeholder="e.g. Connaught Place Branch"
                placeholderTextColor="#94A3B8"
                value={formData.branchName}
                onChangeText={(v) => handleInputChange('branchName', v)}
              />
              <MapPin size={16} color="#CBD5E1" strokeWidth={2.5} />
            </View>
            <Text style={[styles.helperText, { fontStyle: 'italic', textDecorationLine: 'underline' }]}>Optional field for your reference</Text>
          </View>

        </View>
      </KeyboardAwareScrollView>

      {/* STICKY FOOTER */}
      <View style={[styles.stickyFooter, { paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 24 }]}>
        <TouchableOpacity 
          style={[styles.submitBtn, isFormValid ? styles.submitBtnValid : styles.submitBtnInvalid]}
          onPress={handleSave}
          disabled={!isFormValid}
          activeOpacity={0.8}
        >
          <Text style={[styles.submitBtnText, !isFormValid && { color: '#94A3B8' }]}>Save Bank Details</Text>
          <Save size={18} color={isFormValid ? '#FFF' : '#94A3B8'} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG_COLOR },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', letterSpacing: -0.5 },
  
  securityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#ECFDF5', borderColor: '#D1FAE5', borderWidth: 1,
    padding: 12, borderRadius: 12, marginBottom: 24
  },
  securityBadgeText: { fontSize: 11, fontWeight: '800', color: PRIMARY, textTransform: 'uppercase', letterSpacing: -0.2 },
  
  previewSection: { marginBottom: 24 },
  previewDividerWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  previewDivider: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  previewLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.5 },
  
  previewCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4
  },
  previewHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  previewIconWrap: { padding: 8, backgroundColor: '#ECFDF5', borderRadius: 10 },
  previewCardType: { fontSize: 10, fontWeight: '900', color: '#CBD5E1', textTransform: 'uppercase' },
  previewDash: { height: 4, width: 48, backgroundColor: 'rgba(19,78,58,0.2)', borderRadius: 2, marginTop: 4 },
  
  previewBankName: { fontSize: 16, fontWeight: '900', color: '#1E293B', letterSpacing: -0.3 },
  previewAccountMask: { fontSize: 12, fontWeight: '800', color: '#059669', letterSpacing: 1.5, marginTop: 2 },
  
  previewDataGrid: { flexDirection: 'row', gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  previewDataLabel: { fontSize: 9, fontWeight: '900', color: '#CBD5E1', textTransform: 'uppercase', marginBottom: 2 },
  previewDataValue: { fontSize: 11, fontWeight: '800', color: '#475569' },
  
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 4 },
  inputWrapper: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#F1F5F9', 
    borderRadius: 14, paddingHorizontal: 16, height: 52
  },
  inputActive: { borderColor: '#E2E8F0' },
  inputSuccess: { borderColor: '#A7F3D0', backgroundColor: '#F0FDF4' },
  inputError: { borderColor: '#FECDD3', backgroundColor: '#FFF1F2' },
  input: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1E293B', paddingRight: 12 },
  helperText: { fontSize: 10, fontWeight: '600', color: '#94A3B8', paddingHorizontal: 4 },
  
  stickyFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.9)', 
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
    paddingHorizontal: 20, paddingTop: 16
  },
  submitBtn: {
    paddingVertical: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  submitBtnValid: { backgroundColor: '#FF8A00', shadowColor: '#EA580C' },
  submitBtnInvalid: { backgroundColor: '#F1F5F9', shadowOpacity: 0, elevation: 0 },
  submitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900' }
});

