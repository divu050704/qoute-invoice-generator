import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, StatusBar, Image,
  TextInput, Alert, TouchableOpacity, Modal, Switch, Platform, Dimensions, ActivityIndicator, KeyboardAvoidingView
} from 'react-native';

import { useTheme } from '../ThemeContext';
import { useAlert } from '../ui/CustomAlert';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../utils/customSecureStore';
import addAndSave from '../utils/addAndSave';
import { Calendar } from 'react-native-calendars';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import {
  ArrowLeft, User, MapPin, FileText,
  Landmark, Calendar as CalendarIcon, Hash, Plus, Trash2,
  PencilLine, ArrowRightLeft, Clock, Building2, PenTool, CheckCircle2, ListPlus, Check,
  Package, Calculator, Search, ChevronLeft, Camera, Image as ImageIcon
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

// -- Shared constants --
import { PRIMARY, HEADER_BG, ACCENT } from '../../src/constants/colors';
import EntitySelector from '../../src/components/forms/EntitySelector';
import SignatureSection from '../../src/components/forms/SignatureSection';
import BankDetailsSection from '../../src/components/forms/BankDetailsSection';
import TermsSection from '../../src/components/forms/TermsSection';
import CalendarModal from '../../src/components/CalendarModal';


const LOGO_ASSETS = {
  progardenlogo: require('../../assets/progardenlogo.png'),
  hardendramalogo: require('../../assets/hardendramalogo.png'),
  Vgilogo: require('../../assets/Vgilogo.png'),
};

const today = () => new Date().toISOString().split('T')[0];

export default function CreateQuotation({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const alert = useAlert();
  const inputData = route?.params?.inputData || null;

  // Dark mode palette
  const bg = isDark ? '#121212' : '#F8FAFC';
  const cardBg = isDark ? '#1E1E1E' : '#FFF';
  const cardBorder = isDark ? '#2C2C2E' : '#F1F5F9';
  const textMain = isDark ? '#F5F5F5' : '#0F172A';
  const textSub = isDark ? '#A1A1AA' : '#94A3B8';
  const inputBgColor = isDark ? '#2C2C2E' : '#F8FAFC';
  const inputBorder = isDark ? '#3A3A3C' : '#E2E8F0';

  // State
  const [quotationNumber, setQuotationNumber] = useState(inputData?.quotationNumber || '001');
  const [quotationPrefix, setQuotationPrefix] = useState(inputData?.quotationPrefix || `QTPG/${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const [quotationDate, setQuotationDate] = useState(inputData?.quotationDate || today());
  const [quotationValidity, setQuotationValidity] = useState(inputData?.quotationValidity || '');

  const [supplierDetails, setSupplierDetails] = useState(inputData?.supplierDetails || null);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [buyerDetails, setBuyerDetails] = useState(inputData?.buyerDetails || null);
  const [shipToDetails, setShipToDetails] = useState(inputData?.shipToDetails || null);
  const [bankDetails, setBankDetails] = useState(inputData?.bankDetails || null);
  const [termsAndConditions, setTermsAndConditions] = useState(
    inputData?.termsAndConditions
      ? (Array.isArray(inputData.termsAndConditions) ? inputData.termsAndConditions : [inputData.termsAndConditions])
      : []
  );

  const [productDetails, setProductDetails] = useState(inputData?.productDetails || []);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  const [isShippingNeeded, setIsShippingNeeded] = useState(inputData?.isShippingNeeded ?? !!inputData?.shipToDetails);
  const [shippingType, setShippingType] = useState(inputData?.shippingType || (inputData?.shipToDetails ? 'custom' : 'same'));

  // Other Charges, Overall GST, Advance Payment
  const [otherCharges, setOtherCharges] = useState(inputData?.otherCharges || []);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [newChargeName, setNewChargeName] = useState('');
  const [newChargeAmount, setNewChargeAmount] = useState('');
  const [overallGstEnabled, setOverallGstEnabled] = useState(inputData?.overallGstEnabled ?? false);
  const [overallGstRate, setOverallGstRate] = useState(inputData?.overallGstRate || '18');
  const [advanceReceived, setAdvanceReceived] = useState(inputData?.advanceReceived || '');

  // Signature
  const [signatureData, setSignatureData] = useState(inputData?.signatureData || null);
  const [showSignatureInPdf, setShowSignatureInPdf] = useState(inputData?.showSignatureInPdf ?? true);

  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMode, setCalendarMode] = useState('date');
  const [isSaving, setIsSaving] = useState(false);
  useFocusEffect(
    React.useCallback(() => {
      getItemAsync('supplier').then(raw => {
        if (raw) {
          const data = JSON.parse(raw);
          const arr = Array.isArray(data) ? data : [data];
          setAllSuppliers(arr);
          if (arr.length > 0 && !inputData?.supplierDetails) setSupplierDetails(arr[0]);
        }
      }).catch(() => { });
    }, [inputData])
  );

  React.useEffect(() => {
    if (!inputData?.quotationNumber) {
      getItemAsync('quotation').then(raw => {
        let maxNum = 0;
        if (raw) {
          const data = JSON.parse(raw);
          const arr = Array.isArray(data) ? data : [data];
          arr.forEach(q => {
            const num = parseInt(q.quotationNumber, 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          });
        }
        setQuotationNumber(String(maxNum + 1).padStart(3, '0'));

        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const currentMonth = months[new Date().getMonth()];
        setQuotationPrefix(`QTPG_${currentMonth}_`);
      }).catch(() => { });
    }
  }, [inputData]);

  // calculations
  const subTotal = productDetails.reduce((sum, p) => sum + (parseFloat(p.taxableAmount || p.totalAmount) || 0), 0);
  const perProductTax = productDetails.reduce((sum, p) => sum + (parseFloat(p.totalAmount) - parseFloat(p.taxableAmount || p.totalAmount) || 0), 0);
  const otherChargesTotal = otherCharges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const totalBeforeGst = subTotal + otherChargesTotal;
  const overallGstAmount = overallGstEnabled ? totalBeforeGst * (parseFloat(overallGstRate) || 0) / 100 : 0;
  const tax = overallGstEnabled ? overallGstAmount : perProductTax;
  const grandTotalRaw = overallGstEnabled ? totalBeforeGst + overallGstAmount : (productDetails.reduce((sum, p) => sum + (parseFloat(p.totalAmount) || 0), 0) + otherChargesTotal);
  const advanceAmt = parseFloat(advanceReceived) || 0;
  const totalAmount = grandTotalRaw;
  const balanceDue = grandTotalRaw - advanceAmt;

  const addOtherCharge = () => {
    if (!newChargeName.trim() || !newChargeAmount.trim()) return;
    setOtherCharges(prev => [...prev, { description: newChargeName.trim(), amount: newChargeAmount.trim() }]);
    setNewChargeName('');
    setNewChargeAmount('');
    setShowChargeModal(false);
  };
  const removeOtherCharge = (idx) => setOtherCharges(prev => prev.filter((_, i) => i !== idx));

  const cycleSupplier = () => {
    if (allSuppliers.length <= 1) return;
    const currentIndex = allSuppliers.findIndex(s => s.firmName === supplierDetails?.firmName);
    const nextIndex = (currentIndex + 1) % allSuppliers.length;
    setSupplierDetails(allSuppliers[nextIndex]);
  };

  const openCalendar = (mode) => {
    setCalendarMode(mode);
    setCalendarVisible(true);
  };

  const onDateSelect = (day) => {
    setCalendarVisible(false);
    if (calendarMode === 'date') {
      setQuotationDate(day.dateString);
      const d = new Date(day.dateString);
      d.setDate(d.getDate() + 10);
      setQuotationValidity(d.toISOString().split('T')[0]);
    } else {
      setQuotationValidity(day.dateString);
    }
  };

  const openAddProduct = (product = null, index = null) => {
    if (!product && index === null) {
      navigation.navigate('AddProduct', {
        onSave: (newProduct) => {
          const price = parseFloat(newProduct.unitPrice) || parseFloat(newProduct.rate) || 0;
          const qty = parseFloat(newProduct.quantity) || 1;
          const discVal = parseFloat(newProduct.discountValue) || parseFloat(newProduct.discountRate) || 0;
          const gstRate = parseFloat(newProduct.gstRate) || 0;
          const cessRate = parseFloat(newProduct.cess) || 0;
          const subtotal = price * qty;
          const discountAmt = newProduct.discountType === '%' ? (subtotal * discVal) / 100 : discVal;

          let taxable, gstAmt;
          if (newProduct.taxInclusive || newProduct.isInclusive) {
            const factor = 1 + (gstRate + cessRate) / 100;
            taxable = (subtotal - discountAmt) / factor;
            gstAmt = (subtotal - discountAmt) - taxable;
          } else {
            taxable = subtotal - discountAmt;
            gstAmt = (taxable * (gstRate + cessRate)) / 100;
          }

          const finalProduct = {
            ...newProduct,
            taxableAmount: taxable.toFixed(2),
            totalAmount: (taxable + gstAmt).toFixed(2),
            taxAmount: gstAmt.toFixed(2),
          };

          setProductDetails(prev => [...prev, finalProduct]);
        }
      });
      return;
    }
    navigation.navigate('AddProduct', {
      product: product,
      tempOnly: true,
      onSave: (updatedProduct) => {
        const price = parseFloat(updatedProduct.unitPrice) || parseFloat(updatedProduct.rate) || 0;
        const qty = parseFloat(updatedProduct.quantity) || 1;
        const discVal = parseFloat(updatedProduct.discountValue) || parseFloat(updatedProduct.discountRate) || 0;
        const gstRate = parseFloat(updatedProduct.gstRate) || 0;
        const cessRate = parseFloat(updatedProduct.cess) || 0;
        const subtotal = price * qty;
        const discountAmt = updatedProduct.discountType === '%' ? (subtotal * discVal) / 100 : discVal;
        let taxable, gstAmt;
        if (updatedProduct.taxInclusive || updatedProduct.isInclusive) {
          const factor = 1 + (gstRate + cessRate) / 100;
          taxable = (subtotal - discountAmt) / factor;
          gstAmt = (subtotal - discountAmt) - taxable;
        } else {
          taxable = subtotal - discountAmt;
          gstAmt = (taxable * (gstRate + cessRate)) / 100;
        }
        const finalProduct = {
          ...updatedProduct,
          taxableAmount: taxable.toFixed(2),
          totalAmount: (taxable + gstAmt).toFixed(2),
          taxAmount: gstAmt.toFixed(2),
        };
        setProductDetails(prev => {
          const updated = [...prev];
          updated[index] = finalProduct;
          return updated;
        });
      }
    });
  };

  const updateField = (key, value) => {
    setEditingProduct(prev => ({ ...prev, [key]: value }));
  };

  const pickProductImage = async (source) => {
    let result;
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    };
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) { alert.show('Permission Needed', 'Camera permission is required', { type: 'warning' }); return; }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }
      if (!result.canceled) {
        updateField('productImage', result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking image:', error);
    }
  };

  const modalTotals = React.useMemo(() => {
    const price = Number(editingProduct?.unitPrice) || 0;
    const qty = Number(editingProduct?.quantity) || 0;
    const discVal = Number(editingProduct?.discountRate) || 0;
    const gstPct = Number(editingProduct?.gstRate) || 0;
    const cessVal = Number(editingProduct?.cess) || 0;

    const subtotal = price * qty;
    const discountAmt = editingProduct?.discountType === '%' ? (subtotal * discVal) / 100 : discVal;

    let taxableAmount = subtotal - discountAmt;
    let gstAmount = 0;

    if (editingProduct?.taxInclusive) {
      const factor = 1 + gstPct / 100;
      const baseTaxable = taxableAmount / factor;
      gstAmount = taxableAmount - baseTaxable;
      taxableAmount = baseTaxable;
    } else {
      gstAmount = (taxableAmount * gstPct) / 100;
    }

    const total = taxableAmount + gstAmount + cessVal;

    return { subtotal, discountAmt, taxableAmount, gstAmount, total };
  }, [editingProduct]);


  const handleSelectProducts = (selectedProducts) => {
    if (!Array.isArray(selectedProducts)) return;

    const newItems = selectedProducts.map(prod => {
      const price = Number(prod.unitPrice || prod.rate || 0);
      const qty = 1;
      const discVal = Number(prod.discount || prod.discountRate || 0);
      const discType = prod.discountType || '%';
      const gstPct = Number(prod.gstRate || 0);
      const cessVal = Number(prod.cess || 0);
      const taxInclusive = prod.taxInclusive || false;

      const subtotal = price * qty;
      const discountAmt = discType === '%' ? (subtotal * discVal) / 100 : discVal;
      let taxableAmount = subtotal - discountAmt;
      let gstAmount = 0;

      if (taxInclusive) {
        const factor = 1 + gstPct / 100;
        const baseTaxable = taxableAmount / factor;
        gstAmount = taxableAmount - baseTaxable;
        taxableAmount = baseTaxable;
      } else {
        gstAmount = (taxableAmount * gstPct) / 100;
      }

      const totalAmount = taxableAmount + gstAmount + cessVal;

      return {
        productName: prod.productName,
        description: prod.description || '',
        hsn: prod.hsn || prod.hsnCode || '',
        quantity: qty,
        unit: prod.unit || 'Nos',
        unitPrice: price,
        gstRate: gstPct,
        discount: discVal,
        discountType: discType,
        taxInclusive: taxInclusive,
        cess: cessVal,
        productImage: prod.productImage || null,
        amount: subtotal,
        taxableAmount: taxableAmount,
        totalAmount: totalAmount,
      };
    });

    setProductDetails(prev => [...prev, ...newItems]);
  };

  const saveProduct = () => {
    const hasName = editingProduct?.productName?.trim().length > 0;
    const hasImage = editingProduct?.imageEnabled && editingProduct?.productImage;
    if (!hasName && !hasImage) {
      alert.show('Error', 'Either Product Name or Product Image is required', { type: 'error' });
      return;
    }

    const newProduct = {
      productName: editingProduct.productName,
      description: editingProduct.description,
      hsn: editingProduct.hsnCode,
      quantity: Number(editingProduct.quantity) || 0,
      unit: editingProduct.unit,
      unitPrice: Number(editingProduct.unitPrice) || 0,
      gstRate: Number(editingProduct.gstRate) || 0,
      discount: Number(editingProduct.discountRate) || 0,
      discountType: editingProduct.discountType,
      taxInclusive: editingProduct.taxInclusive,
      cess: Number(editingProduct.cess) || 0,
      productImage: editingProduct.imageEnabled ? editingProduct.productImage : null,
      amount: modalTotals.subtotal,
      taxableAmount: modalTotals.taxableAmount,
      totalAmount: modalTotals.total,
    };

    if (editingIndex !== null) {
      setProductDetails(prev => prev.map((p, i) => i === editingIndex ? newProduct : p));
    } else {
      setProductDetails(prev => [...prev, newProduct]);
    }
    setProductModalVisible(false);
  };

  const removeProduct = (index) => {
    setProductDetails(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!buyerDetails) { alert.show('Missing Info', 'Please select a client.', { type: 'warning' }); return; }
    if (productDetails.length === 0) { alert.show('Missing Info', 'Please add at least one product.', { type: 'warning' }); return; }

    if (isShippingNeeded && shippingType === 'custom' && !shipToDetails) {
      alert.show('Missing Info', 'Please select a shipping address.', { type: 'warning' }); return;
    }

    const finalShipTo = isShippingNeeded
      ? (shippingType === 'same' ? buyerDetails : shipToDetails)
      : null;

    const data = {
      quotationDate, quotationPrefix, quotationNumber, quotationValidity,
      supplierDetails, buyerDetails, shipToDetails: finalShipTo, bankDetails,
      termsAndConditions: termsAndConditions,
      productDetails,
      otherCharges,
      overallGstEnabled,
      overallGstRate: overallGstEnabled ? overallGstRate : null,
      advanceReceived: advanceAmt > 0 ? String(advanceAmt) : '',
      signature: showSignatureInPdf && signatureData ? (signatureData.imageUri || '') : '',
      signatureData,
      showSignatureInPdf,
    };

    try {
      setIsSaving(true);
      await addAndSave({ propertyName: 'quotation', newValue: data, propertyCheck: null });
      navigation.replace('ViewQuotation', { data });
    } catch {
      alert.show('Error', 'Could not save quotation.', { type: 'error' });
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_BG} />

      {/* HEADER SECTION */}
      <SafeAreaView style={{ backgroundColor: HEADER_BG, zIndex: 10 }} edges={['top']}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'RecordTab' })} style={styles.backBtn} hitSlop={8}>
              <ArrowLeft size={24} color="#FFF" strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Quotation</Text>
          </View>
        </View>

        <View style={styles.headerStatsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>DATE</Text>
            <TouchableOpacity style={styles.statValRow} onPress={() => openCalendar('date')}>
              <CalendarIcon size={13} color="#F6AD55" />
              <Text style={[styles.statInput, { paddingVertical: 2 }]}>{quotationDate}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>VALIDITY</Text>
            <TouchableOpacity style={styles.statValRow} onPress={() => openCalendar('validity')}>
              <Clock size={13} color="#F6AD55" />
              <Text style={[styles.statInput, { paddingVertical: 2 }]}>{quotationValidity || 'Select Date'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>QUOTE #</Text>
            <View style={styles.statValRow}>
              <Hash size={13} color="#F6AD55" />
              <TextInput style={[styles.statInput, { minWidth: 60, maxWidth: 85 }]} value={quotationPrefix} onChangeText={setQuotationPrefix} />
              <TextInput style={[styles.statInput, { flex: 1 }]} value={quotationNumber} onChangeText={setQuotationNumber} keyboardType="numeric" />
            </View>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 130 }}>
        {/* ENTITY SELECTORS */}
        <View style={{ gap: 16 }}>
          {/* Supplier */}
          <EntitySelector
            title="MY COMPANY DETAILS"
            icon={<Building2 size={20} color="#134E3A" />}
            iconBg="#FFF"
            entityName={supplierDetails?.firmName || 'No Company Added'}
            entitySub={supplierDetails?.gstin ? "GST: $(supplierDetails.gstin)" : null}
            isDark={isDark}
            logoUrl={supplierDetails?.logoUrl || supplierDetails?.image}
            logoKey={supplierDetails?.logoKey}
            onEditDetails={() => navigation.navigate('CompanyDetails', { isNew: false })}
            rightAction={allSuppliers.length > 1 ? (
              <TouchableOpacity onPress={cycleSupplier} style={[styles.actionChip, { backgroundColor: 'rgba(19,78,58,0.05)' }]}>
                <ArrowRightLeft size={13} color="#134E3A" />
                <Text style={[styles.actionChipText, { color: '#134E3A' }]}>SWITCH</Text>
              </TouchableOpacity>
            ) : null}
          />

          {/* Buyer */}
          <EntitySelector
            title="CLIENT DETAILS"
            icon={<User size={20} color="#FF8A00" />}
            iconBg="#FFF7ED"
            entityName={buyerDetails?.companyName || 'No Client Selected'}
            entitySub={buyerDetails ? [buyerDetails.city, buyerDetails.state].filter(Boolean).join(', ') : null}
            entityPhone={buyerDetails?.mobile}
            onPress={() => navigation.navigate('SelectBuyer', { onSelect: setBuyerDetails })}
            actionText={buyerDetails ? 'CHANGE' : 'SELECT'}
            actionColor="#FF8A00"
            hasData={!!buyerDetails}
            isDark={isDark}
          />
        </View>

        {/* PRODUCTS */}
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 2 }}>
            <Text style={[styles.sectionHeaderLabel, { color: textSub }]}>LINE ITEMS</Text>
            <TouchableOpacity style={styles.addProductBtn} onPress={() => openAddProduct()}>
              <Plus size={16} color="#134E3A" strokeWidth={2.5} />
              <Text style={styles.addProductText}>Add Product</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.listContainer, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={{ backgroundColor: cardBg }}>
              {productDetails.map((product, idx) => (
                <View key={idx} style={styles.productRow}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={[styles.prodName, { color: textMain }]}>{product.productName}</Text>
                    <Text style={[styles.prodSub, { color: textSub }]}>{product.quantity} × ₹{parseFloat(product.unitPrice).toLocaleString()}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.prodTotal}>₹{parseFloat(product.totalAmount).toLocaleString()}</Text>
                    <View style={styles.prodActions}>
                      <TouchableOpacity onPress={() => openAddProduct(product, idx)} style={{ padding: 8 }}>
                        <PencilLine size={15} color="#9CA3AF" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeProduct(idx)} style={{ padding: 8 }}>
                        <Trash2 size={15} color="#FB7185" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
              {productDetails.length === 0 && (
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <Package size={40} color="#E2E8F0" style={{ marginBottom: 12 }} strokeWidth={1.5} />
                  <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600', marginBottom: 16 }}>No products added yet.</Text>
                </View>
              )}
              <View style={{ padding: 16, alignItems: 'center', borderTopWidth: productDetails.length > 0 ? 1 : 0, borderTopColor: '#F8FAFC', gap: 10, flexDirection: 'row', justifyContent: 'center' }}>
                <TouchableOpacity onPress={() => navigation.navigate('SelectProduct', { onSelect: handleSelectProducts })} style={{ paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'rgba(19,78,58,0.05)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Search size={16} color="#134E3A" />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#134E3A', textTransform: 'uppercase', letterSpacing: 0.5 }}>Choose Product</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowChargeModal(true)} style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF7ED', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} color="#EA580C" strokeWidth={2.5} />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#EA580C', textTransform: 'uppercase', letterSpacing: 0.3 }}>Other Charges</Text>
                </TouchableOpacity>
              </View>
            </View>
            {(productDetails.length > 0 || otherCharges.length > 0) && (
              <View style={[styles.totalsBox, { backgroundColor: isDark ? '#1A1A1A' : '#F8FAFC', borderTopColor: cardBorder }]}>
                {/* Subtotal */}
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Subtotal</Text>
                  <Text style={[styles.totalLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>₹{subTotal.toLocaleString()}</Text>
                </View>
                {/* Per-product GST breakdown (only if not overall) */}
                {!overallGstEnabled && perProductTax > 0 && (
                  <View style={{ backgroundColor: isDark ? '#0A2418' : '#F0FDF4', borderRadius: 10, padding: 10, marginBottom: 6 }}>
                    <View style={[styles.totalRow, { marginBottom: 4 }]}>
                      <Text style={[styles.totalLabel, { color: '#059669', fontWeight: '600', fontSize: 11 }]}>Taxable Amount</Text>
                      <Text style={[styles.totalLabel, { color: '#059669', fontWeight: '600', fontSize: 11 }]}>₹{subTotal.toLocaleString()}</Text>
                    </View>
                    <View style={[styles.totalRow, { marginBottom: 4 }]}>
                      <Text style={[styles.totalLabel, { color: '#059669', fontSize: 11 }]}>CGST</Text>
                      <Text style={[styles.totalLabel, { color: '#059669', fontSize: 11 }]}>₹{(perProductTax / 2).toLocaleString()}</Text>
                    </View>
                    <View style={[styles.totalRow, { marginBottom: 4 }]}>
                      <Text style={[styles.totalLabel, { color: '#059669', fontSize: 11 }]}>SGST</Text>
                      <Text style={[styles.totalLabel, { color: '#059669', fontSize: 11 }]}>₹{(perProductTax / 2).toLocaleString()}</Text>
                    </View>
                    <View style={[styles.totalRow, { marginBottom: 0, borderTopWidth: 1, borderTopColor: isDark ? '#134E3A' : '#D1FAE5', paddingTop: 4 }]}>
                      <Text style={[styles.totalLabel, { color: '#059669', fontWeight: '700', fontSize: 12 }]}>Tax Amount</Text>
                      <Text style={[styles.totalLabel, { color: '#059669', fontWeight: '700', fontSize: 12 }]}>₹{perProductTax.toLocaleString()}</Text>
                    </View>
                  </View>
                )}

                {/* Other Charges */}
                {otherCharges.map((charge, idx) => (
                  <View key={idx} style={[styles.totalRow, { alignItems: 'center' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <TouchableOpacity onPress={() => removeOtherCharge(idx)} hitSlop={8}>
                        <Trash2 size={12} color="#FB7185" />
                      </TouchableOpacity>
                      <Text style={[styles.totalLabel, { color: '#EA580C', fontWeight: '600' }]}>+ {charge.description}</Text>
                    </View>
                    <Text style={[styles.totalLabel, { color: '#EA580C', fontWeight: '600' }]}>₹{parseFloat(charge.amount).toLocaleString()}</Text>
                  </View>
                ))}

                {/* Overall GST Toggle */}
                <View style={{ borderTopWidth: 1, borderTopColor: isDark ? '#2C2C2E' : '#E2E8F0', marginTop: 6, paddingTop: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: overallGstEnabled ? 10 : 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Calculator size={14} color={overallGstEnabled ? '#059669' : '#9CA3AF'} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: overallGstEnabled ? '#059669' : (isDark ? '#A1A1AA' : '#64748B') }}>Overall GST</Text>
                    </View>
                    <Switch
                      value={overallGstEnabled}
                      onValueChange={setOverallGstEnabled}
                      trackColor={{ false: '#E5E7EB', true: '#059669' }}
                      thumbColor="#FFF"
                      style={{ transform: [{ scale: Platform.OS === 'ios' ? 0.7 : 0.85 }] }}
                    />
                  </View>
                  {overallGstEnabled && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDark ? '#0A2418' : '#ECFDF5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 6 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>GST @{overallGstRate}% on ₹{totalBeforeGst.toLocaleString()}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TextInput
                          value={overallGstRate}
                          onChangeText={setOverallGstRate}
                          keyboardType="numeric"
                          style={{ backgroundColor: isDark ? '#134E3A' : '#FFF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, fontSize: 14, fontWeight: '800', color: '#059669', width: 50, textAlign: 'center' }}
                        />
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#059669' }}>%</Text>
                      </View>
                    </View>
                  )}
                  {overallGstEnabled && (
                    <View style={styles.totalRow}>
                      <Text style={[styles.totalLabel, { color: '#059669', fontWeight: '700' }]}>GST Amount</Text>
                      <Text style={[styles.totalLabel, { color: '#059669', fontWeight: '700' }]}>₹{overallGstAmount.toLocaleString()}</Text>
                    </View>
                  )}
                </View>

                {/* Grand Total */}
                <View style={styles.grandTotalRow}>
                  <Text style={[styles.grandTotalLabel, { color: textMain }]}>Grand Total</Text>
                  <Text style={styles.grandTotalValue}>₹{totalAmount.toLocaleString()}</Text>
                </View>

                {/* Advance Payment */}
                <View style={{ borderTopWidth: 1, borderTopColor: isDark ? '#2C2C2E' : '#E2E8F0', marginTop: 10, paddingTop: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: isDark ? '#A1A1AA' : '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>Advance Received</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#A1A1AA' : '#64748B' }}>₹</Text>
                      <TextInput
                        value={advanceReceived}
                        onChangeText={setAdvanceReceived}
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor="#CBD5E1"
                        style={{ backgroundColor: isDark ? '#2C2C2E' : '#FFF', borderWidth: 1, borderColor: isDark ? '#3A3A3C' : '#E2E8F0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, fontSize: 14, fontWeight: '700', color: textMain, width: 100, textAlign: 'right' }}
                      />
                    </View>
                  </View>
                  {advanceAmt > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, backgroundColor: isDark ? '#1A1A2E' : '#EFF6FF', borderRadius: 10, padding: 12 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#3B82F6' }}>Balance Due</Text>
                      <Text style={{ fontSize: 15, fontWeight: '900', color: '#3B82F6' }}>₹{balanceDue.toLocaleString()}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* SHIPPING */}
        <View style={{ marginTop: 24, gap: 16 }}>
          <View style={[styles.listContainer, { padding: 16, backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: isShippingNeeded ? 16 : 0 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.8 }}>SHIP TO (DETAILS)</Text>
              <Switch
                value={isShippingNeeded}
                onValueChange={setIsShippingNeeded}
                trackColor={{ false: '#E5E7EB', true: '#059669' }}
                thumbColor="#FFF"
                style={{ transform: [{ scale: Platform.OS === 'ios' ? 0.7 : 0.9 }] }}
              />
            </View>

            {isShippingNeeded && (
              <View style={{ gap: 12 }}>
                {/* Same as Client */}
                <TouchableOpacity
                  onPress={() => setShippingType('same')}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12,
                    backgroundColor: shippingType === 'same' ? '#ECFDF5' : '#FFF',
                    borderWidth: 1, borderColor: shippingType === 'same' ? '#10B981' : '#F8FAFC'
                  }}>
                  {shippingType === 'same' ? (
                    <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' }} />
                    </View>
                  ) : (
                    <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#CBD5E1', marginRight: 12 }} />
                  )}
                  <Text style={{ fontSize: 13, fontWeight: '600', color: shippingType === 'same' ? '#064E3B' : '#475569' }}>Same as Client Details</Text>
                </TouchableOpacity>

                {/* Custom Address */}
                <TouchableOpacity
                  onPress={() => setShippingType('custom')}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12,
                    backgroundColor: shippingType === 'custom' ? '#ECFDF5' : '#FFF',
                    borderWidth: 1, borderColor: shippingType === 'custom' ? '#10B981' : '#F8FAFC'
                  }}>
                  {shippingType === 'custom' ? (
                    <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' }} />
                    </View>
                  ) : (
                    <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#CBD5E1', marginRight: 12 }} />
                  )}
                  <Text style={{ fontSize: 13, fontWeight: '600', color: shippingType === 'custom' ? '#064E3B' : '#475569' }}>Add Other Shipping Details</Text>
                </TouchableOpacity>
                {/* Show Custom Address selector only if custom is selected */}
                {shippingType === 'custom' && (
                  <EntitySelector
                    containerStyle={{ marginTop: 4 }}
                    icon={<MapPin size={18} color="#9CA3AF" />}
                    iconBg="#F8FAFC"
                    entityName={shipToDetails?.companyName || 'No Address Selected'}
                    entitySub={shipToDetails ? [shipToDetails.street, shipToDetails.city, shipToDetails.state, shipToDetails.pincode].filter(Boolean).join(', ') : 'Add a shipping address'}
                    onPress={() => navigation.navigate('SelectShipTo', { onSelect: setShipToDetails })}
                    actionText={shipToDetails ? 'CHANGE' : 'SELECT'}
                    actionColor="#64748B"
                    hasData={!!shipToDetails}
                    isDark={isDark}
                  />
                )}
              </View>
            )}
          </View>
        </View>

        {/* Terms */}
        <TermsSection
          termsAndConditions={termsAndConditions}
          onSelectPress={() => navigation.navigate('SelectTermsAndConditions', { onSelect: setTermsAndConditions })}
          isDark={isDark}
        />

        {/* BANK */}
        <BankDetailsSection
          bankDetails={bankDetails}
          onSelectPress={() => navigation.navigate('SelectBankDetail', { onSelect: setBankDetails })}
          isDark={isDark}
        />

        {/* SIGNATURE */}
        <SignatureSection
          signatureData={signatureData}
          setSignatureData={setSignatureData}
          showSignatureInPdf={showSignatureInPdf}
          setShowSignatureInPdf={setShowSignatureInPdf}
          onSelectPress={() => navigation.navigate('SelectSignature', { onSelect: setSignatureData })}
          isDark={isDark}
        />
      </ScrollView>

      {/* COMPACT STICKY FOOTER */}
      <View style={[styles.stickyFooter, { paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 24, backgroundColor: cardBg, borderTopColor: isDark ? '#2C2C2E' : '#E2E8F0' }]}>
        <View>
          <Text style={{ fontSize: 11, fontWeight: '900', color: textSub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{advanceAmt > 0 ? 'Balance Due' : 'Grand Total'}</Text>
          <Text style={{ fontSize: 22, fontWeight: '900', color: advanceAmt > 0 ? '#3B82F6' : textMain, letterSpacing: -0.5 }}>₹{(advanceAmt > 0 ? balanceDue : totalAmount).toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={[styles.savePdfBtn, isSaving && { opacity: 0.7 }]} onPress={handleSave} activeOpacity={0.8} disabled={isSaving}>
          <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>{isSaving ? 'Saving...' : 'Save Quote'}</Text>
          {isSaving ? <ActivityIndicator color="#FFF" size="small" /> : <CheckCircle2 size={18} color="#FFF" strokeWidth={2.5} />}
        </TouchableOpacity>
      </View>

      {/* Product Edit Modal */}
      <Modal visible={productModalVisible} animationType="slide" transparent={false} onRequestClose={() => setProductModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: isDark ? '#1A1A1A' : '#F8FAFC' }}>
          <SafeAreaView edges={['top']} style={{ backgroundColor: '#032B20' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16 }}>
              <TouchableOpacity onPress={() => setProductModalVisible(false)} style={{ padding: 4, marginLeft: -4 }}>
                <ChevronLeft size={24} color="#FFF" strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFF' }}>{editingIndex !== null ? 'Edit Product' : 'Add Product'}</Text>
            </View>
          </SafeAreaView>

          <KeyboardAwareScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20 }} contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false} enableOnAndroid={true} extraScrollHeight={80} keyboardShouldPersistTaps="handled">

            {/* PRODUCT INFO */}
            <View style={{ backgroundColor: cardBg, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, borderColor: cardBorder, borderWidth: 1, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <View style={{ padding: 6, backgroundColor: '#ECFDF5', borderRadius: 8 }}>
                  <Package size={16} color="#134E3A" />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '900', color: textMain, textTransform: 'uppercase', letterSpacing: 1 }}>Product Info</Text>
              </View>

              {/* Product Image Upload */}
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={styles.prodLabel}>Product Image</Text>
                  <Switch
                    value={editingProduct?.imageEnabled}
                    onValueChange={(v) => {
                      updateField('imageEnabled', v);
                      if (!v) updateField('productImage', null);
                    }}
                    trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                    thumbColor="#FFF"
                    style={{ transform: [{ scale: Platform.OS === 'ios' ? 0.7 : 0.9 }] }}
                  />
                </View>

                {editingProduct?.imageEnabled && (
                  <View>
                    {!editingProduct?.productImage ? (
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                          onPress={() => pickProductImage('library')}
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#FFF' }}>
                          <ImageIcon size={18} color="#64748B" />
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B' }}>Gallery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => pickProductImage('camera')}
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#FFF' }}>
                          <Camera size={18} color="#64748B" />
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B' }}>Camera</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#E2E8F0', height: 140 }}>
                        <Image source={{ uri: editingProduct.productImage }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                        <TouchableOpacity
                          onPress={() => updateField('productImage', null)}
                          style={{ position: 'absolute', top: 10, right: 10, backgroundColor: '#EF4444', padding: 8, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 }}>
                          <Text style={{ fontSize: 14, fontWeight: '900', color: '#FFF' }}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={styles.prodLabel}>Product Name *</Text>
                <TextInput style={styles.prodInput} placeholder="e.g. Garden Maintenance Service" placeholderTextColor="#94A3B8" value={editingProduct?.productName} onChangeText={(v) => updateField('productName', v)} />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={styles.prodLabel}>Description (Optional)</Text>
                <TextInput style={styles.prodInput} placeholder="Brief item details..." placeholderTextColor="#94A3B8" value={editingProduct?.description} onChangeText={(v) => updateField('description', v)} />
              </View>

              <View style={{ marginBottom: 8 }}>
                <Text style={styles.prodLabel}>HSN / SAC</Text>
                <View style={styles.prodInputWrapper}>
                  <TextInput style={styles.prodInputInner} placeholder="Enter or search code" placeholderTextColor="#94A3B8" value={editingProduct?.hsnCode} onChangeText={(v) => updateField('hsnCode', v)} />
                  <Search size={16} color="#94A3B8" />
                </View>
              </View>
            </View>

            {/* PRICING & TAX */}
            <View style={{ backgroundColor: cardBg, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, borderColor: cardBorder, borderWidth: 1, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <View style={{ padding: 6, backgroundColor: '#FFF7ED', borderRadius: 8 }}>
                  <Calculator size={16} color="#FF8A00" />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '900', color: textMain, textTransform: 'uppercase', letterSpacing: 1 }}>Pricing & Tax</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prodLabel}>Unit Price</Text>
                  <TextInput style={styles.prodInput} keyboardType="numeric" placeholder="0.00" placeholderTextColor="#94A3B8" value={editingProduct?.unitPrice} onChangeText={(v) => updateField('unitPrice', v)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prodLabel}>Quantity</Text>
                  <TextInput style={styles.prodInput} keyboardType="numeric" placeholder="1" placeholderTextColor="#94A3B8" value={editingProduct?.quantity} onChangeText={(v) => updateField('quantity', v)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prodLabel}>Unit Type</Text>
                  <View style={styles.prodInputWrapper}>
                    <TextInput style={styles.prodInputInner} placeholder="PCS" placeholderTextColor="#94A3B8" value={editingProduct?.unit} onChangeText={(v) => updateField('unit', v)} />
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prodLabel}>Discount</Text>
                  <View style={[styles.prodInputWrapper, { paddingHorizontal: 0, overflow: 'hidden' }]}>
                    <TextInput style={[styles.prodInputInner, { paddingHorizontal: 12 }]} keyboardType="numeric" placeholder="0" placeholderTextColor="#94A3B8" value={editingProduct?.discountRate} onChangeText={(v) => updateField('discountRate', v)} />
                    <TouchableOpacity
                      onPress={() => updateField('discountType', editingProduct?.discountType === '%' ? '₹' : '%')}
                      style={{ paddingHorizontal: 16, borderLeftWidth: 1, borderLeftColor: '#E2E8F0', height: '100%', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#64748B' }}>{editingProduct?.discountType || '%'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prodLabel}>GST Rate (%)</Text>
                  <View style={[styles.prodInputWrapper, { paddingHorizontal: 0, justifyContent: 'center', height: Platform.OS === 'ios' ? 44 : 50 }]}>
                    <Picker
                      selectedValue={Number(editingProduct?.gstRate || 0)}
                      onValueChange={(v) => updateField('gstRate', String(v))}
                      style={{ width: '100%', height: Platform.OS === 'ios' ? 44 : 50, color: textMain }}
                      dropdownIconColor={textSub}
                    >
                      <Picker.Item label="0% (Exempted)" value={0} />
                      <Picker.Item label="0.1%" value={0.1} />
                      <Picker.Item label="0.25%" value={0.25} />
                      <Picker.Item label="3%" value={3} />
                      <Picker.Item label="5%" value={5} />
                      <Picker.Item label="12%" value={12} />
                      <Picker.Item label="18%" value={18} />
                      <Picker.Item label="28%" value={28} />
                    </Picker>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: editingProduct?.taxInclusive ? '#134E3A' : '#475569' }}>
                    {editingProduct?.taxInclusive ? 'Tax Inclusive' : 'Tax Exclusive'}
                  </Text>
                  <Switch
                    value={editingProduct?.taxInclusive}
                    onValueChange={(v) => updateField('taxInclusive', v)}
                    trackColor={{ false: '#E2E8F0', true: '#134E3A' }}
                    thumbColor="#FFF"
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>CESS (₹)</Text>
                  <TextInput style={[styles.prodInput, { width: 70, textAlign: 'right', paddingVertical: 6, height: 36 }]} keyboardType="numeric" placeholder="0" value={editingProduct?.cess} onChangeText={(v) => updateField('cess', v)} />
                </View>
              </View>

              {/* Calculations Box */}
              <View style={{ backgroundColor: 'rgba(19,78,58,0.05)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(19,78,58,0.1)', gap: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Subtotal</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#1E293B' }}>₹{modalTotals.subtotal.toLocaleString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Discount</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#EA580C' }}>- ₹{modalTotals.discountAmt.toLocaleString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Taxable Amount</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#1E293B' }}>₹{modalTotals.taxableAmount.toLocaleString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(19,78,58,0.1)' }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>GST ({editingProduct?.gstRate || '0'}%)</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#1E293B' }}>+ ₹{modalTotals.gstAmount.toLocaleString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: '#134E3A', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total</Text>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#134E3A' }}>₹{modalTotals.total.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          </KeyboardAwareScrollView>

          {/* STICKY TOTAL BAR */}
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: cardBg, borderTopWidth: 1, borderTopColor: cardBorder, padding: 16, paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 24, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>Running Total</Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#134E3A' }}>₹{modalTotals.total.toLocaleString()}</Text>
            </View>
            <TouchableOpacity onPress={saveProduct} activeOpacity={0.8} style={{ backgroundColor: '#FF8A00', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#FF8A00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
              <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '900' }}>Save Product</Text>
              <CheckCircle2 size={18} color="#FFF" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Other Charge Modal */}
      <Modal visible={showChargeModal} animationType="slide" transparent onRequestClose={() => setShowChargeModal(false)}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1} onPress={() => setShowChargeModal(false)} style={{ flex: 1 }} />
          <View style={{ backgroundColor: isDark ? '#1E1E1E' : '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: isDark ? '#3A3A3C' : '#E2E8F0', alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ fontSize: 17, fontWeight: '800', color: textMain, marginBottom: 20 }}>Add Other Charge</Text>

            <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Service / Charge Name</Text>
            <TextInput
              value={newChargeName}
              onChangeText={setNewChargeName}
              placeholder="e.g. Installation, Freight, Handling..."
              placeholderTextColor="#CBD5E1"
              style={{ backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderWidth: 1, borderColor: isDark ? '#3A3A3C' : '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: textMain, marginBottom: 16 }}
            />

            <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Amount (₹)</Text>
            <TextInput
              value={newChargeAmount}
              onChangeText={setNewChargeAmount}
              placeholder="0.00"
              placeholderTextColor="#CBD5E1"
              keyboardType="numeric"
              style={{ backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderWidth: 1, borderColor: isDark ? '#3A3A3C' : '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: textMain, marginBottom: 24 }}
            />

            <TouchableOpacity
              onPress={addOtherCharge}
              activeOpacity={0.8}
              disabled={!newChargeName.trim() || !newChargeAmount.trim()}
              style={{ backgroundColor: (!newChargeName.trim() || !newChargeAmount.trim()) ? '#CBD5E1' : '#FF8A00', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, elevation: 4 }}
            >
              <Plus size={18} color="#FFF" strokeWidth={2.5} />
              <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>Add Charge</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Calendar Modal */}
      <CalendarModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        onDateSelect={onDateSelect}
        selectedDate={calendarMode === 'date' ? quotationDate : quotationValidity}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFF', letterSpacing: -0.3 },
  headerStatsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, paddingBottom: 24 },
  statBox: { flex: 1, backgroundColor: '#021F17', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statLabel: { color: '#48BB78', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '800', marginBottom: 6 },
  statValRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statInput: { color: '#FFF', fontSize: 12, fontWeight: '700', padding: 0, margin: 0, height: 20, lineHeight: 18 },

  sectionHeaderLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, paddingHorizontal: 2 },
  entityCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#F1F5F9', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4 },
  entityLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  entityIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  entityName: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  entitySub: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  actionChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionChipText: { fontSize: 11, fontWeight: '700' },
  iconBtnAction: { padding: 10 },

  addProductBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(19,78,58,0.05)' },
  addProductText: { color: '#134E3A', fontSize: 13, fontWeight: '700' },

  listContainer: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4 },
  productRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  prodName: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  prodSub: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  prodTotal: { fontSize: 15, fontWeight: '700', color: '#059669' },
  prodActions: { flexDirection: 'row', alignItems: 'center', marginLeft: 4, paddingLeft: 4, borderLeftWidth: 1, borderLeftColor: '#F1F5F9' },

  totalsBox: { backgroundColor: '#F8FAFC', padding: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  totalLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  grandTotalLabel: { fontSize: 11, fontWeight: '900', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.8 },
  grandTotalValue: { fontSize: 17, fontWeight: '900', color: '#059669' },

  changeAccBtn: { width: '100%', marginTop: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' },
  changeAccText: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },

  stickyFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 20 },
  savePdfBtn: { backgroundColor: '#FF8A00', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 4, shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1F2937' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 5 },
  prodLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, paddingHorizontal: 4 },
  prodInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 10, fontSize: 14, fontWeight: '600', color: '#1E293B' },
  prodInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  prodInputInner: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1E293B', padding: 0 },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  calendarContainer: { backgroundColor: '#FFF', borderRadius: 16, padding: 10, overflow: 'hidden' },
  calendarCloseBtn: { alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 8 },
});


