import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';

const INITIAL_COURSES = [
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

export default function DashboardScreen({ email, fullName, setCurrentScreen, onOpenRoster }) {
  const [courses, setCourses] = useState(INITIAL_COURSES);
  const [modalVisible, setModalVisible] = useState(false);

  // Add Class Form State
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [schedule, setSchedule] = useState('');
  const [room, setRoom] = useState('');
  const [enrolledCount, setEnrolledCount] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  const totalAnomalies = courses.reduce(
    (sum, item) => sum + (item.pending_anomalies || 0),
    0
  );

  const handleAddClass = () => {
    if (!courseCode.trim() || !courseName.trim() || !schedule.trim() || !room.trim()) {
      Alert.alert('Missing Details', 'Please fill in the course code, name, schedule, and room.');
      return;
    }

    const newCourse = {
      course_id: `CRS-${Date.now()}`,
      course_code: courseCode.trim().toUpperCase(),
      course_name: courseName.trim(),
      schedule: schedule.trim(),
      room: room.trim(),
      enrolled_count: parseInt(enrolledCount, 10) || 0,
      pending_anomalies: 0
    };

    setCourses([newCourse, ...courses]);
    setCourseCode('');
    setCourseName('');
    setSchedule('');
    setRoom('');
    setEnrolledCount('');
    setModalVisible(false);
  };

  const handleDeleteClass = (courseId, code, name) => {
    Alert.alert(
      'Delete Class',
      `Are you sure you want to remove ${code} - ${name} from your dashboard?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setCourses((prev) => prev.filter((item) => item.course_id !== courseId));
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        {/* Top Header */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.greetingLabel}>DLSAU Faculty Portal</Text>
            <Text style={styles.screenHeader}>
              {fullName ? fullName : 'Faculty Dashboard'}
            </Text>
            <Text style={styles.subText}>{email}</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => setCurrentScreen('AUTH')}
          >
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Metric Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{courses.length}</Text>
            <Text style={styles.statLabel}>Assigned Classes</Text>
          </View>
          <View style={styles.statCard}>
            <Text
              style={[
                styles.statNumber,
                { color: totalAnomalies > 0 ? '#DC2626' : '#82B428' }
              ]}
            >
              {totalAnomalies}
            </Text>
            <Text style={styles.statLabel}>Pending Anomalies</Text>
          </View>
        </View>

        {/* Section Header + Self-Service "+ Add Class" Trigger */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Your Courses</Text>
          <TouchableOpacity
            style={styles.addClassPill}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addClassPillText}>+ Add Class</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Course List */}
        <FlatList
          data={courses}
          keyExtractor={(item) => item.course_id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No Classes Assigned</Text>
              <Text style={styles.emptySub}>
                Tap "+ Add Class" above to add a subject to your dashboard.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <View style={styles.codeBadge}>
                  <Text style={styles.courseCode}>{item.course_code}</Text>
                </View>
                <Text style={styles.roomBadge}>{item.room}</Text>
              </View>

              <Text style={styles.courseName}>{item.course_name}</Text>
              <Text style={styles.scheduleText}>{item.schedule}</Text>

              <View style={styles.divider} />

              <View style={styles.cardFooter}>
                <Text style={styles.metaText}>
                  <Text style={styles.metaBold}>{item.enrolled_count}</Text> Students •{' '}
                  <Text
                    style={[
                      styles.metaBold,
                      item.pending_anomalies > 0 && { color: '#DC2626' }
                    ]}
                  >
                    {item.pending_anomalies} Anomalies
                  </Text>
                </Text>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.deleteClassBtn}
                    onPress={() =>
                      handleDeleteClass(item.course_id, item.course_code, item.course_name)
                    }
                  >
                    <Text style={styles.deleteClassBtnText}>Delete</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cardSmallBtn}
                    onPress={() => onOpenRoster && onOpenRoster(item)}
                  >
                    <Text style={styles.cardSmallBtnText}>List</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />

        {/* Bottom Primary & Secondary Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() =>
              Alert.alert('Live Session', 'Ready to connect Screen 5: Live Seat Map!')
            }
          >
            <Text style={styles.primaryBtnText}>+ Start Class Session</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setCurrentScreen('HEALTH')}
          >
            <Text style={styles.secondaryBtnText}>View System Health</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL: ADD NEW CLASS */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Add New Class</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSubtitle}>
                Enter your DLSAU course details below to add it to your active load.
              </Text>

              <Text style={styles.label}>Course Code</Text>
              <TextInput
                style={[styles.input, focusedField === 'CODE' && styles.inputFocused]}
                placeholder="e.g. CS 309"
                placeholderTextColor="#94A3B8"
                value={courseCode}
                onFocus={() => setFocusedField('CODE')}
                onBlur={() => setFocusedField(null)}
                onChangeText={setCourseCode}
              />

              <Text style={styles.label}>Course Name</Text>
              <TextInput
                style={[styles.input, focusedField === 'NAME' && styles.inputFocused]}
                placeholder="e.g. Human-Computer Interaction"
                placeholderTextColor="#94A3B8"
                value={courseName}
                onFocus={() => setFocusedField('NAME')}
                onBlur={() => setFocusedField(null)}
                onChangeText={setCourseName}
              />

              <Text style={styles.label}>Schedule</Text>
              <TextInput
                style={[styles.input, focusedField === 'SCHED' && styles.inputFocused]}
                placeholder="e.g. MWF 10:30 AM - 12:00 PM"
                placeholderTextColor="#94A3B8"
                value={schedule}
                onFocus={() => setFocusedField('SCHED')}
                onBlur={() => setFocusedField(null)}
                onChangeText={setSchedule}
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 0.58 }}>
                  <Text style={styles.label}>Room Assignment</Text>
                  <TextInput
                    style={[styles.input, focusedField === 'ROOM' && styles.inputFocused]}
                    placeholder="Osmeña Hall 302"
                    placeholderTextColor="#94A3B8"
                    value={room}
                    onFocus={() => setFocusedField('ROOM')}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={setRoom}
                  />
                </View>

                <View style={{ flex: 0.38 }}>
                  <Text style={styles.label}>Enrolled</Text>
                  <TextInput
                    style={[styles.input, focusedField === 'COUNT' && styles.inputFocused]}
                    placeholder="35"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    value={enrolledCount}
                    onFocus={() => setFocusedField('COUNT')}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={setEnrolledCount}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleAddClass}>
                <Text style={styles.primaryBtnText}>Save Class to Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3EB'
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16
  },

  // Top Bar
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  greetingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#82B428',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2
  },
  screenHeader: {
    fontSize: 28,
    fontWeight: '900',
    color: '#070B24',
    letterSpacing: -0.5
  },
  subText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500'
  },
  logoutBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0'
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700'
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22
  },
  statCard: {
    flex: 0.48,
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#070B24',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#070B24'
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600'
  },

  // Courses Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#070B24'
  },
  addClassPill: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#98C93C'
  },
  addClassPillText: {
    color: '#65A30D',
    fontSize: 13,
    fontWeight: '800'
  },

  // Empty State
  emptyBox: {
    backgroundColor: '#FFFFFF',
    padding: 28,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginTop: 10
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#070B24',
    marginBottom: 4
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center'
  },

  // Course Card
  courseCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#070B24',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  codeBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0'
  },
  courseCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#65A30D'
  },
  roomBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  courseName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#070B24',
    marginBottom: 4
  },
  scheduleText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500'
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  metaText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
    marginRight: 8
  },
  metaBold: {
    fontWeight: '700',
    color: '#070B24'
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  deleteClassBtn: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginRight: 8
  },
  deleteClassBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700'
  },
  cardSmallBtn: {
    backgroundColor: '#070B24',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10
  },
  cardSmallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },

  // Bottom Buttons
  bottomActions: {
    paddingTop: 6
  },
  primaryBtn: {
    backgroundColor: '#070B24',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#98C93C',
    marginTop: 10
  },
  secondaryBtnText: {
    color: '#82B428',
    fontSize: 15,
    fontWeight: '700'
  },

  // Add Class Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 11, 36, 0.45)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    borderWidth: 1.5,
    borderColor: '#E2E8F0'
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#070B24'
  },
  closeBtnText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#64748B',
    padding: 4
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 18,
    fontWeight: '500'
  },
  label: {
    color: '#1E293B',
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '700'
  },
  input: {
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    fontSize: 15
  },
  inputFocused: {
    borderColor: '#82B428',
    backgroundColor: '#FFFFFF'
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
});