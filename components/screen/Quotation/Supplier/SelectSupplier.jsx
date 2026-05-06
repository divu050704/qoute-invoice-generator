import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  StatusBar, Alert, TextInput, TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../../../utils/customSecureStore';
import { ArrowLeft, Plus, Trash2, Search, Building2 } from 'lucide-react-native';

// ── Shared constants ──
import { PRIMARY } from '../../../../src/constants/colors';

export default function SelectSupplier({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const onSelect = route?.params?.onSelect;

  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');

  const loadSuppliers = useCallback(async () => {
    try {
      const raw = await getItemAsync('supplier');
      const data = raw ? JSON.parse(raw) : [];
      setSuppliers(Array.isArray(data) ? data : (data ? [data] : []));
    } catch {
      setSuppliers([]);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadSuppliers(); }, [loadSuppliers]));

  const deleteSupplier = (item) => {
    Alert.alert('Delete Supplier', `Delete "${item.firmName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const raw = await getItemAsync('supplier');
            let list = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(list)) list = list ? [list] : [];
            list = list.filter(s => s.firmName !== item.firmName);
            await setItemAsync('supplier', JSON.stringify(list));
            loadSuppliers();
          } catch { }
        }
      }
    ]);
  };

  const filtered = suppliers.filter(s =>
    (s.firmName || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (item) => {
    if (onSelect) {
      onSelect(item);
      navigation.goBack();
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => handleSelect(item)}>
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Building2 size={20} color={PRIMARY} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{item.firmName}</Text>
          {item.gstin ? <Text style={styles.sub}>GSTIN: {item.gstin}</Text> : null}
          {item.mobile ? <Text style={styles.sub}>{item.mobile}</Text> : null}
        </View>
      </View>
      <Pressable style={styles.deleteBtn} onPress={() => deleteSupplier(item)} hitSlop={8}>
        <Trash2 size={16} color="#EF4444" strokeWidth={2.5} />
      </Pressable>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <SafeAreaView style={{ backgroundColor: PRIMARY, elevation: 4 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color="#FFF" strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select Supplier</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtnFilled} onPress={() => navigation.navigate('AddSupplier')}>
              <Plus size={20} color="#FFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.searchRow}>
        <Search size={16} color="#9CA3AF" strokeWidth={2} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search suppliers..."
          placeholderTextColor="#C4C4C4"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Building2 size={44} color="#D1D5DB" strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>{suppliers.length === 0 ? 'No Suppliers Yet' : 'No Results'}</Text>
          <Text style={styles.emptySub}>{suppliers.length === 0 ? 'Add your first supplier.' : 'Try a different search.'}</Text>
          {suppliers.length === 0 && (
            <Pressable style={styles.emptyBtn} onPress={() => navigation.navigate('AddSupplier')}>
              <Plus size={16} color="#FFF" strokeWidth={2.5} />
              <Text style={styles.emptyBtnText}>Add Supplier</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, idx) => `${item.firmName}-${idx}`}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 30 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 4, borderRadius: 20 },
  iconBtnFilled: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
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
  deleteBtn: { padding: 6 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#374151', marginTop: 14, marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: PRIMARY, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14,
  },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});



