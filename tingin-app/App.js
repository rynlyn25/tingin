import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert
} from 'react-native';

const MOCK_COURSES = [
  {
    course_id: 'CS301',
    course_code: 'CS 301',
    course_name: 'Software Engineering',
    schedule: 'MWF 09:00 AM - 10:30 AM',
    room: 'Osmeña Hall Rm 302',
    enrolled_count: 35,
    pending_anomalies: 2
  },
  {
    course_id: 'CS305',
    course_code: 'CS 305',
    course_name: 'Architecture and Organization',
    schedule: 'TTH 01:00 PM - 02:30 PM',
    room: 'Osmeña Hall Rm 304',
    enrolled_count: 40,
    pending_anomalies: 0
  }
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('AUTH'); // AUTH | DASHBOARD | HEALTH
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [email, setEmail] = useState('juan.delacruz@dlsau.edu.ph');
  const [password, setPassword] = useState('********');

  const handleAuth = () => {
    if (!email.toLowerCase().endsWith('@dlsau.edu.ph')) {
      Alert.alert(
        'Access Restricted',
        'Professor-Exclusive System: Please use a valid @dlsau.edu.ph institutional email.'
      );
      return;
    }
    setCurrentScreen('DASHBOARD');
  };

  // SCREEN 1: AUTHENTICATION & FACULTY SIGN-UP
  if (currentScreen === 'AUTH') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authBox}>
          <Text style={styles.brandTitle}>TINGIN</Text>
          <Text style={styles.brandSubtitle}>
            Autonomous Vision-Based Attendance System
          </Text>
          <Text style={styles.badge}>DLSAU Faculty-Exclusive Portal</Text>

          {isSignUp && (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Prof. Juan Dela Cruz"
                placeholderTextColor="#94A3B8"
                value={fullName}
                onChangeText={setFullName}
              />
              <Text style={styles.label}>DLSAU Employee ID</Text>
              <TextInput
                style={styles.input}
                placeholder="FAC-2026-001"
                placeholderTextColor="#94A3B8"
                value={facultyId}
                onChangeText={setFacultyId}
              />
            </>
          )}

          <Text style={styles.label}>Institutional Email</Text>
          <TextInput
            style={styles.input}
            placeholder="professor@dlsau.edu.ph"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={handleAuth}>
            <Text style={styles.primaryBtnText}>
              {isSignUp ? 'Register Faculty Account' : 'Sign In to Dashboard'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.switchBtnText}>
              {isSignUp
                ? 'Already have a faculty account? Sign In'
                : 'New Faculty Member? Register with @dlsau.edu.ph'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // SCREEN 10: SYSTEM HEALTH DIAGNOSTICS
  if (currentScreen === 'HEALTH') {
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

  // SCREEN 2: GLOBAL DASHBOARD (HOME SCREEN)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.screenHeader}>Faculty Dashboard</Text>
            <Text style={styles.subText}>{email}</Text>
          </View>
          <TouchableOpacity
            style={styles.smallBtn}
            onPress={() => setCurrentScreen('AUTH')}
          >
            <Text style={styles.smallBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>Assigned Classes</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#F87171' }]}>2</Text>
            <Text style={styles.statLabel}>Pending Anomalies</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Courses</Text>
        <FlatList
          data={MOCK_COURSES}
          keyExtractor={(item) => item.course_id}
          renderItem={({ item }) => (
            <View style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <Text style={styles.courseCode}>{item.course_code}</Text>
                <Text style={styles.roomBadge}>{item.room}</Text>
              </View>
              <Text style={styles.courseName}>{item.course_name}</Text>
              <Text style={styles.scheduleText}>{item.schedule}</Text>
              <Text style={styles.metaText}>
                Enrolled: {item.enrolled_count} Students • Anomalies: {item.pending_anomalies}
              </Text>
            </View>
          )}
        />

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() =>
            Alert.alert('Next Screen', 'Ready to connect Screen 5: Live Seat Map!')
          }
        >
          <Text style={styles.primaryBtnText}>+ Start Class Session</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, { marginTop: 10 }]}
          onPress={() => setCurrentScreen('HEALTH')}
        >
          <Text style={styles.primaryBtnText}>View System Health (Screen 10)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F291E' },
  authBox: { flex: 1, justifyContent: 'center', padding: 24 },
  innerContainer: { flex: 1, padding: 20, paddingTop: 40 },
  brandTitle: { fontSize: 34, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', letterSpacing: 2 },
  brandSubtitle: { fontSize: 13, color: '#CBD5E1', textAlign: 'center', marginTop: 4 },
  badge: { fontSize: 12, color: '#A3E635', textAlign: 'center', marginTop: 6, marginBottom: 28, fontWeight: '600' },
  label: { color: '#E2E8F0', fontSize: 13, marginBottom: 6, fontWeight: '500' },
  input: { backgroundColor: '#1B4332', color: '#FFFFFF', padding: 14, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#2D6A4F' },
  primaryBtn: { backgroundColor: '#2D6A4F', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  secondaryBtn: { backgroundColor: '#1B4332', padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#40916C' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  switchBtn: { marginTop: 18, alignItems: 'center' },
  switchBtnText: { color: '#A3E635', fontSize: 13 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  screenHeader: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  subText: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  smallBtn: { backgroundColor: '#1B4332', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6 },
  smallBtnText: { color: '#F87171', fontSize: 12, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { flex: 0.48, backgroundColor: '#1B4332', padding: 16, borderRadius: 10, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#A3E635' },
  statLabel: { fontSize: 12, color: '#CBD5E1', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  courseCard: { backgroundColor: '#1B4332', padding: 16, borderRadius: 10, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#A3E635' },
  courseHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  courseCode: { fontSize: 16, fontWeight: 'bold', color: '#A3E635' },
  roomBadge: { fontSize: 12, color: '#CBD5E1', backgroundColor: '#0F291E', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  courseName: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 },
  scheduleText: { fontSize: 12, color: '#CBD5E1', marginBottom: 6 },
  metaText: { fontSize: 12, color: '#94A3B8' },
  card: { backgroundColor: '#1B4332', padding: 20, borderRadius: 12, marginVertical: 20 },
  diagnosticItem: { color: '#E2E8F0', fontSize: 14, marginBottom: 12 }
});