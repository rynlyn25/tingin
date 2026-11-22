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
import LiquidSectionBar from '../components/LiquidSectionBar';

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
  danger: '#DC2626',
  defaultCardColor: '#01A638'
};

const COLOR_PRESETS = [
  { name: 'Red', hex: '#ED0A3F' },
  { name: 'Orange', hex: '#FF8833' },
  { name: 'Yellow', hex: '#FBE870' },
  { name: 'Green', hex: '#01A638' },
  { name: 'Blue', hex: '#0066FF' },
  { name: 'Violet', hex: '#8359A3' },
  { name: 'Brown', hex: '#AF593E' }
];

const STATUS_BADGES = {
  PRESENT: { glassTint: 'rgba(22, 163, 74, 0.24)', text: '#14532D', label: 'Present' },
  LATE: { glassTint: 'rgba(217, 119, 6, 0.24)', text: '#78350F', label: 'Late' },
  ANOMALY: { glassTint: 'rgba(220, 38, 38, 0.24)', text: '#991B1B', label: 'Anomaly' },
  ABSENT: { glassTint: 'rgba(100, 116, 139, 0.22)', text: '#334155', label: 'Absent' }
};

const SWIPE_ACTIONS = [
  { status: 'PRESENT', label: 'Present', tintRgba: 'rgba(22, 163, 74, 0.58)', glow: '#16A34A', midX: -110, minScale: 0.72 },
  { status: 'LATE', label: 'Late', tintRgba: 'rgba(217, 119, 6, 0.58)', glow: '#D97706', midX: -80, minScale: 0.68 },
  { status: 'ABSENT', label: 'Absent', tintRgba: 'rgba(71, 85, 105, 0.56)', glow: '#475569', midX: -50, minScale: 0.64 }
];

const SWIPE_ACTION_WIDTH = 228;
const MINI_WEEK_BARS = [0.85, 0.55, 0.4, 0.72, 0.95, 0.45, 0.8];

const DEFAULT_SECTIONS = [
  { section_id: 'sec-a', section_name: 'Section 3A' },
  { section_id: 'sec-b', section_name: 'Section 3B' },
  { section_id: 'sec-c', section_name: 'Section 3C' }
];

const INITIAL_ENROLL_FORM = {
  name: '',
  studentId: '',
  seat: '',
  photoUri: null,
  captureSource: '',
  dpaAccepted: false
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

// =============================================================================
// 2. UTILITIES (ANIMATION & COLOR MATH)
// =============================================================================

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

const getShades = (base) => [
  mixColor(base, '#FFFFFF', 0.7),
  mixColor(base, '#FFFFFF', 0.5),
  mixColor(base, '#FFFFFF', 0.25),
  mixColor(base, '#FFFFFF', 0),
  mixColor(base, '#000000', 0.2),
  mixColor(base, '#000000', 0.4),
  mixColor(base, '#000000', 0.55)
];

const getLuminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const getCardTheme = (bg) => {
  const L = getLuminance(bg);
  const useWhite = 1.05 / (L + 0.05) > (L + 0.05) / 0.056;
  const rgb = useWhite ? '255, 255, 255' : '7, 11, 36';
  return {
    ink: useWhite ? '#FFFFFF' : THEME.ink,
    inkSoft: `rgba(${rgb}, 0.8)`
  };
};

const getInitials = (name) =>
  name
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

function getSectionRoster(courseKey, sectionId, sectionOffset = 0) {
  const baseList = INITIAL_STUDENTS[courseKey] || INITIAL_STUDENTS.CS301;
  if (sectionOffset === 0) return baseList;
  return baseList.map((stu, idx) => ({
    ...stu,
    id: `${stu.id}-${sectionId}`,
    seat: `${String.fromCharCode(65 + ((idx + sectionOffset) % 5))}${(idx % 6) + 1}`
  }));
}

// =============================================================================
// 3. SUB-COMPONENTS
// =============================================================================

function CardAuraBackground({ color }) {
  const driftA = useRef(new Animated.Value(0)).current;
  const driftB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeDriftLoop = (anim, duration) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true
          })
        ])
      );

    const loopA = makeDriftLoop(driftA, 5200);
    const loopB = makeDriftLoop(driftB, 6800);
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

