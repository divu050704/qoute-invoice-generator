import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeftIcon, SearchIcon, XIcon } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import Colors from "../colors";
import { getItemAsync } from "expo-secure-store";
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

  const formatDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return d; // fallback if already formatted string
    return dt.toLocaleDateString();
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

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.85} 
        onPress={() => navigation.navigate("CreateInvoice", { inputData: invoice })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.companyName} numberOfLines={1}>
            {company}
          </Text>
          <Text style={styles.dateText}>{date}</Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.refText}>{ref}</Text>
          <Text style={styles.smallText} numberOfLines={2}>
            {invoice?.buyerDetails?.address || ""}
          </Text>
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
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  companyName: { fontSize: 16, fontWeight: "700", color: Colors.accentGreen, flex: 1 },
  dateText: { fontSize: 12, color: "#666", marginLeft: 8 },
  cardBody: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  refText: { fontSize: 14, fontWeight: "600", color: "#333" },
  smallText: { fontSize: 12, color: "#666", maxWidth: "60%", textAlign: "right" },
  empty: { padding: 36, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#666", fontSize: 14, textAlign: "center" },
});