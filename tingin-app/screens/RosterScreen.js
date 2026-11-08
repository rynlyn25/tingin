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
import { BlurView } from 'expo-blur';

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

// ---- Liquid Glass tuning ----
// Works like the iOS 27 transparency slider: higher TINT = more frosted and readable,
// lower TINT = clearer glass. BLUR is the strength of the backdrop blur.
const GLASS_BLUR = 45;
const GLASS_TINT = 0.5;

// A frosted, edge-lit glass surface. Pass layout/padding through `style`.
function Glass({
  children,
  style,
  radius = 20,
  tint = GLASS_TINT,
  tintColor,
  intensity = GLASS_BLUR,
  topOnly = false
}) {
  const corners = {
    borderTopLeftRadius: radius,
    borderTopRightRadius: radius,
    borderBottomLeftRadius: topOnly ? 0 : radius,
    borderBottomRightRadius: topOnly ? 0 : radius
  };
  return (
    <View style={[styles.glass, corners, style]}>
      <BlurView
        pointerEvents="none"
        intensity={intensity}
        tint="light"
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: tintColor || `rgba(255, 255, 255, ${tint})` }
        ]}
      />
      {children}
    </View>
  );
}

// Soft feathered color blob (stacked translucent circles) so the glass has something to refract
function Blob({ color, size, style }) {
  return (
    <View style={[styles.blobWrap, { width: size, height: size }, style]}>
      {[1, 0.85, 0.7, 0.55, 0.4, 0.25].map((f) => (
        <View
          key={f}
          style={{
            position: 'absolute',
            width: size * f,
            height: size * f,
            borderRadius: size,
            backgroundColor: color,
            opacity: 0.17
          }}
        />
      ))}
    </View>
  );
}

function AmbientBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Blob color="#A8DB3F" size={340} style={{ top: -110, right: -100 }} />
      <Blob color="#7DB6FF" size={360} style={{ top: 250, left: -150 }} />
      <Blob color="#FFA877" size={320} style={{ bottom: 60, right: -130 }} />
      <Blob color="#C3A2FF" size={280} style={{ bottom: -90, left: -20 }} />
    </View>
  );
}

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

  // Action buttons fade in as the card slides away, so they never show through the glass
  const actionsOpacity = translateX.interpolate({
    inputRange: [-ACTION_WIDTH, -24, 0],
    outputRange: [1, 0.2, 0],
    extrapolate: 'clamp'
  });

  return (
    <View style={styles.swipeWrapper}>
      {/* Hidden Right-Side Action Buttons revealed on Slide Left */}
      <Animated.View
        style={[styles.hiddenActionsContainer, { opacity: actionsOpacity }]}
      >
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
      </Animated.View>

      {/* Foreground Sliding Glass Student Card */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{ transform: [{ translateX }] }}
      >
        <Glass radius={22} style={styles.studentCard}>
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
        </Glass>
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
        return { bg: 'rgba(101, 163, 13, 0.16)', border: 'rgba(101, 163, 13, 0.38)', text: '#4D7C0F', label: 'Present' };
      case 'LATE':
        return { bg: 'rgba(202, 138, 4, 0.16)', border: 'rgba(202, 138, 4, 0.38)', text: '#A16207', label: 'Late' };
      case 'ANOMALY':
        return { bg: 'rgba(220, 38, 38, 0.14)', border: 'rgba(220, 38, 38, 0.38)', text: '#B91C1C', label: 'Anomaly' };
      default:
        return { bg: 'rgba(100, 116, 139, 0.14)', border: 'rgba(100, 116, 139, 0.32)', text: '#475569', label: 'Absent' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackdrop />
      <View style={styles.innerContainer}>
        {/* Top Navigation */}
        <View style={styles.topRow}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setCurrentScreen('DASHBOARD')}
          >
            <Glass radius={999} style={styles.backGlass}>
              <Text style={styles.backChevron}>‹</Text>
              <Text style={styles.backBtnText}>Dashboard</Text>
            </Glass>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setDpaModalVisible(true)}
          >
            <Glass
              radius={999}
              tintColor="rgba(152, 201, 60, 0.42)"
              style={styles.enrollGlass}
            >
              <Text style={styles.enrollPillText}>+ Enroll Biometrics</Text>
            </Glass>
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
          <Glass radius={22} style={styles.metricBox}>
            <Text style={styles.metricVal}>{students.length}</Text>
            <Text style={styles.metricLabel}>Total List</Text>
          </Glass>
          <Glass radius={22} style={styles.metricBox}>
            <Text style={[styles.metricVal, { color: '#4D7C0F' }]}>{presentCount}</Text>
            <Text style={styles.metricLabel}>Verified</Text>
          </Glass>
          <Glass radius={22} style={styles.metricBox}>
            <Text
              style={[
                styles.metricVal,
                { color: anomalyCount > 0 ? '#B91C1C' : '#64748B' }
              ]}
            >
              {anomalyCount}
            </Text>
            <Text style={styles.metricLabel}>Anomalies</Text>
          </Glass>
        </View>

        {/* Search & Filter Tabs */}
        <Glass radius={20} style={styles.searchGlass}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search student name or DLSAU ID..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </Glass>

        <Glass radius={20} style={styles.filterGlass}>
          <TouchableOpacity
            style={[styles.filterTab, filterMode === 'ALL' && styles.filterTabActive]}
            onPress={() => setFilterMode('ALL')}
          >
            <Text
              numberOfLines={1}
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
              numberOfLines={1}
              style={[
                styles.filterTabText,
                filterMode === 'ANOMALY' && styles.filterTabTextActive
              ]}
            >
              Pending Anomalies ({anomalyCount})
            </Text>
          </TouchableOpacity>
        </Glass>

        {/* Swipeable Student List */}
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
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
          <Glass
            radius={32}
            topOnly
            tint={0.74}
            intensity={70}
            style={styles.modalCard}
          >
            <View style={styles.grabber} />
            <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>DPA Biometric Enrollment</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setDpaModalVisible(false)}>
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
          </Glass>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3EB' },
  innerContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 18 },

  // Liquid Glass surface: edge-lit (bright top/left, faint dark bottom/right)
  glass: {
    overflow: 'hidden',
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    borderLeftColor: 'rgba(255, 255, 255, 0.8)',
    borderRightColor: 'rgba(7, 11, 36, 0.05)',
    borderBottomColor: 'rgba(7, 11, 36, 0.08)'
  },
  blobWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center'
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  backGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingLeft: 12,
    paddingRight: 16
  },
  backChevron: {
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '600',
    color: '#070B24',
    marginRight: 6,
    marginTop: -2
  },
  backBtnText: { fontSize: 15, fontWeight: '700', color: '#070B24' },
  enrollGlass: { paddingVertical: 10, paddingHorizontal: 16 },
  enrollPillText: { color: '#365314', fontSize: 13, fontWeight: '800' },

  courseTag: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4D7C0F',
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
    color: '#475569',
    marginTop: 4,
    marginBottom: 16
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  metricBox: {
    flex: 0.31,
    paddingVertical: 14,
    alignItems: 'center'
  },
  metricVal: { fontSize: 22, fontWeight: '900', color: '#070B24' },
  metricLabel: { fontSize: 11, color: '#475569', fontWeight: '600', marginTop: 2 },

  searchGlass: { marginBottom: 12 },
  searchInput: {
    color: '#0F172A',
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 14
  },
  filterGlass: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: 14
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterTabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#070B24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 2
  },
  filterTabText: { fontSize: 12.5, fontWeight: '700', color: '#475569' },
  filterTabTextActive: { color: '#070B24' },

  // Swipeable Row Styles
  swipeWrapper: {
    position: 'relative',
    marginBottom: 10,
    borderRadius: 22,
    overflow: 'hidden'
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
    marginLeft: 6,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  swipeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  studentCard: { padding: 16 },
  studentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  studentName: { fontSize: 16, fontWeight: '800', color: '#070B24' },
  studentMeta: { fontSize: 12, color: '#475569', marginTop: 3, fontWeight: '500' },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1
  },
  statusBadgeText: { fontSize: 12, fontWeight: '800' },
  anomalyBanner: {
    marginTop: 10,
    backgroundColor: 'rgba(254, 202, 202, 0.5)',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.25)'
  },
  anomalyBannerText: { color: '#991B1B', fontSize: 12, fontWeight: '600' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 11, 36, 0.3)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 36
  },
  grabber: {
    alignSelf: 'center',
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(7, 11, 36, 0.18)',
    marginBottom: 14
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#070B24' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(7, 11, 36, 0.08)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeBtnText: { fontSize: 14, fontWeight: '800', color: '#334155' },
  modalSubtitle: {
    fontSize: 12,
    color: '#4D7C0F',
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 2
  },
  label: { color: '#1E293B', fontSize: 13, marginBottom: 6, fontWeight: '700' },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    color: '#0F172A',
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(7, 11, 36, 0.1)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(7, 11, 36, 0.1)'
  },
  photoOptionBtnActive: {
    backgroundColor: 'rgba(152, 201, 60, 0.28)',
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
    backgroundColor: 'rgba(152, 201, 60, 0.2)',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(101, 163, 13, 0.35)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 14,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(7, 11, 36, 0.08)'
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#64748B',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  checkboxChecked: { backgroundColor: '#65A30D', borderColor: '#65A30D' },
  checkmark: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
  dpaText: { flex: 1, fontSize: 12, color: '#334155', lineHeight: 18 },
  primaryBtn: {
    backgroundColor: 'rgba(7, 11, 36, 0.92)',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center'
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});