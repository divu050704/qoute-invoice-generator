import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Platform, Alert, Text } from "react-native";
import Pdf from "react-native-pdf";
import { Edit3, Download, Share2, ArrowLeft, FileText } from "lucide-react-native";
import RNFS from "react-native-fs";
import { SafeAreaView } from "react-native-safe-area-context";
import { generateQuotationPDF } from "../../utils/generateQuotationPDF";
import Colors from "../../colors";
import { StatusBar } from "expo-status-bar";
import * as Sharing from "expo-sharing";

export default function ViewQuotation({ navigation, route }) {
  const data = route.params.data;
  const [filePath, setFilePath] = useState("");

  useEffect(() => {
    async function generate() {
      const result = await generateQuotationPDF(data);
      setFilePath(result.filePath);
    }
    generate();
  }, []);

  const handleEdit = () => {
    navigation.navigate("CreateQuotation", { inputData: data });
  };

  const handleDownload = async () => {
    try {
      if (!filePath) {
        Alert.alert("Error", "No file to download");
        return;
      }

      const fileName = `quotation_${Date.now()}.pdf`;
      const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

      // Copy file to downloads directory
      await RNFS.copyFile(filePath, downloadPath);

      Alert.alert("Success", "File downloaded to Downloads folder");
    } catch (error) {
      Alert.alert("Error", "Failed to download file");
      console.error(error);
    }
  };

  const handleShare = async () => {
    try {
      if (!filePath) {
        Alert.alert("Error", "No file to share");
        return;
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Error", "Sharing is not available on this device");
        return;
      }

      // Ensure the file path has the file:// protocol
      const fileUri = filePath.startsWith('file://') ? filePath : `file://${filePath}`;

      // Use expo-sharing for better compatibility with WhatsApp and other apps
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Quotation',
        UTI: 'com.adobe.pdf'
      });
    } catch (error) {
      console.error("Share error:", error);
      Alert.alert("Error", "Failed to share file: " + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container} >
      <StatusBar style="light" backgroundColor={Colors.accentGreen} />
      
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <FileText size={22} color={Colors.white} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Quotation</Text>
            <Text style={styles.headerSubtitle}>
              {data?.quotationNumber || "Preview"}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* PDF Viewer */}
      <View style={styles.pdfContainer}>
        {filePath ? (
          <Pdf
            source={{ uri: `file://${filePath}` }}
            style={styles.pdf}
            trustAllCerts={false}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading PDF...</Text>
          </View>
        )}
      </View>

      {/* Modern Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]} 
          onPress={handleEdit}
        >
          <Edit3 size={20} color={Colors.white} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.downloadButton]} 
          onPress={handleDownload}
        >
          <Download size={20} color={Colors.white} />
          <Text style={styles.actionButtonText}>Download</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.shareButton]} 
          onPress={handleShare}
        >
          <Share2 size={20} color={Colors.white} />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.accentGreen,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.accentGreen,
    paddingBottom: 16,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    // margin: 12,
    // borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pdf: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  editButton: {
    backgroundColor: "#6366f1",
  },
  downloadButton: {
    backgroundColor: "#8b5cf6",
  },
  shareButton: {
    backgroundColor: Colors.accentGreen,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
});