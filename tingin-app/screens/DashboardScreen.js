import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  Easing,
  LayoutAnimation,
  UIManager
} from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Line,
  Circle
} from 'react-native-svg';

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
const DEFAULT_COLOR = '#0066FF';

const springLayout = () => {
  LayoutAnimation.configureNext({
    duration: 320,
    create: {
      type: LayoutAnimation.Types.spring,
      property: LayoutAnimation.Properties.opacity,
      springDamping: 0.78
    },
    update: {
      type: LayoutAnimation.Types.spring,
      springDamping: 0.78
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity
    }
  });
};

// ---- Color helpers ----
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
    inkSoft: `rgba(${rgb}, 0.78)`,
    line: `rgba(${rgb}, 0.22)`,
    solidBg: useWhite ? 'rgba(255, 255, 255, 0.92)' : 'rgba(7, 11, 36, 0.88)',
    solidText: useWhite ? '#0B1320' : '#FFFFFF',
    softPillBg: useWhite ? 'rgba(255, 255, 255, 0.24)' : 'rgba(255, 255, 255, 0.55)'
  };
};

const WEEKLY_BARS = [
  { day: 'Mon', val: 0.62, active: false },
  { day: 'Tue', val: 0.78, active: false },
  { day: 'Wed', val: 0.35, active: false },
  { day: 'Thu', val: 0.50, active: false },
  { day: 'Fri', val: 0.96, active: true },
  { day: 'Sat', val: 0.22, active: false },
  { day: 'Sun', val: 0.18, active: false }
];

// Gently drifting ambient orbs behind the glass deck
function DeckAmbientBackground({ accent }) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const warmOrb = mixColor(accent || '#98C93C', '#FFFFFF', 0.35);
  const shiftY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 18] });
  const shiftX = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [12, -14] });

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#F5F3EB' }]} pointerEvents="none">
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX: shiftX }, { translateY: shiftY }] }
        ]}
      >
        <Svg width={SCREEN_W} height={SCREEN_H}>
          <Defs>
            <RadialGradient id="deckOrb1" cx="15%" cy="22%" r="55%">
              <Stop offset="0%" stopColor={warmOrb} stopOpacity="0.34" />
              <Stop offset="100%" stopColor="#F5F3EB" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="deckOrb2" cx="88%" cy="58%" r="55%">
              <Stop offset="0%" stopColor="#D3C499" stopOpacity="0.48" />
              <Stop offset="100%" stopColor="#F5F3EB" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={SCREEN_W * 0.15} cy={SCREEN_H * 0.22} r={SCREEN_W * 0.78} fill="url(#deckOrb1)" />
          <Circle cx={SCREEN_W * 0.88} cy={SCREEN_H * 0.58} r={SCREEN_W * 0.78} fill="url(#deckOrb2)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

function GlassSheen({ id }) {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.46" />
          <Stop offset="38%" stopColor="#FFFFFF" stopOpacity="0.12" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

function HatchedBar({ height, active, revealAnim }) {
  const w = 28;
  const barTranslateY = revealAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0]
  });

  if (active) {
    return (
      <View style={{ width: w, height, borderRadius: 7, overflow: 'hidden' }}>
        <Animated.View
          style={{
            width: w,
            height,
            backgroundColor: '#070B24',
            borderRadius: 7,
            transform: [{ translateY: barTranslateY }]
          }}
        />
      </View>
    );
  }

  const stripeSpacing = 6;
  const lines = [];
  for (let i = -height; i < w + height; i += stripeSpacing) {
    lines.push(
      <Line
        key={i}
        x1={i}
        y1={0}
        x2={i - height}
        y2={height}
        stroke="rgba(7, 11, 36, 0.28)"
        strokeWidth="1.6"
      />
    );
  }
  return (
    <View style={{ width: w, height, borderRadius: 7, overflow: 'hidden' }}>
      <Animated.View style={{ transform: [{ translateY: barTranslateY }] }}>
        <Svg width={w} height={height}>
          <Rect width={w} height={height} fill="rgba(255, 255, 255, 0.25)" rx={7} />
          {lines}
        </Svg>
      </Animated.View>
    </View>
  );
}

