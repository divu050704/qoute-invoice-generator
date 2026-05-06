import React from 'react';
import { deleteItemAsync, clearCachedUserId } from '../../utils/customSecureStore';
import * as SecureStoreNative from 'expo-secure-store';
import { View, Alert, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, Building2, PenTool, FileText, Truck, Package, ShieldCheck, History } from 'lucide-react-native';
import { useTheme } from '../../ThemeContext';
import { useAlert } from '../../ui/CustomAlert';

// ── Shared constants ────────────────────────────────────────────────────────
import { HEADER_BG } from '../../../src/constants/colors';

export default function SettingTab({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const alert = useAlert();

  const bg = isDark ? '#121212' : '#F8FAFC';
  const cardBg = isDark ? '#1E1E1E' : '#FFF';
  const cardBorder = isDark ? '#2C2C2E' : 'rgba(226, 232, 240, 0.6)';
  const textMain = isDark ? '#F5F5F5' : '#0F172A';
  const textSub = isDark ? '#A1A1AA' : '#94A3B8';
  const divider = isDark ? '#2C2C2E' : '#F1F5F9';
  const badgeBg = isDark ? '#2C2C2E' : '#F8FAFC';

  const handleLogout = () => {
    alert.confirm(
      'Log Out',
      'Are you sure you want to log out? You can log back in with your phone number anytime.',
      async () => {
        clearCachedUserId();
        await SecureStoreNative.deleteItemAsync('app_user_id');
        navigation.replace('LoginScreen');
      },
      { type: 'warning', confirmText: 'Log Out', destructive: true }
    );
  };

  const handleResetApp = () => {
    alert.confirm(
      'Reset Application Data',
      'Are you sure you want to clear ALL data? This will delete all your clients, products, quotations, and invoices permanently.',
      async () => {
        try {
          const keys = ['supplier', 'buyer', 'product', 'bankdetails', 'termsandconditions', 'signature', 'quotation', 'invoice'];
          await Promise.all(keys.map(key => deleteItemAsync(key)));
          alert.show('Success', 'All app data has been wiped. Please restart the app.', { type: 'success' });
        } catch (error) {
          alert.show('Error', 'Could not clear some data.', { type: 'error' });
        }
      },
      { type: 'error', confirmText: 'Yes, Reset Everything', destructive: true }
    );
  };

  const settingsData = [
    {
      group: "Product settings",
      items: [
        {
          id: 'inventory',
          title: "Products / Services",
          subtitle: "Add and manage price lists",
          icon: Package,
          status: "48 Items",
          iconBg: isDark ? '#1E2A4A' : "#EEF2FF", iconColor: "#4F46E5",
          onPress: () => navigation.navigate('SelectProduct')
        }
      ]
    },
    {
      group: "Document settings",
      items: [
        {
          id: 'terms',
          title: "Terms & Conditions",
          subtitle: "Edit default invoice footers",
          icon: FileText,
          status: "Active",
          iconBg: isDark ? '#3D2E0A' : "#FFFBEB", iconColor: "#D97706",
          onPress: () => navigation.navigate('SelectTermsAndConditions')
        },
        {
          id: 'shipping',
          title: "Ship To (Delivery)",
          subtitle: "Manage default site addresses",
          icon: Truck,
          status: "2 Saved",
          iconBg: isDark ? '#2A1A3D' : "#FAF5FF", iconColor: "#9333EA",
          onPress: () => navigation.navigate('SelectShipTo')
        }
      ]
    },
    {
      group: "Business settings",
      items: [
        {
          id: 'bank',
          title: "Bank Accounts",
          subtitle: "Manage your payout details",
          icon: Building2,
          status: "3 Added",
          iconBg: isDark ? '#0A2418' : "#ECFDF5", iconColor: "#134E3A",
          onPress: () => navigation.navigate('SelectBankDetail')
        },
        {
          id: 'signature',
          title: "Digital Signature",
          subtitle: "Used for quotes and invoices",
          icon: PenTool,
          status: "Verified",
          iconBg: isDark ? '#1A2A4A' : "#EFF6FF", iconColor: "#2563EB",
          onPress: () => navigation.navigate('SelectSignature')
        }
      ]
    },
    {
      group: "System",
      items: [
        {
          id: 'security',
          title: "Security & Permissions",
          subtitle: "Password and access control",
          icon: ShieldCheck,
          status: "",
          iconBg: isDark ? '#2C2C2E' : "#F8FAFC", iconColor: isDark ? '#A1A1AA' : "#475569",
          onPress: () => {}
        },
        {
          id: 'history',
          title: "Activity Log",
          subtitle: "Recent changes and updates",
          icon: History,
          status: "2h ago",
          iconBg: isDark ? '#2C2C2E' : "#F8FAFC", iconColor: isDark ? '#A1A1AA' : "#475569",
          onPress: () => {}
        }
      ]
    }
  ];

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_BG} />
      <SafeAreaView style={{ backgroundColor: HEADER_BG, zIndex: 20, elevation: 5 }} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color="#FFF" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 48 }]}>
        {settingsData.map((section, idx) => (
          <View key={idx} style={styles.sectionContainer}>
            <Text style={[styles.sectionHeading, { color: textSub }]}>{section.group}</Text>
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {section.items.map((item, i) => (
                <TouchableOpacity 
                  key={item.id}
                  style={[styles.itemRow, i !== section.items.length - 1 && [styles.itemBorder, { borderBottomColor: divider }]]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemLeft}>
                    <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
                      <item.icon size={18} color={item.iconColor} />
                    </View>
                    <View>
                      <Text style={[styles.itemTitle, { color: textMain }]}>{item.title}</Text>
                      <Text style={[styles.itemSubtitle, { color: textSub }]}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <View style={styles.itemRight}>
                    {!!item.status && (
                      <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.statusText, { color: textSub }]}>{item.status}</Text>
                      </View>
                    )}
                    <ChevronRight size={16} color={isDark ? '#6B7280' : '#CBD5E1'} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footerInfo}>
          <Text style={[styles.versionText, { color: isDark ? '#6B7280' : '#CBD5E1' }]}>APP VERSION 2.4.0 (BUILD 88)</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={handleLogout}>
            <Text style={styles.signOutText}>LOG OUT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, gap: 16 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  contentContainer: { paddingHorizontal: 16, paddingTop: 16 },
  sectionContainer: { marginBottom: 24 },
  sectionHeading: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 12, paddingHorizontal: 4 },
  sectionCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  itemBorder: { borderBottomWidth: 1 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconWrap: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  itemTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  itemSubtitle: { fontSize: 11, fontWeight: '500' },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  footerInfo: { paddingTop: 16, alignItems: 'center' },
  versionText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  signOutText: { fontSize: 11, fontWeight: '900', color: '#F87171', letterSpacing: 1, marginTop: 16 },
});
