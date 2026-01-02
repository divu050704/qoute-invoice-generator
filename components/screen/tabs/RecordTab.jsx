import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; 
import Colors from '../../colors'; 
import { SafeAreaView } from 'react-native-safe-area-context';

// ADDED: setItemAsync to save changes
import { getItemAsync, setItemAsync } from 'expo-secure-store'; 

export default function RecordTab() {
  // --- 1. State Management ---
  const [activeType, setActiveType] = useState('Quotation'); 
  const [dateFilter, setDateFilter] = useState('All'); 
  const [statusFilter, setStatusFilter] = useState('All'); 
  const [searchText, setSearchText] = useState('');
  
  // Data State
  const [savedQuotations, setSavedQuotations] = useState([]);
  const [savedInvoices, setSavedInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Helper: Calculate Total Amount ---
  const calculateGrandTotal = (item) => {
    if (item.productDetails && Array.isArray(item.productDetails)) {
      const total = item.productDetails.reduce((sum, product) => {
        const pTotal = parseFloat(product.totalAmount) || 0;
        return sum + pTotal;
      }, 0);
      return total.toFixed(2);
    }
    return parseFloat(item.totalAmount || item.amount || 0).toFixed(2);
  };

  // --- 2. Data Fetching & Storage Operations ---
  
  const getSavedQuotations = async () => {
    try {
      const raw = await getItemAsync("quotation");
      const quotations = raw ? JSON.parse(raw) : [];
      setSavedQuotations(Array.isArray(quotations) ? quotations : []);
    } catch (err) {
      console.warn("Failed reading quotations:", err);
      setSavedQuotations([]);
    }
  };

  const getSavedInvoices = async () => {
    try {
      const raw = await getItemAsync("invoice");
      const invoices = raw ? JSON.parse(raw) : [];
      setSavedInvoices(Array.isArray(invoices) ? invoices : []);
    } catch (err) {
      console.warn("Failed reading invoices:", err);
      setSavedInvoices([]);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([getSavedQuotations(), getSavedInvoices()]);
    setLoading(false);
  };

  // NEW: Handle Status Change
  const handleStatusUpdate = async (item) => {
    Alert.alert(
      "Update Status",
      `Change status for ${activeType}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Mark Pending", 
          onPress: () => updateStorageStatus(item, "Pending") 
        },
        { 
          text: "Mark Complete", 
          onPress: () => updateStorageStatus(item, "Complete") 
        },
      ]
    );
  };

  const updateStorageStatus = async (targetItem, newStatus) => {
    try {
      // 1. Determine which list to update
      const isQuotation = activeType === 'Quotation';
      const currentList = isQuotation ? savedQuotations : savedInvoices;
      const storageKey = isQuotation ? "quotation" : "invoice";

      // 2. Create updated list
      // Note: We use item.id if available, otherwise we rely on object reference matching for this example
      const updatedList = currentList.map((item) => {
        if (item === targetItem || (item.id && item.id === targetItem.id)) {
          return { ...item, status: newStatus };
        }
        return item;
      });

      // 3. Update Local State immediately (Optimistic UI)
      if (isQuotation) {
        setSavedQuotations(updatedList);
      } else {
        setSavedInvoices(updatedList);
      }

      // 4. Persist to Storage
      await setItemAsync(storageKey, JSON.stringify(updatedList));
      
    } catch (error) {
      console.error("Failed to update status:", error);
      Alert.alert("Error", "Could not save the new status.");
      // Revert state if needed (optional)
      loadAllData();
    }
  };

  // Initial Load
  useEffect(() => {
    loadAllData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  // --- 3. Filtering Logic ---
  const currentDataset = activeType === 'Quotation' ? savedQuotations : savedInvoices;

  const filteredData = currentDataset.filter((item) => {
    // A. Filter by Status
    if (statusFilter !== 'All') {
       const itemStatus = item.status ? item.status.toLowerCase() : 'pending'; // default to pending if missing
       if (itemStatus !== statusFilter.toLowerCase()) return false;
    }

    // B. Filter by Date
    if (dateFilter !== 'All') {
      const itemDate = new Date(item.quotationDate || item.date);
      const today = new Date();
      
      if (dateFilter === 'Today') {
        if (itemDate.toDateString() !== today.toDateString()) return false;
      } 
    }

    // C. Filter by Search Text
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      const clientName = (item.buyerDetails && item.buyerDetails.companyName) 
        ? item.buyerDetails.companyName 
        : (item.clientName || item.client || '');
        
      const recordNumber = item.quotationNumber || item.invoiceNumber || item.number || '';
      
      if (!clientName.toLowerCase().includes(lowerSearch) && 
          !recordNumber.toLowerCase().includes(lowerSearch)) {
        return false;
      }
    }

    return true;
  });

  // --- 4. Render Components ---

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeType}s...`}
          placeholderTextColor={Colors.primaryDark}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.tabContainer}>
        {['Quotation', 'Invoice'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.mainTab, activeType === type && styles.activeMainTab]}
            onPress={() => setActiveType(type)}
          >
            <Text style={[styles.mainTabText, activeType === type && styles.activeMainTabText]}>
              {type}s
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterRow}>
        {['Today', 'This Week', 'This Month', 'All'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.pillButton, dateFilter === filter && styles.activePillButton]}
            onPress={() => setDateFilter(filter)}
          >
            <Text style={[styles.pillText, dateFilter === filter && styles.activePillText]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterRow}>
        {['All', 'Pending', 'Complete'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.pillButton, statusFilter === status && styles.activePillButton]}
            onPress={() => setStatusFilter(status)}
          >
            <Text style={[styles.pillText, statusFilter === status && styles.activePillText]}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCard = ({ item }) => {
    const client = (item.buyerDetails && item.buyerDetails.companyName) ? item.buyerDetails.companyName : "Unknown Client";
    const number = (item.quotationPrefix && item.quotationNumber) 
      ? `${item.quotationPrefix}-${item.quotationNumber}`
      : "---";
    const date = item.quotationDate || "---";
    const amount = calculateGrandTotal(item);
    const status = item.status || "Pending";

    const isPending = status.toLowerCase() === 'pending';
    const statusColor = isPending ? Colors.warning : Colors.success;

    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardMain}>
          <View style={styles.cardLeft}>
            <Text style={styles.clientName}>{client}</Text>
            <Text style={styles.recordNumber}>{number}</Text>
            <Text style={styles.dateText}>{date}</Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.amountText}>{amount}</Text>
            
            {/* UPDATED: Status is now a TouchableOpacity */}
            <TouchableOpacity 
              style={[styles.statusBadge, { borderColor: statusColor }]}
              onPress={() => handleStatusUpdate(item)}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {status} ▾
              </Text>
            </TouchableOpacity>
            
          </View>
        </View>

        {activeType === 'Quotation' && (
          <TouchableOpacity style={styles.subCard}>
            <Text style={styles.subCardText}>Convert to Invoice</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.backgroundLight} barStyle="dark-content" />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accentGreen} />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={renderCard}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No {activeType.toLowerCase()}s found.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  headerContainer: {
    backgroundColor: Colors.white,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchContainer: {
    padding: 15,
  },
  searchInput: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.black,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  mainTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeMainTab: {
    borderBottomColor: Colors.accentGreen,
  },
  mainTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  activeMainTabText: {
    color: Colors.accentGreen,
    fontWeight: 'bold',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  pillButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.backgroundDark,
    backgroundColor: Colors.backgroundLight,
    marginRight: 8,
    marginBottom: 5,
  },
  activePillButton: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  pillText: {
    fontSize: 13,
    color: Colors.primaryDark,
  },
  activePillText: {
    color: Colors.white,
    fontWeight: '600',
  },
  cardContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 1,
  },
  cardMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  cardLeft: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  cardRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 4,
  },
  recordNumber: {
    fontSize: 14,
    color: Colors.primaryDark,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 6,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4, // Increased slightly for touch area
    backgroundColor: Colors.backgroundLight, // Light bg to look like a button
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold', // Bold for better visibility
    textTransform: 'uppercase',
  },
  subCard: {
    backgroundColor: Colors.backgroundDark,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  subCardText: {
    color: Colors.accentGreen,
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: Colors.primaryDark,
  },
});