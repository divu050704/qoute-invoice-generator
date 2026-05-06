import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  StatusBar, Alert, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../utils/customSecureStore';
import { FileCheck, Plus, ArrowLeft, Trash2, Eye, Calendar, ChevronRight, Clock } from 'lucide-react-native';

// -- Shared constants --
import { PRIMARY, HEADER_BG, ACCENT } from '../../src/constants/colors';


export default function InvoiceScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [invoices, setInvoices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadInvoices = useCallback(async () => {
    try {
      const raw = await getItemAsync('invoice');
      const data = raw ? JSON.parse(raw) : [];
      setInvoices(Array.isArray(data) ? [...data].reverse() : []);
    } catch {
      setInvoices([]);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadInvoices(); }, [loadInvoices]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInvoices();
    setRefreshing(false);
  }, [loadInvoices]);

  const deleteInvoice = (item) => {
    Alert.alert('Delete Invoice', 'Are you sure you want to delete this invoice?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const raw = await getItemAsync('invoice');
            let list = raw ? JSON.parse(raw) : [];
            list = list.filter(i =>
              !(i.invoiceDate === item.invoiceDate &&
                i.invoicePrefix === item.invoicePrefix &&
                i.invoiceNumber === item.invoiceNumber)
            );
            await setItemAsync('invoice', JSON.stringify(list));
            loadInvoices();
          } catch { }
        }
      }
    ]);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getTotal = (item) => {
    if (item.productDetails && Array.isArray(item.productDetails)) {
      return item.productDetails.reduce((sum, p) => sum + (parseFloat(p.totalAmount) || 0), 0);
    }
    return parseFloat(item.totalAmount || 0);
  };

  const getStatusColor = (status) => {
    switch ((status || 'Pending').toLowerCase()) {
      case 'paid': return { bg: '#EFFAF2', text: '#059669' };
      case 'partially paid': return { bg: '#FFFCEA', text: '#D97706' };
      default: return { bg: '#FEF2F2', text: '#EF4444' };
    }
  };

  const renderItem = ({ item }) => {
    const ref = `${item.invoicePrefix || 'INV'}-${item.invoiceNumber || ''}`;
    const buyer = item.buyerDetails?.companyName || 'Unknown Client';
    const total = getTotal(item);
    const received = parseFloat(item.receivedAmount || 0);
    const balance = Math.max(0, total - received);
    const status = balance === 0 ? 'Paid' : received > 0 ? 'Partially Paid' : 'Pending';
    const statusColors = getStatusColor(status);

    return (
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.cardBody}
          onPress={() => navigation.navigate('ViewInvoice', { data: item })}
        >
          <View style={styles.cardLeft}>
            <View style={styles.iconCircle}>
              <FileCheck size={18} color="#059669" strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.buyerName} numberOfLines={1}>{buyer}</Text>
              <Text style={styles.refText}>{ref}</Text>
              <View style={styles.dateRow}>
                <Calendar size={11} color="#9CA3AF" strokeWidth={2} />
                <Text style={styles.dateText}>{formatDate(item.invoiceDate)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.amountText}>₹{total.toFixed(2)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <Clock size={10} color={statusColors.text} strokeWidth={2.5} />
              <Text style={[styles.statusText, { color: statusColors.text }]}>{status}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.cardFooter}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => navigation.navigate('ViewInvoice', { data: item })}
          >
            <Eye size={14} color={PRIMARY} strokeWidth={2.5} />
            <Text style={[styles.actionBtnText, { color: PRIMARY }]}>View</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: '#FEF2F2' }]}
            onPress={() => deleteInvoice(item)}
          >
            <Trash2 size={14} color="#EF4444" strokeWidth={2.5} />
            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <SafeAreaView style={{ backgroundColor: PRIMARY, elevation: 4 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color="#FFF" strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>All Invoices</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtnFilled} onPress={() => navigation.navigate('CreateInvoice')}>
              <Plus size={20} color="#FFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {invoices.length === 0 ? (
        <View style={styles.empty}>
          <FileCheck size={48} color="#D1D5DB" strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No Invoices Yet</Text>
          <Text style={styles.emptySubtitle}>Create your first invoice to get started.</Text>
          <Pressable style={styles.emptyBtn} onPress={() => navigation.navigate('CreateInvoice')}>
            <Plus size={16} color="#FFF" strokeWidth={2.5} />
            <Text style={styles.emptyBtnText}>New Invoice</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item, idx) => `${item.invoiceDate}-${item.invoiceNumber}-${idx}`}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#059669', '#FDAF05']}
              tintColor="#059669"
            />
          }
        />
      )}

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => navigation.navigate('CreateInvoice')}
      >
        <Plus size={22} color="#FFF" strokeWidth={2.5} />
        <Text style={styles.fabText}>New Invoice</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 4, borderRadius: 20 },
  iconBtnFilled: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#FFF' },
  card: {
    backgroundColor: '#FFF', borderRadius: 16, marginBottom: 14,
    borderWidth: 1, borderColor: '#E5E7EB',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  cardBody: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingBottom: 10 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFFAF2', justifyContent: 'center', alignItems: 'center' },
  buyerName: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  refText: { fontSize: 12, fontWeight: '600', color: '#059669', marginBottom: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  amountText: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '700' },
  cardFooter: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6',
    paddingHorizontal: 14, paddingVertical: 10, gap: 10,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EFFAF2', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#374151', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 24 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#059669', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14,
  },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  fab: {
    position: 'absolute', right: 20, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#059669', paddingHorizontal: 20, paddingVertical: 14,
    borderRadius: 50, elevation: 8, shadowColor: '#059669', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
  },
  fabText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});


