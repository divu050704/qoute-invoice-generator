import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  StatusBar,
  Dimensions,
  Animated,
  Modal,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { InteractionManager } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getItemAsync, setItemAsync, deleteItemAsync } from "../../utils/customSecureStore";
import {
  User, Settings, Sun, Moon, FileText, ArrowRight, IndianRupee,
  FileCheck, ClipboardList, Clock, Phone, MapPin,
  Wallet, ArrowDownToLine, Calendar, Pencil, TrendingUp, ChevronDown, Building2, Trash2, X, Camera, ExternalLink, CheckCircle2
} from 'lucide-react-native';
import { useTheme } from "../../ThemeContext";
import { Calendar as CalendarPicker } from 'react-native-calendars';
import { useAlert } from '../../ui/CustomAlert';
import PaymentModal from '../../../src/components/forms/PaymentModal';
import CalendarModal from '../../../src/components/CalendarModal';

const LOGO_ASSETS = {
  progardenlogo:   require('../../../assets/progardenlogo.png'),
  hardendramalogo: require('../../../assets/hardendramalogo.png'),
  Vgilogo:         require('../../../assets/Vgilogo.png'),
};

const { width } = Dimensions.get('window');

const L = {
  primary: '#134E3A', accent: '#FDAF05', background: '#F5F5F5',
  card: '#FFFFFF', text: '#292929', textSub: '#7C7C7C',
  success: '#059669', border: '#DCDCDC',
  lightOrange: '#FFFCEA', lightGreen: '#EFFAF2', lightBlue: '#EBF4FF',
};
const D = {
  primary: '#059669', accent: '#FDAF05', background: '#292929',
  card: '#3D3D3D', text: '#F5F5F5', textSub: '#BDBDBD',
  success: '#059669', border: '#464646',
  lightOrange: '#7C3A0B', lightGreen: '#0A2418', lightBlue: '#1A1A1A',
};

