import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FileText, Wallet, Sparkles } from "lucide-react-native";
import Colors from "../../../colors";
import { getItemAsync } from "expo-secure-store";

export default function HomeTab({ navigation }) {
  const [companyName, setCompanyName] = useState("Guest User");

  useEffect(() => {
    (async () => {
      try {
        const raw = await getItemAsync("supplier");
        const supplier = raw ? JSON.parse(raw) : null;
        const name =
          supplier?.[0]?.firmName ||
          supplier?.firmName ||
          supplier?.firm ||
          "Guest User";
        setCompanyName(name);
      } catch {
        setCompanyName("Guest User");
      }
    })();
  }, []);

  const Card = ({ icon, title, subtitle, onPress }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.9, transform: [{ scale: 0.995 }] },
      ]}
    >
      <View style={styles.iconCircle}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.companyName}>{companyName}</Text>
        </View>

      </View>

      {/* Slim accent divider */}
      <View style={styles.topDivider} />

      {/* Content */}
      <View style={styles.container}>
        <Card
          icon={<FileText size={20} color={Colors.accentGreen} />}
          title="Quotations"
          subtitle="Create & manage quotes"
          onPress={() => navigation.navigate("QuotationsScreen")}
        />

        <Card
          icon={<Wallet size={20} color={Colors.accentGreen} />}
          title="Invoices"
          subtitle="Generate invoices quickly"
          onPress={() => navigation.navigate("InvoiceMain")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  greeting: {
    fontSize: 14,
    color: Colors.black,
    opacity: 0.6,
  },

  companyName: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.black,
    marginTop: 2,
  },

  badge: {
    backgroundColor: Colors.accentGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  badgeText: {
    color: Colors.white,
    fontWeight: "600",
    fontSize: 12,
  },

  topDivider: {
    height: 3,
    backgroundColor: Colors.accentGreen,
    width: "100%",
  },

  container: {
    paddingHorizontal: 18,
    paddingTop: 20,
    gap: 14,
  },

  card: {
    flexDirection: "row",
    backgroundColor: Colors.backgroundLight,
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.black,
  },

  cardSubtitle: {
    fontSize: 13,
    color: Colors.primaryDark,
    marginTop: 2,
  },

  chevron: {
    fontSize: 28,
    color: Colors.primaryDark,
    opacity: 0.5,
    marginLeft: 10,
    marginRight: 2,
  },
});
