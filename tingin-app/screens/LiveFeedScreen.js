import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Animated,
  Dimensions,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Rect,
  Circle,
  Line
} from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';

let CameraView = null;
let useCameraPermissions = null;
try {
  const ExpoCamera = require('expo-camera');
  CameraView = ExpoCamera.CameraView;
  useCameraPermissions = ExpoCamera.useCameraPermissions;
} catch (_) {
  // Optional dependency fallback when expo-camera is not installed
}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// =============================================================================
// 1. CONSTANTS & DATA
// =============================================================================

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const THEME = {
  bg: '#F8F9FA',
  navy: '#070B24',
  ink: '#0B1320',
  muted: '#64748B',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  defaultCardColor: '#01A638'
};

const STREAM_SOURCES = {
  WIFI: {
    key: 'WIFI',
    label: 'Wi-Fi',
    badge: 'WI-FI CAMERA STREAM',
    detail: 'Classroom IP camera stream over local Wi-Fi',
    endpoint: 'rtsp://dlsau-cam.local:8554/stream'
  },
  PHONE: {
    key: 'PHONE',
    label: 'This Phone',
    badge: 'ON-DEVICE PHONE STREAM',
    detail: 'Live view from this phone camera',
    endpoint: 'device://front-or-back-camera'
  }
};

const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const SEAT_STATES = {
  PRESENT: {
    label: 'Present',
    tint: 'rgba(22, 163, 74, 0.24)',
    border: 'rgba(22, 163, 74, 0.55)',
    text: '#14532D'
  },
  LATE: {
    label: 'Late',
    tint: 'rgba(217, 119, 6, 0.24)',
    border: 'rgba(217, 119, 6, 0.55)',
    text: '#78350F'
  },
  ANOMALY: {
    label: 'Anomaly',
    tint: 'rgba(220, 38, 38, 0.24)',
    border: 'rgba(220, 38, 38, 0.55)',
    text: '#991B1B'
  },
  EMPTY: {
    label: 'Empty',
    tint: 'rgba(255, 255, 255, 0.34)',
    border: 'rgba(255, 255, 255, 0.72)',
    text: '#64748B'
  }
};

const SAMPLE_STUDENTS = [
  { id: '2024-1001', name: 'Dela Cruz, Mateo', status: 'PRESENT', confidence: '98.4%' },
  { id: '2024-1002', name: 'Santos, Clara Isabel', status: 'ANOMALY', confidence: '61.2%' },
  { id: '2024-1003', name: 'Reyes, Gabriel', status: 'PRESENT', confidence: '96.9%' },
  { id: '2024-1004', name: 'Mendoza, Sofia Marie', status: 'ANOMALY', confidence: '0.0%' },
  { id: '2024-1005', name: 'Bautista, Lucas', status: 'EMPTY', confidence: '-' },
  { id: '2024-1006', name: 'Lim, Nadine', status: 'PRESENT', confidence: '97.8%' },
  { id: '2024-1007', name: 'Aquino, Paolo', status: 'LATE', confidence: '94.1%' },
  { id: '2024-1008', name: 'Navarro, Bianca', status: 'PRESENT', confidence: '98.9%' },
  { id: '2024-1009', name: 'Torres, Adrian', status: 'PRESENT', confidence: '95.6%' },
  { id: '2024-1010', name: 'Castillo, Marielle', status: 'LATE', confidence: '93.0%' }
];

const INITIAL_FEED = [
  {
    id: 'evt-ready',
    time: 'Standby',
    seat: 'SYS',
    title: 'Seat Plan Ready',
    detail: 'Review room layout or tap Start Attendance when ready',
    tone: 'EMPTY'
  }
];

// =============================================================================
// 2. UTILITIES
// =============================================================================

const springLayout = () => {
  LayoutAnimation.configureNext({
    duration: 280,
    create: {
      type: LayoutAnimation.Types.spring,
      property: LayoutAnimation.Properties.opacity,
      springDamping: 0.8
    },
    update: {
      type: LayoutAnimation.Types.spring,
      springDamping: 0.8
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity
    }
  });
};

const hexToRgb = (hex) => {
  const clean = (hex || THEME.defaultCardColor).replace('#', '');
  return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16) || 0);
};

const hexToRgba = (hex, alpha) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const rgbToHex = (rgb) =>
  '#' +
  rgb
    .map((v) => Math.round(v).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

const mixColor = (hex, target, amount) => {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  return rgbToHex(a.map((v, i) => v + (b[i] - v) * amount));
};

const isLightColor = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45;
};

const formatNowTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

async function pickOrCapturePhoto(mode) {
  const isCamera = mode === 'CAPTURE';
  const perm = isCamera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!perm.granted) {
    Alert.alert(
      isCamera ? 'Camera Permission Needed' : 'Gallery Permission Needed',
      isCamera
        ? 'Allow camera access to capture a classroom or row photo.'
        : 'Allow photo library access to choose an existing classroom picture.'
    );
    return null;
  }

  const opts = { allowsEditing: true, quality: 0.75 };
  const res = isCamera
    ? await ImagePicker.launchCameraAsync(opts)
    : await ImagePicker.launchImageLibraryAsync({ ...opts, mediaTypes: ['images'] });

  if (!res.canceled && res.assets?.length > 0) {
    return res.assets[0].uri;
  }
  return null;
}

