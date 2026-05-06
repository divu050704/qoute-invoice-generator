import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Modal, FlatList,
  StatusBar, Alert, TouchableOpacity, TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import addAndSave from '../../../utils/addAndSave';
import {
  ArrowLeft, Building2, MapPin, Check, ChevronDown, CheckCircle2, Hash
} from 'lucide-react-native';

// -- Shared constants --
import { PRIMARY, HEADER_BG, ACCENT } from '../../../../src/constants/colors';

const BG       = '#F4F6F8';
const CARD     = '#FFFFFF';
const BORDER   = '#E8EDF2';
const TEXT     = '#1F2937';
const LABEL    = '#64748B';
const INPUT_BG = '#F8FAFC';

const INDIAN_STATES = [
  'Delhi', 'Haryana', 'Uttar Pradesh', 'Rajasthan', 'Punjab',
  'Uttarakhand', 'Himachal Pradesh',
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh',
  'Chhattisgarh', 'Goa', 'Gujarat', 'Jammu and Kashmir', 'Jharkhand',
  'Karnataka', 'Kerala', 'Ladakh', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'West Bengal',
];

// ─── Bottom Sheet Picker Modal ────────────────────────────────────────────────
function PickerModal({ visible, title, options, selected, onSelect, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={pm.overlay} />
      </TouchableWithoutFeedback>

      <View style={pm.sheet}>
        {/* Handle */}
        <View style={pm.handle} />

        {/* Title row */}
        <View style={pm.titleRow}>
          <Text style={pm.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Text style={pm.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Options list */}
        <FlatList
          data={options}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={pm.separator} />}
          renderItem={({ item }) => {
            const isSelected = item === selected;
            return (
              <TouchableOpacity
                style={[pm.option, isSelected && pm.optionActive]}
                onPress={() => { onSelect(item); onClose(); }}
                activeOpacity={0.7}
              >
                <Text style={[pm.optionText, isSelected && pm.optionTextActive]}>
                  {item}
                </Text>
                {isSelected && (
                  <CheckCircle2 size={18} color={PRIMARY} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 30,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB',
    alignSelf: 'center', marginTop: 12, marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  title: { fontSize: 15, fontWeight: '700', color: TEXT },
  closeBtn: { fontSize: 16, color: LABEL, fontWeight: '600', padding: 4 },
  separator: { height: 1, backgroundColor: '#F8FAFC', marginHorizontal: 20 },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
  },
  optionActive: { backgroundColor: '#F0FDF4' },
  optionText: { fontSize: 14, color: TEXT, fontWeight: '500' },
  optionTextActive: { color: PRIMARY, fontWeight: '700' },
});

// ─── SelectField — triggers bottom sheet ─────────────────────────────────────
function SelectField({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <View style={sf.group}>
        <Text style={sf.label}>{label}</Text>
        <TouchableOpacity
          style={sf.picker}
          onPress={() => setOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={sf.pickerText} numberOfLines={1}>{value}</Text>
          <ChevronDown size={16} color={LABEL} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <PickerModal
        visible={open}
        title={label}
        options={options}
        selected={value}
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

const sf = StyleSheet.create({
  group: { flex: 1 },
  label: {
    fontSize: 11, fontWeight: '700', color: LABEL,
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4,
  },
  picker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: INPUT_BG, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 10, paddingHorizontal: 12, height: 44,
  },
  pickerText: { fontSize: 13, color: TEXT, fontWeight: '500', flex: 1, marginRight: 6 },
});

// ─── Text Input Field ─────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, keyboard = 'default', required, style }) {
  return (
    <View style={[{ flex: 1 }, style]}>
      <Text style={styles.fieldLabel}>
        {label}{required && <Text style={{ color: '#EF4444' }}> *</Text>}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder || ''}
        placeholderTextColor="#C4C4C4"
        keyboardType={keyboard}
        autoCapitalize={keyboard === 'email-address' ? 'none' : 'sentences'}
      />
    </View>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Icon size={16} color={PRIMARY} strokeWidth={2.5} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AddShipTo({ navigation, route }) {
  const insets   = useSafeAreaInsets();
  const existing = route?.params?.shipTo || null;

  const [form, setForm] = useState({
    companyName: existing?.companyName || '',
    contactName: existing?.contactName || '',
    gstin:       existing?.gstin || '',
    street:      existing?.street || '',
    city:        existing?.city || '',
    state:       existing?.state || 'Delhi',
    pincode:     existing?.pincode || '',
    country:     existing?.country || 'India',
  });

  const set = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!form.companyName.trim()) {
      Alert.alert('Required', 'Company Name is required.'); return;
    }
    try {
      await addAndSave({ propertyName: 'shipto', newValue: form, propertyCheck: 'companyName' });
      Alert.alert(
        existing ? '✓ Updated' : '✓ Address Saved',
        existing
          ? `${form.companyName} has been updated.`
          : `${form.companyName} added successfully.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch {
      Alert.alert('Error', 'Could not save Ship To details.');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* ── HEADER ── */}
      <SafeAreaView style={{ backgroundColor: PRIMARY, elevation: 4, zIndex: 10 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color="#FFF" strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {existing ? 'Edit Shipping Address' : 'Add Shipping Address'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ── FORM ── */}
      <KeyboardAwareScrollView
        keyboardOpeningTime={0}
        extraScrollHeight={100}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 110 }}
        style={{ backgroundColor: BG }}
      >

        {/* Company Info */}
        <Section icon={Building2} title="Company Info">
          <Field
            label="Company / Recipient Name" value={form.companyName}
            onChange={set('companyName')} placeholder="e.g. Acme Pvt Ltd" required
          />
          <View style={styles.divider} />
          <Field
            label="Contact Person" value={form.contactName}
            onChange={set('contactName')} placeholder="Full Name"
          />
          <View style={styles.divider} />
          <Field
            label="GSTIN" value={form.gstin}
            onChange={set('gstin')} placeholder="Optional"
          />
        </Section>

        {/* Delivery Address */}
        <Section icon={MapPin} title="Delivery Address">
          <Field
            label="Street Address" value={form.street}
            onChange={set('street')} placeholder="Building, Street, Area"
          />
          <View style={styles.divider} />
          <View style={styles.row}>
            <Field label="City" value={form.city} onChange={set('city')} placeholder="Delhi" />
            <View style={{ width: 12 }} />
            <SelectField label="State" value={form.state} options={INDIAN_STATES} onChange={set('state')} />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Field label="Pincode" value={form.pincode} onChange={set('pincode')} placeholder="110001" keyboard="numeric" />
            <View style={{ width: 12 }} />
            <Field label="Country" value={form.country} onChange={set('country')} placeholder="India" />
          </View>
        </Section>

      </KeyboardAwareScrollView>

      {/* ── FOOTER ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 6 : 14 }]}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Check size={18} color="#FFF" strokeWidth={2.5} />
          <Text style={styles.saveBtnText}>
            {existing ? 'Update Address' : 'Save Address'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { padding: 4, borderRadius: 20 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#FFF' },

  // ── Section Card
  section: {
    backgroundColor: CARD, borderRadius: 16, marginBottom: 14,
    borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    backgroundColor: '#F8FAF9', borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  sectionIconWrap: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: '#EFFAF2',
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: PRIMARY, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionBody: { padding: 14, gap: 12 },

  // ── Field
  fieldLabel: { fontSize: 11, fontWeight: '700', color: LABEL, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    backgroundColor: INPUT_BG, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 10, paddingHorizontal: 12,
    fontSize: 13, color: TEXT, fontWeight: '500', height: 44,
  },

  // ── Layout
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 2 },

  // ── Footer
  footer: {
    backgroundColor: CARD, borderTopWidth: 1, borderTopColor: BORDER,
    paddingHorizontal: 16, paddingTop: 12, elevation: 12,
    shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: -3 }, shadowRadius: 10,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: ACCENT, paddingVertical: 16, borderRadius: 14,
    elevation: 4, shadowColor: ACCENT, shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10,
  },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
