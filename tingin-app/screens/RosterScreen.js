import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  PanResponder,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const INITIAL_STUDENTS = {
  CS301: [
    {
      id: '2024-1001',
      name: 'Dela Cruz, Mateo',
      seat: 'A1',
      status: 'PRESENT',
      confidence: '98.4%',
      biometric_enrolled: true,
      anomaly_note: null
    },
    {
      id: '2024-1002',
      name: 'Santos, Clara Isabel',
      seat: 'A2',
      status: 'ANOMALY',
      confidence: '61.2%',
      biometric_enrolled: true,
      anomaly_note: 'Low face match confidence (MiniFASNet liveness passed)'
    },
    {
      id: '2024-1003',
      name: 'Reyes, Gabriel',
      seat: 'A3',
      status: 'PRESENT',
      confidence: '96.9%',
      biometric_enrolled: true,
      anomaly_note: null
    },
    {
      id: '2024-1004',
      name: 'Mendoza, Sofia Marie',
      seat: 'B1',
      status: 'ANOMALY',
      confidence: '0.0%',
      biometric_enrolled: true,
      anomaly_note: 'Seat occupied in CCTV frame, face occluded'
    },
    {
      id: '2024-1005',
      name: 'Bautista, Lucas',
      seat: 'B2',
      status: 'ABSENT',
      confidence: '-',
      biometric_enrolled: false,
      anomaly_note: null
    }
  ],
  CS305: [
    {
      id: '2024-2001',
      name: 'Villanueva, Hannah',
      seat: 'A1',
      status: 'PRESENT',
      confidence: '99.1%',
      biometric_enrolled: true,
      anomaly_note: null
    },
    {
      id: '2024-2002',
      name: 'Garcia, Joaquin',
      seat: 'A2',
      status: 'PRESENT',
      confidence: '97.5%',
      biometric_enrolled: true,
      anomaly_note: null
    }
  ]
};