// Glass Wallet Card with Entrance + Tactile Press Scale (Scroll math kept on outer wrapper)
function GlassDeckCard({
  item,
  index,
  isExpanded,
  scrollY,
  cardStep,
  onToggleExpand,
  onOpenRoster,
  onDelete
}) {
  const cardBg = item.card_color || DEFAULT_COLOR;
  const theme = getCardTheme(cardBg);

  const enterAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(enterAnim, {
      toValue: 1,
      delay: Math.min(index * 75, 360),
      friction: 7,
      tension: 55,
      useNativeDriver: true
    }).start();
  }, []);

  // Exact scroll pinning & scale math preserved
  const startPin = index * cardStep;
  const translateY = scrollY.interpolate({
    inputRange: [-200, 0, startPin, startPin + 600],
    outputRange: [index * 8, 0, 0, 600 - index * (cardStep - 14)],
    extrapolate: 'clamp'
  });

  const scrollScale = scrollY.interpolate({
    inputRange: [startPin - 40, startPin + 220],
    outputRange: [1, 0.965],
    extrapolate: 'clamp'
  });

  const enterTranslateY = enterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [34, 0]
  });

  return (
    <Animated.View
      style={[
        styles.walletCardShadow,
        {
          marginTop: index === 0 ? 0 : -38,
          zIndex: index + 1,
          transform: [{ translateY }, { scale: scrollScale }]
        }
      ]}
    >
      <Animated.View
        style={{
          opacity: enterAnim,
          transform: [{ translateY: enterTranslateY }, { scale: pressScale }]
        }}
      >
        <View style={styles.walletCardClip}>
          <BlurView intensity={55} tint="light" style={StyleSheet.absoluteFill} />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: hexToRgba(cardBg, 0.68) }
            ]}
          />
          <GlassSheen id={`cardSheen-${item.course_id}`} />

          <TouchableOpacity
            activeOpacity={0.95}
            style={styles.walletCardInner}
            onPressIn={() =>
              Animated.spring(pressScale, {
                toValue: 0.975,
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
            onPress={onToggleExpand}
          >
            {/* Clean card face: ONLY sched, room, subject, and number of students */}
            <View style={styles.cardMainRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[styles.cardCategorySub, { color: theme.inkSoft }]}>
                  {item.schedule} • {item.room}
                </Text>
                <Text
                  style={[styles.cardTitleText, { color: theme.ink }]}
                  numberOfLines={1}
                >
                  {item.course_name}
                </Text>
              </View>

              <Text style={[styles.cardRightMetric, { color: theme.ink }]}>
                {item.enrolled_count}{' '}
                {item.enrolled_count === 1 ? 'student' : 'students'}
              </Text>
            </View>

            {/* Expanded Action Bar */}
            {isExpanded && (
              <View style={[styles.expandedDrawer, { borderTopColor: theme.line }]}>
                <View style={styles.actionRowButtons}>
                  <TouchableOpacity
                    style={[styles.actionDarkPill, { backgroundColor: theme.solidBg }]}
                    onPress={() => onOpenRoster && onOpenRoster(item)}
                  >
                    <Text style={[styles.actionDarkPillText, { color: theme.solidText }]}>
                      Open List
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionLightPill, { backgroundColor: theme.softPillBg }]}
                    onPress={() =>
                      Alert.alert(
                        item.course_code,
                        `Starting YOLOv8 live attendance feed for ${item.course_name}.`
                      )
                    }
                  >
                    <Text style={[styles.actionLightPillText, { color: theme.ink }]}>
                      Live Feed
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionDeletePill}
                    onPress={() =>
                      onDelete(item.course_id, item.course_code, item.course_name)
                    }
                  >
                    <Text style={styles.actionDeleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function ShadeStrip({ base, current, onPick, labelColor }) {
  return (
    <View style={styles.shadeBlock}>
      <Text style={[styles.shadeLabel, { color: labelColor }]}>
        Light to dark. Tap a shade to apply.
      </Text>
      <View style={styles.shadeRow}>
        {getShades(base).map((shade) => (
          <TouchableOpacity
            key={shade}
            activeOpacity={0.8}
            style={[
              styles.shadeSwatch,
              { backgroundColor: shade },
              (current || '').toUpperCase() === shade && styles.shadeSwatchActive
            ]}
            onPress={() => onPick(shade)}
          />
        ))}
      </View>
    </View>
  );
}

export default function DashboardScreen({
  email,
  fullName,
  courses = [],
  onAddCourse,
  onDeleteCourse,
  setCurrentScreen,
  onOpenRoster
}) {
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Add Class Form State
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [schedule, setSchedule] = useState('');
  const [room, setRoom] = useState('');
  const [enrolledCount, setEnrolledCount] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
  const [selectedBase, setSelectedBase] = useState(DEFAULT_COLOR);
  const [shadePicker, setShadePicker] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  const chevronRot = useRef(new Animated.Value(0)).current;
  const barAnims = useRef(WEEKLY_BARS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      55,
      barAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          delay: 180,
          friction: 7,
          tension: 50,
          useNativeDriver: true
        })
      )
    ).start();
  }, []);

  const toggleMenu = () => {
    springLayout();
    const next = !menuVisible;
    setMenuVisible(next);
    Animated.spring(chevronRot, {
      toValue: next ? 1 : 0,
      friction: 7,
      useNativeDriver: true
    }).start();
  };

  const chevronRotateDeg = chevronRot.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  const totalStudents = courses.reduce((sum, c) => sum + (c.enrolled_count || 0), 0);
  const totalAnomalies = courses.reduce((sum, c) => sum + (c.pending_anomalies || 0), 0);

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
      pending_anomalies: 0,
      card_color: selectedColor,
      card_base: selectedBase
    };

    springLayout();
    onAddCourse && onAddCourse(newCourse);
    setCourseCode('');
    setCourseName('');
    setSchedule('');
    setRoom('');
    setEnrolledCount('');
    setSelectedColor(DEFAULT_COLOR);
    setSelectedBase(DEFAULT_COLOR);
    setShadePicker(null);
    setModalVisible(false);
  };

  const handleDeleteClass = (courseId, code, name) => {
    Alert.alert('Delete Class', `Remove ${code} (${name}) from your deck?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          springLayout();
          onDeleteCourse && onDeleteCourse(courseId);
          if (selectedCardId === courseId) setSelectedCardId(null);
        }
      }
    ]);
  };

  const CARD_STEP = 126;

  return (
    <SafeAreaView style={styles.container}>
      <DeckAmbientBackground accent={courses[0]?.card_color} />

      {/* Editorial Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.titleDropdownBtn}
          activeOpacity={0.7}
          onPress={toggleMenu}
        >
          <Text style={styles.headerTitle}>Classes</Text>
          <Animated.Text
            style={[
              styles.chevronIcon,
              { transform: [{ rotate: chevronRotateDeg }] }
            ]}
          >
            ⌄
          </Animated.Text>
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.addBtnCircle}
            activeOpacity={0.82}
            onPress={() => {
              setShadePicker(null);
              setModalVisible(true);
            }}
          >
            <Text style={styles.addBtnPlus}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Collapsible Glass Quick Drawer */}
      {menuVisible && (
        <View style={styles.quickDrawerShadow}>
          <BlurView intensity={55} tint="light" style={styles.quickDrawerGlass}>
            <View style={styles.drawerProfileRow}>
              <View>
                <Text style={styles.drawerName}>
                  {fullName || 'DLSAU Professor'}
                </Text>
                <Text style={styles.drawerEmail}>{email}</Text>
              </View>
              <View style={styles.drawerPills}>
                <TouchableOpacity
                  style={styles.drawerPillBtn}
                  onPress={() => {
                    setMenuVisible(false);
                    setCurrentScreen('HEALTH');
                  }}
                >
                  <Text style={styles.drawerPillText}>System Health</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.drawerPillBtn, styles.logoutPill]}
                  onPress={() => setCurrentScreen('AUTH')}
                >
                  <Text style={[styles.drawerPillText, { color: '#DC2626' }]}>
                    Log Out
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      )}

      {/* Stacked Glass Wallet Card Deck */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={styles.deckScrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {courses.map((item, index) => (
          <GlassDeckCard
            key={item.course_id}
            item={item}
            index={index}
            isExpanded={selectedCardId === item.course_id}
            scrollY={scrollY}
            cardStep={CARD_STEP}
            onToggleExpand={() => {
              springLayout();
              setSelectedCardId(
                selectedCardId === item.course_id ? null : item.course_id
              );
            }}
            onOpenRoster={onOpenRoster}
            onDelete={handleDeleteClass}
          />
        ))}

        {/* Glassmorphic Analytics Card */}
        <View
          style={[
            styles.walletCardShadow,
            {
              marginTop: courses.length === 0 ? 0 : -38,
              zIndex: courses.length + 2
            }
          ]}
        >
          <View style={styles.walletCardClip}>
            <BlurView
              intensity={60}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: 'rgba(211, 196, 153, 0.72)' }
              ]}
            />
            <GlassSheen id="analyticsSheen" />

            <View style={[styles.walletCardInner, { paddingBottom: 26 }]}>
              <View style={styles.cardTopRow}>
                <View style={styles.glyphBadge}>
                  <Text style={styles.glyphText}>AI</Text>
                </View>
                <TouchableOpacity onPress={() => setCurrentScreen('HEALTH')}>
                  <Text style={styles.healthLinkText}>System Health ↗</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cardMainRow}>
                <View>
                  <Text style={styles.cardCategorySub}>
                    Vision Attendance Summary
                  </Text>
                  <Text style={styles.cardTitleText}>Weekly Rate</Text>
                </View>
                <Text style={styles.cardRightMetric}>
                  {totalAnomalies > 0 ? `${totalAnomalies} alerts` : '96.4%'}
                </Text>
              </View>

              <View style={styles.chartRow}>
                {WEEKLY_BARS.map((bar, idx) => (
                  <View key={bar.day} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <HatchedBar
                        height={Math.round(bar.val * 88)}
                        active={bar.active}
                        revealAnim={barAnims[idx]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.barDayLabel,
                        bar.active && styles.barDayLabelActive
                      ]}
                    >
                      {bar.day}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.analyticsFooterRow}>
                <Text style={styles.allTimeLabel}>All Classes</Text>
                <Text style={styles.allTimeValue}>{totalStudents} Enrolled</Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.ScrollView>

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
                Add a new subject card and choose its card theme color.
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
                placeholder="e.g. MWF 10:30 AM"
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
                    placeholder="Osmeña Rm 302"
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

              <Text style={styles.label}>Card Color Theme</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.modalColorScroll}
              >
                {COLOR_PRESETS.map(({ name, hex }) => {
                  const active = selectedBase === hex;
                  return (
                    <TouchableOpacity
                      key={hex}
                      accessibilityLabel={`${name}. Hold for shades.`}
                      delayLongPress={350}
                      style={[
                        styles.modalSwatch,
                        { backgroundColor: hex },
                        active && styles.modalSwatchActive,
                        active && { shadowColor: hex }
                      ]}
                      onPress={() => {
                        setSelectedColor(hex);
                        setSelectedBase(hex);
                        setShadePicker(null);
                      }}
                      onLongPress={() => setShadePicker(hex)}
                    />
                  );
                })}
              </ScrollView>

              {shadePicker ? (
                <ShadeStrip
                  base={shadePicker}
                  current={selectedColor}
                  labelColor="#64748B"
                  onPick={(shade) => {
                    setSelectedColor(shade);
                    setSelectedBase(shadePicker);
                  }}
                />
              ) : (
                <Text style={[styles.shadeLabel, { color: '#64748B', marginBottom: 14 }]}>
                  Hold a color for lighter or darker shades.
                </Text>
              )}

              <TouchableOpacity style={styles.primaryBtn} onPress={handleAddClass}>
                <Text style={styles.primaryBtnText}>Add Card to Deck</Text>
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14
  },
  titleDropdownBtn: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#070B24',
    letterSpacing: -0.8
  },
  chevronIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: '#070B24',
    marginLeft: 8,
    marginTop: -2
  },
  headerRightActions: { flexDirection: 'row', alignItems: 'center' },
  addBtnCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(7, 11, 36, 0.9)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addBtnPlus: { color: '#FFFFFF', fontSize: 22, fontWeight: '600', marginTop: -2 },

  // Glass Quick Drawer
  quickDrawerShadow: {
    marginHorizontal: 14,
    marginBottom: 12,
    borderRadius: 22,
    shadowColor: '#070B24',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4
  },
  quickDrawerGlass: {
    borderRadius: 22,
    overflow: 'hidden',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)'
  },
  drawerProfileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  drawerName: { fontSize: 15, fontWeight: '800', color: '#070B24' },
  drawerEmail: { fontSize: 12, color: '#475569', marginTop: 2 },
  drawerPills: { flexDirection: 'row' },
  drawerPillBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)'
  },
  logoutPill: { backgroundColor: 'rgba(254, 242, 242, 0.85)' },
  drawerPillText: { fontSize: 12, fontWeight: '700', color: '#070B24' },

  // Glass Wallet Card Deck
  deckScrollContent: {
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 80
  },
  walletCardShadow: {
    borderRadius: 30,
    shadowColor: '#070B24',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 6
  },
  walletCardClip: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.64)'
  },
  walletCardInner: {
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 56
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22
  },
  glyphBadge: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  glyphText: { fontSize: 10, fontWeight: '900', color: '#070B24' },
  cardMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  cardCategorySub: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(11, 19, 32, 0.6)',
    marginBottom: 3
  },
  cardTitleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0B1320',
    letterSpacing: -0.5
  },
  cardRightMetric: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0B1320',
    letterSpacing: -0.5,
    flexShrink: 0
  },
  expandedDrawer: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1
  },
  actionRowButtons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  actionDarkPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginRight: 8
  },
  actionDarkPillText: { fontSize: 13, fontWeight: '700' },
  actionLightPill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)'
  },
  actionLightPillText: { fontSize: 13, fontWeight: '700' },
  actionDeletePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderWidth: 1.5,
    borderColor: '#B91C1C',
    paddingVertical: 8.5,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginLeft: 'auto'
  },
  actionDeleteText: { color: '#B91C1C', fontSize: 13, fontWeight: '700' },

  // Analytics Card Internals
  healthLinkText: { fontSize: 12, fontWeight: '700', color: 'rgba(7, 11, 36, 0.7)' },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 112,
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 4
  },
  barCol: { alignItems: 'center' },
  barTrack: { height: 90, justifyContent: 'flex-end' },
  barDayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(7, 11, 36, 0.5)',
    marginTop: 6
  },
  barDayLabelActive: { color: '#070B24', fontWeight: '800' },
  analyticsFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 6
  },
  allTimeLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(7, 11, 36, 0.6)' },
  allTimeValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#070B24',
    letterSpacing: -0.8
  },

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
    alignItems: 'center',
    marginBottom: 4
  },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#070B24' },
  closeBtnText: { fontSize: 20, fontWeight: '800', color: '#64748B', padding: 4 },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 18,
    fontWeight: '500'
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
    fontSize: 15
  },
  inputFocused: { borderColor: '#82B428', backgroundColor: '#FFFFFF' },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
  modalColorScroll: { paddingTop: 4, paddingBottom: 12, paddingHorizontal: 4 },
  modalSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
    borderWidth: 3,
    borderColor: 'transparent'
  },
  modalSwatchActive: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.12 }],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.55,
    shadowRadius: 6,
    elevation: 6
  },
  shadeBlock: { marginBottom: 14 },
  shadeLabel: { fontSize: 11, fontWeight: '600', marginBottom: 6 },
  shadeRow: { flexDirection: 'row' },
  shadeSwatch: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    marginRight: 6,
    borderWidth: 3,
    borderColor: 'transparent'
  },
  shadeSwatchActive: {
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4
  },
  primaryBtn: {
    backgroundColor: '#070B24',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 6
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});