export default function HomeTab({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme } = useTheme();
  const alert = useAlert();
  const C = isDark ? D : L;
  const [companyName, setCompanyName] = useState("Your Company");
  const [companyLogo, setCompanyLogo] = useState(null);
  const [companyLogoKey, setCompanyLogoKey] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const toggleAnim = useRef(new Animated.Value(0)).current;

  // Data states
  const [savedQuotations, setSavedQuotations] = useState([]);
  const [savedInvoices, setSavedInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [tempImage, setTempImage] = useState(null);
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const toggleWithAnim = () => {
    Animated.spring(toggleAnim, {
      toValue: isDark ? 0 : 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
    toggleTheme();
  };

  const thumbX = toggleAnim.interpolate({ inputRange: [0, 1], outputRange: [2, 26] });

  const loadData = useCallback(async () => {
    try {
      const raw = await getItemAsync("supplier");
      const s = raw ? JSON.parse(raw) : [];
      let arr = Array.isArray(s) ? s : (s ? [s] : []);
      if (arr.length === 0) arr = [{ firmName: "Your Company" }];
      setCompanies(arr);
      
      const data = arr[0];
      setCompanyName(data?.firmName || data?.firm || "Your Company");
      setCompanyLogo(data?.logoUrl || null);
      setCompanyLogoKey(data?.logoKey || null);
    } catch { 
      setCompanyName("Your Company"); 
      setCompanyLogo(null);
      setCompanyLogoKey(null);
      setCompanies([{ firmName: "Your Company" }]);
    }

    // Load Invoices and Quotations
    try {
      const qRaw = await getItemAsync("quotation");
      const iRaw = await getItemAsync("invoice");
      const sRaw = await getItemAsync("supplier");
      const q = qRaw ? JSON.parse(qRaw) : [];
      const i = iRaw ? JSON.parse(iRaw) : [];
      const s = sRaw ? JSON.parse(sRaw) : [];
      setSavedQuotations(Array.isArray(q) ? q : []);
      setSavedInvoices(Array.isArray(i) ? i : []);
      setSuppliers(Array.isArray(s) ? s : (s ? [s] : []));
    } catch (e) {
      console.warn("Failed reading records", e);
    }
  }, []);

  const switchProfile = async (index) => {
    try {
      const raw = await getItemAsync("supplier");
      const s = raw ? JSON.parse(raw) : [];
      let arr = Array.isArray(s) ? s : (s ? [s] : []);
      if (arr.length > index) {
        const selected = arr[index];
        arr.splice(index, 1);
        arr.unshift(selected); // Move to active
        await setItemAsync("supplier", JSON.stringify(arr));
        loadData();
      }
      setProfileModalVisible(false);
    } catch {}
  };

  const deleteProfile = (index, name) => {
    alert.confirm(
      'Delete Profile',
      `Are you sure you want to delete ${name}?`,
      async () => {
        try {
          const raw = await getItemAsync("supplier");
          const s = raw ? JSON.parse(raw) : [];
          let arr = Array.isArray(s) ? s : (s ? [s] : []);
          if (arr.length > 1) {
            arr.splice(index, 1);
            await setItemAsync("supplier", JSON.stringify(arr));
            loadData();
          } else {
            alert.show('Cannot Delete', 'You must have at least one profile.', { type: 'warning' });
          }
        } catch {}
      },
      { type: 'error', confirmText: 'Delete', destructive: true }
    );
  };

  useEffect(() => {
    const wipeData = async () => {
      const wiped = await getItemAsync('has_wiped_v3');
      if (!wiped) {
        try {
          await setItemAsync('quotation', '[]');
          await setItemAsync('invoice', '[]');
          await setItemAsync('buyer', '[]');
          await setItemAsync('products', '[]');
          await setItemAsync('terms', '[]');
          await setItemAsync('bankDetails', '[]');
          await setItemAsync('signatureData', '[]');
          await setItemAsync('has_wiped_v3', '"true"');
          console.log('✅ ALL TEST DATA WIPED SUCCESSFULLY!');
          loadData();
        } catch (e) {
          console.error('Wipe failed:', e);
        }
      }
    };
    wipeData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        loadData();
      });
      return () => task.cancel();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const calculateGrandTotal = (item) => {
    if (item.productDetails && Array.isArray(item.productDetails)) {
      const total = item.productDetails.reduce((sum, product) => {
        return sum + (parseFloat(product.totalAmount) || 0);
      }, 0);
      return total;
    }
    return parseFloat(item.totalAmount || item.amount || 0);
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.5,
    });
    if (!result.canceled) setTempImage(result.assets[0].uri);
  };

  const handleAddPayment = async () => {
    if (!selectedInvoice || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert.show('Invalid Amount', 'Please enter a valid payment amount.', { type: 'warning' });
      return;
    }

    setIsSavingPayment(true);
    try {
      const newPayment = {
        id: Date.now(),
        type: 'client',
        amount,
        date: paymentDate,
        method: paymentMethod,
        remarks: '',
        vendorName: '',
        attachment: tempImage,
      };

      const updatedList = savedInvoices.map((item) => {
        const itemId = `${item.invoicePrefix || 'INV'}-${item.invoiceNumber || ''}`;
        const selId = `${selectedInvoice.invoicePrefix || 'INV'}-${selectedInvoice.invoiceNumber || ''}`;
        if ((item.id && item.id === selectedInvoice.id) || itemId === selId) {
          const existingPayments = item.savedPayments || [];
          const updatedPayments = [...existingPayments, newPayment];
          const clientTotal = updatedPayments
            .filter(p => p.type === 'client')
            .reduce((sum, p) => sum + Number(p.amount), 0);
          return { ...item, savedPayments: updatedPayments, receivedAmount: clientTotal };
        }
        return item;
      });

      setSavedInvoices(updatedList);
      await setItemAsync("invoice", JSON.stringify(updatedList));
    } catch (error) {
      alert.show('Error', 'Could not save the payment.', { type: 'error' });
    } finally {
      setIsSavingPayment(false);
      setPaymentModalVisible(false);
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('UPI');
      setTempImage(null);
      setSelectedInvoice(null);
      setShowMethodDropdown(false);
    }
  };

  const recentInvoices = savedInvoices.filter(inv => {
    const total = calculateGrandTotal(inv);
    const received = parseFloat(inv.receivedAmount || 0);
    return total > 0 && received < total;
  }).slice(0, 5);

  const STATS = [
    { label: 'Quotations', value: savedQuotations.length.toString(), Icon: FileText,      iconColor: C.accent,   bg: C.lightOrange },
    { label: 'Invoices',   value: savedInvoices.length.toString(),   Icon: FileCheck,     iconColor: C.success,  bg: C.lightGreen  },
    { label: 'Ongoing',    value: savedInvoices.filter(i => {
      const total = calculateGrandTotal(i);
      const received = parseFloat(i.receivedAmount || 0);
      return total > 0 && received < total;
    }).length.toString(), Icon: ClipboardList, iconColor: '#3B82F6',  bg: C.lightBlue   },
  ];

  const renderInvoiceCard = (invoice, idx) => {
    const clientName = invoice.buyerDetails?.companyName || "Unknown Client";
    const ref = `${invoice.invoicePrefix || "INV"}-${invoice.invoiceNumber || ""}`;
    const dateStr = invoice.invoiceDate || "";
    const dateObj = new Date(dateStr);
    const dateFormatted = !isNaN(dateObj) ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "---";

    const totalAmount = calculateGrandTotal(invoice);
    const receivedAmount = parseFloat(invoice.receivedAmount || 0);
    let balanceAmount = totalAmount - receivedAmount;
    if (balanceAmount < 0) balanceAmount = 0;
    
    let progress = totalAmount > 0 ? (receivedAmount / totalAmount) * 100 : 0;
    if (progress > 100) progress = 100;

    return (
      <View key={`inv-${idx}`} style={[styles.projectCard, { backgroundColor: C.card, borderColor: C.border, marginBottom: 16 }]}>
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={() => navigation.navigate("ViewInvoice", { data: invoice })}
        >
          <View style={styles.projectTop}>
            <View style={[styles.projectAvatar, { backgroundColor: C.lightGreen }]}>
              <FileText size={18} color={C.success} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.projectName, { color: C.text }]}>{clientName}</Text>
              <Text style={[styles.projectType, { color: C.textSub }]}>{ref} • {dateFormatted}</Text>
            </View>
            <View style={[styles.progressBadge, { backgroundColor: balanceAmount === 0 ? C.lightGreen : C.lightOrange }]}>
              {balanceAmount === 0 ? (
                <CheckCircle2 size={11} color={C.success} strokeWidth={2.5} />
              ) : (
                <Clock size={11} color={C.accent} strokeWidth={2.5} />
              )}
              <Text style={[styles.progressBadgeText, { color: balanceAmount === 0 ? C.success : C.accent }]}>{balanceAmount === 0 ? 'Work Done' : 'Ongoing Work'}</Text>
            </View>
          </View>

          <View style={[styles.finBlock, { backgroundColor: isDark ? '#151821' : '#FFFCF8', borderColor: isDark ? C.border : '#F0E8DC' }]}>
            {[
              { label: 'Project Amount', val: `₹${totalAmount.toFixed(2)}`, color: C.text,    iconBg: C.lightGreen,  Icon: Wallet          },
              { label: 'Received',       val: `₹${receivedAmount.toFixed(2)}`,  color: C.success,  iconBg: C.lightGreen,  Icon: ArrowDownToLine },
              { label: 'Amount Left',    val: `₹${balanceAmount.toFixed(2)}`,  color: C.accent,   iconBg: C.lightOrange, Icon: Clock           },
            ].map((row, i, arr) => (
              <View key={i}>
                <View style={styles.finRow}>
                  <View style={styles.finLeft}>
                    <View style={[styles.finIcon, { backgroundColor: row.iconBg }]}>
                      <row.Icon size={12} color={row.color} strokeWidth={2} />
                    </View>
                    <Text style={[styles.finLabel, { color: C.textSub }]}>{row.label}</Text>
                  </View>
                  <Text style={[styles.finVal, { color: row.color }]}>{row.val}</Text>
                </View>
                {i < arr.length - 1 && <View style={[styles.finDivider, { borderColor: isDark ? C.border : '#EDE0CF' }]} />}
              </View>
            ))}

            <View style={styles.progressMeta}>
              <View style={styles.progressMetaLeft}>
                <TrendingUp size={12} color={C.success} strokeWidth={2.5} />
                <Text style={[styles.progressPct, { color: C.success }]}>{progress.toFixed(0)}% Paid</Text>
              </View>
              <Text style={[styles.progressFraction, { color: C.textSub }]}>₹{receivedAmount.toFixed(0)} of ₹{totalAmount.toFixed(0)}</Text>
            </View>
            <View style={[styles.barBg, { backgroundColor: isDark ? '#2A2D3A' : '#E5E7EB' }]}>
              <View style={[styles.barFill, { width: `${progress}%`, backgroundColor: C.success }]} />
            </View>
          </View>
        </TouchableOpacity>

        <View style={[styles.cardFooter, { borderTopColor: C.border }]}>
          <View style={styles.footerLeft}>
            <Calendar size={13} color={C.textSub} strokeWidth={2} />
            <Text style={[styles.footerTxt, { color: C.textSub }]}>
              {balanceAmount === 0 ? "Fully Paid" : "Awaiting Payment"}
            </Text>
          </View>
          {balanceAmount > 0 && (
            <Pressable 
              style={[styles.updateBtn, { backgroundColor: C.accent }]}
              onPress={() => {
                setSelectedInvoice(invoice);
                setPaymentModalVisible(true);
              }}
            >
              <Pencil size={11} color="#FFF" strokeWidth={2.5} />
              <Text style={styles.updateBtnTxt}>Add Payment</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#134E3A" />

      {/* ── HEADER ── */}
      <SafeAreaView style={{ backgroundColor: "#134E3A" }} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.headerLeft} onPress={() => setProfileModalVisible(true)}>
            <View style={[styles.avatar, { backgroundColor: '#FFF', overflow: 'hidden' }]}>
              {companyLogoKey && LOGO_ASSETS[companyLogoKey] ? (
                <Image source={LOGO_ASSETS[companyLogoKey]} style={{ width: '80%', height: '80%', resizeMode: 'contain' }} />
              ) : companyLogo ? (
                <Image source={{ uri: companyLogo }} style={{ width: '80%', height: '80%', resizeMode: 'contain' }} />
              ) : (
                <Text style={{ fontSize: 16 }}>🏢</Text>
              )}
            </View>
            <View>
              <Text style={[styles.hello, { color: 'rgba(255,255,255,0.8)' }]}>Default Profile</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <Text style={[styles.name, { color: '#FFF' }]}>
                  {companyName?.length > 14 ? `${companyName.substring(0, 14)}..` : companyName}
                </Text>
                <ChevronDown size={16} color="#FFF" strokeWidth={3} />
              </View>
            </View>
          </Pressable>

          <View style={styles.headerRight}>
            <Pressable
              onPress={toggleWithAnim}
              style={[styles.toggle, { backgroundColor: isDark ? '#1C5B42' : 'rgba(255,255,255,0.2)' }]}
            >
              <View style={styles.toggleTrackIcons}>
                <Sun  size={11} color={isDark ? C.textSub : '#FFF'} strokeWidth={2.5} />
                <Moon size={11} color={isDark ? '#FFF' : '#FFF8'}   strokeWidth={2.5} />
              </View>
              <Animated.View style={[styles.toggleThumb, { transform: [{ translateX: thumbX }], backgroundColor: '#FFF' }]} />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('SettingTab')}
              style={styles.settingsBtn}
            >
              <Settings size={22} color="#FFF" strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 90 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
            colors={[C.primary, C.accent]}
            progressBackgroundColor={C.card}
          />
        }
      >
        {/* ── QUICK ACTIONS ── */}
        <View style={styles.row}>
          <Pressable style={[styles.actionCard, { backgroundColor: C.primary }]} onPress={() => navigation.navigate("CreateQuotation")}>
            <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
              <FileText size={22} color="#FFF" strokeWidth={2} />
            </View>
            <Text style={styles.actionTitleWhite}>New Quotation</Text>
            <Text style={styles.actionSubWhite}>Create a new quotation</Text>
            <View style={styles.actionArrow}>
              <ArrowRight size={13} color={C.primary} strokeWidth={3} />
            </View>
          </Pressable>

          <Pressable style={[styles.actionCard, { backgroundColor: C.card, borderWidth: 1, borderColor: C.border }]} onPress={() => navigation.navigate("CreateInvoice")}>
            <View style={[styles.actionIconWrap, { backgroundColor: C.lightOrange }]}>
              <IndianRupee size={22} color={C.accent} strokeWidth={2} />
            </View>
            <Text style={[styles.actionTitleDark, { color: C.text }]}>Invoice</Text>
            <Text style={[styles.actionSubDark, { color: C.textSub }]}>Create and manage invoices</Text>
            <View style={[styles.actionArrow, { backgroundColor: C.background, borderWidth: 1, borderColor: C.border }]}>
              <ArrowRight size={13} color={C.accent} strokeWidth={3} />
            </View>
          </Pressable>
        </View>

        {/* ── OVERVIEW STATS ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: C.textSub }]}>OVERVIEW</Text>
          <View style={[styles.sectionBar, { backgroundColor: C.accent }]} />
        </View>

        {/* Single card, 3 stat columns */}
        <View style={[styles.statsCard, { backgroundColor: C.card, borderColor: C.border }]}>
          {STATS.map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={[styles.statDivider, { backgroundColor: C.border }]} />}
              <TouchableOpacity 
                style={styles.statCol} 
                activeOpacity={0.7}
                onPress={() => {
                  if (s.label === 'Quotations') navigation.navigate('QuotationsScreen');
                  if (s.label === 'Invoices') navigation.navigate('InvoiceScreen');
                }}
              >
                <View style={styles.statTopRow}>
                  <View style={[styles.statCircle, { backgroundColor: s.bg }]}>
                    <s.Icon size={20} color={s.iconColor} strokeWidth={2.4} />
                  </View>
                  <Text style={[styles.statBigNum, { color: C.text }]}>{s.value}</Text>
                </View>
                <Text style={[styles.statLbl, { color: C.textSub }]}>{s.label}</Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* ── RECENTS HEADER ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: C.textSub }]}>RECENT INVOICES</Text>
          <View style={[styles.sectionBar, { backgroundColor: C.accent }]} />
        </View>

        {/* ── ACTIVE PROJECT CARDS (Dynamic Invoices) ── */}
        {recentInvoices.length > 0 ? (
          recentInvoices.map((inv, idx) => renderInvoiceCard(inv, idx))
        ) : (
          <View style={{ padding: 20, alignItems: 'center', backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border }}>
            <FileCheck size={32} color={C.textSub} style={{ marginBottom: 8 }} />
            <Text style={{ color: C.text, fontWeight: '700' }}>No Recent Invoices</Text>
            <Text style={{ color: C.textSub, fontSize: 12, marginTop: 4 }}>Your created invoices will appear here.</Text>
          </View>
        )}

      </ScrollView>

      {/* ── PROFILE SWITCHER MODAL ── */}
      <Modal
        visible={profileModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: C.card, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>Switch Profile</Text>
              <Pressable onPress={() => setProfileModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={{ fontSize: 16, color: C.textSub, fontWeight: '700' }}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.profileList}>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 250 }}>
                {companies.map((comp, idx) => {
                  const isActive = idx === 0;
                  const name = comp?.firmName || comp?.firm || "Unnamed";
                  const logo = comp?.logoUrl;
                  return (
                    <TouchableOpacity 
                      key={idx}
                      style={[
                        styles.profileRow, 
                        { marginBottom: 12 },
                        isActive 
                          ? { backgroundColor: isDark ? '#2A2D3A' : '#EFFAF2', borderColor: C.success, borderWidth: 1 }
                          : { backgroundColor: isDark ? '#1C1F2A' : '#FFFFFF', borderColor: C.border, borderWidth: 1 }
                      ]}
                      onPress={() => { if (!isActive) switchProfile(idx); }}
                    >
                      <View style={[styles.profileLogoPlaceholder, { backgroundColor: '#FFF', overflow: 'hidden', borderWidth: 1.5, borderColor: isActive ? C.success : C.border }]}>
                        {comp?.logoKey && LOGO_ASSETS[comp?.logoKey] ? (
                          <Image source={LOGO_ASSETS[comp.logoKey]} style={{ width: '75%', height: '75%', resizeMode: 'contain' }} />
                        ) : logo ? (
                          <Image source={{ uri: logo }} style={{ width: '75%', height: '75%', resizeMode: 'contain' }} />
                        ) : (
                          <Text style={{ fontSize: 20 }}>🏢</Text>
                        )}
                      </View>
                      <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, { color: C.text }]}>{name}</Text>
                        <Text style={[styles.profileRole, { color: C.textSub }]}>{isActive ? "Default Profile" : "Workspace"}</Text>
                      </View>
                      {isActive && <View style={[styles.activeDot, { backgroundColor: C.success }]} />}
                      <TouchableOpacity
                        style={{ padding: 8, marginLeft: 8 }}
                        onPress={() => deleteProfile(idx, name)}
                      >
                        <Trash2 size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Add New Profile */}
              <TouchableOpacity 
                style={[styles.profileRow, { backgroundColor: isDark ? '#1C1F2A' : '#F9FAFB', borderStyle: 'dashed', borderWidth: 1, borderColor: C.border }]}
                onPress={() => {
                  setProfileModalVisible(false);
                  navigation.navigate("CompanyDetails", { isNew: true });
                }}
              >
                <View style={[styles.profileLogoPlaceholder, { backgroundColor: C.border }]}>
                  <Building2 size={20} color={C.textSub} />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: C.textSub }]}>Add New Company</Text>
                </View>
                <ArrowRight size={16} color={C.textSub} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.manageBtn, { backgroundColor: C.primary }]}
              onPress={() => {
                setProfileModalVisible(false);
                navigation.navigate("CompanyDetails");
              }}
            >
              <Settings size={16} color="#FFF" />
              <Text style={styles.manageBtnText}>Manage Company Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Payment Receipt Modal */}
      <PaymentModal
        visible={paymentModalVisible}
        onClose={() => { setPaymentModalVisible(false); setTempImage(null); setPaymentAmount(''); }}
        type="client"
        amount={paymentAmount}
        setAmount={setPaymentAmount}
        date={paymentDate}
        setDate={setPaymentDate}
        method={paymentMethod}
        setMethod={setPaymentMethod}
        image={tempImage}
        setImage={setTempImage}
        onPickImage={handlePickImage}
        onConfirm={handleAddPayment}
        isSaving={isSavingPayment}
        isDark={isDark}
        onCalendarPress={() => setShowCalendar(true)}
        clientOrVendorName={selectedInvoice?.buyerDetails?.companyName || 'Unknown Client'}
        invoiceRef={selectedInvoice ? `-${selectedInvoice.invoiceNumber || ''}` : ''}
      />

      {/* CALENDAR MODAL */}
      <CalendarModal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onDateSelect={(day) => { setPaymentDate(day.dateString); setShowCalendar(false); }}
        selectedDate={paymentDate}
        isDark={isDark}
      />
    </View>
  );
}

