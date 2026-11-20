import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  PanResponder,
  Image,
  Dimensions,
  Easing,
  LayoutAnimation,
  UIManager
} from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Rect,
  Circle
} from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const COLOR_PRESETS = [
  { name: 'Red', hex: '#ED0A3F' },
  { name: 'Orange', hex: '#FF8833' },
  { name: 'Yellow', hex: '#FBE870' },
  { name: 'Green', hex: '#01A638' },
  { name: 'Blue', hex: '#0066FF' },
  { name: 'Violet', hex: '#8359A3' },
  { name: 'Brown', hex: '#AF593E' }
];
const DEFAULT_COLOR = '#01A638';

const springLayout = () => {
  LayoutAnimation.configureNext({
    duration: 320,
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

// ---- Color Helpers ----
const hexToRgb = (hex) => {
  const h = (hex || DEFAULT_COLOR).replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
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

const getShades = (base) => [
  mixColor(base, '#FFFFFF', 0.7),
  mixColor(base, '#FFFFFF', 0.5),
  mixColor(base, '#FFFFFF', 0.25),
  mixColor(base, '#FFFFFF', 0),
  mixColor(base, '#000000', 0.2),
  mixColor(base, '#000000', 0.4),
  mixColor(base, '#000000', 0.55)
];

const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const getCardTheme = (bg) => {
  const L = luminance(bg);
  const useWhite = 1.05 / (L + 0.05) > (L + 0.05) / 0.056;
  const rgb = useWhite ? '255, 255, 255' : '7, 11, 36';
  return {
    ink: useWhite ? '#FFFFFF' : '#0B1320',
    inkSoft: `rgba(${rgb}, 0.8)`
  };
};

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

const MINI_WEEK_BARS = [0.85, 0.55, 0.4, 0.72, 0.95, 0.45, 0.8];

// Living, gently drifting card-color aura backdrop
function CardAuraBackground({ color }) {
  const driftA = useRef(new Animated.Value(0)).current;
  const driftB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loopA = Animated.loop(
      Animated.sequence([
        Animated.timing(driftA, {
          toValue: 1,
          duration: 5200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(driftA, {
          toValue: 0,
          duration: 5200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );

    const loopB = Animated.loop(
      Animated.sequence([
        Animated.timing(driftB, {
          toValue: 1,
          duration: 6800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(driftB, {
          toValue: 0,
          duration: 6800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );

    loopA.start();
    loopB.start();
    return () => {
      loopA.stop();
      loopB.stop();
    };
  }, []);

  const baseCanvas = mixColor(color, '#FFFFFF', 0.86);
  const softGlow = mixColor(color, '#FFFFFF', 0.25);
  const deepGlow = mixColor(color, '#000000', 0.12);

  const orbATranslateY = driftA.interpolate({ inputRange: [0, 1], outputRange: [-14, 18] });
  const orbAScale = driftA.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.06] });
  const orbBTranslateX = driftB.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] });
  const orbBTranslateY = driftB.interpolate({ inputRange: [0, 1], outputRange: [12, -16] });

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: baseCanvas }]} pointerEvents="none">
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateY: orbATranslateY }, { scale: orbAScale }] }
        ]}
      >
        <Svg width={SCREEN_W} height={SCREEN_H}>
          <Defs>
            <RadialGradient id="auraTop" cx="50%" cy="18%" r="62%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.62" />
              <Stop offset="55%" stopColor={softGlow} stopOpacity="0.32" />
              <Stop offset="100%" stopColor={baseCanvas} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={SCREEN_W * 0.5} cy={SCREEN_H * 0.18} r={SCREEN_W * 0.9} fill="url(#auraTop)" />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX: orbBTranslateX }, { translateY: orbBTranslateY }] }
        ]}
      >
        <Svg width={SCREEN_W} height={SCREEN_H}>
          <Defs>
            <RadialGradient id="auraLeft" cx="10%" cy="56%" r="58%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.46" />
              <Stop offset="100%" stopColor={baseCanvas} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="auraRight" cx="90%" cy="76%" r="58%">
              <Stop offset="0%" stopColor={deepGlow} stopOpacity="0.34" />
              <Stop offset="100%" stopColor={baseCanvas} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={SCREEN_W * 0.1} cy={SCREEN_H * 0.56} r={SCREEN_W * 0.8} fill="url(#auraLeft)" />
          <Circle cx={SCREEN_W * 0.9} cy={SCREEN_H * 0.76} r={SCREEN_W * 0.8} fill="url(#auraRight)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

