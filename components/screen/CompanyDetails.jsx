import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Switch,
  Platform,
  StatusBar,
  Modal,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Check,
  Building2,
  Briefcase,
  CreditCard,
  Info,
  ShieldCheck,
  Image as ImageIcon,
  Camera,
  Plus,
  ChevronDown,
} from 'lucide-react-native';
import { getItemAsync, setItemAsync, deleteItemAsync } from "../utils/customSecureStore";
import * as ImagePicker from 'expo-image-picker';

// Bundled logo assets for seeded companies
const LOGO_ASSETS = {
  progardenlogo: require('../../assets/progardenlogo.png'),
  hardendramalogo: require('../../assets/hardendramalogo.png'),
  Vgilogo: require('../../assets/Vgilogo.png'),
};

const FormField = ({ label, placeholder, required = false, type = "default", value, onChangeText, multiline = false, faded = false, showToggle = false, toggleActive, onToggle }) => (
  <View style={[styles.fieldContainer, faded && { opacity: 0.6 }]}>
    {showToggle ? (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={[styles.fieldLabel, { marginBottom: 0 }]}>
          {label} {required && <Text style={{ color: '#ef4444' }}>*</Text>}
        </Text>
        <Toggle active={toggleActive} onToggle={onToggle} label="Show in PDF" />
      </View>
    ) : (
      <Text style={styles.fieldLabel}>
        {label} {required && <Text style={{ color: '#ef4444' }}>*</Text>}
      </Text>
    )}
    <TextInput
      style={[
        styles.input,
        multiline && { height: 80, textAlignVertical: 'top' }
      ]}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      value={value}
      onChangeText={onChangeText}
      keyboardType={type}
      multiline={multiline}
    />
  </View>
);

const DropdownField = ({ label, placeholder, required = false, value, onPress, faded = false }) => (
  <View style={[styles.fieldContainer, faded && { opacity: 0.6 }]}>
    <Text style={styles.fieldLabel}>
      {label} {required && <Text style={{ color: '#ef4444' }}>*</Text>}
    </Text>
    <Pressable style={styles.input} onPress={onPress}>
      <Text style={{ color: value ? '#1A1A1A' : '#9CA3AF', fontSize: 14, fontWeight: '500' }}>
        {value || placeholder}
      </Text>
      <View style={{ position: 'absolute', right: 14, top: Platform.OS === 'ios' ? 14 : 10 }}>
        <ChevronDown size={20} color="#9CA3AF" />
      </View>
    </Pressable>
  </View>
);


const Toggle = ({ active, onToggle, label = "Show in PDF" }) => (
  <View style={styles.toggleContainer}>
    <Text style={[styles.toggleLabel, { color: active ? '#2E8B57' : '#9CA3AF' }]}>
      {label}
    </Text>
    <Switch
      value={active}
      onValueChange={onToggle}
      trackColor={{ false: '#E2E8F0', true: '#2E8B57' }}
      thumbColor="#FFFFFF"
      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
    />
  </View>
);

const STATES = [
  "New Delhi", "Delhi", "Haryana", "Uttar Pradesh", "Punjab", "Rajasthan",
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Goa", "Gujarat", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttarakhand", "West Bengal"
];

