import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, StatusBar, TouchableOpacity, Alert, ScrollView, RefreshControl, TextInput, Share } from 'react-native';
import { InteractionManager } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../../utils/customSecureStore';
import { ArrowLeft, Search, SlidersHorizontal, Leaf, Calendar, AlertCircle, Eye, Share2, MoreVertical, Plus, FilePlus, PlusCircle, FileText, X, Trash2, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../ThemeContext';

// ── Shared constants ────────────────────────────────────────────────────────
import { HEADER_BG, SUCCESS } from '../../../src/constants/colors';

export default function InvoiceTab({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const bg = isDark ? '#121212' : '#f4f7f6';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const textMain = isDark ? '#F5F5F5' : '#111827';
  const textSub = isDark ? '#A1A1AA' : '#6B7280';
  const borderCol = isDark ? '#2C2C2E' : '#F3F4F6';

  const [invoices, setInvoices] = useState([]);
  const [invoiceFilter, setInvoiceFilter] = useState('All');
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [suppliers, setSuppliers] = useState([]);

  const handleDeleteInvoice = async (item) => {
    const id = `${item.invoicePrefix}-${item.invoiceNumber}`;
    Alert.alert('Delete Invoice', `Delete invoice ${id}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const raw = await getItemAsync('invoice');
            let list = raw ? JSON.parse(raw) : [];
            list = list.filter(i =>
              !(i.invoiceDate === item.invoiceDate &&
                i.invoicePrefix === item.invoicePrefix &&
                i.invoiceNumber === item.invoiceNumber)
            );
            await setItemAsync('invoice', JSON.stringify(list));
            load();
          } catch { Alert.alert('Error', 'Could not delete.'); }
        },
      },
    ]);
  };

  const handleShareInvoice = async (item) => {
    const id = `${item.invoicePrefix}-${item.invoiceNumber}`;
    const client = item.buyerDetails?.companyName || 'Client';
    const total = getTotal(item);
    try {
      await Share.share({
        message: `Invoice ${id} for ${client}\nAmount: ₹${Number(total).toLocaleString('en-IN')}`,
      });
    } catch {}
  };

  const load = useCallback(async () => {
    try {
      const raw = await getItemAsync('invoice');
      const data = raw ? JSON.parse(raw) : [];
      setInvoices(Array.isArray(data) ? [...data].reverse() : []);
      
      const sRaw = await getItemAsync('supplier');
      const s = sRaw ? JSON.parse(sRaw) : [];
      setSuppliers(Array.isArray(s) ? s : (s ? [s] : []));
    } catch { setInvoices([]); setSuppliers([]); }
  }, []);

  useFocusEffect(useCallback(() => { const task = InteractionManager.runAfterInteractions(() => { load(); }); return () => task.cancel(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const getTotal = (item) => (item.productDetails || []).reduce((sum, p) => sum + (parseFloat(p.totalAmount) || 0), 0);

  const formatDate = (str) => {
    if (!str) return '---';
    const d = new Date(str);
    return isNaN(d) ? str : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filteredInvoices = useMemo(() => {
    let list = invoices;
    if (invoiceFilter !== 'All') {
      // Check if it's a status filter or company filter
      const statusFilters = ['Completed', 'Pending', 'Overdue', 'Under Process'];
      if (statusFilters.includes(invoiceFilter)) {
        list = list.filter(inv => {
          const total = getTotal(inv);
          const received = parseFloat(inv.receivedAmount || 0);
          const balance = Math.max(0, total - received);
          const status = balance === 0 ? 'Completed' : 'Pending';
          return status === invoiceFilter;
        });
      } else {
        // Company (supplier) name filter
        list = list.filter(inv => (inv.supplierDetails?.firmName || '') === invoiceFilter);
      }
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(inv => {
        const prefix = inv.invoicePrefix || '';
        const num = inv.invoiceNumber || '';
        const id = `${prefix}-${num}`.toLowerCase();
        const client = (inv.buyerDetails?.companyName || '').toLowerCase();
        return id.includes(s) || client.includes(s);
      });
    }
    return list;
  }, [invoiceFilter, invoices, search]);

  const formatCurrency = (val) => `₹${Number(val).toLocaleString('en-IN')}`;

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed': return { bg: '#D1E7DD', text: '#0F5132', border: '#BADBCC' };
      case 'Pending': return { bg: '#FFF3CD', text: '#856404', border: '#FFECB5' };
      case 'Overdue': return { bg: '#F8D7DA', text: '#842029', border: '#F5C2C7' };
      case 'Under Process': return { bg: '#CFF4FC', text: '#055160', border: '#B6EFFB' };
      default: return { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' };
    }
  };

  const companyNames = useMemo(() => {
    const names = [...new Set(suppliers.map(s => s.firmName || s.firm).filter(Boolean))];
    return names.sort();
  }, [suppliers]);

  const filters = ['All', 'Completed', 'Pending', 'Overdue', 'Under Process', ...companyNames];

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_BG} />
      
      {/* HEADER */}
      <SafeAreaView style={{ backgroundColor: HEADER_BG, zIndex: 30, elevation: 4 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('HomeTab')}>
              <ArrowLeft size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Invoices</Text>
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
              placeholder="Search invoices..."
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
            const isActive = invoiceFilter === chip;
            return (
              <TouchableOpacity
                key={chip}
                activeOpacity={0.8}
                onPress={() => setInvoiceFilter(chip)}
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

      {/* INVOICE LIST */}
      {filteredInvoices.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIconWrap, isDark && { backgroundColor: '#2C2C2E' }]}>
            <FileText size={48} color="#D1D5DB" />
          </View>
          <Text style={[styles.emptyTitle, { color: textMain }]}>No results found</Text>
          <Text style={[styles.emptySub, { color: textSub }]}>We couldn't find any invoices matching the filter.</Text>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={styles.clearBtn}
            onPress={() => setInvoiceFilter('All')}
          >
            <Text style={styles.clearBtnText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item, idx) => `inv-${idx}`}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 140 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#134E3A', '#198754']}
              tintColor="#134E3A"
            />
          }
          renderItem={({ item }) => {
            const client = item.buyerDetails?.companyName || 'Unknown';
            const id = `${item.invoicePrefix}-${item.invoiceNumber}`;
            const date = item.invoiceDate;
            const due = item.dueDate || date;
            const total = getTotal(item);
            const received = parseFloat(item.receivedAmount || 0);
            const balance = Math.max(0, total - received);
            const status = balance === 0 ? 'Completed' : 'Pending';
            const service = item.productDetails?.[0]?.productName || 'Service';
            const statusStyle = getStatusStyle(status);

            return (
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => navigation.navigate('ViewInvoice', { data: item })}
                style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}
              >
                <View style={styles.cardContent}>
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={[styles.clientName, { color: textMain }]} numberOfLines={1}>{client}</Text>
                      <Text style={[styles.idMeta, { color: textSub }]}>#{id} • {formatDate(date)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.amountTotal}>{formatCurrency(total)}</Text>
                    </View>
                  </View>

                  <View style={[styles.rowBetween, { marginTop: 12 }]}>
                    <View style={styles.rowTags}>
                      <View style={[styles.serviceTag, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}>
                        <Leaf size={10} color={isDark ? '#A1A1AA' : '#6B7280'} />
                        <Text style={[styles.serviceTagText, { color: isDark ? '#A1A1AA' : '#6B7280' }]}>{service}</Text>
                      </View>
                      {status !== 'Completed' && (
                        <View style={[styles.dueTag, isDark && { backgroundColor: '#3A2020' }]}>
                          <Calendar size={10} color="#E11D48" />
                          <Text style={styles.dueTagText}>Due: {formatDate(due)}</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.rowTags}>
                      {status === 'Overdue' && <AlertCircle size={14} color="#E11D48" />}
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{status}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.cardFooter, { borderTopColor: borderCol }]}>
                    <View style={styles.footerLeft}>
                      {status === 'Completed' ? (
                        <View style={{
                          flexDirection: 'row', alignItems: 'center', gap: 8,
                          borderWidth: 2, borderColor: '#10B981', borderRadius: 8,
                          paddingHorizontal: 12, paddingVertical: 6,
                          backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)',
                          transform: [{ rotate: '-2deg' }],
                        }}>
                          <CheckCircle size={16} color="#10B981" strokeWidth={2.5} />
                          <Text style={{ fontSize: 13, fontWeight: '900', color: '#10B981', letterSpacing: 1.5, textTransform: 'uppercase' }}>Work Completed</Text>
                        </View>
                      ) : (
                        <View>
                          <Text style={[styles.balanceLabel, { color: textSub }]}>Balance Due</Text>
                          <Text style={[styles.balanceAmount, { color: balance > 0 ? '#E11D48' : '#10B981' }]}>
                            {formatCurrency(balance)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.footerRight}>
                      <TouchableOpacity style={styles.actionIconBtn} onPress={() => navigation.navigate('ViewInvoice', { data: item })}>
                        <Eye size={20} color={textSub} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionIconBtn} onPress={() => setActiveMenu(activeMenu === id ? null : id)}>
                        <MoreVertical size={20} color={textSub} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Three-dot menu */}
                  {activeMenu === id && (
                    <View style={{
                      backgroundColor: isDark ? '#2C2C2E' : '#FFF',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isDark ? '#3A3A3C' : '#E5E7EB',
                      overflow: 'hidden',
                      marginTop: 8,
                      elevation: 4,
                    }}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => { setActiveMenu(null); handleShareInvoice(item); }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 }}
                      >
                        <Share2 size={16} color={isDark ? '#10B981' : HEADER_BG} strokeWidth={2} />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: textMain }}>Share Invoice</Text>
                      </TouchableOpacity>
                      <View style={{ height: 1, backgroundColor: isDark ? '#3A3A3C' : '#F3F4F6' }} />
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => { setActiveMenu(null); handleDeleteInvoice(item); }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 }}
                      >
                        <Trash2 size={16} color="#E11D48" strokeWidth={2} />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#E11D48' }}>Delete Invoice</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
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
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 10, paddingHorizontal: 14, height: 40,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#FFF', height: 40 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtnFilled: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  
  filterChip: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  filterText: { fontSize: 12, fontWeight: '700' },

  card: { borderRadius: 16, marginBottom: 16, borderWidth: 1, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, overflow: 'hidden' },
  cardContent: { padding: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  clientName: { fontSize: 16, fontWeight: '700', marginBottom: 4, letterSpacing: -0.3 },
  idMeta: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: -0.2 },
  amountTotal: { fontSize: 18, fontWeight: '900', color: HEADER_BG },
  
  rowTags: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serviceTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  serviceTagText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', color: '#6B7280' },
  dueTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF1F2', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  dueTagText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', color: '#E11D48' },
  
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  statusText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, marginTop: 12, borderTopWidth: 1 },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  balanceLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceAmount: { fontSize: 14, fontWeight: '900' },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionIconBtn: { padding: 8 },

  fabWrapper: { position: 'absolute', right: 20, alignItems: 'flex-end', zIndex: 50 },
  fabMenu: { alignItems: 'flex-end', gap: 12, marginBottom: 16 },
  fabMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  fabMenuText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  fabMenuIconWrapQuo: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(19,78,58,0.1)', justifyContent: 'center', alignItems: 'center' },
  fabMenuIconWrapInv: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center' },
  
  mainFab: { width: 56, height: 56, borderRadius: 28, backgroundColor: HEADER_BG, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: HEADER_BG, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12 },
  mainFabActive: { backgroundColor: '#E11D48', shadowColor: '#E11D48' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, paddingTop: 80 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  clearBtn: { backgroundColor: HEADER_BG, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, elevation: 2 },
  clearBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});


