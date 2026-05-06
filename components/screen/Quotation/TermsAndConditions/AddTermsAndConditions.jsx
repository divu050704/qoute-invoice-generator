import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, StatusBar, Alert, 
  TouchableOpacity, Keyboard 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../../../utils/customSecureStore';
import { 
  ChevronLeft, Save, FileText, Type, 
  List, ListOrdered, Trash2, Info
} from 'lucide-react-native';

// -- Shared constants --
import { PRIMARY, HEADER_BG, ACCENT } from '../../../../src/constants/colors';

const BG_COLOR = '#F8FAFC';

export default function AddTermsAndConditions({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const existingTerm = route?.params?.termData || null;
  const isEditing = route?.params?.isEditing || false;
  const originalTitle = existingTerm?.title || '';

  const [title, setTitle] = useState(existingTerm?.title || '');
  const [content, setContent] = useState(existingTerm?.content || '');
  
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const contentInputRef = useRef(null);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a Category or Title.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Validation Error', 'Please enter the Document Content.');
      return;
    }

    try {
      const raw = await getItemAsync('termsandconditions');
      let list = raw ? JSON.parse(raw) : [];
      
      const newTerm = { title: title.trim(), content: content.trim() };

      if (isEditing) {
        // Find by original title to allow title updates
        const idx = list.findIndex(t => t.title === originalTitle);
        if (idx !== -1) {
          list[idx] = newTerm;
        } else {
          list.push(newTerm);
        }
      } else {
        // Check for duplicate title
        const exists = list.some(t => t.title.toLowerCase() === newTerm.title.toLowerCase());
        if (exists) {
          Alert.alert('Duplicate', 'A term with this title already exists.');
          return;
        }
        list.push(newTerm);
      }

      await setItemAsync('termsandconditions', JSON.stringify(list));
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not save the Terms & Conditions.');
    }
  };

  const insertAtCursor = (textToInsert) => {
    const start = selection.start || content.length;
    const end = selection.end || content.length;
    const newContent = content.substring(0, start) + textToInsert + content.substring(end);
    setContent(newContent);
    // Focus and adjust selection after a small delay
    setTimeout(() => {
      contentInputRef.current?.focus();
    }, 50);
  };

  const addBullet = () => {
    const prefix = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
    insertAtCursor(prefix + '\u2022 ');
  };
  const addNumber = () => {
    const lines = content.split('\n');
    let lastNum = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
      const match = lines[i].match(/^(\d+)\./);
      if (match) { lastNum = parseInt(match[1], 10); break; }
    }
    const prefix = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
    insertAtCursor(prefix + (lastNum + 1) + '. ');
  };
  const clearContent = () => {
    Alert.alert('Clear Content', 'Are you sure you want to clear all text?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setContent('') }
    ]);
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
            <Text style={styles.headerTitle}>{isEditing ? 'Edit Terms & Condition' : 'Add Terms & Condition'}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Save size={14} color="#D1FAE5" strokeWidth={2.5} />
            <Text style={styles.saveBtnText}>SAVE</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <KeyboardAwareScrollView 
        keyboardOpeningTime={0} 
        enableOnAndroid
        extraScrollHeight={80}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
      >
        
        {/* TITLE CARD */}
        <View style={styles.card}>
          <View style={[styles.cardHeader, { backgroundColor: '#F0FDF4' }]}>
            <FileText size={14} color="#10B981" strokeWidth={2.5} />
            <Text style={[styles.cardHeaderText, { color: '#10B981' }]}>CATEGORY / TITLE</Text>
          </View>
          <View style={styles.cardBody}>
            <TextInput
              style={styles.titleInput}
              placeholder="e.g., Payment Schedule, Warranty Terms..."
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
            />
          </View>
        </View>

        {/* CONTENT CARD */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <View style={[styles.cardHeader, { backgroundColor: '#EFF6FF' }]}>
            <Type size={14} color="#3B82F6" strokeWidth={2.5} />
            <Text style={[styles.cardHeaderText, { color: '#3B82F6' }]}>DOCUMENT CONTENT</Text>
          </View>
          <View style={[styles.cardBody, { padding: 0 }]}>
            <TextInput
              ref={contentInputRef}
              style={styles.contentInput}
              placeholder={"Start typing your terms and conditions here...\n\n\u2022 Use the toolbar below to format your text\n\u2022 Add bullet points or numbered lists\n\u2022 Keep it clear and professional"}
              placeholderTextColor="#CBD5E1"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
            />

            {/* FORMATTING TOOLBAR */}
            <View style={styles.toolbarWrapper}>
              <View style={styles.toolbar}>
                <View style={styles.toolbarLeft}>
                  <TouchableOpacity style={styles.toolbarBtn} onPress={addBullet}>
                    <List size={14} color="#475569" strokeWidth={2.5} />
                    <Text style={styles.toolbarBtnText}>Bullet</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolbarBtn} onPress={addNumber}>
                    <ListOrdered size={14} color="#475569" strokeWidth={2.5} />
                    <Text style={styles.toolbarBtnText}>Number</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.toolbarIconBtn} onPress={clearContent}>
                  <Trash2 size={16} color="#EF4444" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
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
  saveBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  saveBtnText: { fontSize: 11, fontWeight: '800', color: '#D1FAE5', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  card: {
    backgroundColor: '#FFF', borderRadius: 16, 
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1,
    overflow: 'hidden'
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC'
  },
  cardHeaderText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardBody: { padding: 16 },
  titleInput: {
    fontSize: 15, fontWeight: '600', color: '#1E293B', padding: 0
  },
  contentInput: {
    fontSize: 14, color: '#334155', lineHeight: 24,
    minHeight: 280, padding: 16, paddingTop: 16, paddingBottom: 80
  },
  
  toolbarWrapper: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
  },
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4
  },
  toolbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  toolbarBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  toolbarBtnText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  toolbarIconBtn: { padding: 4 },

  proTipCard: {
    marginTop: 24, flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#FFFBEB', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#FDE68A',
    shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2
  },
  proTipIconWrap: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#F59E0B',
    justifyContent: 'center', alignItems: 'center'
  },
  proTipTitle: { fontSize: 13, fontWeight: '800', color: '#B45309', marginBottom: 2 },
  proTipDesc: { fontSize: 12, fontWeight: '500', color: '#B45309', lineHeight: 18 }
});


