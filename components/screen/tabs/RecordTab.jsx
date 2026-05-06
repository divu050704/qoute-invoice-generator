import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, StatusBar, TouchableOpacity, Animated, RefreshControl, TextInput, ScrollView } from 'react-native';
import { InteractionManager } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../../utils/customSecureStore';
import { Search, SlidersHorizontal, ArrowLeft, Leaf, Calendar, ArrowRightLeft, Plus, Clock, AlertCircle, FileText, X } from 'lucide-react-native';
import { useTheme } from '../../ThemeContext';

// ── Shared constants ────────────────────────────────────────────────────────
import { PRIMARY, HEADER_BG, SUCCESS, themed } from '../../../src/constants/colors';

export default function RecordTab({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  
  const bg = isDark ? '#121212' : '#f8f9fa';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const textMain = isDark ? '#F5F5F5' : '#111827';
  const textSub = isDark ? '#A1A1AA' : '#6B7280';
  const borderCol = isDark ? '#2C2C2E' : '#F3F4F6';
  const segmentBg = isDark ? '#2C2C2E' : '#E5E5E5';

  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [activeTab, setActiveTab] = useState('Quotations');
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [recordFilter, setRecordFilter] = useState('All');
  const [suppliers, setSuppliers] = useState([]);

  const load = useCallback(async () => {
    try {
      const qRaw = await getItemAsync('quotation');
      const iRaw = await getItemAsync('invoice');
      const sRaw = await getItemAsync('supplier');
      setQuotations(qRaw ? [...JSON.parse(qRaw)].reverse() : []);
      setInvoices(iRaw ? [...JSON.parse(iRaw)].reverse() : []);
      const s = sRaw ? JSON.parse(sRaw) : [];
      setSuppliers(Array.isArray(s) ? s : (s ? [s] : []));
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { const task = InteractionManager.runAfterInteractions(() => { load(); }); return () => task.cancel(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const formatDate = (str) => {
    if (!str) return '---';
    const d = new Date(str);
    return isNaN(d) ? str : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getTotal = (item) => (item.productDetails || []).reduce((s, p) => s + (parseFloat(p.totalAmount) || 0), 0);

  
  const stats = React.useMemo(() => {
    let total = 0, received = 0, pending = 0;
    invoices.forEach(inv => {
      const amt = getTotal(inv);
      total += amt;
      // Use receivedAmount if available, else compute from savedPayments
      let rec = parseFloat(inv.receivedAmount || 0);
      if (!rec && inv.savedPayments) {
        rec = inv.savedPayments
          .filter(p => p.type === 'client')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      }
      received += rec;
      const balance = Math.max(0, amt - rec);
      pending += balance;
    });
    return { total, received, pending };
  }, [invoices]);

  const formatStatAmount = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const companyNames = React.useMemo(() => {
    const names = [...new Set(suppliers.map(s => s.firmName || s.firm).filter(Boolean))];
    return names.sort();
  }, [suppliers]);

  const filters = activeTab === 'Quotations' 
    ? ['All', 'Pending', 'Converted', ...companyNames] 
    : ['All', 'Completed', 'Pending', 'Overdue', 'Under Process', ...companyNames];

  const items = (activeTab === 'Quotations' ? quotations : invoices).filter(item => {
    // 1. Search Filter
    if (search) {
      const s = search.toLowerCase();
      const prefix = item.quotationPrefix || item.invoicePrefix || '';
      const num = item.quotationNumber || item.invoiceNumber || '';
      const id = `${prefix}-${num}`.toLowerCase();
      const client = (item.buyerDetails?.companyName || '').toLowerCase();
      if (!id.includes(s) && !client.includes(s)) return false;
    }
    
    // 2. Status or Company Filter
    if (recordFilter !== 'All') {
      const statusFiltersQ = ['Pending', 'Converted'];
      const statusFiltersI = ['Completed', 'Pending', 'Overdue', 'Under Process'];
      const isQ = activeTab === 'Quotations';
      const isStatusFilter = isQ ? statusFiltersQ.includes(recordFilter) : statusFiltersI.includes(recordFilter);
      
      if (isStatusFilter) {
        if (isQ) {
          const converted = invoices.find(inv => inv.quotationNumber === item.quotationNumber && inv.quotationPrefix === item.quotationPrefix);
          const status = converted ? 'Converted' : 'Pending';
          if (status !== recordFilter) return false;
        } else {
          const total = getTotal(item);
          const received = parseFloat(item.receivedAmount || 0);
          const balance = Math.max(0, total - received);
          const status = balance === 0 ? 'Completed' : 'Pending';
          if (status !== recordFilter) return false;
        }
      } else {
        // Company (supplier) name filter
        if ((item.supplierDetails?.firmName || '') !== recordFilter) return false;
      }
    }
    return true;
  });

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_BG} />
      
      {/* Header Section */}
      <SafeAreaView style={{ backgroundColor: HEADER_BG, elevation: 4, zIndex: 20 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* The user snippet has a back button, but since this is a root tab, it might not go back. We keep the UI exact. */}
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('HomeTab')}>
              <ArrowLeft size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Records</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.iconBtnFilled} 
              onPress={() => { setShowSearch(!showSearch); if (showSearch) setSearch(''); }}
            >
              {showSearch ? <X size={20} color="#FFF" strokeWidth={2} /> : <Search size={20} color="#FFF" strokeWidth={2} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtnFilled} onPress={() => setShowFilter(!showFilter)}>
              <SlidersHorizontal size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {showSearch && (
          <View style={styles.searchWrap}>
            <Search size={15} color="rgba(255,255,255,0.5)" strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            {!!search && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                <X size={15} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </SafeAreaView>

      {/* FILTER CHIPS */}
      {showFilter && (
        <View style={{ paddingTop: 16 }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}
          >
            {filters.map((chip) => {
              const isActive = recordFilter === chip;
              return (
                <TouchableOpacity
                  key={chip}
                  activeOpacity={0.8}
                  onPress={() => setRecordFilter(chip)}
                  style={[
                    styles.filterChip,
                    isActive 
                      ? { backgroundColor: SUCCESS, borderColor: SUCCESS, elevation: 2 } 
                      : { backgroundColor: cardBg, borderColor: borderCol }
                  ]}
                >
                  <Text style={[styles.filterText, isActive ? { color: '#FFF' } : { color: textSub }]}>
                    {chip}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Tabs Section */}
      <View style={{ padding: 16 }}>
        <View style={[styles.segmentContainer, { backgroundColor: segmentBg, borderColor: isDark ? '#3A3A3C' : '#E5E7EB' }]}>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => { setActiveTab('Quotations'); setRecordFilter('All'); }}
            style={[styles.segmentBtn, activeTab === 'Quotations' && styles.segmentBtnActive]}
          >
            <Text style={[styles.segmentText, activeTab === 'Quotations' && styles.segmentTextActive]}>Quotations</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => { setActiveTab('Invoices'); setRecordFilter('All'); }}
            style={[styles.segmentBtn, activeTab === 'Invoices' && styles.segmentBtnActive]}
          >
            <Text style={[styles.segmentText, activeTab === 'Invoices' && styles.segmentTextActive]}>Invoices</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Clock size={48} color="#D1D5DB" strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: textMain }]}>No {activeTab} Yet</Text>
          <Text style={styles.emptySub}>Your saved records will appear here.</Text>
        </View>
      ) : (
        <FlatList 
          data={items} 
          keyExtractor={(_, idx) => `rec-${idx}`}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#134E3A', '#198754']}
              tintColor="#134E3A"
            />
          }
          ListHeaderComponent={activeTab === 'Invoices' ? (
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <Text style={styles.statLabel}>Total</Text>
                <Text style={[styles.statValue, { color: textMain }]}>{formatStatAmount(stats.total)}</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <Text style={styles.statLabel}>Received</Text>
                <Text style={[styles.statValue, { color: '#16A34A' }]}>{formatStatAmount(stats.received)}</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <Text style={styles.statLabel}>Ongoing</Text>
                <Text style={[styles.statValue, { color: '#D97706' }]}>{formatStatAmount(stats.pending)}</Text>
              </View>
            </View>
          ) : null}

          renderItem={({ item }) => {
            const isQ = activeTab === 'Quotations';
            const client = item.buyerDetails?.companyName || 'Unknown';
            const amount = getTotal(item).toFixed(2);
            const totalAmt = getTotal(item);
            let receivedAmt = parseFloat(item.receivedAmount || 0);
            if (!receivedAmt && item.savedPayments) {
              receivedAmt = item.savedPayments
                .filter(p => p.type === 'client')
                .reduce((sum, p) => sum + Number(p.amount || 0), 0);
            }
            const balanceAmt = Math.max(0, totalAmt - receivedAmt);
            const status = balanceAmt === 0 && totalAmt > 0 ? 'Completed' : 'Pending';

            if (isQ) {
              const id = `${item.quotationPrefix}-${item.quotationNumber}`;
              const date = item.quotationDate;
              const service = item.productDetails?.[0]?.productName || 'Service';
              const convertedInvoice = invoices.find(inv => inv.quotationNumber === item.quotationNumber && inv.quotationPrefix === item.quotationPrefix);

              return (
                <TouchableOpacity 
                  activeOpacity={0.9}
                  style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}
                  onPress={() => navigation.navigate('ViewQuotation', { data: item })}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.cardLeft}>
                      <View style={styles.serviceLabel}>
                        <Leaf size={10} color={SUCCESS} strokeWidth={3} />
                        <Text style={styles.serviceText}>{service}</Text>
                      </View>
                      <Text style={[styles.clientName, { color: textMain }]} numberOfLines={1}>{client}</Text>
                      <View style={styles.metaRow}>
                        <View style={[styles.idBadge, isDark && { backgroundColor: '#2C2C2E', borderColor: '#3A3A3C' }]}><Text style={[styles.idText, { color: isDark ? '#A1A1AA' : '#4B5563' }]}>{id}</Text></View>
                        <View style={styles.dateWrap}><Calendar size={12} color={textSub} /><Text style={[styles.dateText, { color: textSub }]}>{formatDate(date)}</Text></View>
                      </View>
                    </View>
                    <View style={styles.cardRight}>
                      <Text style={[styles.amountText, { color: isDark ? '#10B981' : HEADER_BG }]}>₹{amount}</Text>
                    </View>
                  </View>
                  {convertedInvoice ? (
                    <View style={[styles.convertBtn, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }, isDark && { backgroundColor: '#1A2A4A', borderColor: '#1E3A5F' }]}>
                      <FileText size={16} color="#2563EB" />
                      <Text style={[styles.convertText, { color: '#2563EB' }]}>Converted on {formatDate(convertedInvoice.invoiceDate || convertedInvoice.date || new Date().toISOString())}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.convertBtn, isDark && { backgroundColor: '#0A2418', borderColor: 'rgba(16,185,129,0.2)' }]} 
                      activeOpacity={0.8}
                      onPress={() => {
                        const mappedData = { ...item };
                        mappedData.invoiceDate = mappedData.quotationDate || new Date().toISOString().split('T')[0];
                        mappedData.invoicePrefix = `INVPG/${String(new Date().getMonth() + 1).padStart(2, '0')}`; 
                        mappedData.invoiceNumber = mappedData.quotationNumber || "001";
                        mappedData.dueDate = mappedData.quotationValidity || "";
                        
                        delete mappedData.quotationDate;
                        delete mappedData.quotationValidity;
                        // keep quotationPrefix and quotationNumber for reference

                        navigation.navigate("CreateInvoice", { inputData: mappedData });
                      }}
                    >
                      <ArrowRightLeft size={16} color={SUCCESS} />
                      <Text style={styles.convertText}>Convert to Invoice</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            } else {
              const id = `${item.invoicePrefix}-${item.invoiceNumber}`;
              const date = item.invoiceDate;
              
              return (
                <TouchableOpacity 
                  activeOpacity={0.9}
                  style={[styles.invCard, { backgroundColor: cardBg, borderColor: borderCol }]}
                  onPress={() => navigation.navigate('InvoicePdfViewer', { data: item })}
                >
                  <View style={styles.invTop}>
                    <Text style={[styles.invClient, { color: textMain }]} numberOfLines={1}>{client}</Text>
                    <Text style={[styles.invAmount, { color: isDark ? '#10B981' : HEADER_BG }]}>₹{Number(amount).toLocaleString('en-IN')}</Text>
                  </View>
                  
                  <Text style={[styles.invMetaText, { color: textSub }]}>{id} • {formatDate(date)}</Text>
                  
                  {item.quotationNumber ? (
                    <View style={[styles.invConvertedBadge, isDark && { backgroundColor: '#1A2A4A', borderColor: '#1E3A5F' }]}>
                      <FileText size={10} color="#2563EB" />
                      <Text style={styles.invConvertedText}>Converted from {item.quotationPrefix}-{item.quotationNumber}</Text>
                    </View>
                  ) : <View style={{ height: 8 }} />}

                  <View style={[styles.invFooter, { borderTopColor: borderCol }]}>
                    <View style={styles.invDueWrap}>
                      <AlertCircle size={12} color={status === 'Overdue' ? '#EF4444' : textSub} />
                      <Text style={[styles.invDueText, { color: textSub }]}>Due: {formatDate(item.dueDate || date)}</Text>
                    </View>
                    <View style={[styles.statusBadge, status === 'Pending' ? { backgroundColor: '#FFF3CD' } : status === 'Completed' ? { backgroundColor: '#D1E7DD' } : { backgroundColor: '#F8D7DA' }]}>
                      <Text style={[styles.statusText, status === 'Pending' ? { color: '#856404' } : status === 'Completed' ? { color: '#0F5132' } : { color: '#842029' }]}>{status}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }
          }}
        />
      )}


    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { padding: 4, borderRadius: 20 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#FFF' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtnFilled: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  
  segmentContainer: { flexDirection: 'row', padding: 4, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: SUCCESS, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  segmentTextActive: { color: '#FFF' },

  card: { borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1, paddingRight: 10 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 10, paddingHorizontal: 14, height: 40,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#FFF', height: 40 },
  serviceLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(25,135,84,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8 },
  serviceText: { fontSize: 11, fontWeight: '600', color: SUCCESS, textTransform: 'uppercase', letterSpacing: 0.5 },
  clientName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  idBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  idText: { fontSize: 12, fontWeight: '500', color: '#4B5563' },
  dateWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 12, fontWeight: '400' },
  
  cardRight: { alignItems: 'flex-end' },
  amountText: { fontSize: 16, fontWeight: '700', color: HEADER_BG, marginBottom: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  convertBtn: { marginTop: 14, backgroundColor: '#F8F9FA', paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(25,135,84,0.2)' },
  convertText: { fontSize: 13, fontWeight: '600', color: SUCCESS },

  fabContainer: { position: 'absolute', right: 20, zIndex: 50 },
  fab: { width: 56, height: 56, borderRadius: 28, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: PRIMARY, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },

  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  filterText: { fontSize: 13, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statBox: { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '800' },

  invCard: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  invTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  invClient: { flex: 1, fontSize: 15, fontWeight: '700', paddingRight: 10 },
  invAmount: { fontSize: 15, fontWeight: '700', color: HEADER_BG },
  invMetaText: { fontSize: 11, fontWeight: '500', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  invConvertedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: '#DBEAFE', marginBottom: 12 },
  invConvertedText: { fontSize: 9, fontWeight: '700', color: '#2563EB', textTransform: 'uppercase' },
  invFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1 },
  invDueWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  invDueText: { fontSize: 11, fontStyle: 'italic' },

});



