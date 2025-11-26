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
import { ArrowLeftIcon, CheckIcon } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import Colors from "../../colors";
import { useState, useEffect } from "react";

export default function AddContactPerson({ navigation, route }) {
  const { contactPersonDetails, onSave } = route.params || {};

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Load existing supplier details if editing
  useEffect(() => {
    if (contactPersonDetails) {
      setFormData(contactPersonDetails);
    }
  }, [contactPersonDetails]);

  const handleSave = () => {
    // Validate required fields
    if (!formData.name.trim()) {
      alert("Please enter full name");
      return;
    }

    // Call the onSave callback to update parent screen
    if (onSave) {
      onSave(formData);
    }

    // Navigate back
    navigation.goBack();
  };

  const InputField = ({
    label,
    value,
    placeholder,
    keyboardType = "default",
    maxLength,
  }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(text) =>
          setFormData((prev) => ({
            ...prev,
            [label.toLowerCase().replace(/\s+/g, "")]: text,
          }))
        }
        placeholder={placeholder}
        placeholderTextColor="#999"
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
    </View>
  );

  const inputFields = [
    {
      key: "name",
      label: "Full Name",
      placeholder: "Enter conatact person's name",
      required: true,
    },
    {
      key: "email",
      label: "Email",
      placeholder: "Enter email address",
      keyboardType: "email-address",
    },
    {
      key: "phone",
      label: "phone",
      placeholder: "Enter phone number",
      keyboardType: "phone-pad",
      maxLength: 10,
    },
  ];

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
            <Text style={styles.headerTitle}>Contact Details</Text>
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
                    autoCapitalize={
                      field.keyboardType === "email-address" ? "none" : "words"
                    }
                  />
                </View>
                {index < inputFields.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <CheckIcon size={20} color="#fff" strokeWidth={2.5} />
            <Text style={styles.saveButtonText}>Save Contact Details</Text>
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
