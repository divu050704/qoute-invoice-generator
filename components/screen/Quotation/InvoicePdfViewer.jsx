import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../ThemeContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Download, Send, Edit3, CreditCard } from 'lucide-react-native';
import { generateDocumentPDF, generateHTML } from '../../../src/utils/generatePDF';
import { PRIMARY } from '../../../src/constants/colors';
import * as Sharing from 'expo-sharing';

// ── Native module availability (module-level, determined once at load time) ──
let NativePdf = null;
let NativeHtmlToPdf = null;
let NativeWebView = null;
try { NativePdf = require('react-native-pdf').default; } catch (_) {}
try { NativeHtmlToPdf = require('react-native-html-to-pdf').generatePDF || require('react-native-html-to-pdf').default?.generatePDF; } catch (_) {}
try { NativeWebView = require('react-native-webview').WebView; } catch (_) {}

export default function InvoicePdfViewer({ navigation, route }) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const data = route?.params?.data || {};

  const [generating, setGenerating]   = useState(true);
  const [pdfPath, setPdfPath]         = useState(null);
  const [htmlContent, setHtmlContent] = useState(null);

  const { invoicePrefix = 'INV', invoiceNumber = '' } = data;

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        if (NativeHtmlToPdf) {
          // Full native build — generate actual PDF file
          const file = await generateDocumentPDF(data, 'INVOICE');
          if (!cancelled) {
            if (file?.filePath) {
              setPdfPath(`file://${file.filePath}`);
            } else {
              const html = await generateHTML(data, 'INVOICE');
              if (!cancelled) setHtmlContent(html);
            }
          }
        } else {
          // No native PDF module — HTML preview
          const html = await generateHTML(data, 'INVOICE');
          if (!cancelled) setHtmlContent(html);
        }
      } catch (e) {
        console.error('InvoicePdfViewer PDF error:', e);
        try {
          const html = await generateHTML(data, 'INVOICE');
          if (!cancelled) setHtmlContent(html);
        } catch (e2) {
          if (!cancelled) Alert.alert('Error', 'Could not generate invoice preview.');
        }
      } finally {
        if (!cancelled) setGenerating(false);
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  const handleDownload = () => {
    if (pdfPath) {
      Alert.alert('PDF Ready', `Saved to:\n${pdfPath.replace('file://', '')}`);
    } else {
      Alert.alert('Info', 'PDF download available in native build only.');
    }
  };

  const handleShare = async () => {
    if (pdfPath) {
      try {
        const available = await Sharing.isAvailableAsync();
        if (available) {
          await Sharing.shareAsync(pdfPath, {
            mimeType: 'application/pdf',
            dialogTitle: `Share Invoice ${invoicePrefix}-${invoiceNumber}`,
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Error', 'Sharing not available on this device.');
        }
      } catch (e) {
        Alert.alert('Error', 'Could not share PDF.');
      }
    } else {
      Alert.alert('Info', 'PDF sharing requires native build.');
    }
  };

  const renderPreview = () => {
    if (generating) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Generating Preview…</Text>
        </View>
      );
    }
    if (pdfPath && NativePdf) {
      return (
        <NativePdf
          source={{ uri: pdfPath, cache: true }}
          style={styles.fill}
          onError={err => console.log('PDF render error:', err)}
          spacing={10}
          trustAllCerts={false}
        />
      );
    }
    if (htmlContent && NativeWebView) {
      return (
        <NativeWebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={styles.fill}
          scrollEnabled={true}
          scalesPageToFit={true}
        />
      );
    }
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Preview not available</Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      <SafeAreaView style={{ backgroundColor: PRIMARY, elevation: 4 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.row}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color="#FFF" strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{invoicePrefix}-{invoiceNumber}</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={handleDownload} disabled={generating}>
            <Download size={20} color="#FFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={[styles.fill, { backgroundColor: '#F1F5F9' }]}>
        {renderPreview()}
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16 }]}>
        <TouchableOpacity style={styles.action}
          onPress={() => navigation.navigate('ViewInvoice', { data })}>
          <View style={[styles.circle, { backgroundColor: '#EFFAF2' }]}>
            <CreditCard size={20} color={PRIMARY} />
          </View>
          <Text style={styles.actionLabel}>Manage</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action}
          onPress={() => navigation.navigate('CreateInvoice', { inputData: data })}>
          <View style={[styles.circle, { backgroundColor: '#F1F5F9' }]}>
            <Edit3 size={20} color="#475569" />
          </View>
          <Text style={styles.actionLabel}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={handleShare}>
          <View style={[styles.circle, { backgroundColor: '#F1F5F9' }]}>
            <Send size={20} color="#475569" />
          </View>
          <Text style={styles.actionLabel}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#FFF' },
  fill:        { flex: 1, width: '100%', height: '100%' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn:     { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B', fontWeight: '500' },
  bottomBar:   { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start', backgroundColor: '#FFF', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  action:      { alignItems: 'center', flex: 1 },
  circle:      { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: '#475569' },
});
