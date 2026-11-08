import React from 'react';
import {
  StyleSheet,
  Text,
  View,
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

export default function DashboardScreen({ email, setCurrentScreen }) {
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
  innerContainer: { flex: 1, padding: 20, paddingTop: 40 },
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
  primaryBtn: { backgroundColor: '#2D6A4F', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  secondaryBtn: { backgroundColor: '#1B4332', padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#40916C' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' }
});