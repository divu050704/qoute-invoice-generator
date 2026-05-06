import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { ThemeProvider } from "./components/ThemeContext";
import LoginScreen from "./components/screen/LoginScreen";
import HomeScreen from "./components/screen/HomeScreen";
import QuotationsScreen from "./components/screen/QuotationsScreen";
import CreateQuotation from "./components/screen/CreateQuation";
import CompanyDetails from "./components/screen/CompanyDetails";
import AddSupplier from "./components/screen/Quotation/Supplier/AddSupplier";
import SelectSupplier from "./components/screen/Quotation/Supplier/SelectSupplier";
import AddBuyer from "./components/screen/Quotation/Buyer/AddBuyer";
import InvoiceScreen from "./components/screen/InvoiceScreen";
import CreateInvoice from "./components/screen/CreateInvoice";
import SelectBuyer from "./components/screen/Quotation/Buyer/SelectBuyer";
import AddShipTo from "./components/screen/Quotation/ShipTo/AddShipTo";
import SelectShipTo from "./components/screen/Quotation/ShipTo/SelectShipTo";
import AddProducts from "./components/screen/Quotation/Product/AddProduct";
import SelectProduct from "./components/screen/Quotation/Product/SelectProduct";
import SelectTermsAndConditions from "./components/screen/Quotation/TermsAndConditions/SelectTermsAndConditions";
import AddTermsAndConditions from "./components/screen/Quotation/TermsAndConditions/AddTermsAndConditions";
import ViewQuotation from "./components/screen/Quotation/ViewQuotation";
import ViewInvoice from "./components/screen/Quotation/ViewInvoice";
import InvoicePdfViewer from "./components/screen/Quotation/InvoicePdfViewer";
import SelectBankDetail from "./components/screen/Quotation/BankDetails/SelectBankDetails";
import AddBankDetails from "./components/screen/Quotation/BankDetails/AddBankDetails";
import SelectSignature from "./components/screen/Quotation/Signature/SelectSignature";
import SettingTab from "./components/screen/tabs/SettingTab";
import AnimatedSplashScreen from "./components/AnimatedSplashScreen";
import { clearDemoDataOnce } from "./components/utils/seedDemoData";
import { CustomAlertProvider } from "./components/ui/CustomAlert";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { DataProvider } from "./src/contexts/DataContext";
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

// ── Stack navigator created OUTSIDE component (critical: avoids re-creation on every render) ──
const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  // Check login status and seed demo data on first launch
  useEffect(() => {
    // Timeout fallback: if SecureStore hangs, go to LoginScreen after 3s
    const fallback = setTimeout(() => {
      setInitialRoute(r => r || 'LoginScreen');
    }, 3000);

    SecureStore.getItemAsync('app_user_id').then(userId => {
      clearTimeout(fallback);
      if (userId) clearDemoDataOnce(); // Auto-clear old demo data once
      setInitialRoute(userId ? 'MainTabs' : 'LoginScreen');
    }).catch(() => {
      clearTimeout(fallback);
      setInitialRoute('LoginScreen');
    });
  }, []);

  // NOTE: We always render AnimatedSplashScreen so it can call
  // SplashScreen.hideAsync() and dismiss the native splash.
  // NavigationContainer only renders once initialRoute is known.
  return (
    <ErrorBoundary>
    <ThemeProvider>
      <CustomAlertProvider>
      <DataProvider>
      <SafeAreaProvider>
        <AnimatedSplashScreen>
          {initialRoute ? (
            <NavigationContainer>
              <Stack.Navigator initialRouteName={initialRoute}>
                <Stack.Screen
                  name="LoginScreen"
                  options={{ headerShown: false }}
                  component={LoginScreen}
                />
                <Stack.Screen
                  name="MainTabs"
                  options={{ headerShown: false }}
                  component={HomeScreen}
                />
                <Stack.Screen
                  name="QuotationsScreen"
                  options={{ headerShown: false }}
                  component={QuotationsScreen}
                />
                <Stack.Screen
                  name="CreateQuotation"
                  options={{ headerShown: false }}
                  component={CreateQuotation}
                />
                <Stack.Screen
                  name="CompanyDetails"
                  options={{ headerShown: false }}
                  component={CompanyDetails}
                />
                <Stack.Screen
                  name="CreateInvoice"
                  options={{ headerShown: false }}
                  component={CreateInvoice}
                />
                <Stack.Screen
                  name="InvoiceScreen"
                  options={{ headerShown: false }}
                  component={InvoiceScreen}
                />
                <Stack.Screen
                  name="AddSupplier"
                  options={{ headerShown: false }}
                  component={AddSupplier}
                />
                <Stack.Screen
                  name="SelectSupplier"
                  options={{ headerShown: false }}
                  component={SelectSupplier}
                />
                <Stack.Screen
                  name="AddBuyer"
                  options={{ headerShown: false }}
                  component={AddBuyer}
                />
                <Stack.Screen
                  name="SelectBuyer"
                  options={{ headerShown: false }}
                  component={SelectBuyer}
                />
                <Stack.Screen
                  name="AddShipTo"
                  options={{ headerShown: false }}
                  component={AddShipTo}
                />
                <Stack.Screen
                  name="SelectShipTo"
                  options={{ headerShown: false }}
                  component={SelectShipTo}
                />
                <Stack.Screen
                  name="AddProduct"
                  options={{ headerShown: false }}
                  component={AddProducts}
                />
                <Stack.Screen
                  name="SelectProduct"
                  options={{ headerShown: false }}
                  component={SelectProduct}
                />
                <Stack.Screen
                  name="SelectTermsAndConditions"
                  options={{ headerShown: false }}
                  component={SelectTermsAndConditions}
                />
                <Stack.Screen
                  name="AddTermsAndConditions"
                  options={{ headerShown: false }}
                  component={AddTermsAndConditions}
                />
                <Stack.Screen
                  name="SelectBankDetail"
                  options={{ headerShown: false }}
                  component={SelectBankDetail}
                />
                <Stack.Screen
                  name="AddBankDetails"
                  options={{ headerShown: false }}
                  component={AddBankDetails}
                />
                <Stack.Screen
                  name="ViewQuotation"
                  options={{ headerShown: false }}
                  component={ViewQuotation}
                />
                <Stack.Screen
                  name="ViewInvoice"
                  options={{ headerShown: false }}
                  component={ViewInvoice}
                />
                <Stack.Screen
                  name="InvoicePdfViewer"
                  options={{ headerShown: false }}
                  component={InvoicePdfViewer}
                />
                <Stack.Screen
                  name="SelectSignature"
                  options={{ headerShown: false }}
                  component={SelectSignature}
                />
                <Stack.Screen
                  name="SettingTab"
                  options={{ headerShown: false }}
                  component={SettingTab}
                />
              </Stack.Navigator>
            </NavigationContainer>
          ) : null}
        </AnimatedSplashScreen>
      </SafeAreaProvider>
      </DataProvider>
      </CustomAlertProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