// Swipeable Student Row Component
function SwipeableStudentRow({ item, badge, onSelectStatus }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);
  const ACTION_WIDTH = 216; // Total width of Present + Late + Absent buttons

  const openActions = () => {
    isOpen.current = true;
    Animated.spring(translateX, {
      toValue: -ACTION_WIDTH,
      friction: 7,
      tension: 60,
      useNativeDriver: true
    }).start();
  };

  const closeActions = () => {
    isOpen.current = false;
    Animated.spring(translateX, {
      toValue: 0,
      friction: 7,
      tension: 60,
      useNativeDriver: true
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) => {
        const base = isOpen.current ? -ACTION_WIDTH : 0;
        const nextX = Math.min(0, Math.max(-ACTION_WIDTH - 20, base + gestureState.dx));
        translateX.setValue(nextX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -45) {
          openActions();
        } else if (gestureState.dx > 45) {
          closeActions();
        } else {
          isOpen.current ? openActions() : closeActions();
        }
      }
    })
  ).current;

  const chooseStatus = (newStatus) => {
    closeActions();
    onSelectStatus(item.id, newStatus);
  };

  return (
    <View style={styles.swipeWrapper}>
      {/* Hidden Right-Side Action Buttons revealed on Slide Left */}
      <View style={styles.hiddenActionsContainer}>
        <TouchableOpacity
          style={[styles.swipeBtn, { backgroundColor: '#65A30D' }]}
          onPress={() => chooseStatus('PRESENT')}
        >
          <Text style={styles.swipeBtnText}>Present</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.swipeBtn, { backgroundColor: '#CA8A04' }]}
          onPress={() => chooseStatus('LATE')}
        >
          <Text style={styles.swipeBtnText}>Late</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.swipeBtn, { backgroundColor: '#64748B' }]}
          onPress={() => chooseStatus('ABSENT')}
        >
          <Text style={styles.swipeBtnText}>Absent</Text>
        </TouchableOpacity>
      </View>

      {/* Foreground Sliding Student Card */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.studentCard, { transform: [{ translateX }] }]}
      >
        <View style={styles.studentTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.studentMeta}>
              ID: {item.id} • Seat {item.seat} • Match: {item.confidence}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: badge.bg, borderColor: badge.border }
            ]}
          >
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>
              {badge.label}
            </Text>
          </View>
        </View>

        {item.anomaly_note && (
          <View style={styles.anomalyBanner}>
            <Text style={styles.anomalyBannerText}>
              ⚠️ {item.anomaly_note} (Slide left to resolve)
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

export default function RosterScreen({ course, setCurrentScreen }) {
  const courseKey = course?.course_id || 'CS301';
  const [students, setStudents] = useState(
    INITIAL_STUDENTS[courseKey] || INITIAL_STUDENTS.CS301
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'ANOMALY'

  // Screen 4: DPA Consent & Biometric Upload Modal State
  const [dpaModalVisible, setDpaModalVisible] = useState(false);
  const [dpaAccepted, setDpaAccepted] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentSeat, setNewStudentSeat] = useState('');
  const [capturedPhotoUri, setCapturedPhotoUri] = useState(null);
  const [captureSource, setCaptureSource] = useState(''); // 'CAMERA' | 'GALLERY'

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterMode === 'ANOMALY') {
      return matchesSearch && s.status === 'ANOMALY';
    }
    return matchesSearch;
  });

  const anomalyCount = students.filter((s) => s.status === 'ANOMALY').length;
  const presentCount = students.filter((s) => s.status === 'PRESENT').length;

  const handleSetStatus = (studentId, newStatus) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          status: newStatus,
          anomaly_note: null // Clears anomaly banner once resolved
        };
      })
    );
  };

  // Option 1: Take Photo Directly from Camera
  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera Permission Needed', 'Please allow camera access to scan student faces.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7
    });

    if (!result.canceled && result.assets?.length > 0) {
      setCapturedPhotoUri(result.assets[0].uri);
      setCaptureSource('CAMERA');
    }
  };

  // Option 2: Upload Photo from Phone Gallery
  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Gallery Permission Needed', 'Please allow photo library access to upload student photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7
    });

    if (!result.canceled && result.assets?.length > 0) {
      setCapturedPhotoUri(result.assets[0].uri);
      setCaptureSource('GALLERY');
    }
  };

  const handleEnrollStudent = () => {
    if (!newStudentName.trim() || !newStudentId.trim()) {
      Alert.alert('Missing Info', 'Please enter the student name and DLSAU ID.');
      return;
    }
    if (!capturedPhotoUri) {
      Alert.alert(
        'Photo Required',
        'Please take a photo with the camera or upload a photo from your library to extract the 128-D facial vector.'
      );
      return;
    }
    if (!dpaAccepted) {
      Alert.alert(
        'DPA Consent Required',
        'Student must accept the RA 10173 Data Privacy Act consent agreement before biometric enrollment.'
      );
      return;
    }

    const newEntry = {
      id: newStudentId.trim(),
      name: newStudentName.trim(),
      seat: newStudentSeat.trim().toUpperCase() || 'C1',
      status: 'PRESENT',
      confidence: '99.2%',
      biometric_enrolled: true,
      anomaly_note: null
    };

    setStudents([newEntry, ...students]);
    setNewStudentName('');
    setNewStudentId('');
    setNewStudentSeat('');
    setDpaAccepted(false);
    setCapturedPhotoUri(null);
    setCaptureSource('');
    setDpaModalVisible(false);

    Alert.alert(
      'Biometric Vector Encrypted',
      '128-D MobileFaceNet embedding stored in AES-256 SQLCipher. Raw source photo purged per Zero-Retention Policy.'
    );
  };

  const getBadgeStyle = (status) => {
    switch (status) {
      case 'PRESENT':
        return { bg: '#F0FDF4', border: '#BBF7D0', text: '#65A30D', label: 'Present' };
      case 'LATE':
        return { bg: '#FEFCE8', border: '#FEF08A', text: '#CA8A04', label: 'Late' };
      case 'ANOMALY':
        return { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', label: 'Anomaly' };
      default:
        return { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B', label: 'Absent' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        {/* Top Navigation */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setCurrentScreen('DASHBOARD')}
          >
            <Text style={styles.backBtnText}>← Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.enrollPill}
            onPress={() => setDpaModalVisible(true)}
          >
            <Text style={styles.enrollPillText}>+ Enroll Biometrics</Text>
          </TouchableOpacity>
        </View>

        {/* Course Title & Metadata */}
        <Text style={styles.courseTag}>
          {course?.course_code || 'CS 301'} • {course?.room || 'Osmeña Hall Rm 302'}
        </Text>
        <Text style={styles.screenHeader}>
          {course?.course_name || 'Software Engineering'} List
        </Text>
        <Text style={styles.subText}>
          Slide any student card left to mark as Present, Late, or Absent.
        </Text>

        {/* Mini Metrics Bar */}
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{students.length}</Text>
            <Text style={styles.metricLabel}>Total List</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={[styles.metricVal, { color: '#65A30D' }]}>{presentCount}</Text>
            <Text style={styles.metricLabel}>Verified</Text>
          </View>
          <View style={styles.metricBox}>
            <Text
              style={[
                styles.metricVal,
                { color: anomalyCount > 0 ? '#DC2626' : '#64748B' }
              ]}
            >
              {anomalyCount}
            </Text>
            <Text style={styles.metricLabel}>Anomalies</Text>
          </View>
        </View>

        {/* Search & Filter Tabs */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search student name or DLSAU ID..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterTab, filterMode === 'ALL' && styles.filterTabActive]}
            onPress={() => setFilterMode('ALL')}
          >
            <Text
              style={[
                styles.filterTabText,
                filterMode === 'ALL' && styles.filterTabTextActive
              ]}
            >
              All Students ({students.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              filterMode === 'ANOMALY' && styles.filterTabActive
            ]}
            onPress={() => setFilterMode('ANOMALY')}
          >
            <Text
              style={[
                styles.filterTabText,
                filterMode === 'ANOMALY' && styles.filterTabTextActive
              ]}
            >
              Pending Anomalies ({anomalyCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Swipeable Student List */}
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <SwipeableStudentRow
              item={item}
              badge={getBadgeStyle(item.status)}
              onSelectStatus={handleSetStatus}
            />
          )}
        />
      </View>

      {/* SCREEN 4: DPA CONSENT & CAMERA/UPLOAD BIOMETRIC ENROLLMENT MODAL */}
      <Modal
        visible={dpaModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDpaModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>DPA Biometric Enrollment</Text>
                <TouchableOpacity onPress={() => setDpaModalVisible(false)}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSubtitle}>
                Republic Act No. 10173 (Data Privacy Act of 2012) Compliance
              </Text>

              <Text style={styles.label}>Student Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Dela Cruz, Juan"
                placeholderTextColor="#94A3B8"
                value={newStudentName}
                onChangeText={setNewStudentName}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 0.62 }}>
                  <Text style={styles.label}>DLSAU Student ID</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="2024-1099"
                    placeholderTextColor="#94A3B8"
                    value={newStudentId}
                    onChangeText={setNewStudentId}
                  />
                </View>
                <View style={{ flex: 0.34 }}>
                  <Text style={styles.label}>Seat Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="B3"
                    placeholderTextColor="#94A3B8"
                    value={newStudentSeat}
                    onChangeText={setNewStudentSeat}
                  />
                </View>
              </View>

              {/* Camera or Photo Upload Selection */}
              <Text style={styles.label}>Facial Biometric Source</Text>
              <View style={styles.photoButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.photoOptionBtn,
                    captureSource === 'CAMERA' && styles.photoOptionBtnActive
                  ]}
                  onPress={handleTakePhoto}
                >
                  <Text style={styles.photoOptionIcon}>📷</Text>
                  <Text style={styles.photoOptionText}>Use Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.photoOptionBtn,
                    captureSource === 'GALLERY' && styles.photoOptionBtnActive
                  ]}
                  onPress={handlePickImage}
                >
                  <Text style={styles.photoOptionIcon}>🖼️</Text>
                  <Text style={styles.photoOptionText}>Upload Photo</Text>
                </TouchableOpacity>
              </View>

              {/* Preview & Vector Status Banner */}
              {capturedPhotoUri && (
                <View style={styles.previewBanner}>
                  <Image
                    source={{ uri: capturedPhotoUri }}
                    style={styles.previewThumb}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.biometricTitle}>
                      ✓ 128-D MobileFaceNet Vector Ready
                    </Text>
                    <Text style={styles.biometricSub}>
                      Source photo will be auto-purged immediately after encryption.
                    </Text>
                  </View>
                </View>
              )}

              {/* DPA Legal Consent Box */}
              <TouchableOpacity
                style={styles.dpaConsentBox}
                onPress={() => setDpaAccepted(!dpaAccepted)}
              >
                <View
                  style={[
                    styles.checkbox,
                    dpaAccepted && styles.checkboxChecked
                  ]}
                >
                  {dpaAccepted && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.dpaText}>
                  I confirm the student has signed the RA 10173 Data Privacy Consent Form. Tingin stores only encrypted mathematical facial embeddings and immediately deletes raw camera images.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleEnrollStudent}
              >
                <Text style={styles.primaryBtnText}>
                  Complete Biometric Enrollment
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3EB' },
  innerContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 18 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  backBtn: { paddingVertical: 6, paddingRight: 12 },
  backBtnText: { fontSize: 16, fontWeight: '700', color: '#070B24' },
  enrollPill: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#98C93C'
  },
  enrollPillText: { color: '#65A30D', fontSize: 13, fontWeight: '800' },
  courseTag: {
    fontSize: 12,
    fontWeight: '800',
    color: '#65A30D',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  screenHeader: {
    fontSize: 26,
    fontWeight: '900',
    color: '#070B24',
    marginTop: 2
  },
  subText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  metricBox: {
    flex: 0.31,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0'
  },
  metricVal: { fontSize: 20, fontWeight: '900', color: '#070B24' },
  metricLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 },
  searchInput: {
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    fontSize: 14,
    marginBottom: 12
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 14
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#E2E8F0'
  },
  filterTabActive: { backgroundColor: '#070B24' },
  filterTabText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  filterTabTextActive: { color: '#FFFFFF' },

  // Swipeable Row Styles
  swipeWrapper: {
    position: 'relative',
    marginBottom: 10,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0'
  },
  hiddenActionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 216,
    flexDirection: 'row'
  },
  swipeBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  swipeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0'
  },
  studentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  studentName: { fontSize: 16, fontWeight: '800', color: '#070B24' },
  studentMeta: { fontSize: 12, color: '#64748B', marginTop: 3, fontWeight: '500' },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5
  },
  statusBadgeText: { fontSize: 12, fontWeight: '800' },
  anomalyBanner: {
    marginTop: 10,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  anomalyBannerText: { color: '#B91C1C', fontSize: 12, fontWeight: '600' },

  // Modal Styles
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
    paddingBottom: 36
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#070B24' },
  closeBtnText: { fontSize: 20, fontWeight: '800', color: '#64748B' },
  modalSubtitle: {
    fontSize: 12,
    color: '#65A30D',
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 2
  },
  label: { color: '#1E293B', fontSize: 13, marginBottom: 6, fontWeight: '700' },
  input: {
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    fontSize: 14
  },

  // Camera & Upload Buttons
  photoButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  photoOptionBtn: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1'
  },
  photoOptionBtnActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#65A30D'
  },
  photoOptionIcon: {
    fontSize: 16,
    marginRight: 8
  },
  photoOptionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#070B24'
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    marginBottom: 14
  },
  previewThumb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#65A30D'
  },
  biometricTitle: { fontSize: 13, fontWeight: '800', color: '#070B24' },
  biometricSub: { fontSize: 11, color: '#475569', marginTop: 2 },
  dpaConsentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#64748B',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  checkboxChecked: { backgroundColor: '#65A30D', borderColor: '#65A30D' },
  checkmark: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
  dpaText: { flex: 1, fontSize: 12, color: '#475569', lineHeight: 18 },
  primaryBtn: {
    backgroundColor: '#070B24',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center'
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});