import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Platform } from 'react-native';
import { Home, Users, FileText, IndianRupee } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeTab from './tabs/HomeTab';
import ClientTab from './tabs/ClientTab';
import InvoiceTab from './tabs/InvoiceTab';
import RecordTab from './tabs/RecordTab';
import { useTheme } from '../ThemeContext';

const Tab = createMaterialTopTabNavigator();

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const tabBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const tabBorder = isDark ? '#2C2C2C' : '#F1F5F9';
  const activeTint = isDark ? '#10B981' : '#0B4F2E';
  const inactiveTint = isDark ? '#6B7280' : '#8E9EAA';
  
  // Give extra padding specifically for devices with larger navigation bars
  const safeBottom = insets.bottom > 0 ? insets.bottom + 10 : 34;

  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      screenOptions={{
        tabBarShowLabel: true,
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarStyle: {
          backgroundColor: tabBg,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : (insets.bottom > 0 ? insets.bottom : 6),
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: tabBorder,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
        },
        tabBarIndicatorStyle: {
          height: 0,
          backgroundColor: 'transparent',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'none',
          marginTop: 4,
        },
        swipeEnabled: false,
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeTab} 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Home size={22} color={color} strokeWidth={2.5} />
        }} 
      />
      <Tab.Screen 
        name="RecordTab" 
        component={RecordTab} 
        options={{
          tabBarLabel: 'Records',
          tabBarIcon: ({ color }) => <FileText size={22} color={color} strokeWidth={2.5} />
        }} 
      />
      <Tab.Screen 
        name="InvoiceTab" 
        component={InvoiceTab} 
        options={{
          tabBarLabel: 'Invoices',
          tabBarIcon: ({ color }) => <IndianRupee size={22} color={color} strokeWidth={2.5} />
        }} 
      />
      <Tab.Screen 
        name="ClientTab" 
        component={ClientTab} 
        options={{
          tabBarLabel: 'Clients',
          tabBarIcon: ({ color }) => <Users size={22} color={color} strokeWidth={2.5} />
        }} 
      />
    </Tab.Navigator>
  );
}

