import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Switch,
  StatusBar, Alert, Platform, TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { getItemAsync, setItemAsync } from '../../../utils/customSecureStore';
import { ArrowLeft, Check, Building2, User, Phone, Mail, MapPin, Hash, Globe, FileText, Award } from 'lucide-react-native';

// -- Shared constants --
import { PRIMARY, HEADER_BG, ACCENT } from '../../../../src/constants/colors';


export default function AddSupplier({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const existing = route?.params?.supplier || null;

  const [form, setForm] = useState({
    firmName:           existing?.firmName           || '',
    ownerName:          existing?.ownerName          || '',
    email:              existing?.email              || '',
    mobile:             existing?.mobile             || '',
    gstin:              existing?.gstin              || '',
    pan:                existing?.pan                || '',
    udyam:              existing?.udyam              || '',
    street:             existing?.street             || '',
    city:               existing?.city               || '',
    state:              existing?.state              || '',
    pincode:            existing?.pincode            || '',
    country:            existing?.country            || '',
    corporateAddress:   existing?.corporateAddress   || '',
    website:            existing?.website            || '',
    bankName:           existing?.bankName           || '',
    accountNumber:      existing?.accountNumber      || '',
    ifsc:               existing?.ifsc               || '',
    upiId:              existing?.upiId              || '',
    logoKey:            existing?.logoKey            || '',
    // PDF Visibility Toggles
    showRegisteredAddress: existing?.showRegisteredAddress ?? true,
    showCorporateAddress:  existing?.showCorporateAddress  ?? false,
    showGstin:             existing?.showGstin             ?? false,
    showPan:               existing?.showPan               ?? false,
    showUdyam:             existing?.showUdyam             ?? false,
    showEmail:             existing?.showEmail             ?? true,
    showMobile:            existing?.showMobile            ?? true,
  });

  const [errors, setErrors] = useState({});

  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.firmName.trim()) newErrors.firmName = 'Firm Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      const raw = await getItemAsync('supplier');
      let list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = list ? [list] : [];
      if (existing) {
        const idx = list.findIndex(s => s.firmName === existing.firmName);
        if (idx !== -1) list[idx] = form; else list.unshift(form);
      } else {
        list.unshift(form);
      }
      await setItemAsync('supplier', JSON.stringify(list));
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not save supplier details.');
    }
  };

  const renderInput = ({ label, key, placeholder, icon: Icon, keyboard = 'default', required = false }) => (
    <View style={styles.inputGroup} key={key}>
      <Text style={styles.inputLabel}>
        {label}{required ? <Text style={{ color: '#EF4444' }}> *</Text> : null}
      </Text>
      <View style={[styles.inputWrapper, errors[key] ? styles.inputError : null]}>
        {Icon && <Icon size={16} color={errors[key] ? '#EF4444' : '#9CA3AF'} strokeWidth={2} style={{ marginRight: 8 }} />}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#C4C4C4"
          value={form[key]}
          onChangeText={(v) => setField(key, v)}
          keyboardType={keyboard}
          autoCapitalize={keyboard === 'email-address' ? 'none' : 'sentences'}
        />
      </View>
      {errors[key] ? <Text style={styles.errorText}>{errors[key]}</Text> : null}
    </View>
  );

  const renderToggle = (label, toggleKey) => (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={form[toggleKey]}
        onValueChange={(v) => setField(toggleKey, v)}
        trackColor={{ false: '#E5E7EB', true: '#A7D4C0' }}
        thumbColor={form[toggleKey] ? PRIMARY : '#9CA3AF'}
      />
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <SafeAreaView style={{ backgroundColor: PRIMARY, elevation: 4 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color="#FFF" strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{existing ? 'Edit Supplier' : 'Add Supplier'}</Text>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAwareScrollView
        keyboardOpeningTime={0}
        extraScrollHeight={80}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
      >
        {/* ── Firm Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Firm Info</Text>
          {renderInput({ label: 'Firm / Company Name', key: 'firmName', placeholder: 'e.g. ProGarden India', icon: Building2, required: true })}
          {renderInput({ label: 'Owner / Contact Name', key: 'ownerName', placeholder: 'e.g. Ashish Kumar', icon: User })}
        </View>

        {/* ── Contact Details ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Details</Text>
          {renderInput({ label: 'Email', key: 'email', placeholder: 'e.g. info@firm.com', icon: Mail, keyboard: 'email-address' })}
          {renderToggle('Show Email in PDF', 'showEmail')}
          <View style={styles.divider} />
          {renderInput({ label: 'Mobile', key: 'mobile', placeholder: 'e.g. 9876543210', icon: Phone, keyboard: 'phone-pad' })}
          {renderToggle('Show Mobile in PDF', 'showMobile')}
          <View style={styles.divider} />
          {renderInput({ label: 'Website', key: 'website', placeholder: 'e.g. www.firm.com', icon: Globe })}
        </View>

        {/* ── Registered Address ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Registered Address</Text>
            <View style={styles.toggleInline}>
              <Text style={styles.toggleHint}>Show in PDF</Text>
              <Switch
                value={form.showRegisteredAddress}
                onValueChange={(v) => setField('showRegisteredAddress', v)}
                trackColor={{ false: '#E5E7EB', true: '#A7D4C0' }}
                thumbColor={form.showRegisteredAddress ? PRIMARY : '#9CA3AF'}
              />
            </View>
          </View>
          {renderInput({ label: 'Street / Area', key: 'street', placeholder: 'e.g. RZ 21/274, Geetanjali Park', icon: MapPin })}
          {renderInput({ label: 'City', key: 'city', placeholder: 'e.g. New Delhi' })}
          {renderInput({ label: 'State', key: 'state', placeholder: 'e.g. Delhi' })}
          {renderInput({ label: 'Pincode', key: 'pincode', placeholder: 'e.g. 110046', keyboard: 'numeric' })}
          {renderInput({ label: 'Country', key: 'country', placeholder: 'e.g. India', icon: Globe })}
        </View>

        {/* ── Corporate Address ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Corporate Address</Text>
            <View style={styles.toggleInline}>
              <Text style={styles.toggleHint}>Show in PDF</Text>
              <Switch
                value={form.showCorporateAddress}
                onValueChange={(v) => setField('showCorporateAddress', v)}
                trackColor={{ false: '#E5E7EB', true: '#A7D4C0' }}
                thumbColor={form.showCorporateAddress ? PRIMARY : '#9CA3AF'}
              />
            </View>
          </View>
          {renderInput({ label: 'Corporate / Head Office Address', key: 'corporateAddress', placeholder: 'e.g. ANDC Instart Foundation, Kalkaji', icon: Building2 })}
        </View>

        {/* ── Tax & Registration ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tax & Registration</Text>
          {renderInput({ label: 'GSTIN', key: 'gstin', placeholder: 'e.g. 07AAFCH4804B1Z2', icon: Hash })}
          {renderToggle('Show GSTIN in PDF', 'showGstin')}
          <View style={styles.divider} />
          {renderInput({ label: 'PAN Number', key: 'pan', placeholder: 'e.g. ABIFP3808N', icon: FileText })}
          {renderToggle('Show PAN in PDF', 'showPan')}
          <View style={styles.divider} />
          {renderInput({ label: 'UDYAM Number', key: 'udyam', placeholder: 'e.g. UDYAM-DL-10-0101527', icon: Award })}
          {renderToggle('Show UDYAM in PDF', 'showUdyam')}
        </View>

        {/* ── Bank Details ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Details</Text>
          {renderInput({ label: 'Bank Name', key: 'bankName', placeholder: 'e.g. HDFC Bank' })}
          {renderInput({ label: 'Account Number', key: 'accountNumber', placeholder: 'e.g. 001234567890', keyboard: 'numeric' })}
          {renderInput({ label: 'IFSC Code', key: 'ifsc', placeholder: 'e.g. HDFC0001234' })}
          {renderInput({ label: 'UPI ID', key: 'upiId', placeholder: 'e.g. ashish@upi' })}
        </View>
      </KeyboardAwareScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Check size={18} color="#FFF" strokeWidth={2.5} />
          <Text style={styles.saveBtnText}>Save Supplier</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { padding: 4, borderRadius: 20 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#FFF' },
  section: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: PRIMARY, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  toggleInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleHint: { fontSize: 11, color: '#9CA3AF' },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 0,
    backgroundColor: '#FAFAFA',
  },
  inputError: { borderColor: '#EF4444' },
  input: { flex: 1, fontSize: 14, color: '#1F2937', height: 44 },
  errorText: { fontSize: 11, color: '#EF4444', marginTop: 4, marginLeft: 2 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 4,
  },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
  footer: {
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, backgroundColor: '#FFF',
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: PRIMARY, paddingVertical: 16, borderRadius: 14,
    elevation: 4, shadowColor: PRIMARY, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8,
  },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
