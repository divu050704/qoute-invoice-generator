import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FileText, Sparkles, Wallet } from "lucide-react-native";
import Colors from "../colors";
import { StatusBar } from "expo-status-bar";

export default function HomeScreen({ navigation }) {
  const userName = "Guest User";

  function onPressGenerateQuotations() {
    navigation?.navigate('QuotationsScreen');
  
  }

  function onPressGenerateInvoice() {
    // navigation?.navigate('InvoiceGenerator');
    console.log("Go to Invoice Generator");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.username}>{userName} 👋</Text>
        </View>
        <View style={styles.pulseWrap}>
          <Sparkles width={28} height={28} color={Colors.warning} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create something new</Text>
        <Text style={styles.cardSubtitle}>Pick a generator to get started</Text>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.button, styles.leftButton]}
            onPress={onPressGenerateQuotations}
            activeOpacity={0.8}
          >
            <View style={styles.iconWrap}>
              <FileText width={20} height={20} color={Colors.white} />
            </View>
            <Text style={styles.buttonText}>Quotation Generator</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.rightButton]}
            onPress={onPressGenerateInvoice}
            activeOpacity={0.8}
          >
            <View style={styles.iconWrap}>
              <Wallet width={20} height={20} color={Colors.white} />
            </View>
            <Text style={styles.buttonText}>Invoice Generator</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Quick Tips</Text>
        <Text style={styles.infoText}>
          • Use clear, consistent invoice titles so they’re easy to track.
        </Text>
        <Text style={styles.infoText}>
          • Create multiple quotation versions to compare pricing easily.
        </Text>
        <Text style={styles.infoText}>
          • Always include due dates and payment terms to avoid confusion.
        </Text>
        <Text style={styles.infoText}>
          • Review all client details before generating the final document.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Made with ❤️ • ProGarden India
        </Text>
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  greeting: {
    color: Colors.primaryDark,
    fontSize: 16,
  },
  username: {
    color: Colors.black,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
  },
  pulseWrap: {
    backgroundColor: Colors.white,
    padding: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 6,
    marginBottom: 14,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  leftButton: {
    backgroundColor: Colors.accentGreen,
    marginRight: 10,
  },
  rightButton: {
    backgroundColor: Colors.success,
    marginLeft: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  buttonText: {
    color: Colors.white,
    fontWeight: "600",
    fontSize: 14,
    flex: 1,
    flexWrap: "wrap",
    flexShrink: 1,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
  },
  infoTitle: {
    fontWeight: "700",
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  infoText: {
    color: "#555",
    fontSize: 13,
    marginBottom: 6,
  },
  footer: {
    alignItems: "center",
    marginTop: "auto",
    paddingVertical: 16,
  },
  footerText: {
    color: "#999",
    fontSize: 12,
  },
});