// Reusable frosted glass panel with crisp specular rim
function GlassPanel({ style, intensity = 58, children }) {
  return (
    <View style={[styles.glassShadowWrap, style]}>
      <View style={styles.glassClipWrap}>
        <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.glassTintLayer} />
        {children}
      </View>
    </View>
  );
}

// Floating Glassmorphic Swipe Action Capsule (Present / Late / Absent)
function GlassActionPill({ label, tintRgba, glowColor, scaleAnim, onPress }) {
  const pressScale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View
      style={[
        styles.glassActionOuter,
        {
          shadowColor: glowColor,
          transform: [{ scale: Animated.multiply(scaleAnim, pressScale) }]
        }
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={() =>
          Animated.spring(pressScale, {
            toValue: 0.92,
            friction: 7,
            useNativeDriver: true
          }).start()
        }
        onPressOut={() =>
          Animated.spring(pressScale, {
            toValue: 1,
            friction: 6,
            useNativeDriver: true
          }).start()
        }
        onPress={onPress}
        style={styles.glassActionClip}
      >
        <BlurView intensity={48} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tintRgba }]} />
        <View style={styles.glassActionTopSheen} />
        <Text style={styles.glassActionText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Swipeable Glass Student Row with Glassmorphic Present / Late / Absent Capsules
function SwipeableStudentRow({ item, badge, accentColor, isLast, onSelectStatus }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const badgePop = useRef(new Animated.Value(1)).current;
  const isOpen = useRef(false);
  const ACTION_WIDTH = 228;

  const actionsOpacity = translateX.interpolate({
    inputRange: [-64, -12, 0],
    outputRange: [1, 0.35, 0],
    extrapolate: 'clamp'
  });

  const presentScale = translateX.interpolate({
    inputRange: [-ACTION_WIDTH, -110, 0],
    outputRange: [1, 0.92, 0.72],
    extrapolate: 'clamp'
  });

  const lateScale = translateX.interpolate({
    inputRange: [-ACTION_WIDTH, -80, 0],
    outputRange: [1, 0.9, 0.68],
    extrapolate: 'clamp'
  });

  const absentScale = translateX.interpolate({
    inputRange: [-ACTION_WIDTH, -50, 0],
    outputRange: [1, 0.88, 0.64],
    extrapolate: 'clamp'
  });

  const openActions = () => {
    isOpen.current = true;
    Animated.spring(translateX, {
      toValue: -ACTION_WIDTH,
      friction: 7,
      tension: 65,
      useNativeDriver: true
    }).start();
  };

  const closeActions = () => {
    isOpen.current = false;
    Animated.spring(translateX, {
      toValue: 0,
      friction: 7,
      tension: 65,
      useNativeDriver: true
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) => {
        const base = isOpen.current ? -ACTION_WIDTH : 0;
        const nextX = Math.min(0, Math.max(-ACTION_WIDTH - 18, base + gestureState.dx));
        translateX.setValue(nextX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -45 || gestureState.vx < -0.45) {
          openActions();
        } else if (gestureState.dx > 45 || gestureState.vx > 0.45) {
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
    Animated.sequence([
      Animated.spring(badgePop, { toValue: 1.18, friction: 5, useNativeDriver: true }),
      Animated.spring(badgePop, { toValue: 1, friction: 6, useNativeDriver: true })
    ]).start();
  };

  const initials = item.name
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  const avatarTint = hexToRgba(accentColor, 0.22);
  const avatarInk = mixColor(accentColor, '#000000', 0.45);

  return (
    <View style={[styles.swipeRowWrap, !isLast && styles.rowDivider]}>
      {/* Glassmorphic Swipe Tray: Present / Late / Absent */}
      <Animated.View
        style={[
          styles.hiddenActionsContainer,
          { width: ACTION_WIDTH, opacity: actionsOpacity }
        ]}
      >
        <GlassActionPill
          label="Present"
          tintRgba="rgba(22, 163, 74, 0.58)"
          glowColor="#16A34A"
          scaleAnim={presentScale}
          onPress={() => chooseStatus('PRESENT')}
        />
        <GlassActionPill
          label="Late"
          tintRgba="rgba(217, 119, 6, 0.58)"
          glowColor="#D97706"
          scaleAnim={lateScale}
          onPress={() => chooseStatus('LATE')}
        />
        <GlassActionPill
          label="Absent"
          tintRgba="rgba(71, 85, 105, 0.56)"
          glowColor="#475569"
          scaleAnim={absentScale}
          onPress={() => chooseStatus('ABSENT')}
        />
      </Animated.View>

      {/* Foreground Glass Student Row */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.studentRowInner, { transform: [{ translateX }] }]}
      >
        <View style={[styles.studentAvatar, { backgroundColor: avatarTint }]}>
          <Text style={[styles.studentAvatarText, { color: avatarInk }]}>
            {initials}
          </Text>
        </View>

        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.studentName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.studentMeta}>
            ID {item.id} • Seat {item.seat}
          </Text>
          {item.anomaly_note ? (
            <Text style={styles.anomalyInlineText} numberOfLines={1}>
              ⚠️ {item.anomaly_note}
            </Text>
          ) : (
            <Text style={styles.studentConfidence}>Match {item.confidence}</Text>
          )}
        </View>

        <View style={styles.rowRightCol}>
          <Animated.View
            style={[
              styles.statusGlassOuter,
              { transform: [{ scale: badgePop }] }
            ]}
          >
            <BlurView intensity={38} tint="light" style={StyleSheet.absoluteFill} />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: badge.glassTint }
              ]}
            />
            <Text style={[styles.statusPillText, { color: badge.text }]}>
              {badge.label}
            </Text>
          </Animated.View>
          <Text style={styles.swipeCue}>‹ Slide</Text>
        </View>
      </Animated.View>
    </View>
  );
}

