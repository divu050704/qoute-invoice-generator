import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, StatusBar, Alert,
  TouchableOpacity, Platform, Image
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../../../utils/customSecureStore';
import {
  ChevronLeft, Check, CheckCircle2, ShoppingCart,
  Plus, Edit2, Trash2, Package
} from 'lucide-react-native';

// -- Shared constants --
import { PRIMARY, HEADER_BG, ACCENT } from '../../../../src/constants/colors';

const BG_COLOR = '#F8FAFC';

export default function SelectProduct({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const onSelect = route?.params?.onSelect;
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const loadProducts = useCallback(async () => {
    try {
      const raw = await getItemAsync('products');
      const data = raw ? JSON.parse(raw) : [];
      setProducts(Array.isArray(data) ? data : []);
    } catch { setProducts([]); }
  }, []);

  useFocusEffect(useCallback(() => { loadProducts(); }, [loadProducts]));

  const toggleSelection = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleEdit = (product) => {
    navigation.navigate('AddProduct', { productData: product, isEditing: true });
  };

  const handleDelete = (item) => {
    Alert.alert('Delete', `Delete "${item.productName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const raw = await getItemAsync('products');
            let list = raw ? JSON.parse(raw) : [];
            list = list.filter(p => p.productName !== item.productName);
            await setItemAsync('products', JSON.stringify(list));
            loadProducts();

            const newSelected = new Set(selectedIds);
            if (newSelected.has(item.productName)) {
              newSelected.delete(item.productName);
              setSelectedIds(newSelected);
            }
          } catch { }
        }
      }
    ]);
  };

  const handleDone = () => {
    if (!onSelect) {
      navigation.goBack();
      return;
    }
    const selectedProducts = products.filter(p => selectedIds.has(p.productName));
    onSelect(selectedProducts);
    navigation.goBack();
  };

  const totals = useMemo(() => {
    const amount = products
      .filter(p => selectedIds.has(p.productName))
      .reduce((sum, p) => sum + Number(p.rate || p.unitPrice || 0), 0);
    return { amount, count: selectedIds.size };
  }, [selectedIds, products]);

  const hasSelection = totals.count > 0;

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
            <Text style={styles.headerTitle}>Select Items</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.addNewBtn}
              onPress={() => navigation.navigate('AddProduct')}
              activeOpacity={0.8}
            >
              <Plus size={18} color="#FFF" strokeWidth={3} />
              <Text style={styles.addNewText}>Add New</Text>
            </TouchableOpacity>

            {hasSelection && (
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={handleDone}
                activeOpacity={0.8}
              >
                <Check size={20} color={PRIMARY} strokeWidth={3} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* PRODUCT LIST */}
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <FlatList
          data={products}
          keyExtractor={(item, idx) => `${item.productName}-${idx}`}
          contentContainerStyle={{ paddingTop: 24, paddingBottom: hasSelection ? insets.bottom + 120 : insets.bottom + 30 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            products.length > 0 ? (
              <View style={{ paddingHorizontal: 4, marginBottom: 12 }}>
                <Text style={styles.listSubText}>TAP TO SELECT ITEMS</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Package size={44} color="#D1D5DB" strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No Products Yet</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddProduct')}>
                <Plus size={16} color="#FFF" strokeWidth={2.5} />
                <Text style={styles.emptyBtnText}>Add Product</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = selectedIds.has(item.productName);

            return (
              <View style={[styles.cardWrapper, isSelected ? styles.cardSelected : styles.cardNormal]}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => toggleSelection(item.productName)}
                  style={styles.cardMain}
                >
                  {/* LEFT ICON */}
                  <View style={[styles.avatar, isSelected ? styles.avatarSelected : styles.avatarNormal]}>
                    {item.productImage ? (
                      <Image source={{ uri: item.productImage }} style={{ width: 48, height: 48, borderRadius: 12 }} />
                    ) : item.icon ? (
                      <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                    ) : (
                      <Package size={20} color={isSelected ? PRIMARY : '#64748B'} strokeWidth={2} />
                    )}
                  </View>

                  {/* CENTER CONTENT */}
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.name, isSelected && { color: PRIMARY }]} numberOfLines={1}>
                      {item.productName}
                    </Text>
                    {item.description ? (
                      <Text style={styles.desc} numberOfLines={1}>
                        {item.description}
                      </Text>
                    ) : null}
                    <Text style={styles.price}>
                      ₹{Number(item.rate || item.unitPrice || 0).toLocaleString()} / {item.unit || 'Nos'}
                    </Text>
                  </View>

                  {/* RIGHT CHECKBOX */}
                  <View style={{ paddingLeft: 8 }}>
                    <View style={[styles.checkbox, isSelected ? styles.checkboxSelected : styles.checkboxNormal]}>
                      {isSelected && <Check size={14} color="#FFF" strokeWidth={4} />}
                    </View>
                  </View>
                </TouchableOpacity>

                {/* BOTTOM ACTIONS (EDIT/DELETE) */}
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                    <Edit2 size={14} color="#475569" strokeWidth={2.5} />
                    <Text style={styles.actionText}>EDIT</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtnDel}>
                    <Trash2 size={14} color="#E11D48" strokeWidth={2.5} />
                    <Text style={styles.actionTextDel}>DELETE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addNewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)', paddingLeft: 8, paddingRight: 12, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  addNewText: { fontSize: 11, fontWeight: '800', color: '#FFF', textTransform: 'uppercase', letterSpacing: -0.3 },
  doneBtn: {
    width: 36, height: 36, backgroundColor: '#FFF', borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4
  },
  listSubText: { fontSize: 12, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 },

  cardWrapper: {
    width: '100%', backgroundColor: '#FFF', borderRadius: 16, marginBottom: 12,
    borderWidth: 1, overflow: 'hidden'
  },
  cardNormal: { borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
  cardSelected: { borderColor: PRIMARY, backgroundColor: '#FFF', shadowColor: PRIMARY, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardMain: { flexDirection: 'row', alignItems: 'center', padding: 16 },

  avatar: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarNormal: { backgroundColor: '#F8FAFC' },
  avatarSelected: { backgroundColor: '#ECFDF5' },
  name: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  desc: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginBottom: 4 },
  price: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  checkbox: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center'
  },
  checkboxNormal: { borderColor: '#E2E8F0', backgroundColor: '#FFF' },
  checkboxSelected: { borderColor: PRIMARY, backgroundColor: PRIMARY, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },

  cardActions: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: 'transparent' },
  actionBtn: { flex: 1, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 11, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 1 },
  actionBtnDel: { flex: 1, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  actionTextDel: { fontSize: 11, fontWeight: '800', color: '#E11D48', textTransform: 'uppercase', letterSpacing: 1 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, marginTop: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#374151', marginTop: 14, marginBottom: 16 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: PRIMARY, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  stickyFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9',
    paddingHorizontal: 20, paddingTop: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 10
  },
  submitBtn: {
    backgroundColor: '#FF8A00', paddingHorizontal: 20, paddingVertical: 14,
    borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  }
});


