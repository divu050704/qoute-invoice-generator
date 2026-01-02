import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeftIcon,
  UserPlus,
  XIcon,
  Calendar as CalendarIcon,
  PlusIcon,
  TrashIcon,
  FileTextIcon,
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import Colors from "../colors";
import { Calendar } from "react-native-calendars";
import addAndSave from "../utils/addAndSave";
import { getItemAsync } from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import RNFS from "react-native-fs";
import { generateInvoicePDF } from "../utils/generateInvoicePDF";

export default function CreateInvoice({ navigation, route }) {
  const [buttonEnable, setButtonEnabled] = useState(false);
  const [inputData, setInputData] = useState({
    invoiceDate: "",
    invoicePrefix: "",
    invoiceNumber: "1",
    supplierDetails: {
      gstin: "",
      firmName: "",
      pancard: "",
      email: "",
      mobile: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      image: "",
    },
    buyerDetails: {
      gstin: "",
      companyName: "",
      email: "",
      mobileNumber: "",
      address: "",
      city: "",
      pincode: "",
      state: "",
      gstTreatmentType: "",
    },
    shipToDetails: {
      gstin: "",
      companyName: "",
      email: "",
      mobileNumber: "",
      address: "",
      city: "",
      pincode: "",
      state: "",
      gstTreatmentType: "",
    },
    productDetails: [],
    termsAndConditions: "",
    bankDetails: {
      ifscCode: "",
      bankName: "",
      branchName: "",
      accountNumber: "",
      holderName: "",
    },
    dueDate: "", // Replaces quotationValidity
    signature: "",
  });

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState("invoiceDate"); // "invoiceDate" | "dueDate"
  const [shipToDetails, setShipToDetails] = useState("Not Required");

  const onDaySelect = (day) => {
    setInputData((prev) => ({ ...prev, [calendarTarget]: day.dateString }));
    setCalendarOpen(false);
  };

  // --- Reusable Card Component ---
  const DetailCard = ({
    title,
    isEmpty,
    onPress,
    icon: Icon,
    propertyName,
  }) => (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {isEmpty ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <View style={styles.addButtonIcon}>
            <Icon size={20} color={Colors.accentGreen} />
          </View>
          <Text style={styles.addButtonText}>Add {title}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.sectionContent}
          onPress={onPress}
          activeOpacity={0.7}
        >
          {inputData[propertyName] &&
            Object.entries(inputData[propertyName]).map(([key, value]) => {
              if (value && key !== "image") {
                return (
                  <View key={key} style={styles.dataRow}>
                    <Text style={styles.dataLabel}>{key.toUpperCase()}</Text>
                    <Text style={styles.dataValue}>{value}</Text>
                  </View>
                );
              }
              return null;
            })}
        </TouchableOpacity>
      )}
    </View>
  );

  // --- Product Handlers ---
  const editProduct = (product, index) => {
    navigation.navigate("AddProduct", {
      productDetails: product,
      productIndex: index,
      onSave: (updatedProduct) => {
        setInputData((prev) => {
          const updatedProducts = [...prev.productDetails];
          updatedProducts[index] = updatedProduct;
          return { ...prev, productDetails: updatedProducts };
        });
      },
    });
  };

  const deleteProduct = (index) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setInputData((prev) => ({
              ...prev,
              productDetails: prev.productDetails.filter((_, i) => i !== index),
            }));
          },
        },
      ]
    );
  };

  const ProductDetailsCard = () => (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Product Details</Text>
      </View>
      {inputData.productDetails.length > 0 && (
        <View style={styles.productsContainer}>
          {inputData.productDetails.map((product, index) => (
            <View key={product.id || index} style={styles.productItem}>
              <TouchableOpacity
                style={styles.productInfo}
                onPress={() => editProduct(product, index)}
                activeOpacity={0.7}
              >
                <View style={styles.productTextContainer}>
                  <Text style={styles.productName}>
                    {product.productName || "Unnamed Product"}
                  </Text>
                  <Text style={styles.productPrice}>
                    ₹{product.totalAmount?.toFixed(2) || "0.00"}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.productDeleteButton}
                onPress={() => deleteProduct(index)}
                activeOpacity={0.7}
              >
                <TrashIcon size={18} color={Colors.warning} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <TouchableOpacity
        style={styles.addProductButton}
        onPress={() => {
          navigation.navigate("SelectProduct", {
            productDetails: inputData.productDetails,
            onSave: (updatedProductDetails) => {
              setInputData((prev) => ({
                ...prev,
                productDetails: [...prev.productDetails, updatedProductDetails],
              }));
            },
          });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.addButtonIcon}>
          <PlusIcon size={20} color={Colors.accentGreen} />
        </View>
        <Text style={styles.addButtonText}>Add Product</Text>
      </TouchableOpacity>
    </View>
  );

  // --- Effects ---
  useEffect(() => {
    const isFilled = (obj) => {
      return Object.entries(obj).every(([key, value]) => {
        if (
          key === "signature" ||
          key === "shipToDetails" ||
          key === "bankDetails" ||
          key === "dueDate"
        )
          return true;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === "object" && value !== null)
          return Object.values(value).some((v) => v !== "");
        return value !== "" && value !== null && value !== undefined;
      });
    };
    setButtonEnabled(isFilled(inputData));
  }, [inputData]);

  useEffect(() => {
    if (route.params?.inputData) {
      setInputData(route.params.inputData);
    }
    (async () => {
      try {
        const supplierDetailsRaw = await getItemAsync("supplier");
        const supplierDetails = supplierDetailsRaw
          ? JSON.parse(supplierDetailsRaw)
          : null;
        setInputData((prev) => ({
          ...prev,
          supplierDetails:
            (supplierDetails && (supplierDetails[0] || supplierDetails)) ||
            prev.supplierDetails,
        }));
      } catch (e) {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    if (shipToDetails === "Show Same as Client Details") {
      setInputData((prev) => ({ ...prev, shipToDetails: prev.buyerDetails }));
    }
  }, [shipToDetails]);

  // --- Image Helpers ---
  const saveImageToDocumentDir = async (uri) => {
    try {
      if (!uri) return "";
      const imagesFolder = RNFS.DocumentDirectoryPath + "/images/";
      if (!(await RNFS.exists(imagesFolder))) await RNFS.mkdir(imagesFolder);

      const ext = uri.match(/\.(\w+)(\?.*)?$/)?.[1] || "jpg";
      const destPath = imagesFolder + `sig_${Date.now()}.${ext}`;

      try {
        const fromPath = uri.startsWith("file://")
          ? uri.replace("file://", "")
          : uri;
        await RNFS.moveFile(fromPath, destPath);
        return "file://" + destPath;
      } catch {
        try {
          await RNFS.copyFile(uri, destPath);
          return "file://" + destPath;
        } catch {
          const base64 = await RNFS.readFile(uri, "base64");
          await RNFS.writeFile(destPath, base64, "base64");
          return "file://" + destPath;
        }
      }
    } catch (e) {
      return uri;
    }
  };

  const pickSignature = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permission required");
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
      aspect: [3, 2],
    });
    if (result?.assets?.[0]?.uri) {
      const uri = await saveImageToDocumentDir(result.assets[0].uri);
      setInputData((prev) => ({ ...prev, signature: uri }));
    }
  };

  const removeSignature = () => {
    setInputData((prev) => ({ ...prev, signature: "" }));
  };

  // --- Render ---
  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={Colors.accentGreen} />

      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <ArrowLeftIcon size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Invoice</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.headerDataWrapper}>
            {/* Date */}
            <View style={styles.headerDataContainer}>
              <Text style={styles.headerDataTitle}>Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setCalendarTarget("invoiceDate");
                  setCalendarOpen(true);
                }}
              >
                {!inputData.invoiceDate && (
                  <CalendarIcon size={16} color="rgba(255,255,255,0.8)" />
                )}
                <Text style={styles.dateButtonText}>
                  {inputData.invoiceDate || "Select"}
                </Text>
              </TouchableOpacity>
            </View>
            {/* Prefix */}
            <View style={styles.headerDataContainer}>
              <Text style={styles.headerDataTitle}>Prefix</Text>
              <TextInput
                placeholder="INV-"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={inputData.invoicePrefix}
                onChangeText={(v) =>
                  setInputData((p) => ({ ...p, invoicePrefix: v }))
                }
                style={styles.headerDataInput}
              />
            </View>
            {/* Number */}
            <View style={styles.headerDataContainer}>
              <Text style={styles.headerDataTitle}>Number</Text>
              <TextInput
                placeholder="001"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={String(inputData.invoiceNumber)}
                onChangeText={(v) =>
                  setInputData((p) => ({
                    ...p,
                    invoiceNumber: v.replace(/[^0-9]/g, ""),
                  }))
                }
                keyboardType="numeric"
                style={styles.headerDataInput}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <DetailCard
            title="Supplier Details"
            isEmpty={!inputData.supplierDetails.firmName}
            data={inputData.supplierDetails}
            onPress={() =>
              navigation.navigate("AddSupplier", {
                supplierDetails: inputData.supplierDetails,
                onSave: (d) =>
                  setInputData((p) => ({ ...p, supplierDetails: d })),
              })
            }
            icon={UserPlus}
            propertyName="supplierDetails"
          />

          <DetailCard
            title="Client Details"
            isEmpty={!inputData.buyerDetails.companyName}
            onPress={() =>
              navigation.navigate("SelectBuyer", {
                buyerDetails: inputData.buyerDetails,
                onSave: (d) => setInputData((p) => ({ ...p, buyerDetails: d })),
              })
            }
            icon={UserPlus}
            propertyName="buyerDetails"
          />

          {/* Ship To Logic */}
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Ship to (Details)</Text>
            </View>
            <View>
              {[
                "Not Required",
                "Show Same as Client Details",
                "Add Other Shipping Details",
              ].map((ele, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setShipToDetails(ele)}
                  style={styles.radioRow}
                >
                  <View style={styles.radioOuter}>
                    {shipToDetails === ele && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>{ele}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {shipToDetails === "Add Other Shipping Details" && (
            <DetailCard
              title="Shipping Details"
              isEmpty={!inputData.shipToDetails.companyName}
              icon={PlusIcon}
              onPress={() =>
                navigation.navigate("SelectShipTo", {
                  shipToDetails: inputData.shipToDetails,
                  onSave: (d) =>
                    setInputData((p) => ({ ...p, shipToDetails: d })),
                })
              }
              propertyName="shipToDetails"
            />
          )}

          <ProductDetailsCard />

          {/* Terms */}
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Terms & Conditions</Text>
            </View>
            <TouchableOpacity
              style={
                !inputData.termsAndConditions
                  ? styles.addButton
                  : { padding: 16 }
              }
              onPress={() =>
                navigation.navigate("SelectTermsAndConditions", {
                  termsAndConditions: inputData.termsAndConditions,
                  onSave: (d) =>
                    setInputData((p) => ({ ...p, termsAndConditions: d })),
                })
              }
            >
              {!inputData.termsAndConditions ? (
                <>
                  <View style={styles.addButtonIcon}>
                    <PlusIcon size={20} color={Colors.accentGreen} />
                  </View>
                  <Text style={styles.addButtonText}>
                    Add Terms And Conditions
                  </Text>
                </>
              ) : (
                <Text>{inputData.termsAndConditions}</Text>
              )}
            </TouchableOpacity>
          </View>

          <DetailCard
            title="Bank Details"
            isEmpty={!inputData.bankDetails.holderName}
            onPress={() =>
              navigation.navigate("SelectBankDetail", {
                bankDetails: inputData.bankDetails,
                onSave: (d) => setInputData((p) => ({ ...p, bankDetails: d })),
              })
            }
            icon={PlusIcon}
            propertyName="bankDetails"
          />

          {/* Due Date */}
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Due Date (Optional)</Text>
            </View>
            <View style={styles.validityRow}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setCalendarTarget("dueDate");
                  setCalendarOpen(true);
                }}
              >
                {!inputData.dueDate && (
                  <CalendarIcon size={16} color="rgba(0,0,0,0.6)" />
                )}
                <Text
                  style={[
                    styles.dateButtonText,
                    { color: inputData.dueDate ? "#333" : "rgba(0,0,0,0.5)" },
                  ]}
                >
                  {inputData.dueDate || "Select due date"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Signature */}
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Signature</Text>
            </View>
            <View style={styles.signatureRow}>
              {inputData.signature ? (
                <>
                  <Image
                    source={{ uri: inputData.signature }}
                    style={styles.signatureImage}
                  />
                  <View style={styles.signatureActions}>
                    <TouchableOpacity
                      style={styles.smallButton}
                      onPress={pickSignature}
                    >
                      <Text style={styles.smallButtonText}>Change</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.smallButton,
                        {
                          backgroundColor: "#fff",
                          borderWidth: 1,
                          borderColor: Colors.warning,
                        },
                      ]}
                      onPress={removeSignature}
                    >
                      <TrashIcon size={16} color={Colors.warning} />
                      <Text
                        style={[
                          styles.smallButtonText,
                          { color: Colors.warning },
                        ]}
                      >
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.signatureButton}
                  onPress={pickSignature}
                >
                  <View style={styles.addButtonIcon}>
                    <PlusIcon size={18} color={Colors.accentGreen} />
                  </View>
                  <Text style={styles.addButtonText}>Pick Signature</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 12, paddingHorizontal: 15, marginBottom: 30 }}>
            <TouchableOpacity
              disabled={!buttonEnable}
              style={{ ...styles.saveButton, opacity: buttonEnable ? 1 : 0.6 }}
              onPress={async () => {
                try {
                  setButtonEnabled(false);
                  // Save to storage
                  await addAndSave({
                    propertyName: "invoice",
                    newValue: inputData,
                    propertyCheck: "invoiceDate",
                  });
                  // Navigate to View (assuming ViewInvoice exists, or reuse ViewQuotation if generic)
                  // For now, we can also offer immediate PDF generation
                  navigation.navigate("ViewInvoice", { data: inputData })
                 
                } catch (e) {
                  Alert.alert("Error", String(e));
                } finally {
                  setButtonEnabled(true);
                }
              }}
            >
              <Text style={styles.saveButtonText}>Save Invoice</Text>
            </TouchableOpacity>

           
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Calendar Modal */}
      <Modal
        visible={calendarOpen}
        transparent={true} // <--- THIS IS CRITICAL
        animationType="fade"
        onRequestClose={() => setCalendarOpen(false)}
      >
        {/* Backdrop - Handles closing when clicking outside */}
        <TouchableWithoutFeedback onPress={() => setCalendarOpen(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        {/* Content Wrapper */}
        <View style={styles.modalWrapper} pointerEvents="box-none">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {calendarTarget === "invoiceDate"
                  ? "Select Date"
                  : "Select Due Date"}
              </Text>
              <TouchableOpacity
                onPress={() => setCalendarOpen(false)}
                style={styles.modalCloseButton}
              >
                <XIcon size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <Calendar
              onDayPress={onDaySelect}
              // FIX: Only pass markedDates if a date is actually selected
              markedDates={
                inputData[calendarTarget]
                  ? {
                      [inputData[calendarTarget]]: {
                        selected: true,
                        selectedColor: Colors.accentGreen,
                      },
                    }
                  : {}
              }
              // Optional: Set current date to today if no date is selected yet
              current={
                inputData[calendarTarget] ||
                new Date().toISOString().split("T")[0]
              }
              theme={{
                todayTextColor: Colors.accentGreen,
                arrowColor: Colors.accentGreen,
                selectedDayBackgroundColor: Colors.accentGreen,
                selectedDayTextColor: "#ffffff",
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  header: {
    backgroundColor: Colors.accentGreen,
    paddingHorizontal: 20,
    paddingBottom: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    marginTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerDataWrapper: { flexDirection: "row", gap: 12 },
  headerDataContainer: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: 12,
  },
  headerDataTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerDataInput: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "600",
    padding: 0,
  },
  dateButton: { flexDirection: "row", alignItems: "center", gap: 6 },
  dateButtonText: { color: Colors.white, fontSize: 15, fontWeight: "600" },
  scrollView: { flex: 1 },
  cardContainer: {
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginBottom: 12,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: Colors.backgroundDark || "#f9f9f9",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: 0.2,
  },
  sectionContent: { padding: 16 },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dataLabel: { fontSize: 12, fontWeight: "600", color: "#666", flex: 1 },
  dataValue: { fontSize: 14, color: "#333", flex: 2, textAlign: "right" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  addButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.accentGreen}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: Colors.accentGreen,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.accentGreen,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accentGreen,
  },
  radioLabel: { fontSize: 15, color: "#333", fontWeight: "500" },
  productsContainer: { padding: 16 },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    gap: 12,
  },
  productInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  productTextContainer: { flex: 1 },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  productPrice: { fontSize: 14, fontWeight: "700", color: Colors.accentGreen },
  productDeleteButton: { padding: 8 },
  addProductButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  saveButton: {
    backgroundColor: Colors.accentGreen,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    elevation: 3,
    shadowColor: Colors.accentGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: 0.2,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  validityRow: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  signatureRow: { padding: 16, flexDirection: "row", alignItems: "center" },
  signatureButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  signatureImage: {
    width: 140,
    height: 80,
    borderRadius: 8,
    resizeMode: "cover",
    backgroundColor: "#f0f0f0",
  },
  signatureActions: {
    marginLeft: 12,
    flex: 1,
    gap: 10,
    justifyContent: "space-between",
  },
  smallButton: {
    backgroundColor: Colors.accentGreen,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
  },
  smallButtonText: { color: "#fff", fontWeight: "700", marginLeft: 6 },
});
