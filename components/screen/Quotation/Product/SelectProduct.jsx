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

export default function SelectProduct({ navigation, route }) {
  const [search, setSearch] = useState("");
  const { productDetails, onSave } = route.params || {};
  const [savedProducts, setSavedProducts] = useState([]);

  async function getExistingProducts() {
    try {
      const productJson = await getItemAsync("products");
      if (!productJson) {
        setSavedProducts([]);
        return;
      }
      const parsed = JSON.parse(productJson);
      if (Array.isArray(parsed)) setSavedProducts(parsed);
      else setSavedProducts([]);
    } catch (e) {
      console.warn("Error parsing products from secure store", e);
      setSavedProducts([]);
    }
  }

  useEffect(() => {
    getExistingProducts();
  }, []);

  async function persistProducts(list) {
    try {
      await setItemAsync("products", JSON.stringify(list || []));
    } catch (e) {
      console.warn("Failed to persist products", e);
    }
  }

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return savedProducts;
    return savedProducts.filter((s) => {
      if (!s) return false;
      const productName = (s.productName || "").toLowerCase();
      const unitPrice = (s.unitPrice || "").toLowerCase();
      const amount = (s.amount || "").toLowerCase();
      return (
        productName.includes(q) || unitPrice.includes(q) || amount.includes(q) 
      );
    });
  }, [search, savedProducts]);

  const handleSelect = (product) => {
    if (onSave) onSave(product);
    navigation.goBack();
  };

  // handle edit - open AddSupplier with initial data and update on save
  const handleEdit = (product, originalIndex) => {
    navigation.navigate("AddProduct", {
      productDetails: product,
      onSave: (savedProduct) => {
        if (onSave) onSave(savedProduct);
      },
    });
  };

  const ProductDetailsComponent = ({ data, index, originalIndex }) => (
    <View
      style={styles.productCard}
      key={`${data?.firmName ?? "product"}-${index}`}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleSelect(data)}
        style={styles.productTouchable}
      >
        <View style={styles.productTop}>
          <Text style={styles.firmName} numberOfLines={1}>
            {data?.productName || "—"}
          </Text>
          <Text style={styles.smallText}>{data?.state || ""}</Text>
        </View>

        <View style={styles.productRow}>
          <View style={styles.productCol}>
            <Text style={styles.label}>Price</Text>
            <Text style={styles.value}>{data?.unitPrice || "—"}</Text>
          </View>

          <View style={styles.productCol}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>{data?.amount || "—"}</Text>
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
              <Text style={styles.headerTitle}>Select Product</Text>
            </View>

            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => {
                navigation.navigate("AddProduct", {
                  onSave: (savedProduct) => {
                    // add to list locally + call parent onSave if provided
                    if (savedProduct) {
                      setSavedProducts((prev) => {
                        const next = [savedProduct, ...(prev || [])];
                        persistProducts(next);
                        return next;
                      });
                    }
                    if (onSave) onSave(savedProduct);
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
              placeholder="Search name"
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
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No Products found</Text>
              <Text style={styles.emptySub}>
                {savedProducts.length === 0
                  ? "You don't have any products yet. Add one using + Add."
                  : `No results for "${search}"`}
              </Text>
            </View>
          ) : (
            filteredProducts.map((ele, i) => {
              // find original index in savedSuppliers to allow proper update
              const originalIndex = savedProducts.findIndex(
                (s) =>
                  (ele.productName && s.productName === ele.productName) ||
                  (ele.unitPrice && s.unitPrice === ele.unitPrice) ||
                  (ele.amount && s.amount === ele.amount)
              );
              return (
                <ProductDetailsComponent
                  data={ele}
                  index={i}
                  originalIndex={originalIndex}
                  key={`product-${i}`}
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

  productCard: {
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

  productTouchable: {
    // keep padding so content looks clickable
  },

  productTop: {
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

  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  productCol: {
    flex: 1,
    marginRight: 8,
  },

  productColFull: {
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
