import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  StatusBar, Alert, TextInput, TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getItemAsync, setItemAsync } from '../../../utils/customSecureStore';
import { ArrowLeft, Plus, User, Trash2, Search, Building2, Edit3 } from 'lucide-react-native';

// ── Shared components & constants ───────────────────────────────────────────
import { PRIMARY } from '../../../../src/constants/colors';
import { CLIENT_TABS } from '../../../../src/constants';
import FilterChips from '../../../../src/components/FilterChips';
import EmptyState from '../../../../src/components/EmptyState';
import useDebounce from '../../../../src/hooks/useDebounce';

const CHIP_EMOJIS = { Active: '😊', Inactive: '😔', Quoted: '📋', Converted: '✅' };

// ── Memoized Buyer Card ─────────────────────────────────────────────────────
const BuyerCard = React.memo(({ item, statusBadge, onSelect, onEdit, onDelete }) => (
  <TouchableOpacity
    style={styles.card}
    activeOpacity={0.8}
    onPress={onSelect}
  >
    <View style={styles.cardLeft}>
      <View style={styles.avatar}>
        <Building2 size={20} color={PRIMARY} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>{item.companyName}</Text>
        {item.contactName ? <Text style={styles.sub}>{item.contactName}</Text> : null}
        {item.mobile ? <Text style={styles.sub}>{item.mobile}</Text> : null}
      </View>
    </View>
    <View style={{ alignItems: 'flex-end', gap: 6 }}>
      <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
        <Text style={[styles.statusText, { color: statusBadge.color }]}>{statusBadge.label}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable style={styles.actionBtn} onPress={onEdit} hitSlop={8}>
          <Edit3 size={14} color={PRIMARY} strokeWidth={2.5} />
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={onDelete} hitSlop={8}>
          <Trash2 size={14} color="#EF4444" strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  </TouchableOpacity>
));
BuyerCard.displayName = 'BuyerCard';

// ── Main Component ──────────────────────────────────────────────────────────
export default function SelectBuyer({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const onSelect = route?.params?.onSelect;

  const [buyers, setBuyers] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const debouncedSearch = useDebounce(search, 300);

  const loadBuyers = useCallback(async () => {
    try {
      const [bRaw, qRaw, iRaw] = await Promise.all([
        getItemAsync('buyer'),
        getItemAsync('quotation'),
        getItemAsync('invoice'),
      ]);
      setBuyers(bRaw ? (Array.isArray(JSON.parse(bRaw)) ? JSON.parse(bRaw) : []) : []);
      setQuotations(qRaw ? JSON.parse(qRaw) : []);
      setInvoices(iRaw ? JSON.parse(iRaw) : []);
    } catch {
      setBuyers([]);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadBuyers(); }, [loadBuyers]));

  const deleteBuyer = useCallback((item) => {
    Alert.alert('Delete Buyer', `Delete "${item.companyName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const raw = await getItemAsync('buyer');
            let list = raw ? JSON.parse(raw) : [];
            list = list.filter(b => b.companyName !== item.companyName);
            await setItemAsync('buyer', JSON.stringify(list));
            loadBuyers();
          } catch { }
        }
      }
    ]);
  }, [loadBuyers]);

  // ── Status computation ──────────────────────────────────────────────────
  const getStatusKey = useCallback((client) => {
    if (client.leadStatus === 'Inactive') return 'Inactive';
    const name = (client.companyName || '').toLowerCase();
    if (invoices.some(i => (i.buyerDetails?.companyName || '').toLowerCase() === name)) return 'Converted';
    if (quotations.some(q => (q.buyerDetails?.companyName || '').toLowerCase() === name)) return 'Quoted';
    return 'Active';
  }, [invoices, quotations]);

  const getClientBadge = useCallback((client) => {
    if (client.leadStatus === 'Inactive') return { label: '😔 Inactive', bg: '#FEE2E2', color: '#991B1B' };
    const name = (client.companyName || '').toLowerCase();
    const invCount = invoices.filter(i => (i.buyerDetails?.companyName || '').toLowerCase() === name).length;
    if (invCount > 0) return { label: '✅ Converted', bg: '#D1E7DD', color: '#0F5132' };
    const quoCount = quotations.filter(q => (q.buyerDetails?.companyName || '').toLowerCase() === name).length;
    if (quoCount > 0) return { label: `📋 Quoted ${quoCount > 1 ? quoCount + 'x' : ''}`.trim(), bg: '#CCE5FF', color: '#004085' };
    return { label: '😊 Active', bg: '#FFF3CD', color: '#856404' };
  }, [invoices, quotations]);

  // ── Tab counts ──────────────────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts = { All: buyers.length, Active: 0, Quoted: 0, Converted: 0, Inactive: 0 };
    buyers.forEach(b => { counts[getStatusKey(b)]++; });
    return counts;
  }, [buyers, getStatusKey]);

  // ── Filtered list ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = buyers;
    if (statusFilter !== 'All') {
      list = list.filter(b => getStatusKey(b) !== statusFilter ? false : true);
    }
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      list = list.filter(b =>
        (b.companyName || '').toLowerCase().includes(s) ||
        (b.contactName || '').toLowerCase().includes(s)
      );
    }
    return list;
  }, [buyers, statusFilter, debouncedSearch, getStatusKey]);

  const handleSelect = useCallback((item) => {
    if (onSelect) {
      onSelect(item);
      navigation.goBack();
    }
  }, [onSelect, navigation]);

  // ── Render ────────────────────────────────────────────────────────────
  const renderItem = useCallback(({ item }) => (
    <BuyerCard
      item={item}
      statusBadge={getClientBadge(item)}
      onSelect={() => handleSelect(item)}
      onEdit={() => navigation.navigate('AddBuyer', { buyer: item })}
      onDelete={() => deleteBuyer(item)}
    />
  ), [getClientBadge, handleSelect, navigation, deleteBuyer]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <SafeAreaView style={{ backgroundColor: PRIMARY }} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={22} color="#FFF" strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.headerTitle}>Select Buyer</Text>
          <Pressable
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddBuyer', { onSelect })}
          >
            <Plus size={20} color="#FFF" strokeWidth={2.5} />
          </Pressable>
        </View>
      </SafeAreaView>

      <View style={styles.searchRow}>
        <Search size={16} color="#9CA3AF" strokeWidth={2} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search buyers..."
          placeholderTextColor="#C4C4C4"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Status Filter Chips (shared component) */}
      <FilterChips
        tabs={CLIENT_TABS}
        activeTab={statusFilter}
        onSelect={setStatusFilter}
        counts={statusCounts}
        emojis={CHIP_EMOJIS}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<User size={44} color="#D1D5DB" strokeWidth={1.5} />}
          title={buyers.length === 0 ? 'No Buyers Yet' : 'No Results'}
          subtitle={buyers.length === 0 ? 'Add your first buyer.' : 'Try a different search.'}
          actionLabel={buyers.length === 0 ? 'Add Buyer' : undefined}
          onAction={buyers.length === 0 ? () => navigation.navigate('AddBuyer') : undefined}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, idx) => `${item.companyName}-${idx}`}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 30 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#FFF' },
  addBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 16, marginBottom: 8,
    borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, height: 44, fontSize: 14, color: '#1F2937' },
  card: {
    backgroundColor: '#FFF', borderRadius: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#E5E7EB', padding: 14,
    flexDirection: 'row', alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EFFAF2', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  name: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  sub: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  actionBtn: { padding: 4 },
});
