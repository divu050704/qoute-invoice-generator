import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./components/screen/HomeScreen";
import QuotationsScreen from "./components/screen/QuotationsScreen";
import CreateQuotation from "./components/screen/CreateQuation";
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
import SelectBankDetail from "./components/screen/Quotation/BankDetails/SelectBankDetails";
import AddBankDetails from "./components/screen/Quotation/BankDetails/AddBankDetails";

export default function App() {
  const Stack = createNativeStackNavigator();
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="HomeScreen">
        <Stack.Screen
          name="HomeScreen"
          options={{ headerShown: false }}
          component={HomeScreen}
        />
        <Stack.Screen  
          name="QuotationsScreen"
          options={{headerShown: false}}
          component={QuotationsScreen}
        />
        <Stack.Screen 
          name="CreateQuotation"
          options={{headerShown: false}}
          component={CreateQuotation}
        />
        <Stack.Screen 
          name="CreateInvoice"
          options={{headerShown: false}}
          component={CreateInvoice}
        />
        <Stack.Screen 
          name="InvoiceScreen"
          options={{headerShown: false}}
          component={InvoiceScreen}
        />
        <Stack.Screen 
          name="AddSupplier"
          options={{headerShown: false}}
          component={AddSupplier}
        />
        <Stack.Screen 
          name="SelectSupplier"
          options={{headerShown: false}}
          component={SelectSupplier}
        />
        <Stack.Screen 
          name="AddBuyer"
          options={{headerShown: false}}
          component={AddBuyer}
        />
        <Stack.Screen 
          name="SelectBuyer"
          options={{headerShown: false}}
          component={SelectBuyer}
        />
        <Stack.Screen 
          name="AddShipTo"
          options={{headerShown: false}}
          component={AddShipTo}
        />
        <Stack.Screen 
          name="SelectShipTo"
          options={{headerShown: false}}
          component={SelectShipTo}
        />
        <Stack.Screen 
          name="AddProduct"
          options={{headerShown: false}}
          component={AddProducts}
        />
        <Stack.Screen 
          name="SelectProduct"
          options={{headerShown: false}}
          component={SelectProduct}
        />
        <Stack.Screen 
          name="SelectTermsAndConditions"
          options={{headerShown: false}}
          component={SelectTermsAndConditions}
        /><Stack.Screen 
          name="AddTermsAndConditions"
          options={{headerShown: false}}
          component={AddTermsAndConditions}
        />
        <Stack.Screen 
          name="SelectBankDetail"
          options={{headerShown: false}}
          component={SelectBankDetail}
        />
        <Stack.Screen 
          name="AddBankDetails"
          options={{headerShown: false}}
          component={AddBankDetails}
        />
        <Stack.Screen 
          name="ViewQuotation"
          options={{headerShown: false}}
          component={ViewQuotation}
        />
        <Stack.Screen 
          name="ViewInvoice"
          options={{headerShown: false}}
          component={ViewInvoice}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
