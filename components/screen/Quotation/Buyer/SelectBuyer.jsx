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

export default function SelectBuyer({ navigation, route }) {
  const [search, setSearch] = useState("");
  const { buyerDetails, onSave } = route.params || {};
  const [savedBuyers, setSavedBuyers] = useState([]);

  async function getExistingBuyers() {
    try {
      const buyerJson = await getItemAsync("buyers");
      if (!buyerJson) {
        setSavedBuyers([]);
        return;
      }
      const parsed = JSON.parse(buyerJson);
      if (Array.isArray(parsed)) setSavedBuyers(parsed);
      else setSavedBuyers([]);
    } catch (e) {
      console.warn("Error parsing buyers from secure store", e);
      setSavedBuyers([]);
    }
  }

  useEffect(() => {
    getExistingBuyers();
  }, []);

  async function persistBuyers(list) {
    try {
      await setItemAsync("buyers", JSON.stringify(list || []));
    } catch (e) {
      console.warn("Failed to persist buyers", e);
    }
  }

  const filteredBuyers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return savedBuyers;
    return savedBuyers.filter((s) => {
      if (!s) return false;
      const companyName = (s.companyName || "").toLowerCase();
      const gst = (s.gstin || "").toLowerCase();
      const email = (s.email || "").toLowerCase();
      const st = (s.state || "").toLowerCase();
      return (
        companyName.includes(q) || gst.includes(q) || email.includes(q) || st.includes(q)
      );
    });
  }, [search, savedBuyers]);

  const handleSelect = (buyer) => {
    if (onSave) onSave(buyer);
    navigation.goBack();
  };

  // handle edit - open AddSupplier with initial data and update on save
  const handleEdit = (buyer, originalIndex) => {
    navigation.navigate("AddBuyer", {
      buyerDetails: buyer,
      onSave: (savedBuyer) => {
        if (onSave) onSave(savedBuyer);
      },
    });
  };

  const BuyerDetailsComponent = ({ data, index, originalIndex }) => (
    <View
      style={styles.buyerCard}
      key={`${data?.firmName ?? "buyer"}-${index}`}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleSelect(data)}
        style={styles.buyerTouchable}
      >
        <View style={styles.buyerTop}>
          <Text style={styles.firmName} numberOfLines={1}>
            {data?.companyName || "—"}
          </Text>
          <Text style={styles.smallText}>{data?.state || ""}</Text>
        </View>

        <View style={styles.buyerRow}>
          <View style={styles.buyerCol}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{data?.email || "—"}</Text>
          </View>

          <View style={styles.buyerCol}>
            <Text style={styles.label}>GSTIN</Text>
            <Text style={styles.value}>{data?.gstin || "—"}</Text>
          </View>
        </View>

        <View style={[styles.buyerRow, { marginTop: 8 }]}>
          <View style={styles.buyerColFull}>
            <Text style={styles.label}>State</Text>
            <Text style={styles.value} numberOfLines={2}>
              {data?.state || "—"}
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
              <Text style={styles.headerTitle}>Select Buyer</Text>
            </View>

            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => {
                navigation.navigate("AddBuyer", {
                  onSave: (savedBuyer) => {
                    // add to list locally + call parent onSave if provided
                    if (savedBuyer) {
                      setSavedBuyers((prev) => {
                        const next = [savedBuyer, ...(prev || [])];
                        persistBuyers(next);
                        return next;
                      });
                    }
                    if (onSave) onSave(savedBuyer);
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
              placeholder="Search buyer, GSTIN, email, state..."
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
          {filteredBuyers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No Buyers found</Text>
              <Text style={styles.emptySub}>
                {savedBuyers.length === 0
                  ? "You don't have any buyers yet. Add one using + Add."
                  : `No results for "${search}"`}
              </Text>
            </View>
          ) : (
            filteredBuyers.map((ele, i) => {
              // find original index in savedSuppliers to allow proper update
              const originalIndex = savedBuyers.findIndex(
                (s) =>
                  (ele.gstin && s.gstin === ele.gstin) ||
                  (ele.pancard && s.pancard === ele.pancard) ||
                  (ele.firmName && s.firmName === ele.firmName)
              );
              return (
                <BuyerDetailsComponent
                  data={ele}
                  index={i}
                  originalIndex={originalIndex}
                  key={`buyer-${i}`}
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

  buyerCard: {
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

  buyerTouchable: {
    // keep padding so content looks clickable
  },

  buyerTop: {
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

  buyerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  buyerCol: {
    flex: 1,
    marginRight: 8,
  },

  buyerColFull: {
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
