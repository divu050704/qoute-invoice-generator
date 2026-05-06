import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, StatusBar,
  TextInput, TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { InteractionManager } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getItemAsync, setItemAsync } from '../../utils/customSecureStore';
import {
  Search, MapPin, Phone, Mail, Edit2, ChevronRight, Users, X, ArrowLeft, Plus
} from 'lucide-react-native';
import { useTheme } from '../../ThemeContext';

// ── Shared components & constants ───────────────────────────────────────────
import { PRIMARY, ACCENT, AVATAR_PALETTES, STATUS, themed } from '../../../src/constants/colors';
import { CLIENT_TABS } from '../../../src/constants';
import FilterChips from '../../../src/components/FilterChips';
import EmptyState from '../../../src/components/EmptyState';
import useDebounce from '../../../src/hooks/useDebounce';

// ── Helpers ─────────────────────────────────────────────────────────────────
const getInitials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map(n => n[0]?.toUpperCase() || '').join('') || '?';

const getPalette = (name = '', idx = 0) =>
  AVATAR_PALETTES[((name.charCodeAt(0) || 65) + idx) % AVATAR_PALETTES.length];

const CHIP_EMOJIS = { Active: '😊', Inactive: '😔', Quoted: '📋', Converted: '✅' };

// ── Memoized Client Card ────────────────────────────────────────────────────
const ClientCard = React.memo(({ item, index, cardBg, borderCol, textMain, textSub, stripBg, statusKey, statusLabel, onPress, onEdit }) => {
  const palette = getPalette(item.companyName, index);
  const ss = STATUS[statusKey] || { bg: '#F3F4F6', text: '#6B7280' };
  const address = [item.street, item.city].filter(Boolean).join(', ');

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}
      onPress={onPress}
    >
      <View style={styles.cardBody}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: palette.bg }]}>
          <Text style={[styles.avatarText, { color: palette.text }]}>
            {getInitials(item.companyName)}
          </Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={[styles.clientName, { color: textMain }]} numberOfLines={1}>
              {item.companyName}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: ss.bg }]}>
              <Text style={[styles.statusText, { color: ss.text }]}>{statusLabel}</Text>
            </View>
          </View>

          {!!item.contactName && (
            <View style={styles.serviceRow}>
              <View style={styles.serviceDot} />
              <Text style={[styles.serviceLabel, { color: textSub }]}>
                {item.contactName}
              </Text>
            </View>
          )}

          <View style={styles.metaBlock}>
            {!!address && (
              <View style={styles.metaRow}>
                <MapPin size={11} color={textSub} strokeWidth={2} />
                <Text style={[styles.metaText, { color: textSub }]} numberOfLines={1}>
                  {address}
                </Text>
              </View>
            )}
            <View style={styles.contactRow}>
              {!!item.mobile && (
                <View style={styles.metaRow}>
                  <Phone size={11} color={PRIMARY} strokeWidth={2.5} />
                  <Text style={[styles.phoneText, { color: PRIMARY }]}>{item.mobile}</Text>
                </View>
              )}
              {!!item.email && (
                <View style={[styles.metaRow, { flex: 1 }]}>
                  <Mail size={11} color={textSub} strokeWidth={2} />
                  <Text style={[styles.metaText, { color: textSub }]} numberOfLines={1}>
                    {item.email}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={onEdit} style={styles.editBtn} hitSlop={10}>
          <Edit2 size={14} color={textSub} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Footer Strip */}
      <View style={[styles.strip, { backgroundColor: stripBg, borderTopColor: borderCol }]}>
        <Text style={[styles.stripLabel, { color: textSub }]}>
          {item.gstin ? `GSTIN: ${item.gstin.slice(0, 10)}…` : 'Tap to view details'}
        </Text>
        <ChevronRight size={14} color={textSub} strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );
});
ClientCard.displayName = 'ClientCard';

