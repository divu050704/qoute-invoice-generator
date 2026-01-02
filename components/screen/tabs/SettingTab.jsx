import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
// 1. Import Lucide Icons
import { Camera, User, Edit, CheckCircle, X } from 'lucide-react-native';

import Colors from "../../colors"

const STORAGE_KEY = "supplier";

export default function SettingTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
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
    image: null, 
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const result = await SecureStore.getItemAsync(STORAGE_KEY);
      if (result) {
        setFormData(JSON.parse(result));
      }
    } catch (error) {
      console.error("Failed to load profile", error);
      Alert.alert("Error", "Could not load profile data.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setIsLoading(true);
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(formData));
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Failed to save profile", error);
      Alert.alert("Error", "Could not save changes.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const pickImage = async () => {
    Alert.alert(
      "Update Profile Photo",
      "Choose an option",
      [
        { text: "Camera", onPress: openCamera },
        { text: "Gallery", onPress: openGallery },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission to access camera is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      handleChange('image', result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission to access gallery is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      handleChange('image', result.assets[0].uri);
    }
  };

  const renderField = (label, key, placeholder, keyboardType = 'default') => (
    <View style={styles.fieldContainer} key={key}>
      <Text style={styles.label}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={formData[key]}
          onChangeText={(text) => handleChange(key, text)}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType={keyboardType}
        />
      ) : (
        <Text style={styles.valueText}>
          {formData[key] || <Text style={styles.placeholderText}>Not set</Text>}
        </Text>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.accentGreen} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* --- Profile Photo Section --- */}
          <View style={styles.headerContainer}>
            <View style={styles.imageWrapper}>
              {formData.image ? (
                <Image source={{ uri: formData.image }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, styles.placeholderImage]}>
                  {/* Replaced Ionicons 'person' with Lucide 'User' */}
                  <User size={60} color={Colors.white} />
                </View>
              )}
              
              <TouchableOpacity style={styles.cameraIconContainer} onPress={pickImage}>
                {/* Replaced Ionicons 'camera' with Lucide 'Camera' */}
                <Camera size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <Text style={styles.firmNameTitle}>
              {formData.firmName || "Firm Name"}
            </Text>
          </View>

          {/* --- Form Fields --- */}
          <View style={styles.formContainer}>
            {renderField("Firm Name", "firmName", "Enter firm name")}
            {renderField("Email", "email", "Enter email address", "email-address")}
            {renderField("Mobile", "mobile", "Enter mobile number", "phone-pad")}
            {renderField("GSTIN", "gstin", "Enter GSTIN")}
            {renderField("PAN Card", "pancard", "Enter PAN number")}
            {renderField("Address", "address", "Enter address")}
            
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                {renderField("City", "city", "City")}
              </View>
              <View style={{ flex: 1 }}>
                 {renderField("State", "state", "State")}
              </View>
            </View>
            
            {renderField("Pincode", "pincode", "Zip Code", "numeric")}
          </View>

          <View style={styles.footerSpacing} />
        </ScrollView>

        {/* --- Footer Buttons --- */}
        <View style={styles.footerContainer}>
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                { backgroundColor: isEditing ? Colors.success : Colors.accentGreen }
              ]}
              onPress={isEditing ? saveProfile : () => setIsEditing(true)}
            >
              {/* Logic to switch icons based on state */}
              {isEditing ? (
                 <CheckCircle size={24} color={Colors.white} />
              ) : (
                 <Edit size={24} color={Colors.white} />
              )}
              
              <Text style={styles.actionButtonText}>
                {isEditing ? "Save Changes" : "Edit Profile"}
              </Text>
            </TouchableOpacity>
            
            {isEditing && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  loadProfile(); // Revert changes
                  setIsEditing(false);
                }}
              >
                 {/* Added explicit Cancel icon (X) */}
                 <X size={24} color={Colors.black} />
                 <Text style={[styles.actionButtonText, { color: Colors.black }]}>Cancel</Text>
              </TouchableOpacity>
            )}
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 150, // Increased padding for footer space
  },
  headerContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: Colors.backgroundDark,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  placeholderImage: {
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.accentGreen,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  firmNameTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.black,
    marginTop: 5,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  fieldContainer: {
    marginBottom: 15,
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  label: {
    fontSize: 12,
    color: Colors.primaryDark,
    marginBottom: 5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  valueText: {
    fontSize: 16,
    color: Colors.black,
    fontWeight: '500',
  },
  placeholderText: {
    color: '#bbb',
    fontStyle: 'italic',
  },
  input: {
    fontSize: 16,
    color: Colors.black,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accentGreen,
    paddingVertical: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: Colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#ccc',
    elevation: 0,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginLeft: 10,
  },
});