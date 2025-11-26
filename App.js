import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./components/screen/HomeScreen";
import QuotationsScreen from "./components/screen/QuotationsScreen";
import CreateQuotation from "./components/screen/CreateQuation";
import AddSupplier from "./components/screen/Quotation/AddSupplier";
import AddBuyer from "./components/screen/Quotation/AddBuyer";
import AddContactPerson from "./components/screen/Quotation/AddContactPerson";
import AddProducts from "./components/screen/Quotation/AddProduct";

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
          name="AddBuyer"
          options={{headerShown: false}}
          component={AddBuyer}
        />
        <Stack.Screen 
          name="AddContactPerson"
          options={{headerShown: false}}
          component={AddContactPerson}
        />
        <Stack.Screen 
          name="AddProducts"
          options={{headerShown: false}}
          component={AddProducts}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
