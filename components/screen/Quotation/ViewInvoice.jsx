import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, TextInput, Alert, Modal, Image, KeyboardAvoidingView, Platform, TouchableOpacity, Share, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft, Leaf, MapPin, ArrowDownCircle, ArrowUpCircle, TrendingUp,
  Truck, MessageSquare, Eye, Share2, Trash2, X, Camera, ExternalLink, Edit3, Check,
  Wallet, ChevronDown, Calendar, User, CheckCircle2, MoreVertical,
} from 'lucide-react-native';
import CalendarModal from '../../../src/components/CalendarModal';
import * as ImagePicker from 'expo-image-picker';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../../utils/customSecureStore';
import { generateDocumentPDF } from '../../../src/utils/generatePDF';
import { useTheme } from '../../ThemeContext';
import { useAlert } from '../../ui/CustomAlert';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';

// -- Shared constants --
import { PRIMARY, HEADER_BG, ACCENT } from '../../../src/constants/colors';
import PaymentModal from '../../../src/components/forms/PaymentModal';
import ImagePreviewModal from '../../../src/components/forms/ImagePreviewModal';

const SUCCESS = '#198754';
const ROSE = '#E11D48';

export default function ViewInvoice({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const alert = useAlert();
  const rawData = route?.params?.data || {};

  // Dark mode palette
  const bg = isDark ? '#121212' : '#F5F7F6';
  const cardBg = isDark ? '#1E1E1E' : '#FFF';
  const cardBorder = isDark ? '#2C2C2E' : '#F3F4F6';
  const textMain = isDark ? '#F5F5F5' : '#111827';
  const textSub = isDark ? '#A1A1AA' : '#9CA3AF';
  const inputBg = isDark ? '#2C2C2E' : '#F9FAFB';
  const segBg = isDark ? '#2C2C2E' : '#E8EDF2';

  // Editable state
  const [inv, setInv] = useState({
    id: `${rawData.invoicePrefix || 'INV'}-${rawData.invoiceNumber || ''}`,
    client: rawData.buyerDetails?.companyName || 'Unknown Client',
    address: rawData.buyerDetails?.address || '',
    date: rawData.invoiceDate || '',
    due: rawData.dueDate || '',
    amount: (rawData.productDetails || []).reduce((s, p) => s + (parseFloat(p.totalAmount) || 0), 0),
    adjustment: 0,
    status: rawData.status || 'Pending',
    service: rawData.productDetails?.[0]?.productName || 'Service',
    notes: rawData.termsAndConditions || '',
    vendorName: '',
    vendorAmount: 0
  });

  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [clientNotes, setClientNotes] = useState([]);
  const [vendorNotes, setVendorNotes] = useState([]);
  const [workspaceTab, setWorkspaceTab] = useState('CLIENT');
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [tempImage, setTempImage] = useState(null);

  const [modalAmount, setModalAmount] = useState('');
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalMethod, setModalMethod] = useState('UPI');
  const [modalVendor, setModalVendor] = useState('');

  // Payments — loaded from storage
  const [allPayments, setAllPayments] = useState([]);
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Load persisted data on mount
  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        const raw = await getItemAsync('invoice');
        if (raw) {
          const invoices = JSON.parse(raw);
          const thisInvoice = invoices.find(i =>
            (i.id && i.id === rawData.id) ||
            (`${i.invoicePrefix || 'INV'}-${i.invoiceNumber || ''}` === `${rawData.invoicePrefix || 'INV'}-${rawData.invoiceNumber || ''}`)
          );
          if (thisInvoice) {
            if (thisInvoice.savedPayments) setAllPayments(thisInvoice.savedPayments);
            if (thisInvoice.clientNotes) setClientNotes(thisInvoice.clientNotes);
            if (thisInvoice.vendorNotes) setVendorNotes(thisInvoice.vendorNotes);
            // Restore vendor & adjustment data
            setInv(prev => ({
              ...prev,
              adjustment: thisInvoice.adjustment || prev.adjustment,
              vendorName: thisInvoice.vendorName || prev.vendorName,
              vendorAmount: thisInvoice.vendorAmount || prev.vendorAmount,
              client: thisInvoice.buyerDetails?.companyName || prev.client,
              address: thisInvoice.buyerDetails?.address || prev.address,
              date: thisInvoice.invoiceDate || prev.date,
              due: thisInvoice.dueDate || prev.due,
            }));
          }
        }
      } catch {}
    };
    loadFromStorage();
  }, []);

  const formatCurrency = (val) => `₹${Number(val).toLocaleString('en-IN')}`;

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Paid': return { bg: '#D1E7DD', text: '#0F5132', border: '#BADBCC' };
      case 'Pending': return { bg: '#FFF3CD', text: '#856404', border: '#FFECB5' };
      case 'Overdue': return { bg: '#F8D7DA', text: '#842029', border: '#F5C2C7' };
      default: return { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' };
    }
  };

  const clientPayments = allPayments.filter(p => p.type === 'client');
  const vendorPayments = allPayments.filter(p => p.type === 'vendor');

  const totalClientInvoice = Number(inv.amount) + Number(inv.adjustment || 0);
  const totalReceived = clientPayments.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalVendorCost = Number(inv.vendorAmount || 0);
  const totalVendorPaid = vendorPayments.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const profit = totalReceived - totalVendorPaid;
  const clientPending = totalClientInvoice - totalReceived;
  const vendorPending = totalVendorCost - totalVendorPaid;
  const progress = Math.min((totalReceived / (totalClientInvoice || 1)) * 100, 100);

  // Auto-update status
  useEffect(() => {
    if (clientPending <= 0 && totalClientInvoice > 0) setInv(p => ({ ...p, status: 'Paid' }));
    else if (clientPending > 0 && totalReceived > 0) setInv(p => ({ ...p, status: 'Pending' }));
  }, [clientPending, totalClientInvoice, totalReceived]);

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.5,
    });
    if (!result.canceled) setTempImage(result.assets[0].uri);
  };

  const handleAddPayment = async () => {
    const amt = Number(modalAmount);
    if (!amt || amt <= 0) {
      alert.show('Invalid Amount', 'Please enter a valid amount.', { type: 'warning' });
      return;
    }

    setIsSavingPayment(true);

    const newPayment = {
      id: Date.now(),
      type: showPaymentModal,
      amount: amt,
      date: modalDate,
      method: modalMethod,
      remarks: '',
      vendorName: showPaymentModal === 'vendor' ? modalVendor : '',
      attachment: tempImage
    };

    const updatedPayments = [...allPayments, newPayment];
    setAllPayments(updatedPayments);

    // Close modal immediately for responsive feel
    setShowPaymentModal(null);
    setTempImage(null);
    setModalAmount('');
    setModalVendor('');
    setShowMethodDropdown(false);

    // Persist to storage
    try {
      const raw = await getItemAsync('invoice');
      if (raw) {
        const invoices = JSON.parse(raw);
        const updatedInvoices = invoices.map(item => {
          const itemId = `${item.invoicePrefix || 'INV'}-${item.invoiceNumber || ''}`;
          const thisId = `${rawData.invoicePrefix || 'INV'}-${rawData.invoiceNumber || ''}`;
          if ((item.id && item.id === rawData.id) || itemId === thisId) {
            const clientTotal = updatedPayments
              .filter(p => p.type === 'client')
              .reduce((sum, p) => sum + Number(p.amount), 0);
            return { ...item, savedPayments: updatedPayments, receivedAmount: clientTotal };
          }
          return item;
        });
        await setItemAsync('invoice', JSON.stringify(updatedInvoices));
      }
    } catch (error) {
      alert.show('Error', 'Could not save payment.', { type: 'error' });
    } finally {
      setIsSavingPayment(false);
    }
  };

  const updatePayment = (id, key, val) => {
    setAllPayments(prev => prev.map(p => p.id === id ? { ...p, [key]: val } : p));
  };

  const handleViewPDF = () => {
    navigation.navigate("InvoicePdfViewer", { data: rawData });
  };

  const viewShotRef = useRef();

  const handleShare = async () => {
    try {
      if (!viewShotRef.current?.capture) {
        alert.show('Error', 'Screenshot capture not ready.', { type: 'error' });
        return;
      }
      const uri = await viewShotRef.current.capture();
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Share Invoice ${inv.id}`,
        });
      } else {
        alert.show('Error', 'Sharing is not available on this device.', { type: 'error' });
      }
    } catch (e) {
      console.error('Share error:', e);
      alert.show('Error', 'Could not share invoice: ' + (e?.message || e), { type: 'error' });
    }
  };

  const handleDelete = () => {
    alert.confirm(
      'Delete Invoice',
      `Delete invoice ${inv.id}? This action cannot be undone.`,
      async () => {
        try {
          const raw = await getItemAsync('invoice');
          let list = raw ? JSON.parse(raw) : [];
          list = list.filter(i =>
            !(i.invoiceDate === rawData.invoiceDate &&
              i.invoicePrefix === rawData.invoicePrefix &&
              i.invoiceNumber === rawData.invoiceNumber)
          );
          await setItemAsync('invoice', JSON.stringify(list));
          navigation.goBack();
        } catch {
          alert.show('Error', 'Could not delete invoice.', { type: 'error' });
        }
      },
      { type: 'error', confirmText: 'Delete', destructive: true }
    );
  };

  // ─── SAVE ALL CHANGES TO STORAGE ───
  const saveToStorage = async () => {
    try {
      const raw = await getItemAsync('invoice');
      if (!raw) return;
      const invoices = JSON.parse(raw);
      const thisId = `${rawData.invoicePrefix || 'INV'}-${rawData.invoiceNumber || ''}`;

      const clientTotal = allPayments
        .filter(p => p.type === 'client')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const updatedInvoices = invoices.map(item => {
        const itemId = `${item.invoicePrefix || 'INV'}-${item.invoiceNumber || ''}`;
        if ((item.id && item.id === rawData.id) || itemId === thisId) {
          return {
            ...item,
            savedPayments: allPayments,
            receivedAmount: clientTotal,
            buyerDetails: {
              ...(item.buyerDetails || {}),
              companyName: inv.client,
              address: inv.address,
            },
            invoiceDate: inv.date,
            dueDate: inv.due,
            adjustment: inv.adjustment,
            vendorName: inv.vendorName,
            vendorAmount: inv.vendorAmount,
            clientNotes: clientNotes,
            vendorNotes: vendorNotes,
          };
        }
        return item;
      });

      await setItemAsync('invoice', JSON.stringify(updatedInvoices));
    } catch (error) {
      console.warn('Save failed', error);
    }
  };

  const PaymentCard = ({ payment, isVendor }) => (
    <View style={[styles.payCard, { backgroundColor: cardBg, borderColor: cardBorder }, isVendor ? { borderLeftColor: ROSE } : { borderLeftColor: '#10B981' }]}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <TextInput
            editable={isEditing}
            value={payment.amount.toString()}
            onChangeText={(t) => updatePayment(payment.id, 'amount', t)}
            keyboardType="numeric"
            style={[styles.payAmountInput, { color: textMain }]}
          />
          {isVendor && <View style={styles.vendorNameBadge}><Text style={styles.vendorNameText}>{payment.vendorName || 'Vendor'}</Text></View>}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.payDate}>{payment.date}</Text>
          <View style={styles.payDot} />
          <Text style={styles.payMethod}>{payment.method}</Text>
        </View>
        {payment.attachment && (
          <TouchableOpacity style={styles.viewAttachBtn} onPress={() => setPreviewImage(payment.attachment)}>
            <ExternalLink size={10} color={HEADER_BG} />
            <Text style={styles.viewAttachText}>View Attachment</Text>
          </TouchableOpacity>
        )}
        <TextInput
          editable={isEditing}
          value={payment.remarks}
          onChangeText={(t) => updatePayment(payment.id, 'remarks', t)}
          placeholder="Add note..."
          style={styles.payRemarks}
        />
      </View>
      {isEditing && (
        <TouchableOpacity onPress={() => setAllPayments(prev => prev.filter(p => p.id !== payment.id))} style={{ padding: 8 }}>
          <Trash2 size={16} color="#D1D5DB" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_BG} />

      {/* HEADER */}
      <SafeAreaView style={{ backgroundColor: HEADER_BG, zIndex: 10, elevation: 4 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <ArrowLeft size={24} color="#FFF" strokeWidth={2} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Invoice Workspace</Text>
              <Text style={styles.headerSub}>{inv.id}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtnFilled} onPress={async () => {
              if (isEditing) {
                await saveToStorage();
              }
              setIsEditing(!isEditing);
            }}>
              {isEditing
                ? <Check size={18} color="#FFF" strokeWidth={2.5} />
                : <Edit3 size={18} color="#FFF" strokeWidth={2} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtnFilled} onPress={() => setShowMenu(!showMenu)}>
              <MoreVertical size={18} color="#FFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Three-dot dropdown menu */}
        {showMenu && (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20 }}
          >
            <View style={{
              position: 'absolute',
              top: 56,
              right: 16,
              backgroundColor: isDark ? '#2C2C2E' : '#FFF',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: isDark ? '#3A3A3C' : '#E5E7EB',
              overflow: 'hidden',
              elevation: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              minWidth: 180,
            }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => { setShowMenu(false); handleViewPDF(); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 }}
              >
                <Eye size={18} color={isDark ? '#10B981' : HEADER_BG} strokeWidth={2} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#F5F5F5' : '#374151' }}>View PDF</Text>
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: isDark ? '#3A3A3C' : '#F3F4F6' }} />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => { setShowMenu(false); handleShare(); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 }}
              >
                <Share2 size={18} color={isDark ? '#10B981' : HEADER_BG} strokeWidth={2} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#F5F5F5' : '#374151' }}>Share Invoice</Text>
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: isDark ? '#3A3A3C' : '#F3F4F6' }} />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => { setShowMenu(false); handleDelete(); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 }}
              >
                <Trash2 size={18} color={ROSE} strokeWidth={2} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: ROSE }}>Delete Invoice</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      </SafeAreaView>

      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1, result: 'tmpfile' }} style={{ flex: 1, backgroundColor: bg }}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={80}
        keyboardShouldPersistTaps="handled"
      >

          {/* TOP DETAILS */}
          <View style={[styles.detailsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={[styles.label, { color: textSub }]}>CLIENT DETAILS</Text>
                <TextInput
                  editable={isEditing}
                  value={inv.client}
                  onChangeText={(t) => setInv({ ...inv, client: t })}
                  style={[styles.clientInput, { color: textMain }]}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <MapPin size={12} color="#9CA3AF" />
                  <TextInput
                    editable={isEditing}
                    value={inv.address}
                    onChangeText={(t) => setInv({ ...inv, address: t })}
                    placeholder="Short Address"
                    placeholderTextColor={textSub}
                    style={[styles.addressInput, { color: isDark ? '#A1A1AA' : '#6B7280' }]}
                  />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <View style={[styles.idBadge, { backgroundColor: isDark ? '#2C2C2E' : '#F9FAFB', borderColor: cardBorder }]}><Text style={[styles.idText, { color: textSub }]}>#{inv.id}</Text></View>
                  <View style={styles.serviceBadge}>
                    <Leaf size={10} color={HEADER_BG} />
                    <Text style={styles.serviceText}>{inv.service}</Text>
                  </View>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.label, { marginBottom: 4, color: textSub }]}>TOTAL AMOUNT</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.rupeeSymbol}>₹</Text>
                  <TextInput
                    editable={isEditing}
                    value={inv.amount.toString()}
                    onChangeText={(t) => setInv({ ...inv, amount: Number(t) || 0 })}
                    keyboardType="numeric"
                    style={styles.amountInput}
                  />
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusStyle(inv.status).bg, borderColor: getStatusStyle(inv.status).border, marginTop: 12 }]}>
                  <Text style={[styles.statusText, { color: getStatusStyle(inv.status).text }]}>{inv.status}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* SUMMARY GRID */}
          <View style={styles.gridContainer}>
            <View style={[styles.gridBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.gridLabel, { color: textSub }]}>GRAND TOTAL</Text>
              <Text style={[styles.gridValBig, { color: textMain }]}>{formatCurrency(totalClientInvoice)}</Text>
            </View>
            <View style={[styles.gridBox, { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' }]}>
              <View style={styles.rowBetween}><Text style={[styles.gridLabel, { color: '#059669' }]}>CLIENT RECV</Text><ArrowDownCircle size={12} color="#059669" /></View>
              <Text style={[styles.gridValBig, { color: '#047857' }]}>{formatCurrency(totalReceived)}</Text>
            </View>
            <View style={[styles.gridBox, { backgroundColor: '#FFF1F2', borderColor: '#FFE4E6' }]}>
              <View style={styles.rowBetween}><Text style={[styles.gridLabel, { color: '#E11D48' }]}>VENDOR PAID</Text><ArrowUpCircle size={12} color="#E11D48" /></View>
              <Text style={[styles.gridValBig, { color: '#BE123C' }]}>{formatCurrency(totalVendorPaid)}</Text>
            </View>
            <View style={[styles.gridBox, { backgroundColor: HEADER_BG, borderColor: HEADER_BG, elevation: 4 }]}>
              <View style={styles.rowBetween}><Text style={[styles.gridLabel, { color: 'rgba(255,255,255,0.7)' }]}>PROFIT</Text><TrendingUp size={12} color="#FFF" /></View>
              <Text style={[styles.gridValBig, { color: '#FFF' }]}>{formatCurrency(profit)}</Text>
            </View>
          </View>

          {/* TABS — segmented toggle */}
          <View style={[styles.segmentWrap, { backgroundColor: segBg }]}>
            {['CLIENT', 'VENDOR'].map(tab => {
              const active = workspaceTab === tab;
              const activeColor = tab === 'CLIENT' ? HEADER_BG : ROSE;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setWorkspaceTab(tab)}
                  activeOpacity={0.85}
                  style={[
                    styles.segmentBtn,
                    active && { backgroundColor: activeColor, elevation: 3, shadowColor: activeColor, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6 }
                  ]}
                >
                  <Text style={[styles.segmentText, { color: isDark ? '#A1A1AA' : '#6B7280' }, active && styles.segmentTextActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CLIENT CONTENT */}
          {workspaceTab === 'CLIENT' && (
            <View style={styles.tabContent}>
              <View style={[styles.pendingCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={styles.rowBetween}>
                  <View>
                    <Text style={[styles.label, { color: textSub }]}>CLIENT PENDING</Text>
                    <Text style={[styles.gridValBig, { color: '#D97706' }]}>{formatCurrency(clientPending)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.label, { color: textSub }]}>ADJUSTMENT</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontWeight: '700' }}>₹</Text>
                      <TextInput
                        editable={isEditing}
                        value={inv.adjustment ? inv.adjustment.toString() : ''}
                        onChangeText={(t) => setInv({ ...inv, adjustment: Number(t) || 0 })}
                        placeholder="0.00"
                        placeholderTextColor={textSub}
                        keyboardType="numeric"
                        style={[styles.adjustInput, { color: textMain }]}
                      />
                    </View>
                  </View>
                </View>
                <View style={[styles.progressBg, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
              </View>

              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ArrowDownCircle size={16} color="#10B981" />
                  <Text style={[styles.sectionHeading, { color: textMain }]}>CLIENT PAYMENTS</Text>
                </View>
                {isEditing && (
                  <TouchableOpacity style={styles.addPayBtn} onPress={() => setShowPaymentModal('client')}>
                    <Text style={styles.addPayText}>+ ADD RECEIPT</Text>
                  </TouchableOpacity>
                )}
              </View>

              {clientPayments.length > 0 ? clientPayments.map(p => <PaymentCard key={p.id} payment={p} isVendor={false} />) : <View style={[styles.noRecords, { borderColor: isDark ? '#3A3A3C' : '#E5E7EB' }]}><Text style={[styles.noRecordsText, { color: isDark ? '#6B7280' : '#D1D5DB' }]}>NO CLIENT RECORDS</Text></View>}

              {/* CLIENT NOTES */}
              <View style={[styles.detailsCard, { marginTop: 16, backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <MessageSquare size={14} color={textSub} />
                  <Text style={[styles.label, { color: textSub }]}>CLIENT NOTES</Text>
                </View>
                {clientNotes.map((note) => (
                  <View key={note.id} style={[styles.noteBubble, isDark && { backgroundColor: '#2A2418', borderColor: '#3D2E0A', borderLeftColor: '#D97706' }]}>
                    <Text style={[styles.noteBubbleText, { color: isDark ? '#E5E5EA' : '#374151' }]}>{note.text}</Text>
                    <View style={styles.noteBubbleMeta}>
                      <Text style={styles.noteBubbleTime}>{note.time}</Text>
                      {isEditing && (
                        <TouchableOpacity onPress={() => setClientNotes(prev => prev.filter(n => n.id !== note.id))}>
                          <X size={12} color="#9CA3AF" strokeWidth={2.5} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
                <TextInput
                  value={workspaceTab === 'CLIENT' ? noteText : ''}
                  onChangeText={setNoteText}
                  placeholder="Write a note..."
                  placeholderTextColor={isDark ? '#6B7280' : '#C4C4C4'}
                  multiline
                  style={[styles.notesInput, { backgroundColor: inputBg, borderColor: cardBorder, color: textMain }]}
                />
                {isEditing && (
                  <TouchableOpacity
                    style={styles.noteSaveBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (!noteText.trim()) return;
                      const now = new Date();
                      const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                      setClientNotes(prev => [{ id: Date.now(), text: noteText.trim(), time }, ...prev]);
                      setNoteText('');
                    }}
                  >
                    <Check size={16} color="#FFF" strokeWidth={2.5} />
                    <Text style={styles.noteSaveBtnText}>Save Note</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* VENDOR CONTENT */}
          {workspaceTab === 'VENDOR' && (
            <View style={styles.tabContent}>
              <View style={[styles.pendingCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: textSub }]}>VENDOR NAME</Text>
                    <TextInput
                      editable={isEditing}
                      value={inv.vendorName}
                      onChangeText={(t) => setInv({ ...inv, vendorName: t })}
                      placeholder="e.g. Nursery World"
                      placeholderTextColor={textSub}
                      style={[styles.vendorInput, { backgroundColor: inputBg, color: textMain }]}
                    />
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={[styles.label, { color: textSub }]}>VENDOR COST</Text>
                    <View style={[styles.vendorCostWrap, { backgroundColor: inputBg }]}>
                      <Text style={{ fontWeight: '700' }}>₹</Text>
                      <TextInput
                        editable={isEditing}
                        value={inv.vendorAmount ? inv.vendorAmount.toString() : ''}
                        onChangeText={(t) => setInv({ ...inv, vendorAmount: Number(t) || 0 })}
                        placeholder="0.00"
                        placeholderTextColor={textSub}
                        keyboardType="numeric"
                        style={[styles.vendorCostInput, { color: textMain }]}
                      />
                    </View>
                  </View>
                </View>
                <View style={[styles.vendorPendingRow, { borderTopColor: cardBorder }]}>
                  <Text style={[styles.label, { color: textSub }]}>OUTSTANDING TO VENDOR</Text>
                  <Text style={[styles.gridValBig, { color: ROSE }]}>{formatCurrency(vendorPending)}</Text>
                </View>
              </View>

              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Truck size={16} color={ROSE} />
                  <Text style={[styles.sectionHeading, { color: textMain }]}>VENDOR PAYMENTS</Text>
                </View>
                {isEditing && (
                  <TouchableOpacity style={[styles.addPayBtn, { backgroundColor: '#FFF1F2' }]} onPress={() => setShowPaymentModal('vendor')}>
                    <Text style={[styles.addPayText, { color: ROSE }]}>+ ADD PAYMENT</Text>
                  </TouchableOpacity>
                )}
              </View>

              {vendorPayments.length > 0 ? vendorPayments.map(p => <PaymentCard key={p.id} payment={p} isVendor={true} />) : <View style={[styles.noRecords, { borderColor: isDark ? '#3A3A3C' : '#E5E7EB' }]}><Text style={[styles.noRecordsText, { color: isDark ? '#6B7280' : '#D1D5DB' }]}>NO VENDOR RECORDS</Text></View>}

              {/* VENDOR NOTES */}
              <View style={[styles.detailsCard, { marginTop: 16, backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <MessageSquare size={14} color={textSub} />
                  <Text style={[styles.label, { color: textSub }]}>VENDOR NOTES</Text>
                </View>
                {vendorNotes.map((note) => (
                  <View key={note.id} style={[styles.noteBubble, isDark && { backgroundColor: '#2A2418', borderColor: '#3D2E0A', borderLeftColor: '#D97706' }]}>
                    <Text style={[styles.noteBubbleText, { color: isDark ? '#E5E5EA' : '#374151' }]}>{note.text}</Text>
                    <View style={styles.noteBubbleMeta}>
                      <Text style={styles.noteBubbleTime}>{note.time}</Text>
                      {isEditing && (
                        <TouchableOpacity onPress={() => setVendorNotes(prev => prev.filter(n => n.id !== note.id))}>
                          <X size={12} color="#9CA3AF" strokeWidth={2.5} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
                <TextInput
                  value={workspaceTab === 'VENDOR' ? noteText : ''}
                  onChangeText={setNoteText}
                  placeholder="Write a note..."
                  placeholderTextColor={isDark ? '#6B7280' : '#C4C4C4'}
                  multiline
                  style={[styles.notesInput, { backgroundColor: inputBg, borderColor: cardBorder, color: textMain }]}
                />
                {isEditing && (
                  <TouchableOpacity
                    style={styles.noteSaveBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (!noteText.trim()) return;
                      const now = new Date();
                      const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                      setVendorNotes(prev => [{ id: Date.now(), text: noteText.trim(), time }, ...prev]);
                      setNoteText('');
                    }}
                  >
                    <Check size={16} color="#FFF" strokeWidth={2.5} />
                    <Text style={styles.noteSaveBtnText}>Save Note</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}



      </KeyboardAwareScrollView>
      </ViewShot>
      {/* PAYMENT MODAL */}
      <PaymentModal
        visible={!!showPaymentModal}
        onClose={() => setShowPaymentModal(null)}
        type={showPaymentModal}
        amount={modalAmount}
        setAmount={setModalAmount}
        date={modalDate}
        setDate={setModalDate}
        method={modalMethod}
        setMethod={setModalMethod}
        image={tempImage}
        setImage={setTempImage}
        onPickImage={handlePickImage}
        onConfirm={handleAddPayment}
        isSaving={isSavingPayment}
        isDark={isDark}
        onCalendarPress={() => setShowCalendar(true)}
      />

      {/* CALENDAR MODAL */}
      <CalendarModal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onDateSelect={(day) => { setModalDate(day.dateString); setShowCalendar(false); }}
        selectedDate={modalDate}
        isDark={isDark}
      />
      {/* IMAGE PREVIEW MODAL */}
      <ImagePreviewModal
        visible={!!previewImage}
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7F6' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 4, borderRadius: 20 },
  iconBtnFilled: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#FFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.55)', marginTop: 1 },

  detailsCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#F3F4F6', elevation: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  clientInput: { fontSize: 22, fontWeight: '900', color: '#111827', padding: 0, margin: 0, marginTop: 4 },
  addressInput: { fontSize: 12, fontWeight: '500', color: '#6B7280', padding: 0, flex: 1 },
  idBadge: { backgroundColor: '#F9FAFB', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#F3F4F6' },
  idText: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1 },
  serviceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(19,78,58,0.05)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(19,78,58,0.1)' },
  serviceText: { fontSize: 9, fontWeight: '900', color: HEADER_BG, letterSpacing: 1, textTransform: 'uppercase' },
  rupeeSymbol: { fontSize: 18, fontWeight: '900', color: HEADER_BG },
  amountInput: { fontSize: 20, fontWeight: '900', color: HEADER_BG, padding: 0, textAlign: 'right', minWidth: 80 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  gridBox: { width: '48%', padding: 16, borderRadius: 16, borderWidth: 1, height: 100, justifyContent: 'space-between' },
  gridLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  gridValBig: { fontSize: 18, fontWeight: '900', color: '#111827' },

  // Segmented toggle
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: '#E8EDF2',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  segmentBtn: {
    flex: 1, paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: HEADER_BG,
    elevation: 3,
    shadowColor: HEADER_BG,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  segmentText: { fontSize: 12, fontWeight: '800', color: '#6B7280', letterSpacing: 0.5 },
  segmentTextActive: { color: '#FFF' },

  tabContent: { flex: 1 },
  pendingCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  adjustInput: { fontSize: 16, fontWeight: '900', color: '#111827', padding: 0, minWidth: 60, textAlign: 'right' },
  progressBg: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, marginTop: 16, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: SUCCESS },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
  sectionHeading: { fontSize: 14, fontWeight: '900', color: '#111827', letterSpacing: -0.3 },
  addPayBtn: { backgroundColor: 'rgba(19,78,58,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addPayText: { fontSize: 10, fontWeight: '900', color: HEADER_BG, letterSpacing: 1 },

  payCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F9FAFB', borderLeftWidth: 4, flexDirection: 'row', justifyContent: 'space-between', elevation: 1 },
  payAmountInput: { fontSize: 16, fontWeight: '900', color: '#111827', padding: 0, minWidth: 80 },
  vendorNameBadge: { backgroundColor: '#FFF1F2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  vendorNameText: { fontSize: 9, fontWeight: '900', color: ROSE, textTransform: 'uppercase' },
  payDate: { fontSize: 10, fontWeight: '800', color: '#9CA3AF' },
  payDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#D1D5DB' },
  payMethod: { fontSize: 10, fontWeight: '800', color: '#3B82F6', textTransform: 'uppercase' },
  viewAttachBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(19,78,58,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginTop: 8 },
  viewAttachText: { fontSize: 10, fontWeight: '800', color: HEADER_BG },
  payRemarks: { fontSize: 11, fontStyle: 'italic', color: '#6B7280', padding: 0, marginTop: 8 },
  noRecords: { paddingVertical: 32, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: '#E5E7EB', borderRadius: 16 },
  noRecordsText: { fontSize: 11, fontWeight: '800', color: '#D1D5DB', letterSpacing: 1 },

  vendorInput: { backgroundColor: '#F9FAFB', padding: 8, borderRadius: 8, fontSize: 13, fontWeight: '700', color: '#111827' },
  vendorCostWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 8, borderRadius: 8, justifyContent: 'flex-end' },
  vendorCostInput: { fontSize: 13, fontWeight: '700', padding: 0, minWidth: 60, textAlign: 'right' },
  vendorPendingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F9FAFB' },

  notesInput: {
    backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12,
    fontSize: 13, fontWeight: '500', color: '#374151',
    minHeight: 80, textAlignVertical: 'top',
    borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 10,
  },
  noteSaveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: HEADER_BG, paddingVertical: 11, borderRadius: 10,
    elevation: 2,
  },
  noteSaveBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  noteBubble: {
    backgroundColor: '#FFFBEB', borderRadius: 10, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#FEF3C7', borderLeftWidth: 3, borderLeftColor: '#F59E0B',
  },
  noteBubbleText: { fontSize: 13, fontWeight: '500', color: '#374151', lineHeight: 20 },
  noteBubbleMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  noteBubbleTime: { fontSize: 10, fontWeight: '600', color: '#9CA3AF' },

  fixedFooter: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14,
    backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E7EB',
    elevation: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: -4 }, shadowRadius: 10
  },
  actionBlock: {
    flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E8EDF2',
    borderRadius: 14, paddingVertical: 12, alignItems: 'center', gap: 6,
  },
  actionIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(19,78,58,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  actionBlockText: { fontSize: 11, fontWeight: '700', color: '#374151', letterSpacing: 0.3 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 16, marginBottom: 20 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#111827', letterSpacing: 1 },
  modalClose: { padding: 8, backgroundColor: '#F9FAFB', borderRadius: 20 },
  modalField: { marginBottom: 16 },
  modalInput: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, fontSize: 14, fontWeight: '800', color: '#111827' },
  imagePickerWrap: { backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: '#E5E7EB', padding: 24, alignItems: 'center', marginBottom: 16 },
  imagePickerBtn: { alignItems: 'center', gap: 12 },
  camIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 1 },
  removeImageBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: ROSE, padding: 6, borderRadius: 12, elevation: 4 },
  confirmBtn: { paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8, elevation: 4, flexDirection: 'row', gap: 10 },
  confirmBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 40 },
  previewClose: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  previewCloseBtn: { backgroundColor: '#FFF', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30 },
  previewCloseText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});

