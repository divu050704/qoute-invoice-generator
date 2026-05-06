import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, StatusBar, Alert, 
  TouchableOpacity, Modal, TouchableWithoutFeedback 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../../../utils/customSecureStore';
import { 
  ChevronLeft, Plus, Check, CheckCircle2, 
  FileText, MoreVertical, Trash2, Pencil, FileSearch
} from 'lucide-react-native';

// -- Shared constants --
import { PRIMARY, HEADER_BG, ACCENT } from '../../../../src/constants/colors';

const BG_COLOR = '#F8FAFC';

export default function SelectTermsAndConditions({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const onSelect = route?.params?.onSelect;
  const [terms, setTerms] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [menuOpenId, setMenuOpenId] = useState(null);

  const loadTerms = useCallback(async () => {
    try {
      const raw = await getItemAsync('termsandconditions');
      const data = raw ? JSON.parse(raw) : [];
      setTerms(Array.isArray(data) ? data : []);
    } catch { setTerms([]); }
  }, []);

  useFocusEffect(useCallback(() => { loadTerms(); }, [loadTerms]));

  const toggleTerm = (title) => {
    if (selectedIds.has(title)) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set([title]));
    }
  };

  const deleteTerm = (item) => {
    Alert.alert('Delete', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const raw = await getItemAsync('termsandconditions');
          let list = raw ? JSON.parse(raw) : [];
          list = list.filter(t => t.title !== item.title);
          await setItemAsync('termsandconditions', JSON.stringify(list));
          loadTerms();
          
          const newSelected = new Set(selectedIds);
          if (newSelected.has(item.title)) {
            newSelected.delete(item.title);
            setSelectedIds(newSelected);
          }
        } catch {}
      }}
    ]);
  };

  const handleEdit = (item) => {
    setMenuOpenId(null);
    navigation.navigate('AddTermsAndConditions', { termData: item, isEditing: true });
  };

  const handleApply = () => {
    if (onSelect) {
      const chosen = terms.filter(t => selectedIds.has(t.title));
      onSelect(chosen);
      navigation.goBack();
    }
  };

  const hasSelection = selectedIds.size > 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      
      {/* HEADER */}
      <SafeAreaView style={{ backgroundColor: PRIMARY, zIndex: 20, elevation: 20 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7} hitSlop={8}>
              <ChevronLeft size={24} color="#FFF" strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Terms & Conditions</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.addNewBtn}
            onPress={() => navigation.navigate('AddTermsAndConditions')}
            activeOpacity={0.8}
          >
            <Plus size={18} color="#FFF" strokeWidth={3} />
            <Text style={styles.addNewText}>Add New</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* MAIN LIST AREA */}
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <FlatList
          data={terms}
          keyExtractor={(item, idx) => `${item.title}-${idx}`}
          contentContainerStyle={{ paddingTop: 24, paddingBottom: hasSelection ? insets.bottom + 120 : insets.bottom + 30 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            terms.length > 0 ? (
              <View style={styles.listHeaderRow}>
                <Text style={styles.listSubText}>Select items to include</Text>
                {hasSelection && (
                  <TouchableOpacity onPress={() => setSelectedIds(new Set())}>
                    <Text style={styles.clearAllText}>CLEAR ALL</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <FileSearch size={40} color="#E2E8F0" />
              </View>
              <Text style={styles.emptyTitle}>No terms added yet</Text>
              <Text style={styles.emptyDesc}>Save your standard business clauses to add them quickly to quotations.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddTermsAndConditions')}>
                <Plus size={18} color="#FFF" strokeWidth={3} />
                <Text style={styles.emptyBtnText}>Add Terms</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = selectedIds.has(item.title);
            const isMenuOpen = menuOpenId === item.title;

            return (
              <View style={[styles.card, isSelected ? styles.cardSelected : styles.cardNormal]}>
                <TouchableOpacity 
                  activeOpacity={0.9}
                  onPress={() => toggleTerm(item.title)}
                  style={styles.cardMain}
                >
                  {/* LEFT ICON */}
                  <View style={[styles.avatar, isSelected ? styles.avatarSelected : styles.avatarNormal]}>
                    <FileText size={20} color={isSelected ? PRIMARY : '#94A3B8'} strokeWidth={2} />
                  </View>

                  {/* CENTER CONTENT */}
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={[styles.name, isSelected && { color: PRIMARY }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <TouchableOpacity 
                        hitSlop={10} 
                        style={{ padding: 4 }}
                        onPress={(e) => {
                          setMenuOpenId(isMenuOpen ? null : item.title);
                        }}
                      >
                        <MoreVertical size={16} color="#CBD5E1" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.desc} numberOfLines={2}>
                      {item.content}
                    </Text>
                  </View>

                  {/* RIGHT CHECKBOX */}
                  <View style={{ paddingLeft: 4, paddingTop: 4, alignSelf: 'flex-start' }}>
                    <View style={[styles.checkbox, isSelected ? styles.checkboxSelected : styles.checkboxNormal]}>
                      {isSelected && <Check size={14} color="#FFF" strokeWidth={4} />}
                    </View>
                  </View>
                </TouchableOpacity>

                {/* CONTEXT MENU (Rendered conditionally within the card) */}
                {isMenuOpen && (
                  <View style={styles.contextMenu}>
                    <TouchableOpacity onPress={() => handleEdit(item)} style={styles.menuItem}>
                      <Pencil size={12} color="#475569" strokeWidth={2.5} />
                      <Text style={styles.menuText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => {
                        setMenuOpenId(null);
                        deleteTerm(item);
                      }} 
                      style={[styles.menuItem, { backgroundColor: '#FFF1F2', marginTop: 4 }]}
                    >
                      <Trash2 size={12} color="#E11D48" strokeWidth={2.5} />
                      <Text style={[styles.menuText, { color: '#E11D48' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />
      </View>

      {/* STICKY FOOTER */}
      {hasSelection && (
        <View style={[styles.stickyFooter, { paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 24 }]}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY }} />
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Single Selection
              </Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '900', color: PRIMARY }}>
              1 Term Selected
            </Text>
          </View>
          
          <TouchableOpacity onPress={handleApply} style={styles.submitBtn} activeOpacity={0.8}>
            <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '900' }}>Apply to Doc</Text>
            <CheckCircle2 size={18} color="#FFF" strokeWidth={3} />
          </TouchableOpacity>
        </View>
      )}
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
    backgroundColor: 'rgba(255,255,255,0.1)', paddingLeft: 8, paddingRight: 12, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  addNewText: { fontSize: 11, fontWeight: '800', color: '#FFF', textTransform: 'uppercase', letterSpacing: -0.3 },
  
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, marginBottom: 12 },
  listSubText: { fontSize: 11, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.5 },
  clearAllText: { fontSize: 10, fontWeight: '800', color: '#F43F5E', textTransform: 'uppercase', letterSpacing: -0.2 },
  
  card: { 
    width: '100%', backgroundColor: '#FFF', borderRadius: 16, marginBottom: 12,
    borderWidth: 1, overflow: 'visible' 
  },
  cardNormal: { borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
  cardSelected: { borderColor: PRIMARY, backgroundColor: '#F4FBF7', shadowColor: PRIMARY, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardMain: { flexDirection: 'row', alignItems: 'flex-start', padding: 16 },
  
  avatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarNormal: { backgroundColor: '#F8FAFC' },
  avatarSelected: { backgroundColor: '#E2EAE5' },
  
  name: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  desc: { fontSize: 12, color: '#64748B', lineHeight: 18 },
  
  checkbox: { 
    width: 28, height: 28, borderRadius: 6, borderWidth: 1.5, 
    justifyContent: 'center', alignItems: 'center'
  },
  checkboxNormal: { borderColor: '#E2E8F0', backgroundColor: '#FFF' },
  checkboxSelected: { borderColor: '#064E3B', backgroundColor: '#064E3B', shadowColor: '#064E3B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },

  contextMenu: {
    position: 'absolute', top: 40, right: 40, backgroundColor: '#FFF', 
    borderRadius: 12, padding: 6, borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10,
    zIndex: 50, minWidth: 100
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F8FAFC' },
  menuText: { fontSize: 11, fontWeight: '800', color: '#475569' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, marginTop: 40 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#F1F5F9', borderStyle: 'dashed' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#94A3B8', textAlign: 'center', paddingHorizontal: 20, marginBottom: 32, lineHeight: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: PRIMARY, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  emptyBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

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