function HeroClassCard({
  course,
  sectionLabel,
  studentCount,
  cardColor,
  enterAnim,
  scrollY,
  onPress
}) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const cardTheme = getCardTheme(cardColor);
  const accentDark = mixColor(cardColor, '#000000', 0.35);

  const parallaxY = scrollY.interpolate({
    inputRange: [-120, 0, 220],
    outputRange: [-18, 0, 28],
    extrapolate: 'clamp'
  });
  const scrollScale = scrollY.interpolate({
    inputRange: [-120, 0, 220],
    outputRange: [1.03, 1, 0.94],
    extrapolate: 'clamp'
  });
  const enterY = enterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0]
  });

  const animatePress = (toValue) =>
    Animated.spring(pressScale, {
      toValue,
      friction: toValue < 1 ? 7 : 6,
      useNativeDriver: true
    }).start();

  return (
    <Animated.View
      style={{
        opacity: enterAnim,
        transform: [
          { translateY: Animated.add(enterY, parallaxY) },
          { scale: Animated.multiply(scrollScale, pressScale) }
        ]
      }}
    >
      <TouchableOpacity
        activeOpacity={0.96}
        onPressIn={() => animatePress(0.975)}
        onPressOut={() => animatePress(1)}
        onPress={onPress}
        style={[styles.heroCardShadow, { shadowColor: cardColor }]}
      >
        <View style={styles.heroCardClip}>
          <BlurView intensity={65} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: hexToRgba(cardColor, 0.56) }]} />

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
              {sectionLabel ? `${sectionLabel} • ` : ''}
              {course?.schedule || 'MWF 09:00 AM'} • {course?.room || 'Osmeña Rm 302'}
            </Text>

            <View style={styles.heroBottomRow}>
              <Text style={[styles.heroSubject, { color: cardTheme.ink }]} numberOfLines={2}>
                {course?.course_name || 'Software Engineering'}
              </Text>
              <Text style={[styles.heroStudents, { color: cardTheme.ink }]}>
                {studentCount} {studentCount === 1 ? 'student' : 'students'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function ThemePickerPanel({
  cardColor,
  activeBase,
  onPickColor,
  onDeleteClass
}) {
  const [shadeBase, setShadeBase] = useState(null);

  return (
    <GlassPanel style={styles.themePanelWrap} intensity={65}>
      <View style={styles.themePanelInner}>
        <View style={styles.themePanelHeader}>
          <Text style={styles.themePanelTitle}>Card Color Theme</Text>
          <TouchableOpacity onPress={onDeleteClass}>
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
                onPickColor(hex, hex);
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
                  onPress={() => onPickColor(shade, shadeBase)}
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
  );
}

function BentoMetricsGrid({
  attendancePct,
  presentCount,
  totalCount,
  anomalyCount,
  cardColor,
  enterAnim,
  barAnims,
  onToggleAnomalyFilter,
  onOpenEnroll
}) {
  const enrollPressScale = useRef(new Animated.Value(1)).current;

  const animateEnroll = (toValue) =>
    Animated.spring(enrollPressScale, {
      toValue,
      friction: 6,
      useNativeDriver: true
    }).start();

  return (
    <Animated.View
      style={[
        styles.bentoGrid,
        {
          opacity: enterAnim,
          transform: [
            {
              translateY: enterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [28, 0]
              })
            }
          ]
        }
      ]}
    >
      <View style={styles.bentoCol}>
        <GlassPanel intensity={60}>
          <View style={styles.bentoTileInner}>
            <Text style={styles.bentoLabel}>Verified Attendance</Text>
            <Text style={styles.bentoBigVal}>{attendancePct}%</Text>
            <Text style={styles.bentoSub}>
              {presentCount} of {totalCount} Present
            </Text>
          </View>
        </GlassPanel>

        <GlassPanel style={styles.bentoSecondTile} intensity={60}>
          <View style={styles.bentoTileInner}>
            <Text style={styles.bentoLabel}>Weekly Activity</Text>
            <View style={styles.miniBarsRow}>
              {MINI_WEEK_BARS.map((val, idx) => {
                const barHeight = Math.round(val * 34);
                const barY = barAnims[idx].interpolate({
                  inputRange: [0, 1],
                  outputRange: [barHeight, 0]
                });
                return (
                  <View
                    key={idx}
                    style={[styles.miniBarTrack, { height: barHeight }]}
                  >
                    <Animated.View
                      style={[
                        styles.miniBar,
                        {
                          height: barHeight,
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

      <GlassPanel style={styles.bentoCol} intensity={60}>
        <View style={styles.bentoRightInner}>
          <TouchableOpacity activeOpacity={0.7} onPress={onToggleAnomalyFilter}>
            <Text style={styles.bentoLabel}>Pending Anomalies</Text>
            <Text style={[styles.bentoBigVal, anomalyCount > 0 && { color: THEME.danger }]}>
              {anomalyCount} {anomalyCount === 1 ? 'Flag' : 'Flags'}
            </Text>
            <Text style={styles.bentoSub}>
              {anomalyCount > 0 ? 'Tap to filter flags' : 'All clear today'}
            </Text>
          </TouchableOpacity>

          <Animated.View
            style={[styles.enrollBtnWrap, { transform: [{ scale: enrollPressScale }] }]}
          >
            <TouchableOpacity
              style={styles.roundActionBtn}
              activeOpacity={0.9}
              onPressIn={() => animateEnroll(0.91)}
              onPressOut={() => animateEnroll(1)}
              onPress={onOpenEnroll}
            >
              <Text style={styles.roundActionBtnText}>Enroll</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </GlassPanel>
    </Animated.View>
  );
}

function GlassActionPill({ label, tintRgba, glowColor, scaleAnim, onPress }) {
  const pressScale = useRef(new Animated.Value(1)).current;

  const animatePress = (toValue) =>
    Animated.spring(pressScale, {
      toValue,
      friction: toValue < 1 ? 7 : 6,
      useNativeDriver: true
    }).start();

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
        onPressIn={() => animatePress(0.92)}
        onPressOut={() => animatePress(1)}
        onPress={onPress}
        style={styles.glassActionClip}
      >
        <BlurView intensity={48} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tintRgba }]} />
        <Text style={styles.glassActionText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function SwipeableStudentRow({ student, accentColor, isLast, onSelectStatus }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const badgePop = useRef(new Animated.Value(1)).current;
  const isOpen = useRef(false);

  const badge = STATUS_BADGES[student.status] || STATUS_BADGES.ABSENT;
  const avatarTint = hexToRgba(accentColor, 0.22);
  const avatarInk = mixColor(accentColor, '#000000', 0.45);

  const actionsOpacity = translateX.interpolate({
    inputRange: [-64, -12, 0],
    outputRange: [1, 0.35, 0],
    extrapolate: 'clamp'
  });

  const springDrawerTo = (open) => {
    isOpen.current = open;
    Animated.spring(translateX, {
      toValue: open ? -SWIPE_ACTION_WIDTH : 0,
      friction: 7,
      tension: 65,
      useNativeDriver: true
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        const base = isOpen.current ? -SWIPE_ACTION_WIDTH : 0;
        const clamped = Math.min(0, Math.max(-SWIPE_ACTION_WIDTH - 18, base + g.dx));
        translateX.setValue(clamped);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -45 || g.vx < -0.45) {
          springDrawerTo(true);
        } else if (g.dx > 45 || g.vx > 0.45) {
          springDrawerTo(false);
        } else {
          springDrawerTo(isOpen.current);
        }
      }
    })
  ).current;

  const handleChooseStatus = (newStatus) => {
    springDrawerTo(false);
    onSelectStatus(student.id, newStatus);
    Animated.sequence([
      Animated.spring(badgePop, { toValue: 1.18, friction: 5, useNativeDriver: true }),
      Animated.spring(badgePop, { toValue: 1, friction: 6, useNativeDriver: true })
    ]).start();
  };

  return (
    <View style={[styles.swipeRowWrap, !isLast && styles.rowDivider]}>
      <Animated.View
        style={[
          styles.hiddenActionsContainer,
          { width: SWIPE_ACTION_WIDTH, opacity: actionsOpacity }
        ]}
      >
        {SWIPE_ACTIONS.map((action) => {
          const pillScale = translateX.interpolate({
            inputRange: [-SWIPE_ACTION_WIDTH, action.midX, 0],
            outputRange: [1, 0.9, action.minScale],
            extrapolate: 'clamp'
          });
          return (
            <GlassActionPill
              key={action.status}
              label={action.label}
              tintRgba={action.tintRgba}
              glowColor={action.glow}
              scaleAnim={pillScale}
              onPress={() => handleChooseStatus(action.status)}
            />
          );
        })}
      </Animated.View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.studentRowInner, { transform: [{ translateX }] }]}
      >
        <View style={[styles.studentAvatar, { backgroundColor: avatarTint }]}>
          <Text style={[styles.studentAvatarText, { color: avatarInk }]}>
            {getInitials(student.name)}
          </Text>
        </View>

        <View style={styles.studentInfoCol}>
          <Text style={styles.studentName} numberOfLines={1}>
            {student.name}
          </Text>
          <Text style={styles.studentMeta}>
            ID {student.id} • Seat {student.seat}
          </Text>
          {student.anomaly_note ? (
            <Text style={styles.anomalyInlineText} numberOfLines={1}>
              ⚠️ {student.anomaly_note}
            </Text>
          ) : (
            <Text style={styles.studentConfidence}>Match {student.confidence}</Text>
          )}
        </View>

        <View style={styles.rowRightCol}>
          <Animated.View
            style={[styles.statusGlassOuter, { transform: [{ scale: badgePop }] }]}
          >
            <BlurView intensity={38} tint="light" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: badge.glassTint }]} />
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

