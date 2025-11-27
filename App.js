import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./components/screen/HomeScreen";
import QuotationsScreen from "./components/screen/QuotationsScreen";
import CreateQuotation from "./components/screen/CreateQuation";
import AddSupplier from "./components/screen/Quotation/Supplier/AddSupplier";
import SelectSupplier from "./components/screen/Quotation/Supplier/SelectSupplier";
import AddBuyer from "./components/screen/Quotation/Buyer/AddBuyer";
import SelectBuyer from "./components/screen/Quotation/Buyer/SelectBuyer";
import AddContactPerson from "./components/screen/Quotation/ContactPerson/AddContactPerson";
import SelectContactPerson from "./components/screen/Quotation/ContactPerson/SelectContactPerson";
import AddProducts from "./components/screen/Quotation/Product/AddProduct";
import SelectProduct from "./components/screen/Quotation/Product/SelectProduct";
import ViewQuotation from "./components/screen/Quotation/ViewQuotation";

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
          name="AddContactPerson"
          options={{headerShown: false}}
          component={AddContactPerson}
        />
        <Stack.Screen 
          name="SelectContactPerson"
          options={{headerShown: false}}
          component={SelectContactPerson}
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
          name="ViewQuotation"
          options={{headerShown: false}}
          component={ViewQuotation}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