export default function CompanyDetails({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const isNew = route?.params?.isNew || false;

  const [companyData, setCompanyData] = useState({
    firmName: '', mobile: '', email: '', address: '', city: '', state: '', pincode: '',
    showCorpAddress: false, corpAddress: '', corpCity: '', corpState: '', corpPincode: '',
    showGstin: true, gstin: '', showPan: true, pan: '', showUdyam: true, udyam: '',
    showPayment: true, bankName: '', accNo: '', ifsc: '', upi: '',
    showTerms: true, terms: '',
    isDefault: false,
    logoUrl: '', qrUrl: ''
  });
  console.log(companyData)

  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [activeStateField, setActiveStateField] = useState(null); // 'state' or 'corpState'

  useEffect(() => {
    if (!isNew) {
      loadData();
    }
  }, [isNew]);

  const loadData = async () => {
    try {
      const raw = await getItemAsync("supplier");
      if (raw) {
        const s = JSON.parse(raw);
        const data = Array.isArray(s) ? s[0] : s;
        if (data) setCompanyData(prev => ({ ...prev, ...data }));
      }
    } catch { }
  };

  const handleSave = async () => {
    if (!companyData.firmName || !companyData.mobile) return;
    try {
      const raw = await getItemAsync("supplier");
      let suppliers = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(suppliers)) suppliers = [suppliers];

      if (isNew) {
        suppliers.push(companyData);
      } else {
        if (suppliers.length > 0) {
          suppliers[0] = { ...suppliers[0], ...companyData };
        } else {
          suppliers.push(companyData);
        }
      }
      await setItemAsync("supplier", JSON.stringify(suppliers));
      navigation.goBack();
    } catch {
      navigation.goBack();
    }
  };

  const pickImage = async (source, type) => {
    let result;
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    };

    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return;
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        if (type === 'logo') {
          setCompanyData({ ...companyData, logoUrl: base64Image, logoKey: '' });
        } else {
          setCompanyData({ ...companyData, qrUrl: base64Image });
        }
      }
    } catch (error) {
      console.log('Error picking image:', error);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#14402A" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>{isNew ? "Add New Company" : "Company Details"}</Text>
        <Pressable onPress={handleSave} style={styles.headerBtn}>
          <Check size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <KeyboardAwareScrollView enableOnAndroid={true} extraScrollHeight={40} keyboardOpeningTime={0} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Card 1: Basic Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Building2 size={18} color="#14402A" />
            <Text style={styles.cardTitle}>Basic Information</Text>
          </View>

          <FormField label="Firm Name" required placeholder="ProGarden Solutions" value={companyData.firmName} onChangeText={t => setCompanyData({ ...companyData, firmName: t })} />

          <View style={styles.row}>
            <View style={styles.flex1}><FormField label="Mobile" required type="phone-pad" placeholder="+91 00000 00000" value={companyData.mobile} onChangeText={t => setCompanyData({ ...companyData, mobile: t })} /></View>
            <View style={{ width: 12 }} />
            <View style={styles.flex1}><FormField label="Email" required type="email-address" placeholder="hello@progarden.com" value={companyData.email} onChangeText={t => setCompanyData({ ...companyData, email: t })} /></View>
          </View>

          <FormField label="Address" required placeholder="B-12, Green Park Avenue" value={companyData.address} onChangeText={t => setCompanyData({ ...companyData, address: t })} />

          <View style={styles.row}>
            <View style={styles.flex1}><FormField label="City" required placeholder="New Delhi" value={companyData.city} onChangeText={t => setCompanyData({ ...companyData, city: t })} /></View>
            <View style={{ width: 12 }} />
            <View style={styles.flex1}>
              <DropdownField
                label="State" required placeholder="Select State" value={companyData.state}
                onPress={() => { setActiveStateField('state'); setStateModalVisible(true); }}
              />
            </View>
          </View>

          <FormField label="Pincode" required type="numeric" placeholder="110016" value={companyData.pincode} onChangeText={t => setCompanyData({ ...companyData, pincode: t })} />

          {/* Corporate Address Toggle */}
          <View style={[styles.cardHeaderBetween, { marginTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16 }]}>
            <View style={styles.cardHeaderLeft}>
              <Building2 size={16} color="#14402A" />
              <Text style={[styles.cardTitle, { fontSize: 14 }]}>Corporate Address</Text>
            </View>
            <Toggle active={companyData.showCorpAddress} onToggle={() => setCompanyData({ ...companyData, showCorpAddress: !companyData.showCorpAddress })} label="Enable" />
          </View>

          {companyData.showCorpAddress && (
            <View style={styles.fieldsWrapper}>
              <FormField label="Corp. Address" required placeholder="C-45, Corporate Hub" value={companyData.corpAddress} onChangeText={t => setCompanyData({ ...companyData, corpAddress: t })} />
              <View style={styles.row}>
                <View style={styles.flex1}><FormField label="City" required placeholder="Noida" value={companyData.corpCity} onChangeText={t => setCompanyData({ ...companyData, corpCity: t })} /></View>
                <View style={{ width: 12 }} />
                <View style={styles.flex1}>
                  <DropdownField
                    label="State" required placeholder="Select State" value={companyData.corpState}
                    onPress={() => { setActiveStateField('corpState'); setStateModalVisible(true); }}
                  />
                </View>
              </View>
              <FormField label="Pincode" required type="numeric" placeholder="201301" value={companyData.corpPincode} onChangeText={t => setCompanyData({ ...companyData, corpPincode: t })} />
            </View>
          )}

          {/* Logo Upload Section */}
          <View style={styles.logoUploadSection}>
            <Text style={styles.fieldLabel}>LOGO UPLOAD</Text>
            <View style={styles.logoRow}>
              <View style={styles.logoPlaceholder}>
                {companyData.logoKey && LOGO_ASSETS[companyData.logoKey] ? (
                  <Image source={LOGO_ASSETS[companyData.logoKey]} style={{ width: 80, height: 80, borderRadius: 12 }} />
                ) : companyData.logoUrl ? (
                  <Image source={{ uri: companyData.logoUrl }} style={{ width: 80, height: 80, borderRadius: 12 }} />
                ) : (
                  <>
                    <ImageIcon size={24} color="#CBD5E1" />
                    <Text style={styles.noLogoText}>NO LOGO</Text>
                  </>
                )}
              </View>
              <View style={styles.logoActions}>
                <Pressable style={styles.logoBtn} onPress={() => pickImage('library', 'logo')}>
                  <ImageIcon size={14} color="#1A1A1A" />
                  <Text style={styles.logoBtnText}>Library</Text>
                </Pressable>
                <View style={{ height: 8 }} />
                <Pressable style={styles.logoBtn} onPress={() => pickImage('camera', 'logo')}>
                  <Camera size={14} color="#1A1A1A" />
                  <Text style={styles.logoBtnText}>Camera</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Card 2: Tax Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Briefcase size={18} color="#14402A" />
            <Text style={styles.cardTitle}>Tax Details</Text>
          </View>

          <View style={styles.fieldsWrapper}>
            <FormField
              label="GSTIN" placeholder="07AAAAA0000A1Z5" value={companyData.gstin}
              onChangeText={t => setCompanyData({ ...companyData, gstin: t })}
              showToggle toggleActive={companyData.showGstin}
              onToggle={() => setCompanyData({ ...companyData, showGstin: !companyData.showGstin })}
              faded={!companyData.showGstin}
            />
            <FormField
              label="PAN Card" placeholder="ABCDE1234F" value={companyData.pan}
              onChangeText={t => setCompanyData({ ...companyData, pan: t })}
              showToggle toggleActive={companyData.showPan}
              onToggle={() => setCompanyData({ ...companyData, showPan: !companyData.showPan })}
              faded={!companyData.showPan}
            />
            <FormField
              label="UDYAM Number" placeholder="UDYAM-DL-00-1234567" value={companyData.udyam}
              onChangeText={t => setCompanyData({ ...companyData, udyam: t })}
              showToggle toggleActive={companyData.showUdyam}
              onToggle={() => setCompanyData({ ...companyData, showUdyam: !companyData.showUdyam })}
              faded={!companyData.showUdyam}
            />
          </View>
        </View>

        {/* Card 3: Payment Details */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBetween}>
            <View style={styles.cardHeaderLeft}>
              <CreditCard size={18} color="#14402A" />
              <Text style={styles.cardTitle}>Payment Details</Text>
            </View>
            <Toggle active={companyData.showPayment} onToggle={() => setCompanyData({ ...companyData, showPayment: !companyData.showPayment })} />
          </View>

          <View style={styles.fieldsWrapper}>
            <FormField label="Bank Name" placeholder="HDFC Bank Ltd." faded={!companyData.showPayment} value={companyData.bankName} onChangeText={t => setCompanyData({ ...companyData, bankName: t })} />
            <FormField label="Account Number" placeholder="50100000000000" type="numeric" faded={!companyData.showPayment} value={companyData.accNo} onChangeText={t => setCompanyData({ ...companyData, accNo: t })} />
            <View style={styles.row}>
              <View style={styles.flex1}><FormField label="IFSC Code" placeholder="HDFC0001234" faded={!companyData.showPayment} value={companyData.ifsc} onChangeText={t => setCompanyData({ ...companyData, ifsc: t })} /></View>
              <View style={{ width: 12 }} />
              <View style={styles.flex1}><FormField label="UPI ID" placeholder="progarden@upi" faded={!companyData.showPayment} value={companyData.upi} onChangeText={t => setCompanyData({ ...companyData, upi: t })} /></View>
            </View>

            {/* QR Code Section */}
            <View style={[styles.qrUploadSection, !companyData.showPayment && { opacity: 0.6 }]}>
              <Text style={styles.fieldLabel}>QR CODE UPLOAD</Text>
              {companyData.qrUrl ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <Image source={{ uri: companyData.qrUrl }} style={{ width: 80, height: 80, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }} />
                  <Pressable style={[styles.qrBtn, { flex: 1, height: 44 }]} onPress={() => pickImage('library', 'qr')} disabled={!companyData.showPayment}>
                    <Text style={styles.qrBtnText}>Change QR Code</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable style={styles.qrBtn} onPress={() => pickImage('library', 'qr')} disabled={!companyData.showPayment}>
                  <Plus size={18} color="#1A1A1A" />
                  <Text style={styles.qrBtnText}>Upload QR Code Image</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Card 5: Default Option */}
        <View style={[styles.card, styles.defaultCard]}>
          <View style={styles.defaultCardLeft}>
            <View style={styles.shieldIconWrapper}>
              <ShieldCheck size={18} color="#2E8B57" />
            </View>
            <Text style={styles.defaultCardText}>Set as Default Company</Text>
          </View>
          <Pressable
            onPress={() => setCompanyData({ ...companyData, isDefault: !companyData.isDefault })}
            style={[styles.checkbox, companyData.isDefault && styles.checkboxActive]}
          >
            {companyData.isDefault && <Check size={14} color="#FFFFFF" />}
          </Pressable>
        </View>

      </KeyboardAwareScrollView>

      {/* State Selector Modal */}
      <Modal
        visible={stateModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <Pressable onPress={() => setStateModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={{ fontSize: 16, color: '#7C7C7C', fontWeight: '700' }}>✕</Text>
              </Pressable>
            </View>
            <KeyboardAwareScrollView enableOnAndroid={true} extraScrollHeight={20} keyboardOpeningTime={0} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {STATES.map((s, idx) => (
                <Pressable
                  key={idx}
                  style={styles.stateRow}
                  onPress={() => {
                    if (activeStateField === 'state') setCompanyData({ ...companyData, state: s });
                    else if (activeStateField === 'corpState') setCompanyData({ ...companyData, corpState: s });
                    setStateModalVisible(false);
                  }}
                >
                  <Text style={[styles.stateRowText, (companyData[activeStateField] === s) && { color: '#14402A', fontWeight: '800' }]}>{s}</Text>
                  {(companyData[activeStateField] === s) && <Check size={16} color="#14402A" />}
                </Pressable>
              ))}
            </KeyboardAwareScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    backgroundColor: '#14402A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 8 }
    }),
    zIndex: 10,
  },
  headerBtn: { padding: 8, marginHorizontal: -8 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  cardHeaderBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  row: { flexDirection: 'row' },
  flex1: { flex: 1 },
  fieldContainer: { marginBottom: 14 },
  fieldLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: 0.5, marginLeft: 4, marginBottom: 6 },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  logoUploadSection: { marginTop: 8 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoPlaceholder: {
    width: 80, height: 80, backgroundColor: '#F8FAFC',
    borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 16
  },
  noLogoText: { fontSize: 8, fontWeight: '700', color: '#CBD5E1', marginTop: 4 },
  logoActions: { flex: 1 },
  logoBtn: {
    backgroundColor: '#F1F5F9', borderRadius: 10, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8
  },
  logoBtnText: { color: '#1A1A1A', fontSize: 12, fontWeight: '700' },
  toggleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldsWrapper: { marginTop: 4 },
  noteText: { fontSize: 10, color: '#9CA3AF', fontStyle: 'italic', fontWeight: '500' },
  qrUploadSection: { marginTop: 8 },
  qrBtn: {
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 12, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8
  },
  qrBtnText: { color: '#1A1A1A', fontSize: 12, fontWeight: '700' },
  defaultCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  defaultCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shieldIconWrapper: { backgroundColor: '#ECFDF5', padding: 8, borderRadius: 8 },
  defaultCardText: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  checkbox: {
    width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center'
  },
  checkboxActive: { backgroundColor: '#2E8B57', borderColor: '#2E8B57' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, backgroundColor: '#FFFFFF', maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  modalCloseBtn: { padding: 4 },
  stateRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stateRowText: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
});

