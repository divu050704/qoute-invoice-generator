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

export default function SelectBankDetail({ navigation, route }) {
  const [search, setSearch] = useState("");
  const { BankDetails, onSave } = route.params || {};
  const [savedBankDetails, setSavedBankDetails] = useState([]);

  async function getExistingBankDetails() {
    try {
      const BankDetailJson = await getItemAsync("bankDetails");
      if (!BankDetailJson) {
        setSavedBankDetails([]);
        return;
      }
      const parsed = JSON.parse(BankDetailJson);
      if (Array.isArray(parsed)) setSavedBankDetails(parsed);
      else setSavedBankDetails([]);
    } catch (e) {
      console.warn("Error parsing bankDetails from secure store", e);
      setSavedBankDetails([]);
    }
  }

  useEffect(() => {
    getExistingBankDetails();
  }, []);

  async function persistBankDetails(list) {
    try {
      await setItemAsync("bankDetails", JSON.stringify(list || []));
    } catch (e) {
      console.warn("Failed to persist bankDetails", e);
    }
  }

  const filteredBankDetails = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return savedBankDetails;
    return savedBankDetails.filter((s) => {
      if (!s) return false;
      const ifscCode = (s.ifscCode || "").toLowerCase();
      const bankName = (s.branchName || "").toLowerCase();
      const branchName = (s.branchName || "").toLowerCase();
      const accountNumber = (s.accountNumber || "").toLowerCase();
      const holderName = (s.holderName || "").toLowerCase();
      return (
        ifscCode.includes(q) || bankName.includes(q) || branchName.includes(q) || accountNumber.includes(q) || holderName.includes(q)
      );
    });
  }, [search, savedBankDetails]);

  const handleSelect = (bankDetails) => {
    if (onSave) onSave(bankDetails);
    navigation.goBack();
  };

  // handle edit - open AddSupplier with initial data and update on save
  const handleEdit = (bankDetails, originalIndex) => {
    navigation.navigate("AddBankDetails", {
      bankDetails: bankDetails,
      onSave: (savedBankDetail) => {
        if (onSave) onSave(savedBankDetail);
      },
    });
  };

  const BankDetailDetailsComponent = ({ data, index, originalIndex }) => (
    <View
      style={styles.BankDetailCard}
      key={`${data?.firmName ?? "bankDetails"}-${index}`}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleSelect(data)}
        style={styles.BankDetailTouchable}
      >
        <View style={styles.BankDetailTop}>
          <Text style={styles.firmName} numberOfLines={1}>
            {data?.accountNumber || "—"}
          </Text>
          <Text style={styles.smallText}>{data?.state || ""}</Text>
        </View>

        <View style={styles.BankDetailRow}>
          <View style={styles.BankDetailCol}>
            <Text style={styles.label}>IFSC</Text>
            <Text style={styles.value}>{data?.ifscCode || "—"}</Text>
          </View>

          <View style={styles.BankDetailCol}>
            <Text style={styles.label}>Bank</Text>
            <Text style={styles.value}>{data?.bankName || "—"}</Text>
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
              <Text style={styles.headerTitle}>Select Bank Details</Text>
            </View>

            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => {
                navigation.navigate("AddBankDetails", {
                  onSave: (savedBankDetail) => {
                    // add to list locally + call parent onSave if provided
                    if (savedBankDetail) {
                      setSavedBankDetails((prev) => {
                        const next = [savedBankDetail, ...(prev || [])];
                        persistBankDetails(next);
                        return next;
                      });
                    }
                    if (onSave) onSave(savedBankDetail);
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
              placeholder="Search holder name, ifsc, bank name..."
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
          {filteredBankDetails.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No Bank Details found</Text>
              <Text style={styles.emptySub}>
                {savedBankDetails.length === 0
                  ? "You don't have any Bank Details yet. Add one using + Add."
                  : `No results for "${search}"`}
              </Text>
            </View>
          ) : (
            filteredBankDetails.map((ele, i) => {
              // find original index in savedSuppliers to allow proper update
              const originalIndex = savedBankDetails.findIndex(
                (s) =>
                  (ele.accountNumber && s.accountNumber === ele.accountNumber) 
              );
              return (
                <BankDetailDetailsComponent
                  data={ele}
                  index={i}
                  originalIndex={originalIndex}
                  key={`bankDetails-${i}`}
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

  BankDetailCard: {
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

  BankDetailTouchable: {
    // keep padding so content looks clickable
  },

  BankDetailTop: {
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

  BankDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  BankDetailCol: {
    flex: 1,
    marginRight: 8,
  },

  BankDetailColFull: {
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