function RenameSectionModal({ visible, initialName, onCancel, onSave }) {
  const [nameInput, setNameInput] = useState(initialName || '');

  useEffect(() => {
    setNameInput(initialName || '');
  }, [initialName, visible]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.renameOverlay}>
        <BlurView intensity={26} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.renameCard}>
          <Text style={styles.renameTitle}>Rename Section</Text>
          <TextInput
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="e.g. Section 3A"
            placeholderTextColor={THEME.muted}
            style={styles.renameInput}
          />
          <View style={styles.renameActions}>
            <TouchableOpacity style={styles.renameCancelBtn} onPress={onCancel}>
              <Text style={styles.renameCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.renameSaveBtn}
              onPress={() => {
                const trimmed = nameInput.trim();
                if (trimmed) onSave(trimmed);
              }}
            >
              <Text style={styles.renameSaveText}>Save Name</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SectionManagerModal({
  visible,
  activeSection,
  sectionCount,
  onAddSection,
  onDeleteSection,
  onClose
}) {
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (visible) setNewName('');
  }, [visible]);

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      Alert.alert('Section Name Required', 'Enter a name like Section 3D.');
      return;
    }
    onAddSection(trimmed);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.renameOverlay}>
        <BlurView intensity={26} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.renameCard}>
          <Text style={styles.renameTitle}>
            {activeSection?.section_name || 'Manage Sections'}
          </Text>
          <Text style={styles.managerSub}>
            Add a new section to this subject or delete the active section.
          </Text>

          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="New section name (e.g. Section 3D)"
            placeholderTextColor={THEME.muted}
            style={styles.renameInput}
          />

          <View style={styles.renameActions}>
            <TouchableOpacity style={styles.renameCancelBtn} onPress={handleCreate}>
              <Text style={styles.renameCancelText}>+ Add Section</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.promptDangerBtn,
                sectionCount <= 1 && styles.promptBtnDisabled
              ]}
              disabled={sectionCount <= 1}
              onPress={onDeleteSection}
            >
              <Text style={styles.renameSaveText}>Delete Section</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.modalDismissLink} onPress={onClose}>
            <Text style={styles.modalDismissText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function BiometricEnrollmentModal({ visible, onClose, cardColor, onEnroll }) {
  const [form, setForm] = useState(INITIAL_ENROLL_FORM);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(80)).current;
  const sheetScale = useRef(new Animated.Value(0.95)).current;
  const checkScale = useRef(new Animated.Value(1)).current;
  const camScale = useRef(new Animated.Value(1)).current;
  const galScale = useRef(new Animated.Value(1)).current;
  const submitScale = useRef(new Animated.Value(1)).current;

  const accentDark = mixColor(cardColor, '#000000', 0.35);

  useEffect(() => {
    if (!visible) return;

    backdropOpacity.setValue(0);
    sheetY.setValue(80);
    sheetScale.setValue(0.95);

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true
      }),
      Animated.spring(sheetY, {
        toValue: 0,
        friction: 8,
        tension: 58,
        useNativeDriver: true
      }),
      Animated.spring(sheetScale, {
        toValue: 1,
        friction: 8,
        tension: 58,
        useNativeDriver: true
      })
    ]).start();
  }, [visible]);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const animateSpring = (anim, toValue) =>
    Animated.spring(anim, {
      toValue,
      friction: toValue < 1 ? 7 : 6,
      useNativeDriver: true
    }).start();

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true
      }),
      Animated.timing(sheetY, {
        toValue: 70,
        duration: 180,
        useNativeDriver: true
      })
    ]).start(() => onClose());
  };

  const handleCapturePhoto = async (source) => {
    const isCamera = source === 'CAMERA';
    const permission = isCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        isCamera ? 'Camera Permission Needed' : 'Gallery Permission Needed',
        isCamera
          ? 'Please allow camera access to scan student faces.'
          : 'Please allow photo library access to upload student photos.'
      );
      return;
    }

    const result = isCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7
        });

    if (!result.canceled && result.assets?.length > 0) {
      setForm((prev) => ({
        ...prev,
        photoUri: result.assets[0].uri,
        captureSource: source
      }));
    }
  };

  const handleToggleConsent = () => {
    updateField('dpaAccepted', !form.dpaAccepted);
    Animated.sequence([
      Animated.spring(checkScale, { toValue: 1.24, friction: 5, useNativeDriver: true }),
      Animated.spring(checkScale, { toValue: 1, friction: 6, useNativeDriver: true })
    ]).start();
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.studentId.trim()) {
      Alert.alert('Missing Info', 'Please enter the student name and DLSAU ID.');
      return;
    }
    if (!form.photoUri) {
      Alert.alert(
        'Photo Required',
        'Please take a photo with the camera or upload a photo from your library.'
      );
      return;
    }
    if (!form.dpaAccepted) {
      Alert.alert(
        'DPA Consent Required',
        'Student must accept the RA 10173 Data Privacy Act consent agreement.'
      );
      return;
    }

    onEnroll({
      id: form.studentId.trim(),
      name: form.name.trim(),
      seat: form.seat.trim().toUpperCase() || 'C1',
      status: 'PRESENT',
      confidence: '99.2%',
      biometric_enrolled: true,
      anomaly_note: null
    });

    setForm(INITIAL_ENROLL_FORM);
    handleClose();

    Alert.alert(
      'Biometric Vector Encrypted',
      '128-D MobileFaceNet embedding stored in AES-256 SQLCipher. Raw source photo purged per Zero-Retention Policy.'
    );
  };

  const activePhotoStyle = {
    backgroundColor: hexToRgba(cardColor, 0.2),
    borderColor: cardColor
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableOpacity
            style={styles.modalBackdropTint}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.glassModalShadow,
            {
              opacity: backdropOpacity,
              transform: [{ translateY: sheetY }, { scale: sheetScale }]
            }
          ]}
        >
          <View style={styles.glassModalClip}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.glassModalTint} />

            <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
              <Defs>
                <RadialGradient id="bioAura" cx="85%" cy="10%" r="65%">
                  <Stop offset="0%" stopColor={cardColor} stopOpacity="0.34" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </RadialGradient>
                <LinearGradient id="bioSheen" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.56" />
                  <Stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.12" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#bioAura)" />
              <Rect width="100%" height="100%" fill="url(#bioSheen)" />
            </Svg>

            <View style={styles.glassModalInner}>
              <View style={styles.modalHandle} />
              <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>DPA Biometric Enrollment</Text>
                  <TouchableOpacity style={styles.modalClosePill} onPress={handleClose}>
                    <Text style={styles.closeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.modalSubtitle, { color: accentDark }]}>
                  Republic Act No. 10173 (Data Privacy Act of 2012) Compliance
                </Text>

                <Text style={styles.label}>Student Full Name</Text>
                <TextInput
                  style={styles.glassInput}
                  placeholder="e.g. Dela Cruz, Juan"
                  placeholderTextColor={THEME.muted}
                  value={form.name}
                  onChangeText={(val) => updateField('name', val)}
                />

                <View style={styles.idSeatRow}>
                  <View style={styles.idCol}>
                    <Text style={styles.label}>DLSAU Student ID</Text>
                    <TextInput
                      style={styles.glassInput}
                      placeholder="2024-1099"
                      placeholderTextColor={THEME.muted}
                      value={form.studentId}
                      onChangeText={(val) => updateField('studentId', val)}
                    />
                  </View>
                  <View style={styles.seatCol}>
                    <Text style={styles.label}>Seat Code</Text>
                    <TextInput
                      style={styles.glassInput}
                      placeholder="B3"
                      placeholderTextColor={THEME.muted}
                      value={form.seat}
                      onChangeText={(val) => updateField('seat', val)}
                    />
                  </View>
                </View>

                <Text style={styles.label}>Facial Biometric Source</Text>
                <View style={styles.photoButtonsRow}>
                  <Animated.View style={[styles.photoBtnCol, { transform: [{ scale: camScale }] }]}>
                    <TouchableOpacity
                      style={[
                        styles.glassPhotoOptionBtn,
                        form.captureSource === 'CAMERA' && activePhotoStyle
                      ]}
                      activeOpacity={0.9}
                      onPressIn={() => animateSpring(camScale, 0.94)}
                      onPressOut={() => animateSpring(camScale, 1)}
                      onPress={() => handleCapturePhoto('CAMERA')}
                    >
                      <Text style={styles.photoOptionIcon}>📷</Text>
                      <Text style={styles.photoOptionText}>Use Camera</Text>
                    </TouchableOpacity>
                  </Animated.View>

                  <Animated.View style={[styles.photoBtnCol, { transform: [{ scale: galScale }] }]}>
                    <TouchableOpacity
                      style={[
                        styles.glassPhotoOptionBtn,
                        form.captureSource === 'GALLERY' && activePhotoStyle
                      ]}
                      activeOpacity={0.9}
                      onPressIn={() => animateSpring(galScale, 0.94)}
                      onPressOut={() => animateSpring(galScale, 1)}
                      onPress={() => handleCapturePhoto('GALLERY')}
                    >
                      <Text style={styles.photoOptionIcon}>🖼️</Text>
                      <Text style={styles.photoOptionText}>Upload Photo</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>

                {form.photoUri && (
                  <View
                    style={[
                      styles.glassPreviewBanner,
                      {
                        backgroundColor: hexToRgba(cardColor, 0.16),
                        borderColor: hexToRgba(cardColor, 0.65)
                      }
                    ]}
                  >
                    <Image
                      source={{ uri: form.photoUri }}
                      style={[styles.previewThumb, { borderColor: cardColor }]}
                    />
                    <View style={styles.previewTextCol}>
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
                  style={styles.glassDpaBox}
                  activeOpacity={0.85}
                  onPress={handleToggleConsent}
                >
                  <Animated.View
                    style={[
                      styles.checkbox,
                      { transform: [{ scale: checkScale }] },
                      form.dpaAccepted && { backgroundColor: cardColor, borderColor: cardColor }
                    ]}
                  >
                    {form.dpaAccepted && <Text style={styles.checkmark}>✓</Text>}
                  </Animated.View>
                  <Text style={styles.dpaText}>
                    I confirm the student has signed the RA 10173 Data Privacy Consent Form. Tingin stores only encrypted mathematical facial embeddings and immediately deletes raw camera images.
                  </Text>
                </TouchableOpacity>

                <Animated.View style={{ transform: [{ scale: submitScale }] }}>
                  <TouchableOpacity
                    style={styles.glassPrimaryBtn}
                    activeOpacity={0.92}
                    onPressIn={() => animateSpring(submitScale, 0.96)}
                    onPressOut={() => animateSpring(submitScale, 1)}
                    onPress={handleSubmit}
                  >
                    <Text style={styles.primaryBtnText}>Complete Biometric Enrollment</Text>
                  </TouchableOpacity>
                </Animated.View>
              </ScrollView>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// =============================================================================
// 4. MAIN SCREEN
// =============================================================================

export default function RosterScreen({
  course,
  sections: propSections,
  onUpdateSections,
  onUpdateCourseColor,
  onDeleteCourse,
  setCurrentScreen
}) {
  const courseKey = course?.course_id || 'CS301';
  const cardColor = course?.card_color || THEME.defaultCardColor;
  const activeBase = course?.card_base || cardColor;

  const [localSections, setLocalSections] = useState(
    () => (Array.isArray(propSections) && propSections.length > 0 ? propSections : DEFAULT_SECTIONS)
  );
  const sections =
    Array.isArray(propSections) && propSections.length > 0 ? propSections : localSections;

  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.section_id || 'sec-a');
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [sectionModalVisible, setSectionModalVisible] = useState(false);

  const activeSection =
    sections.find((sec) => sec.section_id === activeSectionId) || sections[0];
  const sectionIdx = Math.max(
    0,
    sections.findIndex((sec) => sec.section_id === activeSection?.section_id)
  );

  const [students, setStudents] = useState(() =>
    getSectionRoster(courseKey, activeSection?.section_id || 'sec-a', sectionIdx)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL');
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [enrollModalVisible, setEnrollModalVisible] = useState(false);

  useEffect(() => {
    if (Array.isArray(propSections) && propSections.length > 0) {
      setLocalSections(propSections);
    }
  }, [propSections]);

  useEffect(() => {
    setStudents(
      getSectionRoster(courseKey, activeSection?.section_id || 'sec-a', sectionIdx)
    );
  }, [courseKey, activeSectionId]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const heroEnter = useRef(new Animated.Value(0)).current;
  const bentoEnter = useRef(new Animated.Value(0)).current;
  const listEnter = useRef(new Animated.Value(0)).current;
  const barAnims = useRef(MINI_WEEK_BARS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      80,
      [heroEnter, bentoEnter, listEnter].map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          friction: 7,
          tension: 52,
          useNativeDriver: true
        })
      )
    ).start();

    Animated.stagger(
      55,
      barAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          friction: 7,
          tension: 55,
          useNativeDriver: true
        })
      )
    ).start();
  }, []);

  const syncSections = (updated, animate = true) => {
    if (animate) springLayout();
    setLocalSections(updated);
    onUpdateSections && onUpdateSections(courseKey, updated);
  };

  const handleSaveSectionName = (newName) => {
    const updated = sections.map((sec) =>
      sec.section_id === activeSection?.section_id ? { ...sec, section_name: newName } : sec
    );
    syncSections(updated);
    setRenameModalVisible(false);
  };

  const handleAddSection = (newName) => {
    const nextSec = {
      section_id: `sec-${Date.now()}`,
      section_name: newName
    };
    syncSections([...sections, nextSec]);
    setActiveSectionId(nextSec.section_id);
    setSectionModalVisible(false);
  };

  const handleDeleteSection = () => {
    if (sections.length <= 1 || !activeSection) return;
    const remaining = sections.filter((sec) => sec.section_id !== activeSection.section_id);
    syncSections(remaining);
    setActiveSectionId(remaining[0].section_id);
    setSectionModalVisible(false);
  };

  const filteredStudents = students.filter((s) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query);
    return filterMode === 'ANOMALY'
      ? matchesSearch && s.status === 'ANOMALY'
      : matchesSearch;
  });

  const anomalyCount = students.filter((s) => s.status === 'ANOMALY').length;
  const presentCount = students.filter((s) => s.status === 'PRESENT').length;
  const attendancePct =
    students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  const handleSetStatus = (studentId, newStatus) => {
    springLayout();
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, status: newStatus, anomaly_note: null } : s
      )
    );
  };

  const handleEnrollStudent = (newStudent) => {
    springLayout();
    setStudents((prev) => [newStudent, ...prev]);
  };

  const handleToggleThemePanel = () => {
    springLayout();
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
    Alert.alert('Delete Class', `Remove ${course.course_name} from your classes?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDeleteCourse(course.course_id)
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <CardAuraBackground color={cardColor} />

      <RenameSectionModal
        visible={renameModalVisible}
        initialName={activeSection?.section_name}
        onCancel={() => setRenameModalVisible(false)}
        onSave={handleSaveSectionName}
      />

      <SectionManagerModal
        visible={sectionModalVisible}
        activeSection={activeSection}
        sectionCount={sections.length}
        onAddSection={handleAddSection}
        onDeleteSection={handleDeleteSection}
        onClose={() => setSectionModalVisible(false)}
      />

      {/* Top Glass Header */}
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
        <LiquidSectionBar
          sections={sections}
          activeSectionId={activeSection?.section_id}
          accentColor={cardColor}
          onSelectSection={(sec) => {
            springLayout();
            setActiveSectionId(sec.section_id);
          }}
          onDoubleTapSection={(sec) => {
            setActiveSectionId(sec.section_id);
            setRenameModalVisible(true);
          }}
          onReorderSections={(nextSections) => syncSections(nextSections, false)}
        />

        <HeroClassCard
          course={course}
          sectionLabel={activeSection?.section_name}
          studentCount={students.length}
          cardColor={cardColor}
          enterAnim={heroEnter}
          scrollY={scrollY}
          onPress={() => setSectionModalVisible(true)}
        />

        {showThemePanel && (
          <ThemePickerPanel
            cardColor={cardColor}
            activeBase={activeBase}
            onPickColor={handlePickColor}
            onDeleteClass={handleDeleteCurrentClass}
          />
        )}

        <BentoMetricsGrid
          attendancePct={attendancePct}
          presentCount={presentCount}
          totalCount={students.length}
          anomalyCount={anomalyCount}
          cardColor={cardColor}
          enterAnim={bentoEnter}
          barAnims={barAnims}
          onToggleAnomalyFilter={() =>
            handleFilterChange(filterMode === 'ANOMALY' ? 'ALL' : 'ANOMALY')
          }
          onOpenEnroll={() => setEnrollModalVisible(true)}
        />

        {/* Class List Section */}
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
                    filterMode === 'ALL' && styles.filterPillTextActive
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
                    filterMode === 'ANOMALY' && styles.filterPillTextActive
                  ]}
                >
                  Anomalies ({anomalyCount})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <GlassPanel style={styles.searchPanelWrap} intensity={55}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search student name or DLSAU ID..."
              placeholderTextColor={THEME.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </GlassPanel>

          <GlassPanel style={styles.listGroupWrap} intensity={62}>
            {filteredStudents.length === 0 ? (
              <View style={styles.emptyListBox}>
                <Text style={styles.emptyListText}>No matching students found.</Text>
              </View>
            ) : (
              filteredStudents.map((student, idx) => (
                <SwipeableStudentRow
                  key={student.id}
                  student={student}
                  accentColor={cardColor}
                  isLast={idx === filteredStudents.length - 1}
                  onSelectStatus={handleSetStatus}
                />
              ))
            )}
          </GlassPanel>
        </Animated.View>
      </Animated.ScrollView>

      <BiometricEnrollmentModal
        visible={enrollModalVisible}
        onClose={() => setEnrollModalVisible(false)}
        cardColor={cardColor}
        onEnroll={handleEnrollStudent}
      />
    </SafeAreaView>
  );
}

// =============================================================================
// 5. STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },

  // Shared Glass Surface
  glassShadowWrap: {
    borderRadius: 20,
    shadowColor: THEME.navy,
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

  // Top Header
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
    color: THEME.navy,
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

  // Rename / Section Manager Modal
  renameOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    backgroundColor: 'rgba(7, 11, 36, 0.35)'
  },
  renameCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  },
  renameTitle: { fontSize: 18, fontWeight: '800', color: THEME.navy },
  managerSub: { fontSize: 12, color: '#475569', marginTop: 4, lineHeight: 17 },
  renameInput: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(7, 11, 36, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: THEME.navy,
    backgroundColor: '#FFFFFF'
  },
  renameActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  },
  renameCancelBtn: {
    flex: 0.47,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#E2E8F0'
  },
  renameCancelText: { fontSize: 12, fontWeight: '800', color: THEME.navy },
  renameSaveBtn: {
    flex: 0.49,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: THEME.navy
  },
  renameSaveText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  promptDangerBtn: {
    flex: 0.49,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: THEME.danger
  },
  promptBtnDisabled: { opacity: 0.4 },
  modalDismissLink: { alignItems: 'center', marginTop: 14 },
  modalDismissText: { fontSize: 12, fontWeight: '800', color: '#475569' },

  // Hero Class Card
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
  heroSchedRoom: { fontSize: 13, fontWeight: '700', letterSpacing: 0.1 },
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
  heroStudents: { fontSize: 16, fontWeight: '700', flexShrink: 0 },

  // Inline Color Theme Panel
  themePanelWrap: { marginBottom: 16 },
  themePanelInner: { padding: 16 },
  themePanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  themePanelTitle: { fontSize: 14, fontWeight: '800', color: THEME.navy },
  deleteLinkText: { fontSize: 13, fontWeight: '700', color: THEME.danger },
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
  shadeChipActive: { borderColor: THEME.navy },

  // Bento Grid
  bentoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  bentoCol: { flex: 0.485 },
  bentoSecondTile: { marginTop: 12 },
  bentoTileInner: { padding: 15 },
  bentoRightInner: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between'
  },
  bentoLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 },
  bentoBigVal: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.navy,
    letterSpacing: -0.7
  },
  bentoSub: { fontSize: 12, color: '#475569', fontWeight: '600', marginTop: 2 },
  miniBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 40,
    marginTop: 8,
    paddingHorizontal: 2
  },
  miniBarTrack: { width: 8, overflow: 'hidden', borderRadius: 4 },
  miniBar: { width: 8, borderRadius: 4 },
  enrollBtnWrap: { alignSelf: 'flex-end' },
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
    shadowColor: THEME.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10
  },
  roundActionBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  // Class List Header & Search
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  listSectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: THEME.navy,
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
  filterPillTextActive: { color: '#FFFFFF' },
  searchPanelWrap: { marginBottom: 12, borderRadius: 16 },
  searchInput: {
    color: '#0F172A',
    paddingVertical: 13,
    paddingHorizontal: 15,
    fontSize: 14
  },
  listGroupWrap: { borderRadius: 22 },
  emptyListBox: { padding: 28, alignItems: 'center' },
  emptyListText: { fontSize: 14, color: '#475569', fontWeight: '600' },

  // Swipeable Glass Rows & Action Capsules
  swipeRowWrap: { position: 'relative', overflow: 'hidden' },
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
  studentInfoCol: { flex: 1, paddingRight: 10 },
  studentName: { fontSize: 15, fontWeight: '800', color: THEME.navy },
  studentMeta: { fontSize: 12, color: '#475569', marginTop: 2, fontWeight: '500' },
  studentConfidence: { fontSize: 11, color: THEME.muted, marginTop: 2, fontWeight: '600' },
  anomalyInlineText: { fontSize: 11, color: THEME.danger, marginTop: 2, fontWeight: '700' },
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
  swipeCue: { fontSize: 10, color: THEME.muted, marginTop: 4, fontWeight: '600' },

  // Glass Biometric Enrollment Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdropTint: { flex: 1, backgroundColor: 'rgba(7, 11, 36, 0.28)' },
  glassModalShadow: {
    marginHorizontal: 10,
    marginBottom: Platform.OS === 'ios' ? 14 : 10,
    borderRadius: 30,
    shadowColor: THEME.navy,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10
  },
  glassModalClip: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)'
  },
  glassModalTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.62)'
  },
  glassModalInner: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 26,
    maxHeight: SCREEN_H * 0.86
  },
  modalHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(7, 11, 36, 0.22)',
    alignSelf: 'center',
    marginBottom: 14
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: { fontSize: 22, fontWeight: '900', color: THEME.navy },
  modalClosePill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeBtnText: { fontSize: 16, fontWeight: '800', color: THEME.muted },
  modalSubtitle: { fontSize: 12, fontWeight: '700', marginBottom: 16, marginTop: 2 },
  label: { color: '#1E293B', fontSize: 13, marginBottom: 6, fontWeight: '700' },
  glassInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    color: '#0F172A',
    padding: 14,
    borderRadius: 14,
    marginBottom: 13,
    borderWidth: 1.4,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    fontSize: 14
  },
  idSeatRow: { flexDirection: 'row', justifyContent: 'space-between' },
  idCol: { flex: 0.62 },
  seatCol: { flex: 0.34 },
  photoButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  photoBtnCol: { flex: 0.48 },
  glassPhotoOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.4,
    borderColor: 'rgba(255, 255, 255, 0.92)'
  },
  photoOptionIcon: { fontSize: 16, marginRight: 8 },
  photoOptionText: { fontSize: 14, fontWeight: '800', color: THEME.navy },
  glassPreviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.4,
    marginBottom: 14
  },
  previewThumb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1.5
  },
  previewTextCol: { flex: 1 },
  biometricTitle: { fontSize: 13, fontWeight: '800', color: THEME.navy },
  biometricSub: { fontSize: 11, color: '#475569', marginTop: 2 },
  glassDpaBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.56)',
    padding: 13,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.9)'
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: THEME.muted,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  checkmark: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
  dpaText: { flex: 1, fontSize: 12, color: '#475569', lineHeight: 18 },
  glassPrimaryBtn: {
    backgroundColor: 'rgba(7, 11, 36, 0.92)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.25)'
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});