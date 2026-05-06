import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, StatusBar, Alert, 
  TouchableOpacity, Modal, TouchableWithoutFeedback 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../../../utils/customSecureStore';
import { 
  ChevronLeft, Plus, Landmark, MoreVertical, Pencil, Trash2 
} from 'lucide-react-native';

// -- Shared constants --
import { PRIMARY, HEADER_BG, ACCENT } from '../../../../src/constants/colors';

const BG_COLOR = '#F8FAFC';

export default function SelectBankDetails({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const onSelect = route?.params?.onSelect;
  const [banks, setBanks] = useState([]);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const loadBanks = useCallback(async () => {
    try {
      const raw = await getItemAsync('bankdetails');
      const data = raw ? JSON.parse(raw) : [];
      setBanks(Array.isArray(data) ? data : []);
    } catch { setBanks([]); }
  }, []);

  useFocusEffect(useCallback(() => { loadBanks(); }, [loadBanks]));

  const deleteBank = (item) => {
    Alert.alert('Delete Account', `Remove "${item.bankName}" ending in ${String(item.accountNumber).slice(-4)}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const raw = await getItemAsync('bankdetails');
          let list = raw ? JSON.parse(raw) : [];
          // Filter by account number to uniquely identify the bank to delete
          list = list.filter(b => b.accountNumber !== item.accountNumber);
          await setItemAsync('bankdetails', JSON.stringify(list));
          loadBanks();
          setMenuOpenId(null);
        } catch {}
      }}
    ]);
  };

  const handleEdit = (item) => {
    setMenuOpenId(null);
    navigation.navigate('AddBankDetails', { bank: item });
  };

  const renderItem = ({ item }) => {
    const isMenuOpen = menuOpenId === item.accountNumber;
    const maskedAccount = item.accountNumber?.length >= 4 
      ? `•••• •••• ${String(item.accountNumber).slice(-4)}`
      : '•••• ----';

    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => { if (onSelect) { onSelect(item); navigation.goBack(); } }}
          style={styles.cardMain}
        >
          {/* TOP HEADER */}
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.iconCircle}>
                <Landmark size={18} color={PRIMARY} strokeWidth={2.5} />
              </View>
              <View style={styles.badgeWrap}>
                <Text style={styles.badgeText}>Settlement Account</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              hitSlop={10} 
              onPress={(e) => setMenuOpenId(isMenuOpen ? null : item.accountNumber)}
              style={{ padding: 4 }}
            >
              <MoreVertical size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* MAIN BANK INFO */}
          <View style={styles.cardContent}>
            <Text style={styles.bankName}>{item.bankName || 'Unknown Bank'}</Text>
            <Text style={styles.accountNumber}>{maskedAccount}</Text>
          </View>

          {/* BOTTOM GRID */}
          <View style={styles.cardGrid}>
            <View style={{ flex: 1 }}>
              <Text style={styles.gridLabel}>IFSC CODE</Text>
              <Text style={styles.gridValue}>{item.ifsc || 'N/A'}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.gridLabel}>ACCOUNT HOLDER</Text>
              <Text style={styles.gridValue} numberOfLines={1}>{item.accountName || 'N/A'}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* CONTEXT MENU */}
        {isMenuOpen && (
          <View style={styles.contextMenu}>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.menuItem}>
              <Pencil size={12} color="#475569" strokeWidth={2.5} />
              <Text style={styles.menuText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => deleteBank(item)} 
              style={[styles.menuItem, { backgroundColor: '#FFF1F2', marginTop: 4 }]}
            >
              <Trash2 size={12} color="#E11D48" strokeWidth={2.5} />
              <Text style={[styles.menuText, { color: '#E11D48' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      
      {/* HEADER */}
      <SafeAreaView style={{ backgroundColor: PRIMARY, zIndex: 10, elevation: 10 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7} hitSlop={8}>
              <ChevronLeft size={24} color="#FFF" strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select Bank</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.addNewBtn}
            onPress={() => navigation.navigate('AddBankDetails')}
            activeOpacity={0.8}
          >
            <Plus size={18} color="#FFF" strokeWidth={3} />
            <Text style={styles.addNewText}>Add New</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <FlatList
          data={banks}
          keyExtractor={(item, idx) => `${item.accountNumber}-${idx}`}
          contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 30 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Landmark size={40} color="#E2E8F0" strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>No bank accounts added</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddBankDetails')}>
                <Plus size={18} color="#FFF" strokeWidth={3} />
                <Text style={styles.emptyBtnText}>Add Bank Account</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={renderItem}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG_COLOR },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', letterSpacing: -0.5 },
  addNewBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  addNewText: { fontSize: 11, fontWeight: '800', color: '#FFF', textTransform: 'uppercase', letterSpacing: -0.3 },

  cardWrapper: {
    marginBottom: 16,
    zIndex: 1 // Necessary for absolute menu placement
  },
  cardMain: {
    backgroundColor: '#FFF', borderRadius: 16, 
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
    overflow: 'hidden'
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12
  },
  iconCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#ECFDF5',
    justifyContent: 'center', alignItems: 'center'
  },
  badgeWrap: {
    backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6
  },
  badgeText: {
    fontSize: 9, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5
  },
  cardContent: {
    paddingHorizontal: 16, paddingBottom: 16
  },
  bankName: {
    fontSize: 18, fontWeight: '900', color: '#1E293B', letterSpacing: -0.3, marginBottom: 4
  },
  accountNumber: {
    fontSize: 14, fontWeight: '800', color: '#059669', letterSpacing: 2
  },
  cardGrid: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: '#F1F5F9'
  },
  gridLabel: {
    fontSize: 9, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2
  },
  gridValue: {
    fontSize: 12, fontWeight: '700', color: '#334155'
  },

  contextMenu: {
    position: 'absolute', top: 50, right: 16, backgroundColor: '#FFF', 
    borderRadius: 12, padding: 6, borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 10,
    zIndex: 50, minWidth: 110
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F8FAFC' },
  menuText: { fontSize: 11, fontWeight: '800', color: '#475569' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, marginTop: 60 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#F1F5F9', borderStyle: 'dashed' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 24 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: PRIMARY, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  emptyBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
});