function buildClassroomSeats(enrolledCount = 35, seatCapacity = 40, colsPerRow = 8) {
  const safeCapacity = Math.max(1, seatCapacity);
  const safeCols = Math.max(2, colsPerRow);
  const rowCount = Math.ceil(safeCapacity / safeCols);

  const codes = [];
  for (let r = 0; r < rowCount; r++) {
    const rowLetter = ROW_LABELS[r] || `R${r + 1}`;
    for (let c = 1; c <= safeCols; c++) {
      if (codes.length < safeCapacity) {
        codes.push(`${rowLetter}${c}`);
      }
    }
  }

  if (enrolledCount > safeCapacity) {
    const overflowCount = enrolledCount - safeCapacity;
    for (let o = 1; o <= overflowCount; o++) {
      codes.push(`OV${o}`);
    }
  }

  const assignedCap = Math.min(enrolledCount, codes.length);

  return codes.map((seatCode, idx) => {
    const isOverflow = seatCode.startsWith('OV');

    if (idx >= assignedCap) {
      return {
        seat: seatCode,
        row: seatCode[0],
        studentId: null,
        studentName: 'Open Seat',
        status: 'EMPTY',
        confidence: '-',
        isOverflow: false
      };
    }

    const template = SAMPLE_STUDENTS[idx % SAMPLE_STUDENTS.length];

    return {
      seat: seatCode,
      row: seatCode[0],
      studentId: `2024-${1001 + idx}`,
      studentName: idx < SAMPLE_STUDENTS.length ? template.name : `Student #${idx + 1}`,
      status: isOverflow
        ? 'ANOMALY'
        : idx < SAMPLE_STUDENTS.length
          ? template.status
          : 'PRESENT',
      confidence: idx < SAMPLE_STUDENTS.length ? template.confidence : '96.5%',
      isOverflow
    };
  });
}

// =============================================================================
// 3. SUB-COMPONENTS
// =============================================================================

function LiveAuraBackdrop({ color }) {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 5600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 5600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const baseCanvas = mixColor(color, '#FFFFFF', 0.87);
  const shiftX = drift.interpolate({ inputRange: [0, 1], outputRange: [-14, 16] });
  const shiftY = drift.interpolate({ inputRange: [0, 1], outputRange: [-12, 14] });

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: baseCanvas }]} pointerEvents="none">
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX: shiftX }, { translateY: shiftY }] }
        ]}
      >
        <Svg width={SCREEN_W} height={SCREEN_H}>
          <Defs>
            <RadialGradient id="liveAuraTop" cx="50%" cy="16%" r="60%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.52" />
              <Stop offset="100%" stopColor={baseCanvas} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="liveAuraBot" cx="85%" cy="75%" r="55%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.32" />
              <Stop offset="100%" stopColor={baseCanvas} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={SCREEN_W * 0.5} cy={SCREEN_H * 0.16} r={SCREEN_W * 0.85} fill="url(#liveAuraTop)" />
          <Circle cx={SCREEN_W * 0.85} cy={SCREEN_H * 0.75} r={SCREEN_W * 0.75} fill="url(#liveAuraBot)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

function GlassContainer({ style, intensity = 58, children }) {
  return (
    <View style={[styles.glassShadow, style]}>
      <View style={styles.glassClip}>
        <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.glassTint} />
        {children}
      </View>
    </View>
  );
}

function SeatPlanCheckModal({
  visible,
  roomName,
  seatCapacity,
  choosingEditType,
  onSelectEditSeats,
  onPickEditMode,
  onNoChanges
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.promptOverlay}>
        <BlurView intensity={26} tint="dark" style={StyleSheet.absoluteFill} />
        <GlassContainer style={styles.promptCard} intensity={76}>
          <View style={styles.promptInner}>
            <Text style={styles.promptBadge}>SAVED ROOM SEAT PLAN</Text>
            <Text style={styles.promptTitle}>
              {choosingEditType ? 'How do you want to edit seats?' : 'Any changes to the seats?'}
            </Text>
            <Text style={styles.promptSub}>
              {choosingEditType
                ? `Choose whether to capture the whole room or capture by row in ${roomName}.`
                : `${roomName} already has a saved seat plan (${seatCapacity} seats). Are there any seat changes today?`}
            </Text>

            {choosingEditType ? (
              <View style={styles.promptActions}>
                <TouchableOpacity
                  style={styles.promptSecondaryBtn}
                  onPress={() => onPickEditMode('PHOTO')}
                >
                  <Text style={styles.promptSecondaryText}>Capture Whole Room</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.promptPrimaryBtn}
                  onPress={() => onPickEditMode('ROW_LAB')}
                >
                  <Text style={styles.promptPrimaryText}>Lab Row-by-Row</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.promptActions}>
                <TouchableOpacity style={styles.promptSecondaryBtn} onPress={onSelectEditSeats}>
                  <Text style={styles.promptSecondaryText}>Yes, Edit Seats</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.promptPrimaryBtn} onPress={onNoChanges}>
                  <Text style={styles.promptPrimaryText}>No Changes, Continue</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </GlassContainer>
      </View>
    </Modal>
  );
}