// ── Main Component ──────────────────────────────────────────────────────────
export default function ClientTab({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const bg        = themed(isDark, '#111111', '#F4F6F8');
  const cardBg    = themed(isDark, '#1C1C1E', '#FFFFFF');
  const borderCol = themed(isDark, '#2C2C2E', '#E8EDF2');
  const textMain  = themed(isDark, '#F5F5F5', '#0F172A');
  const textSub   = themed(isDark, '#A1A1AA', '#64748B');
  const stripBg   = themed(isDark, '#161618', '#F8FAFC');

  const [buyers, setBuyers]       = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices]     = useState([]);
  const [search, setSearch]       = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    try {
      const [bRaw, qRaw, iRaw] = await Promise.all([
        getItemAsync('buyer'),
        getItemAsync('quotation'),
        getItemAsync('invoice'),
      ]);
      setBuyers(bRaw ? JSON.parse(bRaw) : []);
      setQuotations(qRaw ? JSON.parse(qRaw) : []);
      setInvoices(iRaw ? JSON.parse(iRaw) : []);
    } catch { setBuyers([]); }
  }, []);

  useFocusEffect(useCallback(() => {
    const task = InteractionManager.runAfterInteractions(() => { load(); });
    return () => task.cancel();
  }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const deleteClient = useCallback((item) => {
    Alert.alert('Delete Client', `Delete "${item.companyName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const raw = await getItemAsync('buyer');
            let list = raw ? JSON.parse(raw) : [];
            list = list.filter(b => b.companyName !== item.companyName);
            await setItemAsync('buyer', JSON.stringify(list));
            load();
          } catch {}
        }
      }
    ]);
  }, [load]);

  // ── Status computation ──────────────────────────────────────────────────
  const getClientStatusKey = useCallback((client) => {
    if (client.leadStatus === 'Inactive') return 'INACTIVE';
    const name = (client.companyName || '').toLowerCase();
    if (invoices.some(i => (i.buyerDetails?.companyName || '').toLowerCase() === name)) return 'CONVERTED';
    if (quotations.some(q => (q.buyerDetails?.companyName || '').toLowerCase() === name)) return 'QUOTED';
    return 'ACTIVE';
  }, [quotations, invoices]);

  const getClientStatusLabel = useCallback((client) => {
    if (client.leadStatus === 'Inactive') return '😔 INACTIVE';
    const name = (client.companyName || '').toLowerCase();
    const invCount = invoices.filter(i => (i.buyerDetails?.companyName || '').toLowerCase() === name).length;
    if (invCount > 0) return '✅ CONVERTED';
    const quoCount = quotations.filter(q => (q.buyerDetails?.companyName || '').toLowerCase() === name).length;
    if (quoCount > 0) return `📋 QUOTED ${quoCount > 1 ? quoCount + 'x' : ''}`;
    return '😊 ACTIVE';
  }, [quotations, invoices]);

  // ── Tab counts ──────────────────────────────────────────────────────────
  const tabCounts = useMemo(() => {
    const counts = { All: buyers.length, Active: 0, Quoted: 0, Converted: 0, Inactive: 0 };
    buyers.forEach(b => {
      const key = getClientStatusKey(b);
      if (key === 'ACTIVE') counts.Active++;
      else if (key === 'QUOTED') counts.Quoted++;
      else if (key === 'CONVERTED') counts.Converted++;
      else if (key === 'INACTIVE') counts.Inactive++;
    });
    return counts;
  }, [buyers, getClientStatusKey]);

  // ── Filtered list (uses debounced search) ─────────────────────────────
  const filtered = useMemo(() => {
    let list = buyers;
    if (activeTab !== 'All') {
      list = list.filter(b => getClientStatusKey(b) === activeTab.toUpperCase());
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(b =>
        (b.companyName || '').toLowerCase().includes(q) ||
        (b.contactName || '').toLowerCase().includes(q) ||
        (b.mobile || '').includes(q)
      );
    }
    return list;
  }, [buyers, activeTab, debouncedSearch, getClientStatusKey]);

  // ── Render item (with useCallback for stable reference) ───────────────
  const renderItem = useCallback(({ item, index }) => (
    <ClientCard
      item={item}
      index={index}
      cardBg={cardBg}
      borderCol={borderCol}
      textMain={textMain}
      textSub={textSub}
      stripBg={stripBg}
      statusKey={getClientStatusKey(item)}
      statusLabel={getClientStatusLabel(item)}
      onPress={() => navigation.navigate('AddBuyer', { buyer: item })}
      onEdit={() => navigation.navigate('AddBuyer', { buyer: item })}
    />
  ), [cardBg, borderCol, textMain, textSub, stripBg, getClientStatusKey, getClientStatusLabel, navigation]);

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* ── HEADER ── */}
      <SafeAreaView style={{ backgroundColor: PRIMARY, zIndex: 30, elevation: 4 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('HomeTab')}>
              <ArrowLeft size={24} color="#FFF" strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Clients</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconBtnFilled}
              onPress={() => { setShowSearch(s => !s); setSearch(''); }}
            >
              {showSearch
                ? <X size={20} color="#FFF" strokeWidth={2} />
                : <Search size={20} color="#FFF" strokeWidth={2} />
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtnFilled}
              onPress={() => navigation.navigate('AddBuyer')}
            >
              <Plus size={20} color="#FFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {showSearch && (
          <View style={styles.searchWrap}>
            <Search size={15} color="rgba(255,255,255,0.5)" strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, phone…"
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

      {/* ── FILTER CHIPS (shared component) ── */}
      <FilterChips
        tabs={CLIENT_TABS}
        activeTab={activeTab}
        onSelect={setActiveTab}
        counts={tabCounts}
        emojis={CHIP_EMOJIS}
        cardBg={cardBg}
        borderCol={borderCol}
        textSub={textSub}
      />

      {/* ── LIST ── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={40} color="#D1D5DB" strokeWidth={1.5} />}
          title="No Results"
          subtitle="Try a different filter or search term."
          isDark={isDark}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, idx) => `${item.companyName}-${idx}`}
          contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY, ACCENT]}
              tintColor={PRIMARY}
            />
          }
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 4, borderRadius: 20 },
  iconBtnFilled: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#FFF' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 10, paddingHorizontal: 14, height: 40,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#FFF', height: 40 },

  // Card
  card: {
    borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
  },
  cardBody: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 14, gap: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 2,
  },
  avatarText: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  clientName: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2, flexShrink: 1 },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  statusText: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },

  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  serviceDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: ACCENT },
  serviceLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  metaBlock: { gap: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  metaText: { fontSize: 11, fontWeight: '500', flexShrink: 1 },
  phoneText: { fontSize: 11, fontWeight: '700' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },

  editBtn: { padding: 4, marginTop: 2 },

  // Footer strip
  strip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 9, borderTopWidth: 1,
  },
  stripLabel: { fontSize: 10, fontWeight: '500' },
});
