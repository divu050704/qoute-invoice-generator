import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  ArrowLeftIcon, 
  CheckIcon, 
  SearchIcon 
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import Colors from "../../../colors";
import { useState, useEffect } from "react";
import { Picker } from '@react-native-picker/picker';
import addAndSave from "../../../utils/addAndSave";

export default function AddProducts({ navigation, route }) {
  const { productDetails, onSave, productIndex } = route.params || {};

  const [product, setProduct] = useState({
    id: Date.now().toString(),
    productName: "",
    description: "",
    quantity: "",
    hsn: "",
    unitPrice: "",
    unit: "PCS",
    amount: 0,
    discount: "",
    discountType: "percent",
    taxableAmount: 0,
    taxInclusive: false,
    gstRate: "0",
    cess: "",
    cessType: "percent",
    totalAmount: 0,
  });

  useEffect(() => {
    if (productDetails) {
      setProduct(productDetails);
    }
  }, []);

  const updateProduct = (field, value) => {
    setProduct((prevProduct) => {
      const updated = { ...prevProduct, [field]: value };
      
      // Calculate amount
      const qty = parseFloat(updated.quantity) || 0;
      const price = parseFloat(updated.unitPrice) || 0;
      updated.amount = qty * price;

      // Calculate discount
      const discountValue = parseFloat(updated.discount) || 0;
      let discountAmount = 0;
      if (updated.discountType === "percent") {
        discountAmount = (updated.amount * discountValue) / 100;
      } else {
        discountAmount = discountValue;
      }

      updated.taxableAmount = updated.amount - discountAmount;

      // Calculate GST
      const gstRate = parseFloat(updated.gstRate) || 0;
      let gstAmount = 0;
      
      if (updated.taxInclusive) {
        // Tax inclusive: extract tax from taxable amount
        gstAmount = (updated.taxableAmount * gstRate) / (100 + gstRate);
        updated.totalAmount = updated.taxableAmount;
      } else {
        // Tax exclusive: add tax to taxable amount
        gstAmount = (updated.taxableAmount * gstRate) / 100;
        updated.totalAmount = updated.taxableAmount + gstAmount;
      }

      // Calculate CESS
      const cessValue = parseFloat(updated.cess) || 0;
      let cessAmount = 0;
      if (updated.cessType === "percent") {
        cessAmount = (updated.taxableAmount * cessValue) / 100;
      } else {
        cessAmount = cessValue;
      }

      updated.totalAmount += cessAmount;

      return updated;
    });
  };

  const handleSave = () => {
    // Validate product name
    if (!product.productName.trim()) {
      Alert.alert("Validation Error", "Please enter a product name");
      return;
    }
        addAndSave({propertyName: "products", newValue: product, propertyCheck: "productName"})
    

    if (onSave) {
      onSave(product);
    }

    productIndex !== undefined ? navigation.goBack() :navigation.pop(2);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={Colors.warning} />

      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <ArrowLeftIcon size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {productDetails ? "Edit Product" : "Add Product"}
            </Text>
            <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
              <CheckIcon size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.productCard}>
            {/* Product Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Product Name <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.nameInputContainer}>
                <TextInput
                  style={styles.fullInput}
                  value={product.productName}
                  onChangeText={(value) => updateProduct("productName", value)}
                  placeholder="Demo Product"
                  placeholderTextColor={Colors.primaryDark}
                />
                <TouchableOpacity style={styles.editIconButton}>
                  <Text style={styles.editText}>edit</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Description */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={styles.fullInput}
                value={product.description}
                onChangeText={(value) => updateProduct("description", value)}
                placeholder="Enter description"
                placeholderTextColor={Colors.primaryDark}
                multiline
              />
            </View>

            {/* Quantity & HSN */}
            <View style={styles.rowContainer}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={product.quantity}
                  onChangeText={(value) => updateProduct("quantity", value)}
                  placeholder="0"
                  placeholderTextColor={Colors.primaryDark}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>HSN</Text>
                <View style={styles.hsnContainer}>
                  <TextInput
                    style={styles.hsnInput}
                    value={product.hsn}
                    onChangeText={(value) => updateProduct("hsn", value)}
                    placeholder=""
                    placeholderTextColor={Colors.primaryDark}
                  />
                  <SearchIcon size={18} color={Colors.primaryDark} />
                </View>
              </View>
            </View>

            {/* Unit Price & Unit */}
            <View style={styles.rowContainer}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Unit Price</Text>
                <TextInput
                  style={{...styles.input, paddingBottom: 21}}
                  value={product.unitPrice}
                  onChangeText={(value) => updateProduct("unitPrice", value)}
                  placeholder="100"
                  placeholderTextColor={Colors.primaryDark}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Unit</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={product.unit}
                    onValueChange={(value) => updateProduct("unit", value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="PCS" value="PCS" />
                    <Picker.Item label="KG" value="KG" />
                    <Picker.Item label="LITER" value="LITER" />
                    <Picker.Item label="BOX" value="BOX" />
                    <Picker.Item label="METER" value="METER" />
                  </Picker>
                </View>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.greyField}>
              <Text style={styles.fieldLabel}>Amount</Text>
              <Text style={styles.calculatedValue}>{product.amount.toFixed(2)}</Text>
            </View>

            {/* Discount */}
            <View style={styles.rowContainer}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Discount</Text>
                <TextInput
                  style={styles.input}
                  value={product.discount}
                  onChangeText={(value) => updateProduct("discount", value)}
                  placeholder="0"
                  placeholderTextColor={Colors.primaryDark}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <View style={{...styles.pickerContainer, paddingVertical: 5}}>
                  <Picker
                    selectedValue={product.discountType}
                    onValueChange={(value) => updateProduct("discountType", value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="% Percent wise" value="percent" />
                    <Picker.Item label="₹ Amount wise" value="amount" />
                  </Picker>
                </View>
              </View>
            </View>

            {/* Taxable Amount */}
            <View style={styles.greyField}>
              <Text style={styles.fieldLabel}>Taxable amount</Text>
              <Text style={styles.calculatedValue}>{product.taxableAmount.toFixed(2)}</Text>
            </View>

            {/* Tax Inclusive/Exclusive */}
            <View style={styles.taxToggleContainer}>
              <Text style={styles.toggleLabel}>Tax Inclusive</Text>
              <Switch
                value={product.taxInclusive}
                onValueChange={(value) => updateProduct("taxInclusive", value)}
                trackColor={{ false: Colors.backgroundDark, true: Colors.accentGreen }}
                thumbColor={Colors.white}
              />
              <Text style={styles.toggleLabel}>Tax Exclusive</Text>
            </View>

            {/* GST */}
            <View style={styles.rowContainer}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>GST (%)</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={product.gstRate}
                    onValueChange={(value) => updateProduct("gstRate", value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="GST @ 0" value="0" />
                    <Picker.Item label="GST @ 5" value="5" />
                    <Picker.Item label="GST @ 12" value="12" />
                    <Picker.Item label="GST @ 18" value="18" />
                    <Picker.Item label="GST @ 28" value="28" />
                  </Picker>
                </View>
              </View>
            </View>

            {/* CESS */}
            <View style={styles.rowContainer}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>CESS</Text>
                <TextInput
                  style={styles.input}
                  value={product.cess}
                  onChangeText={(value) => updateProduct("cess", value)}
                  placeholder="0"
                  placeholderTextColor={Colors.primaryDark}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={product.cessType}
                    onValueChange={(value) => updateProduct("cessType", value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="% Percent wise" value="percent" />
                    <Picker.Item label="₹ Amount wise" value="amount" />
                  </Picker>
                </View>
              </View>
            </View>

            {/* Total Amount */}
            <View style={styles.greyField}>
              <Text style={styles.fieldLabel}>Total Amount</Text>
              <Text style={styles.calculatedValue}>{product.totalAmount.toFixed(2)}</Text>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Save Product</Text>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    backgroundColor: Colors.accentGreen,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  required: {
    color: Colors.warning,
  },
  nameInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fullInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundDark,
  },
  editIconButton: {
    paddingHorizontal: 8,
  },
  editText: {
    color: Colors.primaryDark,
    fontSize: 14,
  },
  rowContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  halfField: {
    flex: 1,
  },
  input: {
    fontSize: 16,
    color: Colors.black,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundDark,
  },
  hsnContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundDark,
    // paddingVertical: 10,
    paddingHorizontal: 12,
  },
  hsnInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
  },
  pickerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundDark,
    backgroundColor: Colors.white,
    padding: 0
  
  },
  picker: {
    // height: 45,
    color: Colors.black,
  },
  greyField: {
    backgroundColor: Colors.backgroundDark,
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calculatedValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.black,
  },
  taxToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 14,
    color: Colors.primaryDark,
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: Colors.accentGreen,
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "700",
  },
});