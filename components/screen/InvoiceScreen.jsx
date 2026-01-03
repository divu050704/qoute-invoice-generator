import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert // Added Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeftIcon, SearchIcon, XIcon } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import Colors from "../colors";
import { getItemAsync, setItemAsync } from "expo-secure-store"; // Added setItemAsync
import { useIsFocused } from "@react-navigation/native";

export default function InvoiceScreen({ navigation }) {
  const [search, setSearch] = useState("");
  const [savedInvoices, setSavedInvoices] = useState([]);
  const isFocused = useIsFocused();

  async function getSavedInvoices() {
    try {
      const raw = await getItemAsync("invoice");
      const invoices = raw ? JSON.parse(raw) : [];
      setSavedInvoices(Array.isArray(invoices) ? invoices : []);
    } catch (err) {
      console.warn("Failed reading invoices:", err);
      setSavedInvoices([]);
    }
  }

  useEffect(() => {
    if (isFocused) {
      getSavedInvoices();
    }
  }, [isFocused]);

  // --- STATUS UPDATE LOGIC ---
  const handleStatusUpdate = (item) => {
    Alert.alert(
      "Update Status",
      `Change status for this invoice?`,
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
      const updatedList = savedInvoices.map((item) => {
        // Match by reference or ID
        if (item === targetItem || (item.id && item.id === targetItem.id)) {
          return { ...item, status: newStatus };
        }
        return item;
      });

      // Update Local State
      setSavedInvoices(updatedList);

      // Persist to Storage
      await setItemAsync("invoice", JSON.stringify(updatedList));
    } catch (error) {
      console.error("Failed to update status:", error);
      Alert.alert("Error", "Could not save the new status.");
    }
  };
  // ---------------------------

  const formatDate = (d) => {
    if (!d) return "---";
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString();
  };

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

  const filtered = (savedInvoices || []).filter((inv) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const company = inv?.buyerDetails?.companyName?.toLowerCase() || "";
    const prefix = `${inv?.invoicePrefix || ""}-${inv?.invoiceNumber || ""}`.toLowerCase();
    const date = (inv?.invoiceDate || "").toLowerCase();
    return company.includes(s) || prefix.includes(s) || date.includes(s);
  });

  const InvoiceComponent = ({ invoice }) => {
    const company = invoice?.buyerDetails?.companyName || "Unknown company";
    const date = formatDate(invoice?.invoiceDate);
    const ref = `${invoice?.invoicePrefix || "INV"}-${invoice?.invoiceNumber ?? ""}`;
    const amount = `₹${calculateGrandTotal(invoice)}`;
    
    // Status Logic
    const status = invoice?.status || "Pending";
    const isPending = status.toLowerCase() === 'pending';
    const statusColor = isPending ? (Colors.warning || "#F59E0B") : (Colors.success || "#10B981");

    return (
      <TouchableOpacity 
        style={styles.cardContainer} 
        activeOpacity={0.85} 
        onPress={() => navigation.navigate("CreateInvoice", { inputData: invoice })}
      >
        <View style={styles.cardMain}>
          {/* LEFT SIDE */}
          <View style={styles.cardLeft}>
            <Text style={styles.clientName} numberOfLines={1}>{company}</Text>
            <Text style={styles.recordNumber}>{ref}</Text>
            <Text style={styles.dateText}>{date}</Text>
          </View>

          {/* RIGHT SIDE */}
          <View style={styles.cardRight}>
            <Text style={styles.amountText}>{amount}</Text>
            
            {/* Status Button */}
            <TouchableOpacity 
              style={[styles.statusBadge, { borderColor: statusColor }]}
              onPress={() => handleStatusUpdate(invoice)}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {status} ▾
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor={Colors.accentGreen} />

      <SafeAreaView>
        <View style={styles.header}>
          {/* TOP ROW */}
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <ArrowLeftIcon color={Colors.white} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Invoices</Text>
            </View>

            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate("CreateInvoice")}
            >
              <Text style={styles.createBtnText}>+ Create New</Text>
            </TouchableOpacity>
          </View>

          {/* SEARCH BAR */}
          <View style={styles.searchWrapper}>
            <SearchIcon color="#666" size={18} />
            <TextInput
              placeholder="Search (company, ref or date)"
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#666"
              style={styles.searchInput}
              selectionColor={"#666"}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <XIcon color="#666" size={20} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={{ padding: 16 }}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                No invoices found. Create a new invoice to get started.
              </Text>
            </View>
          ) : (
            filtered.map((inv, idx) => (
              <InvoiceComponent
                key={inv.id ?? `${idx}-${inv?.invoiceNumber ?? ""}`}
                invoice={inv}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundLight || "#fff" },
  header: {
    backgroundColor: Colors.accentGreen,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
    elevation: 8,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { color: Colors.white, fontSize: 20, fontWeight: "700", marginLeft: 8 },
  createBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.white,
    borderRadius: 8,
  },
  createBtnText: { color: Colors.accentGreen, fontWeight: "600", fontSize: 14 },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16, color: Colors.black, paddingVertical: 5 },
  list: { marginTop: 8 },
  cardContainer: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  cardMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  cardLeft: {
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1, 
    marginRight: 8,
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
    color: Colors.primaryDark || "#444",
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
    paddingVertical: 4, // Increased slightly for tap target
    backgroundColor: Colors.backgroundLight || "#fff",
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  empty: { padding: 36, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#666", fontSize: 14, textAlign: "center" },
});