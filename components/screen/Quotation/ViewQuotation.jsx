import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Alert, Share, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../ThemeContext';
import { useAlert } from '../../ui/CustomAlert';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Download, Send, Edit3, FileText } from 'lucide-react-native';
import { generateDocumentPDF, generateQuotationHTML } from '../../../src/utils/generatePDF';
import { PRIMARY } from '../../../src/constants/colors';
import * as Sharing from 'expo-sharing';
import { getItemAsync, setItemAsync, deleteItemAsync } from "../../utils/customSecureStore"

// Native module availability (module-level, determined once at load time)
let NativePdf = null;
let NativeHtmlToPdf = null;
let NativeWebView = null;
try { NativePdf = require('react-native-pdf').default; } catch (_) { }
try { NativeHtmlToPdf = require('react-native-html-to-pdf').generatePDF || require('react-native-html-to-pdf').default?.generatePDF; } catch (_) { }
try { NativeWebView = require('react-native-webview').WebView; } catch (_) { }

export default function ViewQuotation({ navigation, route }) {
  const { isDark } = useTheme();
  const alert = useAlert();
  const insets = useSafeAreaInsets();
  const data = route?.params?.data || {};

  const bg = isDark ? '#121212' : '#FFF';
  const pdfBg = isDark ? '#1E1E1E' : '#F1F5F9';
  const barBg = isDark ? '#1E1E1E' : '#FFF';
  const barBorder = isDark ? '#2C2C2E' : '#E2E8F0';
  const actionBg = isDark ? '#2C2C2E' : '#F8FAFC';
  const actionText = isDark ? '#E5E5EA' : '#475569';
  const loadingTextColor = isDark ? '#A1A1AA' : '#64748B';

  const [generating, setGenerating] = useState(true);
  const [pdfPath, setPdfPath] = useState(null);
  const [htmlContent, setHtmlContent] = useState(null);

  const [displayData, setDisplayData] = useState(data);
  const { quotationPrefix = 'QUO', quotationNumber = '' } = displayData;

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        let updatedData = { ...data };
        const companyDetailsRaw = await getItemAsync("supplier");
        if (companyDetailsRaw) {
          const parsed = JSON.parse(companyDetailsRaw);
          const supplierDetails = Array.isArray(parsed) ? parsed[0] : parsed;
          if (supplierDetails) {
            updatedData.supplierDetails = { ...updatedData.supplierDetails, ...supplierDetails };
          }
        }
        if (!cancelled) setDisplayData(updatedData);

        if (NativeHtmlToPdf) {
          // Full native build - generate real PDF
          const file = await generateDocumentPDF(updatedData, 'QUOTATION');
          if (!cancelled) {
            if (file?.filePath) {
              setPdfPath(`file://${file.filePath}`);
            } else {
              // PDF module available but generation failed - HTML fallback
              const html = await generateQuotationHTML(updatedData);
              if (!cancelled) setHtmlContent(html);
            }
          }
        } else {
          // Expo Go / HTML-only mode - use quotation-specific template
          const html = await generateQuotationHTML(updatedData);
          if (!cancelled) setHtmlContent(html);
        }
      } catch (e) {
        console.error('ViewQuotation PDF error:', e);
        try {
          const html = await generateQuotationHTML(displayData);
          if (!cancelled) setHtmlContent(html);
        } catch (e2) {
          if (!cancelled) alert.show('Error', 'Could not generate document preview.', { type: 'error' });
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
      alert.show('PDF Ready', `Saved to: ${pdfPath.replace('file://', '')}`, { type: 'success' });
    } else {
      alert.show('Info', 'PDF file requires native build.', { type: 'info' });
    }
  };

  const handleShare = async () => {
    if (pdfPath) {
      try {
        const available = await Sharing.isAvailableAsync();
        if (available) {
          await Sharing.shareAsync(pdfPath, {
            mimeType: 'application/pdf',
            dialogTitle: `Share ${quotationPrefix}${quotationNumber}`,
          });
        } else {
          Alert.alert('Error', 'Sharing not available on this device.');
        }
      } catch (e) {
        alert.show('Error', 'Could not share PDF.', { type: 'error' });
      }
    } else {
      alert.show('Info', 'PDF sharing requires native build.', { type: 'info' });
    }
  };

  const handleConvertToInvoice = () => {
    const mappedData = { ...displayData };
    mappedData.invoiceDate = mappedData.quotationDate || '';
    mappedData.invoicePrefix = 'INV';
    mappedData.invoiceNumber = mappedData.quotationNumber || '1';
    mappedData.dueDate = mappedData.quotationValidity || '';
    delete mappedData.quotationDate;
    delete mappedData.quotationValidity;
    navigation.navigate('CreateInvoice', { inputData: mappedData });
  };

  const handleEdit = () => navigation.navigate('CreateQuotation', { inputData: displayData });

  const renderPreview = () => {
    if (generating) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#F4B41A" />
          <Text style={[styles.loadingText, { color: loadingTextColor }]}>Generating Preview...</Text>
        </View>
      );
    }
    if (pdfPath && NativePdf) {
      return (
        <NativePdf
          source={{ uri: pdfPath, cache: true }}
          style={[styles.fill, { backgroundColor: pdfBg }]}
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
        <Text style={[styles.loadingText, { color: loadingTextColor }]}>Preview not available</Text>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      <SafeAreaView style={{ backgroundColor: PRIMARY, elevation: 4 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.row}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('CreateQuotation', { inputData: displayData })}>
              <ArrowLeft size={24} color="#FFF" strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{quotationPrefix}{quotationNumber}</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={handleDownload} disabled={generating}>
            <Download size={20} color="#FFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={[styles.fill, { backgroundColor: pdfBg }]}>
        {renderPreview()}
      </View>

      <View style={[styles.bottomBar, {
        backgroundColor: barBg,
        borderTopColor: barBorder,
        paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16,
      }]}>
        <TouchableOpacity style={styles.action} onPress={handleConvertToInvoice}>
          <View style={[styles.circle, { backgroundColor: isDark ? '#0A2418' : '#EFFAF2' }]}>
            <FileText size={20} color={isDark ? '#10B981' : PRIMARY} />
          </View>
          <Text style={[styles.actionLabel, { color: actionText }]}>Convert</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={handleEdit}>
          <View style={[styles.circle, { backgroundColor: actionBg }]}>
            <Edit3 size={20} color={actionText} />
          </View>
          <Text style={[styles.actionLabel, { color: actionText }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={handleShare}>
          <View style={[styles.circle, { backgroundColor: actionBg }]}>
            <Send size={20} color={actionText} />
          </View>
          <Text style={[styles.actionLabel, { color: actionText }]}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1, width: '100%', height: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '500' },
  bottomBar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: 16, borderTopWidth: 1 },
  action: { alignItems: 'center', flex: 1 },
  circle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: '600' },
});