const SHADOW = { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 };

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', height: 40 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 40 },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  hello: { fontSize: 11, fontWeight: '500', marginBottom: 1 },
  name: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  toggle: { width: 52, height: 28, borderRadius: 14, justifyContent: 'center', overflow: 'hidden' },
  toggleTrackIcons: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 4 },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, position: 'absolute', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },
  iconBtn: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  settingsBtn: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  scroll: { paddingHorizontal: 16, paddingTop: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 12 },
  actionCard: { 
    flex: 1, 
    borderRadius: 16, 
    padding: 16, 
    minHeight: 118, 
    position: 'relative', 
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  actionIconWrap: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  actionTitleWhite: { fontSize: 14, fontWeight: '700', color: '#FFF', marginBottom: 3 },
  actionSubWhite: { fontSize: 9, fontWeight: '500', color: 'rgba(255,255,255,0.75)', lineHeight: 13 },
  actionTitleDark: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  actionSubDark: { fontSize: 9, fontWeight: '500', lineHeight: 13 },
  actionArrow: { position: 'absolute', bottom: 14, right: 14, width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  sectionBar: { height: 2, width: 20, borderRadius: 1 },
    statsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 4,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  statCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statBigNum: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statDivider: {
    width: 1,
    height: 44,
    borderRadius: 1,
  },
  statLbl: { fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  projectCard: { 
    borderRadius: 16, 
    borderWidth: 1, 
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  projectTop: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 14 },
  projectAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  projectName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  projectType: { fontSize: 11, fontWeight: '500' },
  progressBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, gap: 4 },
  progressBadgeText: { fontSize: 10, fontWeight: '700' },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, marginBottom: 14 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  contactTxt: { fontSize: 11, fontWeight: '500' },
  contactDot: { width: 1, height: 12, marginHorizontal: 12 },
  finBlock: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 14 },
  finRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  finLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  finIcon: { width: 26, height: 26, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  finLabel: { fontSize: 12, fontWeight: '600' },
  finVal: { fontSize: 13, fontWeight: '800' },
  finDivider: { borderTopWidth: 1, borderStyle: 'dashed', marginVertical: 10 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 6 },
  progressMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  progressPct: { fontSize: 10, fontWeight: '700' },
  progressFraction: { fontSize: 9, fontWeight: '500' },
  barBg: { height: 5, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 5, borderRadius: 3 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  footerTxt: { fontSize: 10, fontWeight: '500' },
  updateBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  updateBtnTxt: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalCloseBtn: { padding: 4 },
  profileList: { gap: 12, marginBottom: 24 },
  profileRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16 },
  profileLogoPlaceholder: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  profileLogoText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  profileRole: { fontSize: 12, fontWeight: '500' },
  activeDot: { width: 10, height: 10, borderRadius: 5 },
  manageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  manageBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  receiptOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  receiptContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%' },
  receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 16, marginBottom: 20 },
  receiptTitle: { fontSize: 16, fontWeight: '900', color: '#111827', letterSpacing: 1 },
  receiptClose: { padding: 8, backgroundColor: '#F9FAFB', borderRadius: 20 },
  receiptField: { marginBottom: 16 },
  receiptLabel: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  receiptInput: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, fontSize: 14, fontWeight: '800', color: '#111827' },
  imagePickerWrap: { backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: '#E5E7EB', padding: 24, alignItems: 'center', marginBottom: 16 },
  imagePickerBtn: { alignItems: 'center', gap: 12 },
  camIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 1 },
  removeImageBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: '#E11D48', padding: 6, borderRadius: 12, elevation: 4 },
  confirmBtn: { backgroundColor: '#134E3A', paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8, elevation: 4, flexDirection: 'row', gap: 10 },
  confirmBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
});





