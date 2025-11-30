import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeftIcon,
  UserPlus,
  XIcon,
  Calendar as CalendarIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import Colors from "../colors";
import { useState, useEffect } from "react";
import { Calendar } from "react-native-calendars";
import addAndSave from "../utils/addAndSave";
import { getItemAsync } from "expo-secure-store";

export default function CreateQuotation({ navigation, route }) {
  const [buttonEnable, setButtonEnabled] = useState(false);
  const [inputData, setInputData] = useState({
    quotationDate: "",
    quotationPrefix: "",
    quotationNumber: "1",
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
      name: "",
      email: "",
      phone: "",
    },
    productDetails: [],
    termsAndConditions: "",
  });

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [shipToDetails, setShipToDetails] = useState("Not Required");

  const onDaySelect = (day) => {
    setInputData((prev) => ({ ...prev, quotationDate: day.dateString }));
    setCalendarOpen(false);
  };

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

  const editProduct = (product, index) => {
    navigation.navigate("AddProduct", {
      productDetails: product,
      productIndex: index,
      onSave: (updatedProduct) => {
        setInputData((prev) => {
          const updatedProducts = [...prev.productDetails];
          updatedProducts[index] = updatedProduct;
          return {
            ...prev,
            productDetails: updatedProducts,
          };
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

      {inputData.productDetails.length > 0 ? (
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
      ) : null}

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

  useEffect(() => {
    const isFilled = (obj) => {
      return Object.values(obj).every((value) => {
        if (Array.isArray(value)) return value.length > 0; // productDetails
        return value !== "" && value !== null && value !== undefined;
      });
    };
    setButtonEnabled(isFilled(inputData));
  }, [inputData]);

  useEffect(() => {
    if (route.params) {
      setInputData(route.params.inputData);
    }
    (async () => {
      const supplierDetails = JSON.parse(await getItemAsync("supplier"));
      setInputData((prev) => ({
        ...prev,
        supplierDetails: supplierDetails[0] ||
          supplierDetails || {
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
      }));
    })();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={Colors.accentGreen} />

      {/* Header - Moved outside KeyboardAvoidingView */}
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ArrowLeftIcon size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Quotation</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.headerDataWrapper}>
            {/* DATE */}
            <View style={styles.headerDataContainer}>
              <Text style={styles.headerDataTitle}>Date</Text>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setCalendarOpen(true)}
                activeOpacity={0.7}
              >
                {inputData.quotationDate === "" && (
                  <CalendarIcon size={16} color="rgba(255,255,255,0.8)" />
                )}
                <Text style={styles.dateButtonText}>
                  {inputData.quotationDate === ""
                    ? "Select"
                    : inputData.quotationDate}
                </Text>
              </TouchableOpacity>
            </View>

            {/* PREFIX */}
            <View style={styles.headerDataContainer}>
              <Text style={styles.headerDataTitle}>Prefix</Text>

              <TextInput
                placeholder="QT-"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={inputData.quotationPrefix}
                onChangeText={(value) =>
                  setInputData((prev) => ({
                    ...prev,
                    quotationPrefix: value ?? "",
                  }))
                }
                blurOnSubmit={false}
                onSubmitEditing={() => {}}
                keyboardShouldPersistTaps="handled"
                style={styles.headerDataInput}
              />
            </View>

            {/* NUMBER */}
            <View style={styles.headerDataContainer}>
              <Text style={styles.headerDataTitle}>Number</Text>

              <TextInput
                placeholder="001"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={String(inputData.quotationNumber)}
                onChangeText={(value) =>
                  setInputData((prev) => ({
                    ...prev,
                    quotationNumber: value.replace(/[^0-9]/g, ""), // numeric only
                  }))
                }
                keyboardType="numeric"
                blurOnSubmit={false}
                onSubmitEditing={() => {}}
                style={styles.headerDataInput}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Content - Wrapped in KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" // Prevent keyboard dismissal on taps
        >
          <DetailCard
            title="Supplier Details"
            isEmpty={inputData.supplierDetails.firmName === ""}
            data={inputData.supplierDetails}
            onPress={() => {
              navigation.navigate("AddSupplier", {
                supplierDetails: inputData.supplierDetails,
                onSave: (updatedSupplier) => {
                  setInputData((prev) => ({
                    ...prev,
                    supplierDetails: updatedSupplier,
                  }));
                },
              });
            }}
            icon={UserPlus}
            propertyName={"supplierDetails"}
          />

          <DetailCard
            title="Client Details"
            isEmpty={inputData.buyerDetails.companyName === ""}
            onPress={() => {
              navigation.navigate("SelectBuyer", {
                buyerDetails: inputData.buyerDetails,
                onSave: (updatedBuyer) => {
                  setInputData((prev) => ({
                    ...prev,
                    buyerDetails: updatedBuyer,
                  }));
                },
              });
            }}
            icon={UserPlus}
            propertyName={"buyerDetails"}
          />
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
                  activeOpacity={0.7}
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
              isEmpty={inputData.shipToDetails.name === ""}
              icon={PlusIcon}
              onPress={() => {
                navigation.navigate("SelectShipTo", {
                  shipToDetails: inputData.shipToDetails,
                  onSave: (updatedShipToDetails) => {
                    setInputData((prev) => ({
                      ...prev,
                      shipToDetails: updatedShipToDetails,
                    }));
                  },
                });
              }}
              propertyName={"shipToDetails"}
            />
          )}

          <ProductDetailsCard />

          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Terms & Conditions</Text>
            </View>
            {inputData.termsAndConditions === "" ? (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  navigation.navigate("SelectTermsAndConditions", {
                    termsAndConditions: inputData.termsAndConditions,
                    onSave: (updatedTermsAndConditions) => {
                      setInputData((prev) => ({
                        ...prev,
                        termsAndConditions: updatedTermsAndConditions,
                      }));
                    },
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={styles.addButtonIcon}>
                  <PlusIcon size={20} color={Colors.accentGreen} />
                </View>
                <Text style={styles.addButtonText}>
                  Add Terms And Constions
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate("SelectTermsAndConditions", {
                    termsAndConditions: inputData.termsAndConditions,
                    onSave: (updatedTermsAndConditions) => {
                      setInputData((prev) => ({
                        ...prev,
                        termsAndConditions: updatedTermsAndConditions,
                      }));
                    },
                  });
                }}
              >
                <Text style={{ paddingVertical: 8, paddingHorizontal: 10 }}>
                  {inputData.termsAndConditions}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            disabled={!buttonEnable}
            style={{
              ...styles.saveButton,
              opacity: buttonEnable ? 1 : 0.6,
            }}
            activeOpacity={0.8}
            onPress={async () => {
              try {
                setButtonEnabled(false);
                addAndSave({
                  propertyName: "quotation",
                  newValue: inputData,
                  propertyCheck: "quotationDate",
                });
                navigation.navigate("ViewQuotation", { data: inputData });
              } catch (e) {
                Alert.alert("An error occurred:", e);
              } finally {
                setButtonEnabled(true);
              }
            }}
          >
            <Text style={styles.saveButtonText}>Save PDF</Text>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Calendar Modal */}
      <Modal
        visible={calendarOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setCalendarOpen(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.modalWrapper} pointerEvents="box-none">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity
                onPress={() => setCalendarOpen(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <XIcon size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <Calendar
              onDayPress={onDaySelect}
              markedDates={
                inputData.quotationDate
                  ? {
                      [inputData.quotationDate]: {
                        selected: true,
                        selectedColor: Colors.accentGreen,
                      },
                    }
                  : {}
              }
              theme={{
                todayTextColor: Colors.accentGreen,
                arrowColor: Colors.accentGreen,
                monthTextColor: "#333",
                textMonthFontWeight: "600",
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
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
  headerDataWrapper: {
    flexDirection: "row",
    gap: 12,
  },
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
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {},
  cardContainer: {
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: Colors.backgroundDark,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: 0.2,
  },
  sectionContent: {
    padding: 16,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dataLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    flex: 1,
  },
  dataValue: {
    fontSize: 14,
    color: "#333",
    flex: 2,
    textAlign: "right",
  },
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

  radioLabel: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  productsContainer: {
    padding: 16,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    gap: 12,
  },
  productInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  productTextContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.accentGreen,
  },
  productDeleteButton: {
    padding: 8,
  },
  addProductButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  termsInput: {
    padding: 16,
    fontSize: 14,
    color: "#333",
    minHeight: 120,
    lineHeight: 20,
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
    marginHorizontal: 15,
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
});
