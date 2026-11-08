import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';

export default function HealthScreen({ setCurrentScreen }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.screenHeader}>System Health & Diagnostics</Text>
        <View style={styles.card}>
          <Text style={styles.diagnosticItem}>🟢 Linux Cloud VPS: Online (Mock Mode)</Text>
          <Text style={styles.diagnosticItem}>🟢 MySQL Database: SQLCipher AES-256 Active</Text>
          <Text style={styles.diagnosticItem}>🟢 AI Pipeline: YOLOv8 + MiniFASNet + MobileFaceNet</Text>
          <Text style={styles.diagnosticItem}>🟢 Zero-Retention Policy: Auto-Purge Enabled</Text>
          <Text style={styles.diagnosticItem}>🟢 IoT 5MP CCTV IP: 192.168.1.108 (15-min FTP)</Text>
        </View>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => setCurrentScreen('DASHBOARD')}
        >
          <Text style={styles.primaryBtnText}>Back to Global Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F291E' },
  innerContainer: { flex: 1, padding: 20, paddingTop: 40 },
  screenHeader: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 10 },
  card: { backgroundColor: '#1B4332', padding: 20, borderRadius: 12, marginVertical: 20 },
  diagnosticItem: { color: '#E2E8F0', fontSize: 14, marginBottom: 12 },
  secondaryBtn: { backgroundColor: '#1B4332', padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#40916C' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' }
});