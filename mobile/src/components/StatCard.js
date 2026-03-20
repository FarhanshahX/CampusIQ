import React from "react";
import { View, Text, StyleSheet } from "react-native";

const StatCard = ({ icon, label, value, sub, accent = "#6366F1" }) => {
  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: accent + "15" }]}>
        <Text style={[styles.icon, { color: accent }]}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value ?? "—"}</Text>
        {sub && <Text style={styles.sub}>{sub}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  value: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
  },
  sub: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
    marginTop: 2,
  },
});

export default StatCard;
