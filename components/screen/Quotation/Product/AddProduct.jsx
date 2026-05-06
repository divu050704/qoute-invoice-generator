import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  StatusBar, Alert, Image, Switch, Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, Search, Info, Camera, Image as ImageIcon, X, UploadCloud, ChevronDown } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import addAndSave from '../../../utils/addAndSave';

// -- Shared constants --
import { PRIMARY, HEADER_BG, ACCENT } from '../../../../src/constants/colors';


export default function AddProduct({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const existing = route?.params?.product || route?.params?.productData || null;

  const [formData, setFormData] = useState({
    name: existing?.productName || '',
    description: existing?.description || '',
    hsn: existing?.hsnCode || existing?.hsn || '',
    unitPrice: existing?.unitPrice ?? existing?.rate ?? '',
    quantity: existing?.quantity ?? '',
    unit: existing?.unit || '',
    discountValue: existing?.discountValue ?? existing?.discountRate ?? '',
    discountType: existing?.discountType || '%',
    isInclusive: existing?.taxInclusive || false,
    gstRate: existing?.gstRate ?? '',
    cess: existing?.cess ?? '',
  });

  const [showImageUpload, setShowImageUpload] = useState(!!(existing?.productImage));
  const [imagePreview, setImagePreview] = useState(existing?.productImage || null);

  const [totals, setTotals] = useState({ subtotal: 0, discount: 0, taxable: 0, gst: 0, total: 0 });

  useEffect(() => {
    const price = parseFloat(formData.unitPrice) || 0;
    const qty = parseFloat(formData.quantity) || 0;
    const discVal = parseFloat(formData.discountValue) || 0;
    const gstRate = parseFloat(formData.gstRate) || 0;
    const cessRate = parseFloat(formData.cess) || 0;

    const subtotal = price * qty;
    const discountAmt = formData.discountType === '%' ? (subtotal * discVal) / 100 : discVal;
    let taxable, gstAmt;

    if (formData.isInclusive) {
      const factor = 1 + (gstRate + cessRate) / 100;
      taxable = (subtotal - discountAmt) / factor;
      gstAmt = (subtotal - discountAmt) - taxable;
    } else {
      taxable = subtotal - discountAmt;
      gstAmt = (taxable * (gstRate + cessRate)) / 100;
    }

    setTotals({ subtotal, discount: discountAmt, taxable, gst: gstAmt, total: taxable + gstAmt });
  }, [formData]);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const pickImage = async (source) => {
    try {
      let result;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permission Required', 'Camera access needed.'); return; }
        result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, base64: true });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permission Required', 'Gallery access needed.'); return; }
        result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, base64: true });
      }
      if (!result.canceled && result.assets?.length > 0) {
        setImagePreview(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch { Alert.alert('Error', 'Could not open image picker.'); }
  };

  const handleSave = async () => {
    const hasName = formData.name.trim().length > 0;
    const hasImage = showImageUpload && imagePreview;
    if (!hasName && !hasImage) { Alert.alert('Required', 'Either Product Name or Product Image is required.'); return; }
    
    const parsedPrice = Number(formData.unitPrice);
    const parsedQty = Number(formData.quantity);
    
    if (String(formData.unitPrice).trim() === '' || isNaN(parsedPrice)) { 
      Alert.alert('Required', 'Valid Unit Price is required.'); 
      return; 
    }
    if (String(formData.quantity).trim() === '' || isNaN(parsedQty) || parsedQty <= 0) { 
      Alert.alert('Required', 'Valid Quantity (greater than 0) is required.'); 
      return; 
    }

    try {
      const payload = {
        productName: formData.name.trim(),
        description: formData.description.trim(),
        hsnCode: formData.hsn.trim(),
        hsn: formData.hsn.trim(),
        unit: formData.unit,
        unitPrice: parsedPrice,
        rate: parsedPrice,
        quantity: parsedQty,
        gstRate: Number(formData.gstRate) || 0,
        discountRate: Number(formData.discountValue) || 0,
        discountValue: Number(formData.discountValue) || 0,
        discountType: formData.discountType,
        taxInclusive: formData.isInclusive,
        cess: Number(formData.cess) || 0,
        productImage: showImageUpload ? imagePreview : null,
      };
      if (!route?.params?.tempOnly) {
        await addAndSave({ propertyName: 'products', newValue: payload, propertyCheck: 'productName' });
      }
      if (route?.params?.onSave) {
        route.params.onSave(payload);
      }
      navigation.goBack();
    } catch { Alert.alert('Error', 'Could not save product.'); }
  };

  const GST_RATES = [
    { value: 0, label: '0% – Exempt' },
    { value: 0.25, label: '0.25%' },
    { value: 1, label: '1%' },
    { value: 1.5, label: '1.5%' },
    { value: 3, label: '3%' },
    { value: 5, label: '5% – Plants, Seeds, Manure' },
    { value: 6, label: '6%' },
    { value: 7.5, label: '7.5%' },
    { value: 12, label: '12% – Timber, Plywood, Fertilizer' },
    { value: 18, label: '18% – Landscaping, Services, Artificial' },
    { value: 28, label: '28% – Marble, Granite, Cement' },
  ];
  const UNITS = [
    { value: 'PCS', label: 'PCS – Pieces' },
    { value: 'NOS', label: 'NOS – Numbers' },
    { value: 'SQFT', label: 'SQFT – Square Feet' },
    { value: 'SQM', label: 'SQM – Square Meter' },
    { value: 'RFT', label: 'RFT – Running Feet' },
    { value: 'CFT', label: 'CFT – Cubic Feet' },
    { value: 'CUM', label: 'CUM – Cubic Meter' },
    { value: 'MTR', label: 'MTR – Meter' },
    { value: 'FEET', label: 'FEET – Feet' },
    { value: 'INCH', label: 'INCH – Inches' },
    { value: 'CM', label: 'CM – Centimeter' },
    { value: 'MM', label: 'MM – Millimeter' },
    { value: 'KG', label: 'KG – Kilogram' },
    { value: 'TON', label: 'TON – Metric Ton' },
    { value: 'LTR', label: 'LTR – Litre' },
    { value: 'BAG', label: 'BAG – Bag' },
    { value: 'BOX', label: 'BOX – Box' },
    { value: 'BUNDLE', label: 'BUNDLE – Bundle' },
    { value: 'ROLL', label: 'ROLL – Roll' },
    { value: 'SET', label: 'SET – Set' },
    { value: 'PAIR', label: 'PAIR – Pair' },
    { value: 'PLANT', label: 'PLANT – Plant' },
    { value: 'POT', label: 'POT – Pot' },
    { value: 'TRIP', label: 'TRIP – Trip / Load' },
    { value: 'HR', label: 'HR – Hour' },
    { value: 'DAY', label: 'DAY – Day' },
    { value: 'MONTH', label: 'MONTH – Month' },
    { value: 'LS', label: 'LS – Lump Sum' },
  ];

  const FieldLabel = ({ label, required, subtitle }) => (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 6, marginLeft: 2 }}>
      <Text style={s.label}>{label}{required ? <Text style={{ color: '#EF4444' }}> *</Text> : ''}</Text>
      {subtitle ? <Text style={s.labelSub}>{subtitle}</Text> : null}
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <SafeAreaView style={{ backgroundColor: PRIMARY }} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={{ padding: 4, marginLeft: -4 }}>
            <ChevronLeft size={24} color="#FFF" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Add Product</Text>
        </View>
      </SafeAreaView>

      <KeyboardAwareScrollView keyboardOpeningTime={0} enableOnAndroid extraScrollHeight={80} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 140 }}>

        {/* SECTION 1: PRODUCT DETAILS */}
        <View style={s.card}>
          <View style={s.cardTopRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={s.accentBar} />
              <Text style={s.cardTitle}>Product Details</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.toggleLabel}>Photo</Text>
              <Switch
                value={showImageUpload}
                onValueChange={v => { setShowImageUpload(v); if (!v) setImagePreview(null); }}
                trackColor={{ false: '#CBD5E1', true: '#FF8A00' }}
                thumbColor="#FFF"
              />
            </View>
          </View>

          {/* Image Upload */}
          {showImageUpload && (
            <View style={{ marginBottom: 16 }}>
              {!imagePreview ? (
                <View style={s.imageDrop}>
                  <View style={s.imageDropIcon}><UploadCloud size={24} color="#94A3B8" /></View>
                  <Text style={s.imageDropText}>Add a professional product photo</Text>
                  <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginTop: 4 }}>
                    <TouchableOpacity style={s.imageBtn} onPress={() => pickImage('gallery')} activeOpacity={0.8}>
                      <ImageIcon size={16} color={PRIMARY} strokeWidth={2} />
                      <Text style={s.imageBtnText}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.imageBtn} onPress={() => pickImage('camera')} activeOpacity={0.8}>
                      <Camera size={16} color="#FF8A00" strokeWidth={2} />
                      <Text style={s.imageBtnText}>Camera</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <Image source={{ uri: imagePreview }} style={s.imagePreview} resizeMode="cover" />
                  <TouchableOpacity style={s.imageRemoveBtn} onPress={() => setImagePreview(null)}>
                    <X size={14} color="#FFF" strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <FieldLabel label="Product Name" required />
          <TextInput style={s.input} placeholder="Enter item name" placeholderTextColor="#94A3B8"
            value={formData.name} onChangeText={v => handleChange('name', v)} />

          <View style={{ height: 14 }} />
          <FieldLabel label="Description" />
          <TextInput style={[s.input, { minHeight: 72, textAlignVertical: 'top', paddingTop: 12 }]}
            placeholder="Brief details about the product..." placeholderTextColor="#94A3B8"
            value={String(formData.description)} onChangeText={v => handleChange('description', v)} multiline />

          <View style={{ height: 14 }} />
          <FieldLabel label="HSN/SAC Code" />
          <View style={s.inputIcon}>
            <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} placeholder="Ex: 9983" placeholderTextColor="#94A3B8"
              value={String(formData.hsn)} onChangeText={v => handleChange('hsn', v)} keyboardType="numeric" />
            <Search size={18} color="#94A3B8" style={{ position: 'absolute', right: 14 }} />
          </View>
        </View>

        {/* SECTION 2: PRICING & TAX */}
        <View style={[s.card, { marginTop: 16 }]}>
          <View style={s.cardTopRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={s.accentBar} />
              <Text style={s.cardTitle}>Pricing & Tax</Text>
            </View>
          </View>

          {/* Price + Qty */}
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <FieldLabel label="Unit Price" required />
              <View style={s.inputIcon}>
                <Text style={s.prefix}>₹</Text>
                <TextInput style={[s.input, { flex: 1, marginBottom: 0, paddingLeft: 28 }]} placeholder="0.00"
                  placeholderTextColor="#94A3B8" keyboardType="decimal-pad"
                  value={String(formData.unitPrice)} onChangeText={v => handleChange('unitPrice', v)} />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel label="Quantity" required />
              <TextInput style={s.input} placeholder="00" placeholderTextColor="#94A3B8" keyboardType="numeric"
                value={String(formData.quantity)} onChangeText={v => handleChange('quantity', v)} />
            </View>
          </View>

          {/* Unit + Discount */}
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <View style={[s.input, { paddingHorizontal: 0, paddingVertical: Platform.OS === 'ios' ? 0 : -10, justifyContent: 'center' }]}>
                <Picker
                  selectedValue={formData.unit}
                  onValueChange={(val) => handleChange('unit', val)}
                  style={{ width: '100%', height: Platform.OS === 'ios' ? 44 : 50, color: formData.unit ? '#1E293B' : '#94A3B8' }}
                  dropdownIconColor="#94A3B8"
                >
                  <Picker.Item label="Select Unit" value="" color="#94A3B8" />
                  {UNITS.map(u => (
                    <Picker.Item key={u.value} label={u.label} value={u.value} />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel label="Discount" />
              <View style={s.discountRow}>
                <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} placeholder="0"
                  placeholderTextColor="#94A3B8" keyboardType="decimal-pad"
                  value={String(formData.discountValue)} onChangeText={v => handleChange('discountValue', v)} />
                <TouchableOpacity style={s.discountTypeBtn}
                  onPress={() => handleChange('discountType', formData.discountType === '%' ? '₹' : '%')}>
                  <Text style={s.discountTypeTxt}>{formData.discountType}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Tax Type Segmented */}
          <View style={s.divider} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={s.segLabel}>Tax Type</Text>
            <View style={s.segControl}>
              {['Exclusive', 'Inclusive'].map(opt => {
                const active = opt === 'Exclusive' ? !formData.isInclusive : formData.isInclusive;
                return (
                  <TouchableOpacity key={opt} onPress={() => handleChange('isInclusive', opt === 'Inclusive')}
                    style={[s.segBtn, active && s.segBtnActive]}>
                    <Text style={[s.segBtnText, active && s.segBtnTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* GST + Cess */}
          <View style={s.row2}>
            <View style={{ flex: 2 }}>
              <View style={[s.input, { paddingHorizontal: 0, paddingVertical: Platform.OS === 'ios' ? 0 : -10, justifyContent: 'center' }]}>
                <Picker
                  selectedValue={formData.gstRate}
                  onValueChange={(val) => handleChange('gstRate', val)}
                  style={{ width: '100%', height: Platform.OS === 'ios' ? 44 : 50, color: formData.gstRate !== '' ? '#1E293B' : '#94A3B8' }}
                  dropdownIconColor="#94A3B8"
                >
                  <Picker.Item label="Select GST Rate" value="" color="#94A3B8" />
                  {GST_RATES.map(r => (
                    <Picker.Item key={r.value} label={r.label} value={r.value} />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel label="CESS" subtitle="(Optional)" />
              <View style={s.inputIcon}>
                <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} placeholder="0"
                  placeholderTextColor="#94A3B8" keyboardType="decimal-pad"
                  value={String(formData.cess)} onChangeText={v => handleChange('cess', v)} />
                <Text style={[s.prefix, { right: 12, left: 'auto' }]}>%</Text>
              </View>
            </View>
          </View>

          {/* Totals Preview */}
          <View style={s.totalsBox}>
            {[
              ['Subtotal', `₹${totals.subtotal.toFixed(2)}`],
              totals.discount > 0 ? ['Discount', `- ₹${totals.discount.toFixed(2)}`, '#EF4444'] : null,
              ['Taxable Amt', `₹${totals.taxable.toFixed(2)}`],
              ['Total Tax (GST + CESS)', `₹${totals.gst.toFixed(2)}`],
            ].filter(Boolean).map(([label, value, color]) => (
              <View key={label} style={s.totalsRow}>
                <Text style={s.totalsLabel}>{label}</Text>
                <Text style={[s.totalsValue, color && { color }]}>{value}</Text>
              </View>
            ))}
            <View style={s.totalsDivider} />
            <View style={s.totalsRow}>
              <Text style={s.totalsFinalLabel}>Total Amount</Text>
              <Text style={s.totalsFinalValue}>₹{totals.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Info note */}
        <View style={s.infoRow}>
          <Info size={14} color={PRIMARY} />
          <Text style={s.infoText}>Inventory will be automatically adjusted upon saving this product.</Text>
        </View>

      </KeyboardAwareScrollView>

      {/* STICKY BOTTOM */}
      <View style={[s.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 20 }]}>
        <View style={s.footerTop}>
          <View>
            <Text style={s.footerLabel}>Total Amount</Text>
            <Text style={s.footerTotal}>₹{totals.total.toFixed(2)}</Text>
          </View>
          <Text style={s.footerSub}>Inclusive of all taxes</Text>
        </View>
        <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={s.saveBtnText}>Save Product</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', letterSpacing: -0.3 },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, borderWidth: 1, borderColor: '#F1F5F9' },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  accentBar: { width: 4, height: 16, backgroundColor: PRIMARY, borderRadius: 2 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#1E293B', textTransform: 'uppercase', letterSpacing: 0.5 },
  toggleLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
  label: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  labelSub: { fontSize: 10, color: '#94A3B8', fontWeight: '500' },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 10, fontSize: 15, color: '#1E293B', fontWeight: '500' },
  inputIcon: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  prefix: { position: 'absolute', left: 12, fontSize: 15, color: '#64748B', fontWeight: '600', zIndex: 1 },
  row2: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  chipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  chipTextActive: { color: '#FFF' },
  discountRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, overflow: 'hidden', backgroundColor: '#F8FAFC' },
  discountTypeBtn: { backgroundColor: '#E2E8F0', paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' },
  discountTypeTxt: { fontSize: 13, fontWeight: '800', color: '#475569' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  segLabel: { fontSize: 12, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  segControl: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4 },
  segBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  segBtnActive: { backgroundColor: PRIMARY },
  segBtnText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  segBtnTextActive: { color: '#FFF' },
  totalsBox: { marginTop: 16, backgroundColor: 'rgba(19,78,58,0.05)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(19,78,58,0.1)' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalsLabel: { fontSize: 13, color: '#64748B' },
  totalsValue: { fontSize: 13, fontWeight: '600', color: '#334155' },
  totalsDivider: { height: 1, backgroundColor: 'rgba(19,78,58,0.15)', marginVertical: 8 },
  totalsFinalLabel: { fontSize: 15, fontWeight: '800', color: PRIMARY },
  totalsFinalValue: { fontSize: 18, fontWeight: '800', color: PRIMARY },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 12, paddingHorizontal: 4, opacity: 0.6 },
  infoText: { fontSize: 11, color: '#475569', flex: 1, lineHeight: 16 },
  imageDrop: { borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', borderRadius: 16, padding: 24, alignItems: 'center', backgroundColor: 'rgba(248,250,252,0.5)', marginBottom: 4 },
  imageDropIcon: { backgroundColor: '#FFF', padding: 12, borderRadius: 40, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  imageDropText: { fontSize: 13, color: '#64748B', marginBottom: 12 },
  imageBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12 },
  imageBtnText: { fontSize: 12, fontWeight: '700', color: '#334155' },
  imagePreview: { width: '100%', height: 160, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  imageRemoveBtn: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingHorizontal: 16, paddingTop: 14, shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 10 },
  footerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  footerLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 },
  footerTotal: { fontSize: 22, fontWeight: '800', color: PRIMARY },
  footerSub: { fontSize: 10, color: '#94A3B8' },
  saveBtn: { backgroundColor: '#FF8A00', paddingVertical: 14, borderRadius: 12, alignItems: 'center', shadowColor: '#FF8A00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
});

