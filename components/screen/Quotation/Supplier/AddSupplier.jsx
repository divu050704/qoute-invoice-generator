import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeftIcon, CheckIcon } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import Colors from "../../../colors";
import { useState, useEffect } from "react";
import addAndSave from "../../../utils/addAndSave";
import * as ImagePicker from "expo-image-picker";

export default function AddSupplier({ navigation, route }) {
  const { supplierDetails, onSave } = route.params || {};

  const [formData, setFormData] = useState({
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
  });

  // Load existing supplier details if editing
  useEffect(() => {
    if (supplierDetails) {
      setFormData(supplierDetails);
    }
  }, [supplierDetails]);

  const handleSave = async () => {
    // Validate required fields
    for (const field of inputFields) {
      if (!formData[field.key] || formData[field.key].trim() === "") {
        alert(`Please enter ${field.label}`);
        return;
      }
    }

    if (!formData.image) {
      alert("Please select a logo");
      return;
    }

    addAndSave({
      propertyName: "supplier",
      newValue: formData,
      propertyCheck: "firmName",
    });

    // Call the onSave callback to update parent screen
    if (onSave) {
      onSave(formData);
    }

    // Navigate back
    navigation.pop(1);
  };

  const inputFields = [
    {
      key: "firmName",
      label: "Firm Name",
      placeholder: "Enter firm name",
      required: true,
    },
    { key: "gstin", label: "GSTIN", placeholder: "Enter GSTIN", maxLength: 15 },
    {
      key: "pancard",
      label: "PAN Card",
      placeholder: "Enter PAN number",
      maxLength: 10,
    },
    {
      key: "email",
      label: "Email",
      placeholder: "Enter email address",
      keyboardType: "email-address",
    },
    {
      key: "mobile",
      label: "Mobile",
      placeholder: "Enter mobile number",
      keyboardType: "phone-pad",
      maxLength: 10,
    },
    { key: "address", label: "Address", placeholder: "Enter address" },
    { key: "city", label: "City", placeholder: "Enter city" },
    { key: "state", label: "State", placeholder: "Enter state" },
    {
      key: "pincode",
      label: "Pincode",
      placeholder: "Enter pincode",
      keyboardType: "numeric",
      maxLength: 6,
    },
  ];

  /* ---------- Image picker helpers ---------- */
  const pickImageFromLibrary = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Please grant gallery access to select an image."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
        aspect: [1, 1],
      });

      if (!result.canceled) {
        setFormData((prev) => ({ ...prev, image: result.assets[0].uri }));
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Please grant camera access to take a photo."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        aspect: [1, 1],
      });

      if (!result.canceled) {
        setFormData((prev) => ({ ...prev, image: result.assets[0].uri }));
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const removeImage = () => {
    Alert.alert(
      "Remove logo",
      "Are you sure you want to remove the selected logo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => setFormData((prev) => ({ ...prev, image: "" })),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={Colors.accentGreen} />

      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ArrowLeftIcon size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Supplier Details</Text>
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
          bounces={false}
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
                    autoCapitalize={
                      field.keyboardType === "email-address" ? "none" : "words"
                    }
                  />
                </View>
                {index < inputFields.length && <View style={styles.divider} />}
              </View>
            ))}

            {/* ---------- IMAGE PICKER SECTION (styled) ---------- */}
            <View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  {"Logo"}
                  {<Text style={styles.required}> *</Text>}
                </Text>

                <View style={styles.imagePickerContainer}>
                  {formData.image ? (
                    <View style={styles.previewWrapper}>
                      <Image
                        source={{ uri: formData.image }}
                        style={styles.imagePreview}
                      />
                      <TouchableOpacity
                        style={styles.editOverlay}
                        onPress={pickImageFromLibrary}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.editOverlayText}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.imagePlaceholder}
                      onPress={pickImageFromLibrary}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.placeholderText}>Select Logo</Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.imageButtonsColumn}>
                    <TouchableOpacity
                      style={styles.smallButton}
                      onPress={pickImageFromLibrary}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.smallButtonText}>Library</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.smallButton, styles.cameraButton]}
                      onPress={takePhotoWithCamera}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.smallButtonText,
                          styles.cameraButtonText,
                        ]}
                      >
                        Camera
                      </Text>
                    </TouchableOpacity>

                    {formData.image ? (
                      <TouchableOpacity
                        style={[styles.smallButton, styles.removeButton]}
                        onPress={removeImage}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.smallButtonText,
                            styles.removeButtonText,
                          ]}
                        >
                          Remove
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            </View>
            {/* ---------- end image picker ---------- */}
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <CheckIcon size={20} color="#fff" strokeWidth={2.5} />
            <Text style={styles.saveButtonText}>Save Supplier Details</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  header: {
    backgroundColor: Colors.accentGreen,
    paddingHorizontal: 20,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: "#000",
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
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  saveIconButton: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
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
    fontWeight: "600",
    color: "#555",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  required: {
    color: "#e74c3c",
    fontSize: 14,
  },
  input: {
    fontSize: 16,
    color: "#333",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
  },

  /* ---------- IMAGE PICKER STYLES ---------- */
  imagePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  imagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: "#f2f6f2",
    borderWidth: 1,
    borderColor: "#e6e6e6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  placeholderText: {
    color: "#7a7a7a",
    fontWeight: "600",
  },
  previewWrapper: {
    position: "relative",
  },
  imagePreview: {
    width: 96,
    height: 96,
    borderRadius: 12,
    resizeMode: "cover",
    borderWidth: 1,
    borderColor: "#eee",
  },
  editOverlay: {
    position: "absolute",
    right: -6,
    bottom: -8,
    backgroundColor: Colors.accentGreen,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    elevation: 3,
  },
  editOverlayText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  imageButtonsColumn: {
    marginLeft: 12,
    justifyContent: "space-between",
    height: 96,
  },
  smallButton: {
    backgroundColor: "#f4f6f5",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eaeaea",
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraButton: {
    backgroundColor: Colors.accentGreen,
  },
  cameraButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  smallButtonText: {
    color: "#333",
    fontWeight: "700",
  },
  removeButton: {
    backgroundColor: "#fff",
    borderColor: "#ffdddd",
  },
  removeButtonText: {
    color: "#e74c3c",
  },

  /* ---------- SAVE BUTTON ---------- */
  saveButton: {
    backgroundColor: Colors.accentGreen,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    elevation: 3,
    shadowColor: Colors.accentGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