export default function RosterScreen({
  course,
  onUpdateCourseColor,
  onDeleteCourse,
  setCurrentScreen
}) {
  const courseKey = course?.course_id || 'CS301';
  const cardColor = course?.card_color || DEFAULT_COLOR;
  const activeBase = course?.card_base || cardColor;
  const cardTheme = getCardTheme(cardColor);

  const [students, setStudents] = useState(
    INITIAL_STUDENTS[courseKey] || INITIAL_STUDENTS.CS301
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'ANOMALY'

  // Inline Card Settings / Color Theme Panel
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [shadeBase, setShadeBase] = useState(null);

  // Screen 4: DPA Consent & Biometric Upload Modal State
  const [dpaModalVisible, setDpaModalVisible] = useState(false);
  const [dpaAccepted, setDpaAccepted] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentSeat, setNewStudentSeat] = useState('');
  const [capturedPhotoUri, setCapturedPhotoUri] = useState(null);
  const [captureSource, setCaptureSource] = useState('');

  // Premium Motion Refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const heroEnter = useRef(new Animated.Value(0)).current;
  const bentoEnter = useRef(new Animated.Value(0)).current;
  const listEnter = useRef(new Animated.Value(0)).current;
  const barReveal = useRef(MINI_WEEK_BARS.map(() => new Animated.Value(0))).current;
  const heroPressScale = useRef(new Animated.Value(1)).current;
  const enrollPressScale = useRef(new Animated.Value(1)).current;

  // Staggered spring entrance on screen mount
  useEffect(() => {
    Animated.stagger(80, [
      Animated.spring(heroEnter, {
        toValue: 1,
        friction: 7,
        tension: 52,
        useNativeDriver: true
      }),
      Animated.spring(bentoEnter, {
        toValue: 1,
        friction: 7,
        tension: 52,
        useNativeDriver: true
      }),
      Animated.spring(listEnter, {
        toValue: 1,
        friction: 7,
        tension: 52,
        useNativeDriver: true
      })
    ]).start();

    Animated.stagger(
      55,
      barReveal.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          friction: 7,
          tension: 55,
          useNativeDriver: true
        })
      )
    ).start();
  }, []);

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
  const attendancePct =
    students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  const accentDark = mixColor(cardColor, '#000000', 0.35);

  // Subtle parallax & scale on Hero Card as you scroll
  const heroParallaxY = scrollY.interpolate({
    inputRange: [-120, 0, 220],
    outputRange: [-18, 0, 28],
    extrapolate: 'clamp'
  });
  const heroScrollScale = scrollY.interpolate({
    inputRange: [-120, 0, 220],
    outputRange: [1.03, 1, 0.94],
    extrapolate: 'clamp'
  });

  const handleSetStatus = (studentId, newStatus) => {
    springLayout();
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, status: newStatus, anomaly_note: null } : s
      )
    );
  };

  const handleToggleThemePanel = () => {
    springLayout();
    setShadeBase(null);
    setShowThemePanel((prev) => !prev);
  };

  const handleFilterChange = (mode) => {
    springLayout();
    setFilterMode(mode);
  };

  const handlePickColor = (hex, baseHex) => {
    if (course && onUpdateCourseColor) {
      onUpdateCourseColor(course.course_id, hex, baseHex || hex);
    }
  };

  const handleDeleteCurrentClass = () => {
    if (!course || !onDeleteCourse) return;
    Alert.alert(
      'Delete Class',
      `Remove ${course.course_name} from your classes?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteCourse(course.course_id)
        }
      ]
    );
  };

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
        'Please take a photo with the camera or upload a photo from your library.'
      );
      return;
    }
    if (!dpaAccepted) {
      Alert.alert(
        'DPA Consent Required',
        'Student must accept the RA 10173 Data Privacy Act consent agreement.'
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

    springLayout();
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
        return {
          glassTint: 'rgba(22, 163, 74, 0.24)',
          text: '#14532D',
          label: 'Present'
        };
      case 'LATE':
        return {
          glassTint: 'rgba(217, 119, 6, 0.24)',
          text: '#78350F',
          label: 'Late'
        };
      case 'ANOMALY':
        return {
          glassTint: 'rgba(220, 38, 38, 0.24)',
          text: '#991B1B',
          label: 'Anomaly'
        };
      default:
        return {
          glassTint: 'rgba(100, 116, 139, 0.22)',
          text: '#334155',
          label: 'Absent'
        };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Living Glowing Card-Color Aura Background */}
      <CardAuraBackground color={cardColor} />

      {/* Top Glass Header ("Done" + "•••") */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.doneGlassBtn}
          activeOpacity={0.8}
          onPress={() => setCurrentScreen('DASHBOARD')}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moreCircleBtn}
          activeOpacity={0.8}
          onPress={handleToggleThemePanel}
        >
          <Text style={styles.moreDotsText}>•••</Text>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* GLASSMORPHIC HERO CLASS CARD with Entrance + Scroll Parallax + Press Scale */}
        <Animated.View
          style={{
            opacity: heroEnter,
            transform: [
              {
                translateY: Animated.add(
                  heroEnter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
                  heroParallaxY
                )
              },
              { scale: Animated.multiply(heroScrollScale, heroPressScale) }
            ]
          }}
        >
          <TouchableOpacity
            activeOpacity={0.96}
            onPressIn={() =>
              Animated.spring(heroPressScale, {
                toValue: 0.975,
                friction: 7,
                useNativeDriver: true
              }).start()
            }
            onPressOut={() =>
              Animated.spring(heroPressScale, {
                toValue: 1,
                friction: 6,
                useNativeDriver: true
              }).start()
            }
            onPress={handleToggleThemePanel}
            style={[styles.heroCardShadow, { shadowColor: cardColor }]}
          >
            <View style={styles.heroCardClip}>
              <BlurView intensity={65} tint="light" style={StyleSheet.absoluteFill} />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: hexToRgba(cardColor, 0.56) }
                ]}
              />
              <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
                <Defs>
                  <LinearGradient id="heroGlassSheen" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.54" />
                    <Stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.12" />
                    <Stop offset="100%" stopColor={accentDark} stopOpacity="0.22" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#heroGlassSheen)" />
              </Svg>

              <View style={styles.heroCardContent}>
                <Text style={[styles.heroSchedRoom, { color: cardTheme.inkSoft }]}>
                  {course?.schedule || 'MWF 09:00 AM'} • {course?.room || 'Osmeña Rm 302'}
                </Text>

                <View style={styles.heroBottomRow}>
                  <Text
                    style={[styles.heroSubject, { color: cardTheme.ink }]}
                    numberOfLines={2}
                  >
                    {course?.course_name || 'Software Engineering'}
                  </Text>
                  <Text style={[styles.heroStudents, { color: cardTheme.ink }]}>
                    {course?.enrolled_count ?? students.length}{' '}
                    {(course?.enrolled_count ?? students.length) === 1
                      ? 'student'
                      : 'students'}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* GLASS CARD COLOR THEME PANEL (Toggled smoothly via LayoutAnimation) */}
        {showThemePanel && (
          <GlassPanel style={{ marginBottom: 16 }} intensity={65}>
            <View style={styles.themePanelInner}>
              <View style={styles.themePanelHeader}>
                <Text style={styles.themePanelTitle}>Card Color Theme</Text>
                <TouchableOpacity onPress={handleDeleteCurrentClass}>
                  <Text style={styles.deleteLinkText}>Delete Class</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.swatchRow}
              >
                {COLOR_PRESETS.map(({ name, hex }) => (
                  <TouchableOpacity
                    key={hex}
                    accessibilityLabel={`${name}. Hold for shades.`}
                    delayLongPress={320}
                    style={[
                      styles.swatchCircle,
                      { backgroundColor: hex },
                      activeBase === hex && styles.swatchCircleActive
                    ]}
                    onPress={() => {
                      springLayout();
                      handlePickColor(hex, hex);
                      setShadeBase(null);
                    }}
                    onLongPress={() => {
                      springLayout();
                      setShadeBase(hex);
                    }}
                  />
                ))}
              </ScrollView>

              {shadeBase ? (
                <View style={styles.shadeSection}>
                  <Text style={styles.shadeHint}>Light to dark — tap a shade:</Text>
                  <View style={styles.shadeRow}>
                    {getShades(shadeBase).map((shade) => (
                      <TouchableOpacity
                        key={shade}
                        style={[
                          styles.shadeChip,
                          { backgroundColor: shade },
                          cardColor.toUpperCase() === shade && styles.shadeChipActive
                        ]}
                        onPress={() => handlePickColor(shade, shadeBase)}
                      />
                    ))}
                  </View>
                </View>
              ) : (
                <Text style={styles.shadeHint}>
                  Tap a color to match the card & aura. Hold for lighter or darker shades.
                </Text>
              )}
            </View>
          </GlassPanel>
        )}

        {/* GLASSMORPHIC BENTO DASHBOARD GRID */}
        <Animated.View
          style={[
            styles.bentoGrid,
            {
              opacity: bentoEnter,
              transform: [
                {
                  translateY: bentoEnter.interpolate({
                    inputRange: [0, 1],
                    outputRange: [28, 0]
                  })
                }
              ]
            }
          ]}
        >
          {/* Left Column: 2 Stacked Glass Tiles */}
          <View style={styles.bentoLeftCol}>
            <GlassPanel intensity={60}>
              <View style={styles.bentoTileInner}>
                <Text style={styles.bentoLabel}>Verified Attendance</Text>
                <Text style={styles.bentoBigVal}>{attendancePct}%</Text>
                <Text style={styles.bentoSub}>
                  {presentCount} of {students.length} Present
                </Text>
              </View>
            </GlassPanel>

            <GlassPanel style={{ marginTop: 12 }} intensity={60}>
              <View style={styles.bentoTileInner}>
                <Text style={styles.bentoLabel}>Weekly Activity</Text>
                <View style={styles.miniBarsRow}>
                  {MINI_WEEK_BARS.map((val, idx) => {
                    const barH = Math.round(val * 34);
                    const barY = barReveal[idx].interpolate({
                      inputRange: [0, 1],
                      outputRange: [barH, 0]
                    });
                    return (
                      <View
                        key={idx}
                        style={{
                          width: 8,
                          height: barH,
                          overflow: 'hidden',
                          borderRadius: 4
                        }}
                      >
                        <Animated.View
                          style={[
                            styles.miniBar,
                            {
                              height: barH,
                              backgroundColor:
                                idx % 2 === 0
                                  ? hexToRgba(cardColor, 0.9)
                                  : hexToRgba(cardColor, 0.44),
                              transform: [{ translateY: barY }]
                            }
                          ]}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>
            </GlassPanel>
          </View>

          {/* Right Column: Tall Glass Tile + Tactile Circular Enroll Button */}
          <GlassPanel style={styles.bentoRightCol} intensity={60}>
            <View style={styles.bentoRightInner}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  handleFilterChange(filterMode === 'ANOMALY' ? 'ALL' : 'ANOMALY')
                }
              >
                <Text style={styles.bentoLabel}>Pending Anomalies</Text>
                <Text
                  style={[
                    styles.bentoBigVal,
                    anomalyCount > 0 && { color: '#DC2626' }
                  ]}
                >
                  {anomalyCount} {anomalyCount === 1 ? 'Flag' : 'Flags'}
                </Text>
                <Text style={styles.bentoSub}>
                  {anomalyCount > 0 ? 'Tap to filter flags' : 'All clear today'}
                </Text>
              </TouchableOpacity>

              <Animated.View style={{ alignSelf: 'flex-end', transform: [{ scale: enrollPressScale }] }}>
                <TouchableOpacity
                  style={styles.roundActionBtn}
                  activeOpacity={0.9}
                  onPressIn={() =>
                    Animated.spring(enrollPressScale, {
                      toValue: 0.91,
                      friction: 6,
                      useNativeDriver: true
                    }).start()
                  }
                  onPressOut={() =>
                    Animated.spring(enrollPressScale, {
                      toValue: 1,
                      friction: 6,
                      useNativeDriver: true
                    }).start()
                  }
                  onPress={() => setDpaModalVisible(true)}
                >
                  <Text style={styles.roundActionBtnText}>Enroll</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </GlassPanel>
        </Animated.View>

        {/* CLASS LIST SECTION */}
        <Animated.View
          style={{
            opacity: listEnter,
            transform: [
              {
                translateY: listEnter.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0]
                })
              }
            ]
          }}
        >
          <View style={styles.listHeaderRow}>
            <Text style={styles.listSectionTitle}>Class List</Text>

            <View style={styles.filterPillsRow}>
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filterMode === 'ALL' && styles.filterPillActiveDark
                ]}
                onPress={() => handleFilterChange('ALL')}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filterMode === 'ALL' && { color: '#FFFFFF' }
                  ]}
                >
                  All ({students.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filterMode === 'ANOMALY' && styles.filterPillActiveRed
                ]}
                onPress={() => handleFilterChange('ANOMALY')}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filterMode === 'ANOMALY' && { color: '#FFFFFF' }
                  ]}
                >
                  Anomalies ({anomalyCount})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Frosted Glass Search Input */}
          <GlassPanel style={{ marginBottom: 12, borderRadius: 16 }} intensity={55}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search student name or DLSAU ID..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </GlassPanel>

          {/* Glassmorphic Grouped Student List Card */}
          <GlassPanel style={{ borderRadius: 22 }} intensity={62}>
            {filteredStudents.length === 0 ? (
              <View style={styles.emptyListBox}>
                <Text style={styles.emptyListText}>No matching students found.</Text>
              </View>
            ) : (
              filteredStudents.map((item, idx) => (
                <SwipeableStudentRow
                  key={item.id}
                  item={item}
                  badge={getBadgeStyle(item.status)}
                  accentColor={cardColor}
                  isLast={idx === filteredStudents.length - 1}
                  onSelectStatus={handleSetStatus}
                />
              ))
            )}
          </GlassPanel>
        </Animated.View>
      </Animated.ScrollView>

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
              <Text style={[styles.modalSubtitle, { color: accentDark }]}>
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

              <Text style={styles.label}>Facial Biometric Source</Text>
              <View style={styles.photoButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.photoOptionBtn,
                    captureSource === 'CAMERA' && {
                      backgroundColor: mixColor(cardColor, '#FFFFFF', 0.88),
                      borderColor: cardColor
                    }
                  ]}
                  onPress={handleTakePhoto}
                >
                  <Text style={styles.photoOptionIcon}>📷</Text>
                  <Text style={styles.photoOptionText}>Use Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.photoOptionBtn,
                    captureSource === 'GALLERY' && {
                      backgroundColor: mixColor(cardColor, '#FFFFFF', 0.88),
                      borderColor: cardColor
                    }
                  ]}
                  onPress={handlePickImage}
                >
                  <Text style={styles.photoOptionIcon}>🖼️</Text>
                  <Text style={styles.photoOptionText}>Upload Photo</Text>
                </TouchableOpacity>
              </View>

              {capturedPhotoUri && (
                <View
                  style={[
                    styles.previewBanner,
                    {
                      backgroundColor: mixColor(cardColor, '#FFFFFF', 0.88),
                      borderColor: cardColor
                    }
                  ]}
                >
                  <Image
                    source={{ uri: capturedPhotoUri }}
                    style={[styles.previewThumb, { borderColor: cardColor }]}
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

              <TouchableOpacity
                style={styles.dpaConsentBox}
                onPress={() => setDpaAccepted(!dpaAccepted)}
              >
                <View
                  style={[
                    styles.checkbox,
                    dpaAccepted && { backgroundColor: cardColor, borderColor: cardColor }
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
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  // Shared Glass Panel Surface
  glassShadowWrap: {
    borderRadius: 20,
    shadowColor: '#070B24',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4
  },
  glassClipWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.74)'
  },
  glassTintLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.36)'
  },

  // Top Bar
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10
  },
  doneGlassBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.54)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)'
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#070B24',
    letterSpacing: -0.2
  },
  moreCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(7, 11, 36, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)'
  },
  moreDotsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 42
  },

  // Glassmorphic Hero Card
  heroCardShadow: {
    height: 198,
    borderRadius: 24,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8
  },
  heroCardClip: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.74)'
  },
  heroCardContent: {
    flex: 1,
    padding: 22,
    justifyContent: 'space-between'
  },
  heroSchedRoom: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1
  },
  heroBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  heroSubject: {
    flex: 1,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.6,
    paddingRight: 12
  },
  heroStudents: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 0
  },

  // Inline Glass Color Theme Panel
  themePanelInner: { padding: 16 },
  themePanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  themePanelTitle: { fontSize: 14, fontWeight: '800', color: '#070B24' },
  deleteLinkText: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  swatchRow: { paddingVertical: 4, paddingHorizontal: 2 },
  swatchCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
    borderWidth: 3,
    borderColor: 'transparent'
  },
  swatchCircleActive: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.12 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4
  },
  shadeSection: { marginTop: 10 },
  shadeHint: { fontSize: 11, color: '#475569', fontWeight: '600', marginTop: 8 },
  shadeRow: { flexDirection: 'row', marginTop: 6 },
  shadeChip: {
    flex: 1,
    height: 30,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 2.5,
    borderColor: 'transparent'
  },
  shadeChipActive: { borderColor: '#070B24' },

  // Glass Bento Grid
  bentoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  bentoLeftCol: { flex: 0.485 },
  bentoTileInner: { padding: 15 },
  bentoRightCol: { flex: 0.485 },
  bentoRightInner: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between'
  },
  bentoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4
  },
  bentoBigVal: {
    fontSize: 26,
    fontWeight: '800',
    color: '#070B24',
    letterSpacing: -0.7
  },
  bentoSub: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginTop: 2
  },
  miniBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 40,
    marginTop: 8,
    paddingHorizontal: 2
  },
  miniBar: { width: 8, borderRadius: 4 },
  roundActionBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(7, 11, 36, 0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#070B24',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10
  },
  roundActionBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  // Class List Section
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  listSectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#070B24',
    letterSpacing: -0.4
  },
  filterPillsRow: { flexDirection: 'row' },
  filterPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginLeft: 6
  },
  filterPillActiveDark: {
    backgroundColor: 'rgba(7, 11, 36, 0.9)',
    borderColor: 'rgba(7, 11, 36, 0.9)'
  },
  filterPillActiveRed: {
    backgroundColor: 'rgba(220, 38, 38, 0.92)',
    borderColor: 'rgba(220, 38, 38, 0.92)'
  },
  filterPillText: { fontSize: 11, fontWeight: '700', color: '#334155' },
  searchInput: {
    color: '#0F172A',
    paddingVertical: 13,
    paddingHorizontal: 15,
    fontSize: 14
  },
  emptyListBox: { padding: 28, alignItems: 'center' },
  emptyListText: { fontSize: 14, color: '#475569', fontWeight: '600' },

  // Swipeable Glass Row & Glassmorphic Present / Late / Absent Tray
  swipeRowWrap: {
    position: 'relative',
    overflow: 'hidden'
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.55)'
  },
  hiddenActionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8
  },
  glassActionOuter: {
    flex: 1,
    height: '100%',
    marginHorizontal: 3,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4
  },
  glassActionClip: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  glassActionTopSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.22)'
  },
  glassActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.1,
    textShadowColor: 'rgba(0, 0, 0, 0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  studentRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    paddingVertical: 14,
    paddingHorizontal: 14
  },
  studentAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  studentAvatarText: { fontSize: 14, fontWeight: '800' },
  studentName: { fontSize: 15, fontWeight: '800', color: '#070B24' },
  studentMeta: { fontSize: 12, color: '#475569', marginTop: 2, fontWeight: '500' },
  studentConfidence: { fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: '600' },
  anomalyInlineText: { fontSize: 11, color: '#DC2626', marginTop: 2, fontWeight: '700' },
  rowRightCol: { alignItems: 'flex-end' },
  statusGlassOuter: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)'
  },
  statusPillText: { fontSize: 11, fontWeight: '800' },
  swipeCue: { fontSize: 10, color: '#64748B', marginTop: 4, fontWeight: '600' },

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
  modalSubtitle: { fontSize: 12, fontWeight: '700', marginBottom: 16, marginTop: 2 },
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
  photoOptionIcon: { fontSize: 16, marginRight: 8 },
  photoOptionText: { fontSize: 14, fontWeight: '800', color: '#070B24' },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 14
  },
  previewThumb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1.5
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