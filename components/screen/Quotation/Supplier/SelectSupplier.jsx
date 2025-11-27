import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeftIcon,
  SearchIcon,
  XIcon,
  Edit2Icon,
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import Colors from "../../../colors";
import { useEffect, useMemo, useState } from "react";
import { getItemAsync, setItemAsync } from "expo-secure-store";

export default function SelectSupplier({ navigation, route }) {
  const [search, setSearch] = useState("");
  const { supplierDetails, onSave } = route.params || {};
  const [savedSuppliers, setSavedSuppliers] = useState([]);

  async function getExistingSuppliers() {
    try {
      const supplierJson = await getItemAsync("supplier");
      if (!supplierJson) {
        setSavedSuppliers([]);
        return;
      }
      const parsed = JSON.parse(supplierJson);
      if (Array.isArray(parsed)) setSavedSuppliers(parsed);
      else setSavedSuppliers([]);
    } catch (e) {
      console.warn("Error parsing suppliers from secure store", e);
      setSavedSuppliers([]);
    }
  }

  useEffect(() => {
    getExistingSuppliers();
  }, []);

  // persist suppliers array to secure store
  async function persistSuppliers(list) {
    try {
      await setItemAsync("supplier", JSON.stringify(list || []));
    } catch (e) {
      console.warn("Failed to persist suppliers", e);
    }
  }

  // filtered list (search over firmName, gstin, pancard, state)
  const filteredSuppliers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return savedSuppliers;
    return savedSuppliers.filter((s) => {
      if (!s) return false;
      const firm = (s.firmName || "").toLowerCase();
      const gst = (s.gstin || "").toLowerCase();
      const pan = (s.pancard || "").toLowerCase();
      const st = (s.state || "").toLowerCase();
      return (
        firm.includes(q) || gst.includes(q) || pan.includes(q) || st.includes(q)
      );
    });
  }, [search, savedSuppliers]);

  const handleSelect = (supplier) => {
    if (onSave) onSave(supplier);
    navigation.goBack();
  };

  // handle edit - open AddSupplier with initial data and update on save
  const handleEdit = (supplier, originalIndex) => {
    navigation.navigate("AddSupplier", {
      supplierDetails: supplier,
      onSave: (savedSupplier) => {
        if (onSave) onSave(savedSupplier);
      },
    });
  };

  const SupplierDetailsComponent = ({ data, index, originalIndex }) => (
    <View
      style={styles.supplierCard}
      key={`${data?.firmName ?? "supplier"}-${index}`}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleSelect(data)}
        style={styles.supplierTouchable}
      >
        <View style={styles.supplierTop}>
          <Text style={styles.firmName} numberOfLines={1}>
            {data?.firmName || "—"}
          </Text>
          <Text style={styles.smallText}>{data?.state || ""}</Text>
        </View>

        <View style={styles.supplierRow}>
          <View style={styles.supplierCol}>
            <Text style={styles.label}>Pan Number</Text>
            <Text style={styles.value}>{data?.pancard || "—"}</Text>
          </View>

          <View style={styles.supplierCol}>
            <Text style={styles.label}>GSTIN</Text>
            <Text style={styles.value}>{data?.gstin || "—"}</Text>
          </View>
        </View>

        <View style={[styles.supplierRow, { marginTop: 8 }]}>
          <View style={styles.supplierColFull}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.value} numberOfLines={2}>
              {data?.address || "—"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Edit button on the right/top */}
      <TouchableOpacity
        onPress={() => handleEdit(data, originalIndex)}
        style={styles.editBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Edit2Icon color={Colors.accentGreen} size={18} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor={Colors.accentGreen} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          {/* TOP ROW */}
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <ArrowLeftIcon color={Colors.white} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Select Supplier</Text>
            </View>

            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => {
                navigation.navigate("AddSupplier", {
                  onSave: (savedSupplier) => {
                    // add to list locally + call parent onSave if provided
                    if (savedSupplier) {
                      setSavedSuppliers((prev) => {
                        const next = [savedSupplier, ...(prev || [])];
                        persistSuppliers(next);
                        return next;
                      });
                    }
                    if (onSave) onSave(savedSupplier);
                  },
                });
              }}
            >
              <Text style={styles.createBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* SEARCH BAR */}
          <View style={styles.searchWrapper}>
            <SearchIcon color="#666" size={18} />

            <TextInput
              placeholder="Search supplier, GSTIN, PAN, state..."
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

        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
          {filteredSuppliers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No suppliers found</Text>
              <Text style={styles.emptySub}>
                {savedSuppliers.length === 0
                  ? "You don't have any suppliers yet. Add one using + Add."
                  : `No results for "${search}"`}
              </Text>
            </View>
          ) : (
            filteredSuppliers.map((ele, i) => {
              // find original index in savedSuppliers to allow proper update
              const originalIndex = savedSuppliers.findIndex(
                (s) =>
                  (ele.gstin && s.gstin === ele.gstin) ||
                  (ele.pancard && s.pancard === ele.pancard) ||
                  (ele.firmName && s.firmName === ele.firmName)
              );
              return (
                <SupplierDetailsComponent
                  data={ele}
                  index={i}
                  originalIndex={originalIndex}
                  key={`supplier-${i}`}
                />
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

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
    marginBottom: 12,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  headerTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 10,
  },

  createBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.white,
    borderRadius: 8,
  },

  createBtnText: {
    color: Colors.accentGreen,
    fontWeight: "600",
    fontSize: 14,
  },

  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
    paddingVertical: 5,
  },

  listContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },

  supplierCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    // shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    // elevation for Android
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    // to allow edit button overlap
    position: "relative",
  },

  supplierTouchable: {
    // keep padding so content looks clickable
  },

  supplierTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  firmName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primaryDark ?? "#222",
    flexShrink: 1,
    marginRight: 8,
  },

  smallText: {
    fontSize: 13,
    color: "#666",
  },

  supplierRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  supplierCol: {
    flex: 1,
    marginRight: 8,
  },

  supplierColFull: {
    flex: 1,
  },

  label: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },

  value: {
    fontSize: 14,
    color: Colors.primaryDark ?? "#222",
    fontWeight: "600",
  },

  editBtn: {
    position: "absolute",
    right: 10,
    top: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },

  emptyState: {
    marginTop: 40,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#444",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
