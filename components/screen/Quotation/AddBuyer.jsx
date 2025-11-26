import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeftIcon, CheckIcon, ChevronDownIcon } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import Colors from "../../colors";
import { useState, useEffect } from "react";
import { Picker } from '@react-native-picker/picker';

export default function AddBuyer({ navigation, route }) {
  const { buyerDetails, onSave } = route.params || {};

  const [formData, setFormData] = useState({
    gstin: "",
    companyName: "",
    email: "",
    mobileNumber: "",
    address: "",
    city: "",
    pincode: "",
    state: "",
    gstTreatmentType: "",
  });

  const gstTreatmentTypes = [
    { label: "Select GST Treatment", value: "" },
    { label: "Registered Business - Regular", value: "registered_regular" },
    { label: "Registered Business - Composition", value: "registered_composition" },
    { label: "Unregistered Business", value: "unregistered" },
    { label: "Consumer", value: "consumer" },
    { label: "Overseas", value: "overseas" },
    { label: "Special Economic Zone", value: "sez" },
  ];

  // Load existing buyer details if editing
  useEffect(() => {
    if (buyerDetails) {
      setFormData(buyerDetails);
    }
  }, [buyerDetails]);

  const handleSave = () => {
    // Validate required fields
    if (!formData.companyName.trim()) {
      alert("Please enter company name");
      return;
    }

    // Call the onSave callback to update parent screen
    if (onSave) {
      onSave(formData);
    }

    // Navigate back
    navigation.goBack();
  };

  const inputFields = [
    { key: "companyName", label: "Company Name", placeholder: "Enter company name", required: true },
    { key: "gstin", label: "GSTIN", placeholder: "Enter GSTIN (optional)", maxLength: 15 },
    { key: "email", label: "Email", placeholder: "Enter email address", keyboardType: "email-address" },
    { key: "mobileNumber", label: "Mobile Number", placeholder: "Enter mobile number", keyboardType: "phone-pad", maxLength: 10 },
    { key: "address", label: "Address", placeholder: "Enter address" },
    { key: "city", label: "City", placeholder: "Enter city" },
    { key: "state", label: "State", placeholder: "Enter state" },
    { key: "pincode", label: "Pincode", placeholder: "Enter pincode", keyboardType: "numeric", maxLength: 6 },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={Colors.accentGreen} />
      
      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ArrowLeftIcon size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Buyer Details</Text>
            <TouchableOpacity 
              onPress={handleSave}
              style={styles.saveIconButton}
              activeOpacity={0.7}
            >
              <CheckIcon size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Form */}
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
          <View style={styles.formCard}>
            {inputFields.map((field, index) => (
              <View key={field.key}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {field.label}
                    {field.required && <Text style={styles.required}> *</Text>}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={formData[field.key]}
                    onChangeText={(text) =>
                      setFormData((prev) => ({
                        ...prev,
                        [field.key]: text,
                      }))
                    }
                    placeholder={field.placeholder}
                    placeholderTextColor="#999"
                    keyboardType={field.keyboardType || "default"}
                    maxLength={field.maxLength}
                    autoCapitalize={field.keyboardType === "email-address" ? "none" : "words"}
                  />
                </View>
                {index < inputFields.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
            
            {/* GST Treatment Type - Separate section */}
            <View style={styles.divider} />
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>GST TREATMENT TYPE</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.gstTreatmentType}
                  onValueChange={(itemValue) =>
                    setFormData((prev) => ({
                      ...prev,
                      gstTreatmentType: itemValue,
                    }))
                  }
                  style={styles.picker}
                  dropdownIconColor="#666"
                >
                  {gstTreatmentTypes.map((type) => (
                    <Picker.Item 
                      key={type.value} 
                      label={type.label} 
                      value={type.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <CheckIcon size={20} color="#fff" strokeWidth={2.5} />
            <Text style={styles.saveButtonText}>Save Buyer Details</Text>
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
    backgroundColor: '#fafafa',
  },
  header: {
    backgroundColor: Colors.accentGreen,
    paddingHorizontal: 20,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginBottom: 16,
  },
  inputContainer: {
    paddingVertical: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  required: {
    color: '#e74c3c',
    fontSize: 14,
  },
  input: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  pickerContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#333',
  },
  saveButton: {
    backgroundColor: Colors.accentGreen,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    elevation: 3,
    shadowColor: Colors.accentGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});