function CameraHeaderCard({
  course,
  enrolledCount,
  seatCapacity,
  cardColor,
  sessionActive,
  streamSource,
  onSelectSource
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const accentDark = mixColor(cardColor, '#000000', 0.35);
  const activeSourceInfo = STREAM_SOURCES[streamSource] || STREAM_SOURCES.WIFI;

  const lightCard = isLightColor(cardColor);
  const ink = lightCard ? THEME.ink : '#FFFFFF';
  const inkSoft = lightCard ? 'rgba(11, 19, 32, 0.78)' : 'rgba(255, 255, 255, 0.88)';
  const selectorBg = lightCard ? 'rgba(7, 11, 36, 0.12)' : 'rgba(7, 11, 36, 0.22)';
  const selectorBorder = lightCard ? 'rgba(7, 11, 36, 0.18)' : 'rgba(255, 255, 255, 0.45)';
  const inactiveOptionText = lightCard ? THEME.ink : '#FFFFFF';

  useEffect(() => {
    if (!sessionActive) {
      pulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.35, duration: 750, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 750, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [sessionActive]);

  const roomName = course?.room || 'Osmeña Rm 302';
  const courseCode = course?.course_code || 'CS 301';
  const scheduleText = course?.schedule || 'MWF 09:00 AM';

  return (
    <View style={[styles.camCardShadow, { shadowColor: cardColor }]}>
      <View style={styles.camCardClip}>
        <BlurView intensity={65} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: hexToRgba(cardColor, 0.72) }]} />

        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
          <Defs>
            <LinearGradient id="camSheen" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={lightCard ? '0.28' : '0.52'} />
              <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.08" />
              <Stop offset="100%" stopColor={accentDark} stopOpacity="0.24" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#camSheen)" />
        </Svg>

        <View style={styles.camCardBody}>
          <View style={styles.camTopRow}>
            <View style={styles.livePill}>
              <Animated.View
                style={[
                  styles.liveDot,
                  {
                    backgroundColor: sessionActive ? '#22C55E' : '#FACC15',
                    opacity: pulseAnim
                  }
                ]}
              />
              <Text style={styles.livePillText}>
                {courseCode} • {scheduleText}
              </Text>
            </View>

            <Text style={[styles.streamStateText, { color: ink }]}>
              {sessionActive ? 'ACTIVE' : 'STANDBY'}
            </Text>
          </View>

          <Text style={[styles.camCourseTitle, { color: ink }]} numberOfLines={1}>
            {course?.course_name || 'Software Engineering'}
          </Text>

          <Text style={[styles.camMetaSub, { color: inkSoft }]}>
            {roomName} • {seatCapacity} Seats ({enrolledCount} Enrolled)
          </Text>

          <View
            style={[
              styles.sourceSelectorRow,
              { backgroundColor: selectorBg, borderColor: selectorBorder }
            ]}
          >
            {Object.values(STREAM_SOURCES).map((option) => {
              const selected = streamSource === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  activeOpacity={0.85}
                  onPress={() => onSelectSource(option.key)}
                  style={[
                    styles.sourceOptionBtn,
                    selected && styles.sourceOptionBtnActive
                  ]}
                >
                  <Text
                    style={[
                      styles.sourceOptionText,
                      { color: inactiveOptionText },
                      selected && styles.sourceOptionTextActive
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.camFooterRow}>
            <Text style={[styles.sourceHintText, { color: inkSoft }]} numberOfLines={1}>
              {activeSourceInfo.badge}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function ClassroomViewport({
  course,
  streamSource,
  sessionActive,
  hasSavedLayout,
  cameraFacing,
  onFlipCamera,
  onToggleSession
}) {
  const sourceInfo = STREAM_SOURCES[streamSource] || STREAM_SOURCES.WIFI;
  const roomName = course?.room || 'Osmeña Rm 302';

  const [permission, requestPermission] = useCameraPermissions
    ? useCameraPermissions()
    : [null, null];

  useEffect(() => {
    if (
      sessionActive &&
      streamSource === STREAM_SOURCES.PHONE.key &&
      permission &&
      !permission.granted &&
      requestPermission
    ) {
      requestPermission();
    }
  }, [sessionActive, streamSource, permission?.granted]);

  if (!sessionActive) {
    return (
      <GlassContainer style={styles.viewportWrap} intensity={58}>
        <View style={styles.viewportStandby}>
          <Text style={styles.standbyTitle}>
            {hasSavedLayout
              ? 'Seat Plan Ready • Next-Day Attendance Ready'
              : 'Seat Plan Required Before Attendance'}
          </Text>
          <Text style={styles.standbySub}>
            {hasSavedLayout
              ? `Saved plan found for ${roomName}. Tap Start Attendance anytime without scanning again.`
              : `Capture or pick a room/lab seat photo below first for ${roomName}, then start attendance.`}
          </Text>
          <TouchableOpacity
            style={styles.standbyActionBtn}
            activeOpacity={0.88}
            onPress={onToggleSession}
          >
            <Text style={styles.standbyActionText}>Start Attendance</Text>
          </TouchableOpacity>
        </View>
      </GlassContainer>
    );
  }

  const canRenderPhoneCamera =
    streamSource === STREAM_SOURCES.PHONE.key &&
    CameraView &&
    permission?.granted;

  return (
    <View style={styles.viewportWrap}>
      <View style={styles.viewportClip}>
        {canRenderPhoneCamera ? (
          <CameraView style={styles.cameraFeed} facing={cameraFacing} />
        ) : (
          <View style={styles.roomPreviewCanvas}>
            <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
              <Defs>
                <LinearGradient id="roomWallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#1E293B" />
                  <Stop offset="65%" stopColor="#0F172A" />
                  <Stop offset="100%" stopColor="#070B24" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#roomWallGrad)" />
              <Rect
                x="18%"
                y="18%"
                width="64%"
                height="22%"
                rx={6}
                fill="rgba(22, 101, 52, 0.35)"
                stroke="rgba(255, 255, 255, 0.16)"
                strokeWidth="1.5"
              />
              <Line
                x1="12%"
                y1="78%"
                x2="36%"
                y2="46%"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1.2"
              />
              <Line
                x1="88%"
                y1="78%"
                x2="64%"
                y2="46%"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1.2"
              />
            </Svg>

            <View style={[styles.detectBox, { left: '22%', top: '48%', borderColor: '#22C55E' }]}>
              <Text style={[styles.detectTag, { backgroundColor: '#16A34A' }]}>A1 • 98%</Text>
            </View>
            <View style={[styles.detectBox, { left: '46%', top: '45%', borderColor: '#F59E0B' }]}>
              <Text style={[styles.detectTag, { backgroundColor: '#D97706' }]}>A2 • 61%</Text>
            </View>
            <View style={[styles.detectBox, { left: '68%', top: '50%', borderColor: '#22C55E' }]}>
              <Text style={[styles.detectTag, { backgroundColor: '#16A34A' }]}>A3 • 97%</Text>
            </View>
          </View>
        )}

        <View style={styles.viewportTopHud}>
          <View style={styles.hudPill}>
            <Text style={styles.hudPillText}>
              {streamSource === STREAM_SOURCES.WIFI.key ? 'WI-FI FEED' : 'PHONE CAM'} • {roomName}
            </Text>
          </View>

          <View style={styles.hudRightGroup}>
            {streamSource === STREAM_SOURCES.PHONE.key && CameraView && (
              <TouchableOpacity style={styles.hudFlipBtn} onPress={onFlipCamera}>
                <Text style={styles.hudFlipText}>Flip</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.hudEndBtn} onPress={onToggleSession}>
              <Text style={styles.hudEndText}>End Attendance</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.viewportBottomHud}>
          <Text style={styles.endpointText} numberOfLines={1}>
            {sourceInfo.endpoint}
          </Text>
          <Text style={styles.hudSubText}>
            {streamSource === STREAM_SOURCES.WIFI.key
              ? 'Viewing classroom Wi-Fi camera'
              : 'Viewing from this phone'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SeatPlanSetupCard({
  roomName,
  seatCapacityInput,
  colsPerRow,
  hasSavedLayout,
  captureMode,
  activeLabRow,
  capturedRows,
  onChangeMode,
  onStepCapacity,
  onTypeCapacity,
  onRoomPhotoAction,
  onSelectLabRow,
  onLabRowPhotoAction
}) {
  const numericCap = Math.max(1, parseInt(seatCapacityInput, 10) || 40);
  const rowCount = Math.ceil(numericCap / colsPerRow);
  const availableRows = ROW_LABELS.slice(0, Math.min(rowCount, ROW_LABELS.length));

  return (
    <GlassContainer style={styles.setupCardWrap} intensity={58}>
      <View style={styles.setupCardInner}>
        <View style={styles.setupTopRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.setupTitle}>Seat Plan & Lab Capture</Text>
            <Text style={styles.setupSub} numberOfLines={1}>
              {roomName} • {hasSavedLayout ? 'Saved (Reusable)' : 'Required First'}
            </Text>
          </View>

          <View style={styles.stepperRow}>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => onStepCapacity(-1)}>
              <Text style={styles.stepperBtnText}>-</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.capacityInput}
              value={seatCapacityInput}
              keyboardType="number-pad"
              maxLength={3}
              onChangeText={onTypeCapacity}
            />

            <TouchableOpacity style={styles.stepperBtn} onPress={() => onStepCapacity(1)}>
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.modeSwitchRow}>
          <TouchableOpacity
            style={[
              styles.modeSwitchBtn,
              captureMode === 'PHOTO' && styles.modeSwitchBtnActive
            ]}
            onPress={() => onChangeMode('PHOTO')}
          >
            <Text
              style={[
                styles.modeSwitchText,
                captureMode === 'PHOTO' && styles.modeSwitchTextActive
              ]}
            >
              Room Photo Scan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeSwitchBtn,
              captureMode === 'ROW_LAB' && styles.modeSwitchBtnActive
            ]}
            onPress={() => onChangeMode('ROW_LAB')}
          >
            <Text
              style={[
                styles.modeSwitchText,
                captureMode === 'ROW_LAB' && styles.modeSwitchTextActive
              ]}
            >
              Lab Row-by-Row
            </Text>
          </TouchableOpacity>
        </View>

        {captureMode === 'PHOTO' ? (
          <View style={styles.photoBtnPair}>
            <TouchableOpacity
              style={styles.photoActionBtn}
              activeOpacity={0.85}
              onPress={() => onRoomPhotoAction('CAPTURE')}
            >
              <Text style={styles.photoActionText}>📷 Capture Room</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoActionBtn}
              activeOpacity={0.85}
              onPress={() => onRoomPhotoAction('PICK')}
            >
              <Text style={styles.photoActionText}>🖼️ Find Picture</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rowChipsScroll}
            >
              {availableRows.map((rowLetter) => {
                const done = capturedRows.includes(rowLetter);
                const selected = activeLabRow === rowLetter;
                return (
                  <TouchableOpacity
                    key={rowLetter}
                    style={[
                      styles.rowChip,
                      selected && styles.rowChipSelected,
                      done && !selected && styles.rowChipDone
                    ]}
                    onPress={() => onSelectLabRow(rowLetter)}
                  >
                    <Text
                      style={[
                        styles.rowChipText,
                        selected && { color: '#FFFFFF' }
                      ]}
                    >
                      Row {rowLetter} {done ? '✓' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.photoBtnPair}>
              <TouchableOpacity
                style={styles.photoActionBtn}
                activeOpacity={0.85}
                onPress={() => onLabRowPhotoAction(activeLabRow, 'CAPTURE')}
              >
                <Text style={styles.photoActionText}>📷 Capture Row {activeLabRow}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoActionBtn}
                activeOpacity={0.85}
                onPress={() => onLabRowPhotoAction(activeLabRow, 'PICK')}
              >
                <Text style={styles.photoActionText}>🖼️ Find Row Pic</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </GlassContainer>
  );
}

function SeatTile({ item, isSelected, onPress }) {
  const stateStyle = SEAT_STATES[item.status] || SEAT_STATES.EMPTY;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => onPress(item)}
      style={[
        styles.seatTile,
        {
          backgroundColor: stateStyle.tint,
          borderColor: isSelected ? THEME.navy : stateStyle.border
        },
        isSelected && styles.seatTileSelected
      ]}
    >
      <View style={styles.seatTileTop}>
        <Text style={styles.seatCode}>{item.seat}</Text>
        <View style={[styles.seatStatusDot, { backgroundColor: stateStyle.text }]} />
      </View>

      <Text style={styles.seatStudentName} numberOfLines={1}>
        {item.studentName}
      </Text>
      <Text style={[styles.seatStatusLabel, { color: stateStyle.text }]}>
        {item.isOverflow ? 'Overflow' : stateStyle.label}
      </Text>
    </TouchableOpacity>
  );
}

function SeatInspectorCard({ seat, onOverrideStatus }) {
  if (!seat) return null;
  const stateStyle = SEAT_STATES[seat.status] || SEAT_STATES.EMPTY;

  return (
    <GlassContainer style={styles.inspectorWrap} intensity={64}>
      <View style={styles.inspectorInner}>
        <View style={styles.inspectorTop}>
          <View style={styles.inspectorInfo}>
            <Text style={styles.inspectorTitle} numberOfLines={1}>
              Seat {seat.seat} • {seat.studentName}
            </Text>
            <Text style={styles.inspectorSub}>
              {seat.studentId ? `ID ${seat.studentId} • ` : ''}
              Confidence {seat.confidence}
            </Text>
          </View>

          <View style={[styles.statusTag, { backgroundColor: stateStyle.tint }]}>
            <Text style={[styles.statusTagText, { color: stateStyle.text }]}>
              {stateStyle.label}
            </Text>
          </View>
        </View>

        <View style={styles.overrideRow}>
          {['PRESENT', 'LATE', 'EMPTY'].map((statusKey) => (
            <TouchableOpacity
              key={statusKey}
              style={[
                styles.overrideBtn,
                seat.status === statusKey && styles.overrideBtnActive
              ]}
              onPress={() => onOverrideStatus(statusKey)}
            >
              <Text
                style={[
                  styles.overrideBtnText,
                  seat.status === statusKey && styles.overrideBtnTextActive
                ]}
              >
                {SEAT_STATES[statusKey].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </GlassContainer>
  );
}

function AttendanceFeedSection({ feed, cardColor }) {
  return (
    <>
      <Text style={styles.sectionTitle}>Attendance Feed</Text>
      <GlassContainer style={styles.feedWrap} intensity={60}>
        {feed.map((evt, idx) => {
          const toneStyle = SEAT_STATES[evt.tone] || SEAT_STATES.PRESENT;
          return (
            <View
              key={evt.id}
              style={[styles.feedRow, idx < feed.length - 1 && styles.feedRowBorder]}
            >
              <View style={[styles.feedSeatBadge, { backgroundColor: hexToRgba(cardColor, 0.18) }]}>
                <Text style={styles.feedSeatText}>{evt.seat}</Text>
              </View>

              <View style={styles.feedTextCol}>
                <Text style={styles.feedTitle} numberOfLines={1}>
                  {evt.title}
                </Text>
                <Text style={styles.feedDetail} numberOfLines={1}>
                  {evt.detail}
                </Text>
              </View>

              <View style={styles.feedRightCol}>
                <Text style={[styles.feedTone, { color: toneStyle.text }]}>
                  {toneStyle.label}
                </Text>
                <Text style={styles.feedTime}>{evt.time}</Text>
              </View>
            </View>
          );
        })}
      </GlassContainer>
    </>
  );
}

// =============================================================================
// 4. MAIN SCREEN
// =============================================================================

export default function LiveFeedScreen({
  course,
  savedRoomLayout,
  sessionState,
  onSaveRoomLayout,
  onUpdateSession,
  setCurrentScreen
}) {
  const cardColor = course?.card_color || THEME.defaultCardColor;
  const enrolledCount = course?.enrolled_count ?? 35;
  const roomName = course?.room || 'Osmeña Rm 302';

  const initialCapacity = savedRoomLayout?.capacity || course?.seat_capacity || 40;
  const colsPerRow = savedRoomLayout?.colsPerRow || 8;
  const hasSavedLayout = Boolean(savedRoomLayout?.capacity);

  const [seatCapacityInput, setSeatCapacityInput] = useState(String(initialCapacity));
  const [seats, setSeats] = useState(
    () => sessionState?.seats || buildClassroomSeats(enrolledCount, initialCapacity, colsPerRow)
  );
  const [feed, setFeed] = useState(() => sessionState?.feed || INITIAL_FEED);
  const [selectedSeatCode, setSelectedSeatCode] = useState(
    () => (sessionState?.seats && sessionState.seats[0]?.seat) || 'A1'
  );
  const [sessionActive, setSessionActive] = useState(() => Boolean(sessionState?.sessionActive));
  const [streamSource, setStreamSource] = useState(
    () => sessionState?.streamSource || STREAM_SOURCES.WIFI.key
  );
  const [cameraFacing, setCameraFacing] = useState('back');
  const [captureMode, setCaptureMode] = useState('PHOTO'); // 'PHOTO' | 'ROW_LAB'
  const [activeLabRow, setActiveLabRow] = useState('A');
  const [capturedRows, setCapturedRows] = useState(() => savedRoomLayout?.capturedRows || []);

  const [seatCheckVisible, setSeatCheckVisible] = useState(() => hasSavedLayout);
  const [choosingEditType, setChoosingEditType] = useState(false);

  const numericCapacity = Math.max(1, parseInt(seatCapacityInput, 10) || 40);

  useEffect(() => {
    const nextCap = savedRoomLayout?.capacity || course?.seat_capacity || 40;
    const nextCols = savedRoomLayout?.colsPerRow || 8;

    setSeatCapacityInput(String(nextCap));
    setCapturedRows(savedRoomLayout?.capturedRows || []);
    setChoosingEditType(false);
    setSeatCheckVisible(Boolean(savedRoomLayout?.capacity));

    if (sessionState?.seats) {
      setSeats(sessionState.seats);
      setFeed(sessionState.feed || INITIAL_FEED);
      setSessionActive(Boolean(sessionState.sessionActive));
      setStreamSource(sessionState.streamSource || STREAM_SOURCES.WIFI.key);
    } else {
      setSeats(buildClassroomSeats(enrolledCount, nextCap, nextCols));
      setFeed(INITIAL_FEED);
      setSessionActive(false);
    }
  }, [course?.course_id]);

  useEffect(() => {
    if (!course?.course_id || !onUpdateSession) return;
    onUpdateSession(course.course_id, {
      seats,
      feed,
      sessionActive,
      streamSource
    });
  }, [seats, feed, sessionActive, streamSource, course?.course_id]);

  const selectedSeat = seats.find((s) => s.seat === selectedSeatCode) || null;
  const presentCount = seats.filter((s) => s.status === 'PRESENT').length;
  const lateCount = seats.filter((s) => s.status === 'LATE').length;
  const anomalyCount = seats.filter((s) => s.status === 'ANOMALY').length;

  const pushFeedEvent = (seatCode, title, detail, tone) => {
    springLayout();
    setFeed((prev) => [
      {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        time: formatNowTime(),
        seat: seatCode,
        title,
        detail,
        tone
      },
      ...prev.slice(0, 11)
    ]);
  };

  const applyCapacity = (rawValue) => {
    const cleaned = rawValue.replace(/[^0-9]/g, '');
    setSeatCapacityInput(cleaned);

    const parsed = parseInt(cleaned, 10);
    if (!parsed || parsed < 1) return;

    const clamped = Math.min(120, parsed);
    springLayout();
    setSeats(buildClassroomSeats(enrolledCount, clamped, colsPerRow));
    onSaveRoomLayout &&
      onSaveRoomLayout(roomName, {
        ...(savedRoomLayout || {}),
        capacity: clamped,
        colsPerRow,
        capturedRows,
        source: savedRoomLayout?.source || 'MANUAL'
      });
  };

  const handleStepCapacity = (delta) => {
    const nextCap = Math.min(120, Math.max(1, numericCapacity + delta));
    setSeatCapacityInput(String(nextCap));
    springLayout();
    setSeats(buildClassroomSeats(enrolledCount, nextCap, colsPerRow));
    onSaveRoomLayout &&
      onSaveRoomLayout(roomName, {
        ...(savedRoomLayout || {}),
        capacity: nextCap,
        colsPerRow,
        capturedRows,
        source: savedRoomLayout?.source || 'MANUAL'
      });
  };

  const handleRoomPhotoAction = async (mode) => {
    const uri = await pickOrCapturePhoto(mode);
    if (!uri) return;

    springLayout();
    setSeats(buildClassroomSeats(enrolledCount, numericCapacity, colsPerRow));
    onSaveRoomLayout &&
      onSaveRoomLayout(roomName, {
        ...(savedRoomLayout || {}),
        capacity: numericCapacity,
        colsPerRow,
        capturedRows,
        roomPhotoUri: uri,
        source: 'PHOTO'
      });

    pushFeedEvent(
      'MAP',
      `${mode === 'CAPTURE' ? 'Captured' : 'Loaded'} Room Plan (${roomName})`,
      `${numericCapacity} seats saved & reusable for next sessions`,
      'PRESENT'
    );
  };

  const handleLabRowPhotoAction = async (rowLetter, mode) => {
    const uri = await pickOrCapturePhoto(mode);
    if (!uri) return;

    const nextRows = capturedRows.includes(rowLetter)
      ? capturedRows
      : [...capturedRows, rowLetter];

    springLayout();
    setCapturedRows(nextRows);
    const firstInRow = seats.find((s) => s.row === rowLetter);
    if (firstInRow) setSelectedSeatCode(firstInRow.seat);

    onSaveRoomLayout &&
      onSaveRoomLayout(roomName, {
        ...(savedRoomLayout || {}),
        capacity: numericCapacity,
        colsPerRow,
        capturedRows: nextRows,
        rowPhotos: { ...(savedRoomLayout?.rowPhotos || {}), [rowLetter]: uri },
        source: 'ROW_LAB'
      });

    pushFeedEvent(
      rowLetter,
      `Row ${rowLetter} ${mode === 'CAPTURE' ? 'Captured' : 'Picture Saved'}`,
      `Lab row stitched into ${roomName} (${numericCapacity} seats)`,
      'PRESENT'
    );
  };

  const setAttendanceRunning = (nextActive) => {
    if (nextActive === sessionActive) return;

    if (nextActive && !hasSavedLayout) {
      Alert.alert(
        'Seat Plan Required First',
        `Please capture or pick a room/lab seat photo for ${roomName} before starting attendance for the first time.`
      );
      return;
    }

    const sourceInfo = STREAM_SOURCES[streamSource] || STREAM_SOURCES.WIFI;
    springLayout();
    setSessionActive(nextActive);

    if (nextActive) {
      pushFeedEvent(
        'START',
        `Attendance Started (${sourceInfo.label})`,
        sourceInfo.detail,
        'PRESENT'
      );
    } else {
      pushFeedEvent(
        'END',
        'Attendance Ended',
        `${presentCount}/${enrolledCount} Present • ${lateCount} Late • ${anomalyCount} Anomalies`,
        'EMPTY'
      );
    }
  };

  const handleSelectSource = (nextKey) => {
    if (nextKey === streamSource) return;
    springLayout();
    setStreamSource(nextKey);
    const info = STREAM_SOURCES[nextKey];
    pushFeedEvent(
      nextKey === STREAM_SOURCES.WIFI.key ? 'WI-FI' : 'PHONE',
      `Switched to ${info.label}`,
      info.detail,
      'EMPTY'
    );
  };

  const handleOverrideSeatStatus = (newStatus) => {
    if (!selectedSeat) return;
    const confidence = newStatus === 'EMPTY' ? '-' : '99.0%';

    springLayout();
    setSeats((prev) =>
      prev.map((s) =>
        s.seat === selectedSeat.seat ? { ...s, status: newStatus, confidence } : s
      )
    );

    pushFeedEvent(
      selectedSeat.seat,
      `${selectedSeat.studentName} — Marked ${SEAT_STATES[newStatus].label}`,
      `Manual faculty override on Seat ${selectedSeat.seat}`,
      newStatus
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LiveAuraBackdrop color={cardColor} />

      <SeatPlanCheckModal
        visible={seatCheckVisible}
        roomName={roomName}
        seatCapacity={numericCapacity}
        choosingEditType={choosingEditType}
        onSelectEditSeats={() => setChoosingEditType(true)}
        onPickEditMode={(mode) => {
          springLayout();
          setCaptureMode(mode);
          setChoosingEditType(false);
          setSeatCheckVisible(false);
        }}
        onNoChanges={() => {
          setChoosingEditType(false);
          setSeatCheckVisible(false);
          pushFeedEvent(
            'PLAN',
            `Using Saved Seat Plan (${roomName})`,
            'No seat changes • Ready for attendance',
            'PRESENT'
          );
        }}
      />

      {/* Top Glass Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backGlassBtn}
          activeOpacity={0.8}
          onPress={() => setCurrentScreen('DASHBOARD')}
        >
          <Text style={styles.backBtnText}>← Classes</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Live Seat Map</Text>

        <TouchableOpacity
          style={styles.rosterBtn}
          activeOpacity={0.8}
          onPress={() => setCurrentScreen('ROSTER')}
        >
          <Text style={styles.rosterBtnText}>Class List</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <CameraHeaderCard
          course={course}
          enrolledCount={enrolledCount}
          seatCapacity={numericCapacity}
          cardColor={cardColor}
          sessionActive={sessionActive}
          streamSource={streamSource}
          onSelectSource={handleSelectSource}
        />

        <ClassroomViewport
          course={course}
          streamSource={streamSource}
          sessionActive={sessionActive}
          hasSavedLayout={hasSavedLayout}
          cameraFacing={cameraFacing}
          onFlipCamera={() =>
            setCameraFacing((prev) => (prev === 'back' ? 'front' : 'back'))
          }
          onToggleSession={() => setAttendanceRunning(!sessionActive)}
        />

        <SeatPlanSetupCard
          roomName={roomName}
          seatCapacityInput={seatCapacityInput}
          colsPerRow={colsPerRow}
          hasSavedLayout={hasSavedLayout}
          captureMode={captureMode}
          activeLabRow={activeLabRow}
          capturedRows={capturedRows}
          onChangeMode={(mode) => {
            springLayout();
            setCaptureMode(mode);
          }}
          onStepCapacity={handleStepCapacity}
          onTypeCapacity={applyCapacity}
          onRoomPhotoAction={handleRoomPhotoAction}
          onSelectLabRow={(rowLetter) => {
            springLayout();
            setActiveLabRow(rowLetter);
          }}
          onLabRowPhotoAction={handleLabRowPhotoAction}
        />

        {/* Summary Counters */}
        <View style={styles.summaryRow}>
          <GlassContainer style={styles.summaryCol} intensity={56}>
            <View style={styles.summaryInner}>
              <Text style={styles.summaryNum}>{presentCount}</Text>
              <Text style={styles.summaryLabel}>Present</Text>
            </View>
          </GlassContainer>

          <GlassContainer style={styles.summaryCol} intensity={56}>
            <View style={styles.summaryInner}>
              <Text style={[styles.summaryNum, { color: THEME.warning }]}>{lateCount}</Text>
              <Text style={styles.summaryLabel}>Late</Text>
            </View>
          </GlassContainer>

          <GlassContainer style={styles.summaryCol} intensity={56}>
            <View style={styles.summaryInner}>
              <Text style={[styles.summaryNum, { color: THEME.danger }]}>{anomalyCount}</Text>
              <Text style={styles.summaryLabel}>Anomalies</Text>
            </View>
          </GlassContainer>
        </View>

        {/* Classroom Seat Grid */}
        <Text style={styles.sectionTitle}>
          Classroom Layout ({numericCapacity} Seats • {enrolledCount} Students)
        </Text>
        <GlassContainer style={styles.seatGridWrap} intensity={60}>
          <View style={styles.seatGridInner}>
            <View style={styles.frontBoardTag}>
              <Text style={styles.frontBoardText}>FRONT • CAMERA & LECTERN</Text>
            </View>

            <View style={styles.seatsGrid}>
              {seats.map((item) => (
                <SeatTile
                  key={item.seat}
                  item={item}
                  isSelected={item.seat === selectedSeatCode}
                  onPress={(picked) => {
                    springLayout();
                    setSelectedSeatCode(picked.seat);
                  }}
                />
              ))}
            </View>
          </View>
        </GlassContainer>

        <SeatInspectorCard
          seat={selectedSeat}
          onOverrideStatus={handleOverrideSeatStatus}
        />

        <AttendanceFeedSection feed={feed} cardColor={cardColor} />
      </ScrollView>
    </SafeAreaView>
  );
}

// =============================================================================
// 5. STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },

  // Header
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12
  },
  backGlassBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)'
  },
  backBtnText: { fontSize: 14, fontWeight: '700', color: THEME.navy },
  headerTitle: { fontSize: 17, fontWeight: '800', color: THEME.navy, letterSpacing: -0.3 },
  rosterBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(7, 11, 36, 0.9)'
  },
  rosterBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 42
  },

  // Shared Glass Surface
  glassShadow: {
    borderRadius: 20,
    shadowColor: THEME.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4
  },
  glassClip: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.78)'
  },
  glassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.42)'
  },

  // Entry Seat Plan Prompt Modal
  promptOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(7, 11, 36, 0.28)'
  },
  promptCard: { borderRadius: 26 },
  promptInner: { padding: 20 },
  promptBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.muted,
    letterSpacing: 0.7,
    marginBottom: 4
  },
  promptTitle: { fontSize: 20, fontWeight: '900', color: THEME.navy },
  promptSub: { fontSize: 13, color: '#475569', marginTop: 6, lineHeight: 18 },
  promptActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  promptSecondaryBtn: {
    flex: 0.47,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(7, 11, 36, 0.15)'
  },
  promptSecondaryText: { fontSize: 12, fontWeight: '800', color: THEME.navy },
  promptPrimaryBtn: {
    flex: 0.5,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: THEME.navy
  },
  promptPrimaryText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },

  // Camera Hero Card
  camCardShadow: {
    borderRadius: 24,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 7
  },
  camCardClip: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.75)'
  },
  camCardBody: { padding: 20 },
  camTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 11, 36, 0.78)',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 7 },
  livePillText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  streamStateText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  camCourseTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  camMetaSub: { fontSize: 13, fontWeight: '700', marginTop: 4 },

  sourceSelectorRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    marginTop: 14,
    borderWidth: 1
  },
  sourceOptionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center'
  },
  sourceOptionBtnActive: { backgroundColor: 'rgba(255, 255, 255, 0.92)' },
  sourceOptionText: { fontSize: 12, fontWeight: '800' },
  sourceOptionTextActive: { color: THEME.navy },

  camFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12
  },
  sourceHintText: { flex: 1, fontSize: 11, fontWeight: '700' },

  // Classroom Live Viewport
  viewportWrap: {
    borderRadius: 22,
    marginBottom: 14,
    shadowColor: THEME.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5
  },
  viewportClip: {
    height: 196,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    backgroundColor: '#0F172A'
  },
  cameraFeed: { flex: 1 },
  roomPreviewCanvas: { flex: 1 },
  viewportStandby: { padding: 20, alignItems: 'center' },
  standbyTitle: { fontSize: 15, fontWeight: '800', color: THEME.navy },
  standbySub: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18
  },
  standbyActionBtn: {
    backgroundColor: THEME.navy,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12
  },
  standbyActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  detectBox: {
    position: 'absolute',
    width: 68,
    height: 54,
    borderWidth: 1.8,
    borderRadius: 8
  },
  detectTag: {
    position: 'absolute',
    top: -16,
    left: -1,
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  viewportTopHud: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  hudPill: {
    backgroundColor: 'rgba(7, 11, 36, 0.72)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  hudPillText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  hudRightGroup: { flexDirection: 'row', alignItems: 'center' },
  hudFlipBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    marginRight: 6
  },
  hudFlipText: { color: THEME.navy, fontSize: 10, fontWeight: '800' },
  hudEndBtn: {
    backgroundColor: 'rgba(185, 28, 28, 0.92)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999
  },
  hudEndText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  viewportBottomHud: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(7, 11, 36, 0.72)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  endpointText: { color: '#E2E8F0', fontSize: 11, fontWeight: '600', flex: 1, paddingRight: 8 },
  hudSubText: { color: '#94A3B8', fontSize: 10, fontWeight: '700' },

  // Seat Plan Setup Card
  setupCardWrap: { marginBottom: 14 },
  setupCardInner: { padding: 14 },
  setupTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  setupTitle: { fontSize: 14, fontWeight: '800', color: THEME.navy },
  setupSub: { fontSize: 11, fontWeight: '600', color: THEME.muted, marginTop: 2 },
  stepperRow: { flexDirection: 'row', alignItems: 'center' },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(7, 11, 36, 0.16)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepperBtnText: { fontSize: 16, fontWeight: '800', color: THEME.navy },
  capacityInput: {
    width: 48,
    height: 30,
    marginHorizontal: 6,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(7, 11, 36, 0.16)',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: THEME.navy,
    paddingVertical: 0
  },

  modeSwitchRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(7, 11, 36, 0.08)',
    padding: 3,
    borderRadius: 11,
    marginBottom: 10
  },
  modeSwitchBtn: { flex: 1, paddingVertical: 7, borderRadius: 9, alignItems: 'center' },
  modeSwitchBtnActive: { backgroundColor: '#FFFFFF' },
  modeSwitchText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  modeSwitchTextActive: { color: THEME.navy, fontWeight: '800' },

  photoBtnPair: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  photoActionBtn: {
    flex: 0.485,
    backgroundColor: 'rgba(7, 11, 36, 0.9)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center'
  },
  photoActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  rowChipsScroll: { paddingBottom: 6 },
  rowChip: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(7, 11, 36, 0.14)',
    marginRight: 6
  },
  rowChipSelected: { backgroundColor: THEME.navy, borderColor: THEME.navy },
  rowChipDone: { backgroundColor: 'rgba(22, 163, 74, 0.18)', borderColor: 'rgba(22, 163, 74, 0.45)' },
  rowChipText: { fontSize: 11, fontWeight: '800', color: THEME.navy },

  // Summary Counters
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  summaryCol: { flex: 0.315 },
  summaryInner: { paddingVertical: 12, alignItems: 'center' },
  summaryNum: { fontSize: 22, fontWeight: '900', color: THEME.navy },
  summaryLabel: { fontSize: 11, fontWeight: '700', color: THEME.muted, marginTop: 2 },

  // Seat Grid
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.navy,
    marginBottom: 10,
    paddingHorizontal: 2,
    letterSpacing: -0.3
  },
  seatGridWrap: { marginBottom: 16 },
  seatGridInner: { padding: 14 },
  frontBoardTag: {
    alignSelf: 'center',
    backgroundColor: 'rgba(7, 11, 36, 0.08)',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginBottom: 12
  },
  frontBoardText: { fontSize: 10, fontWeight: '800', color: '#475569', letterSpacing: 0.7 },
  seatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  seatTile: {
    width: '23.5%',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1.2
  },
  seatTileSelected: { borderWidth: 2 },
  seatTileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  seatCode: { fontSize: 12, fontWeight: '900', color: THEME.navy },
  seatStatusDot: { width: 6, height: 6, borderRadius: 3 },
  seatStudentName: { fontSize: 10, fontWeight: '700', color: THEME.ink },
  seatStatusLabel: { fontSize: 9, fontWeight: '800', marginTop: 2 },

  // Seat Inspector
  inspectorWrap: { marginBottom: 20 },
  inspectorInner: { padding: 16 },
  inspectorTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  inspectorInfo: { flex: 1, paddingRight: 10 },
  inspectorTitle: { fontSize: 15, fontWeight: '800', color: THEME.navy },
  inspectorSub: { fontSize: 12, color: THEME.muted, fontWeight: '600', marginTop: 2 },
  statusTag: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 10 },
  statusTagText: { fontSize: 11, fontWeight: '800' },
  overrideRow: { flexDirection: 'row', justifyContent: 'space-between' },
  overrideBtn: {
    flex: 0.315,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)'
  },
  overrideBtnActive: { backgroundColor: THEME.navy, borderColor: THEME.navy },
  overrideBtnText: { fontSize: 12, fontWeight: '700', color: THEME.navy },
  overrideBtnTextActive: { color: '#FFFFFF' },

  // Attendance Feed
  feedWrap: { marginBottom: 12 },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14
  },
  feedRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 23, 42, 0.07)'
  },
  feedSeatBadge: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  feedSeatText: { fontSize: 12, fontWeight: '900', color: THEME.navy },
  feedTextCol: { flex: 1, paddingRight: 8 },
  feedTitle: { fontSize: 13, fontWeight: '800', color: THEME.navy },
  feedDetail: { fontSize: 11, color: THEME.muted, fontWeight: '600', marginTop: 2 },
  feedRightCol: { alignItems: 'flex-end' },
  feedTone: { fontSize: 11, fontWeight: '800' },
  feedTime: { fontSize: 10, color: THEME.muted, fontWeight: '600', marginTop: 2 }
});