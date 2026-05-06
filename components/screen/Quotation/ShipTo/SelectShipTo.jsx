import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  StatusBar, Alert, TextInput, TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../../../utils/customSecureStore';
import { ArrowLeft, Plus, MapPin, Trash2, Search, Truck } from 'lucide-react-native';

// -- Shared constants --
import { PRIMARY, HEADER_BG, ACCENT } from '../../../../src/constants/colors';


export default function SelectShipTo({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const onSelect = route?.params?.onSelect;

  const [shipTos, setShipTos] = useState([]);
  const [search, setSearch] = useState('');

  const loadShipTos = useCallback(async () => {
    try {
      const raw = await getItemAsync('shipto');
      const data = raw ? JSON.parse(raw) : [];
      setShipTos(Array.isArray(data) ? data : []);
    } catch {
      setShipTos([]);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadShipTos(); }, [loadShipTos]));

  const deleteShipTo = (item) => {
    Alert.alert('Delete Shipping Address', `Delete "${item.companyName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const raw = await getItemAsync('shipto');
            let list = raw ? JSON.parse(raw) : [];
            list = list.filter(b => b.companyName !== item.companyName);
            await setItemAsync('shipto', JSON.stringify(list));
            loadShipTos();
          } catch { }
        }
      }
    ]);
  };

  const filtered = shipTos.filter(b =>
    (b.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.contactName || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (item) => {
    if (onSelect) {
      onSelect(item);
      navigation.goBack();
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => handleSelect(item)}
    >
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Truck size={20} color={PRIMARY} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{item.companyName}</Text>
          {item.contactName ? <Text style={styles.sub}>{item.contactName}</Text> : null}
          <Text style={styles.sub} numberOfLines={1}>{[item.city, item.state].filter(Boolean).join(', ')}</Text>
        </View>
      </View>
      <Pressable
        style={styles.deleteBtn}
        onPress={() => deleteShipTo(item)}
        hitSlop={8}
      >
        <Trash2 size={16} color="#EF4444" strokeWidth={2.5} />
      </Pressable>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <SafeAreaView style={{ backgroundColor: PRIMARY }} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={22} color="#FFF" strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.headerTitle}>Select Ship To</Text>
          <Pressable
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddShipTo', { onSelect })}
          >
            <Plus size={20} color="#FFF" strokeWidth={2.5} />
          </Pressable>
        </View>
      </SafeAreaView>

      <View style={styles.searchRow}>
        <Search size={16} color="#9CA3AF" strokeWidth={2} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search shipping addresses..."
          placeholderTextColor="#C4C4C4"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <MapPin size={44} color="#D1D5DB" strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>{shipTos.length === 0 ? 'No Addresses Yet' : 'No Results'}</Text>
          <Text style={styles.emptySub}>{shipTos.length === 0 ? 'Add your first shipping address.' : 'Try a different search.'}</Text>
          {shipTos.length === 0 && (
            <Pressable
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('AddShipTo')}
            >
              <Plus size={16} color="#FFF" strokeWidth={2.5} />
              <Text style={styles.emptyBtnText}>Add Address</Text>
            </Pressable>
          )}
        </View>
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



