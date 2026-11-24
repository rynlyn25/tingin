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
import LiquidCardStack from '../components/LiquidCardStack';
import EditCourseModal from '../components/EditCourseModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// =============================================================================
// 1. CONSTANTS & THEME
// =============================================================================

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const THEME = {
  bg: '#F5F3EB',
  navy: '#070B24',
  ink: '#0B1320',
  muted: '#64748B',
  danger: '#DC2626',
  defaultCardColor: '#0066FF'
};

const DECK_OVERLAP = -38;

const COLOR_PRESETS = [
  { name: 'Red', hex: '#ED0A3F' },
  { name: 'Orange', hex: '#FF8833' },
  { name: 'Yellow', hex: '#FBE870' },
  { name: 'Green', hex: '#01A638' },
  { name: 'Blue', hex: '#0066FF' },
  { name: 'Violet', hex: '#8359A3' },
  { name: 'Brown', hex: '#AF593E' }
];

const WEEKLY_BARS = [
  { day: 'Mon', val: 0.62, active: false },
  { day: 'Tue', val: 0.78, active: false },
  { day: 'Wed', val: 0.35, active: false },
  { day: 'Thu', val: 0.5, active: false },
  { day: 'Fri', val: 0.96, active: true },
  { day: 'Sat', val: 0.22, active: false },
  { day: 'Sun', val: 0.18, active: false }
];

const INITIAL_FORM = {
  code: '',
  name: '',
  schedule: '',
  room: '',
  enrolled: '',
  seatCapacity: '40',
  color: THEME.defaultCardColor,
  base: THEME.defaultCardColor
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

const hexToRgb = (hex) => {
  const clean = (hex || THEME.defaultCardColor).replace('#', '');
  return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16) || 0);
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

// =============================================================================
// 3. SUB-COMPONENTS
// =============================================================================

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
    <View style={[StyleSheet.absoluteFill, { backgroundColor: THEME.bg }]} pointerEvents="none">
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
              <Stop offset="100%" stopColor={THEME.bg} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="deckOrb2" cx="88%" cy="58%" r="55%">
              <Stop offset="0%" stopColor="#D3C499" stopOpacity="0.48" />
              <Stop offset="100%" stopColor={THEME.bg} stopOpacity="0" />
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

function QuickDrawer({ fullName, email, onOpenProfile, onOpenHealth, onLogOut }) {
  return (
    <View style={styles.quickDrawerShadow}>
      <BlurView intensity={55} tint="light" style={styles.quickDrawerGlass}>
        <View style={styles.drawerProfileRow}>
          <TouchableOpacity
            style={styles.drawerIdentityCol}
            activeOpacity={0.7}
            onPress={onOpenProfile}
          >
            <Text style={styles.drawerName} numberOfLines={1}>
              {fullName || 'DLSAU Professor'} ›
            </Text>
            <Text style={styles.drawerEmail} numberOfLines={1}>
              {email}
            </Text>
          </TouchableOpacity>

          <View style={styles.drawerPills}>
            <TouchableOpacity style={styles.drawerPillBtn} onPress={onOpenHealth}>
              <Text style={styles.drawerPillText}>System Health</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.drawerPillBtn, styles.logoutPill]}
              onPress={onLogOut}
            >
              <Text style={[styles.drawerPillText, { color: THEME.danger }]}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </View>
  );
}

function HatchedBar({ height, active, revealAnim }) {
  const width = 28;
  const barTranslateY = revealAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0]
  });

  if (active) {
    return (
      <View style={{ width, height, borderRadius: 7, overflow: 'hidden' }}>
        <Animated.View
          style={{
            width,
            height,
            backgroundColor: THEME.navy,
            borderRadius: 7,
            transform: [{ translateY: barTranslateY }]
          }}
        />
      </View>
    );
  }

  const lines = [];
  for (let i = -height; i < width + height; i += 6) {
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
    <View style={{ width, height, borderRadius: 7, overflow: 'hidden' }}>
      <Animated.View style={{ transform: [{ translateY: barTranslateY }] }}>
        <Svg width={width} height={height}>
          <Rect width={width} height={height} fill="rgba(255, 255, 255, 0.25)" rx={7} />
          {lines}
        </Svg>
      </Animated.View>
    </View>
  );
}

function AnalyticsCard({ courseCount, totalStudents, totalAnomalies, onOpenHealth }) {
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

  return (
    <View
      style={[
        styles.walletCardShadow,
        {
          marginTop: courseCount === 0 ? 0 : DECK_OVERLAP,
          zIndex: 2
        }
      ]}
    >
      <View style={styles.walletCardClip}>
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(211, 196, 153, 0.72)' }]} />
        <GlassSheen id="analyticsSheen" />

        <View style={[styles.walletCardInner, styles.analyticsInner]}>
          <View style={styles.cardTopRow}>
            <View style={styles.glyphBadge}>
              <Text style={styles.glyphText}>AI</Text>
            </View>
            <TouchableOpacity onPress={onOpenHealth}>
              <Text style={styles.healthLinkText}>System Health ↗</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardMainRow}>
            <View>
              <Text style={styles.cardCategorySub}>Vision Attendance Summary</Text>
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
                <Text style={[styles.barDayLabel, bar.active && styles.barDayLabelActive]}>
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
  );
}

function ShadeStrip({ base, current, onPick }) {
  return (
    <View style={styles.shadeBlock}>
      <Text style={styles.shadeLabel}>Light to dark. Tap a shade to apply.</Text>
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

function AddClassModal({ visible, onClose, onSubmit }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [shadeBase, setShadeBase] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(80)).current;
  const sheetScale = useRef(new Animated.Value(0.95)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;

    setShadeBase(null);
    setFocusedField(null);
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

  const fieldProps = (key) => ({
    value: form[key],
    placeholderTextColor: THEME.muted,
    onFocus: () => setFocusedField(key),
    onBlur: () => setFocusedField(null),
    onChangeText: (val) => setForm((prev) => ({ ...prev, [key]: val })),
    style: [
      styles.glassInput,
      focusedField === key && {
        borderColor: form.color,
        backgroundColor: 'rgba(255, 255, 255, 0.9)'
      }
    ]
  });

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

  const handleSave = () => {
    const { code, name, schedule, room, enrolled, seatCapacity, color, base } = form;
    if (!code.trim() || !name.trim() || !schedule.trim() || !room.trim()) {
      Alert.alert('Missing Details', 'Please fill in the course code, name, schedule, and room.');
      return;
    }

    onSubmit({
      course_id: `CRS-${Date.now()}`,
      course_code: code.trim().toUpperCase(),
      course_name: name.trim(),
      schedule: schedule.trim(),
      room: room.trim(),
      enrolled_count: parseInt(enrolled, 10) || 0,
      seat_capacity: Math.max(1, parseInt(seatCapacity, 10) || 40),
      pending_anomalies: 0,
      card_color: color,
      card_base: base
    });

    setForm(INITIAL_FORM);
    setShadeBase(null);
    handleClose();
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
                <RadialGradient id="addClassAura" cx="85%" cy="12%" r="65%">
                  <Stop offset="0%" stopColor={form.color} stopOpacity="0.34" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </RadialGradient>
                <LinearGradient id="addClassSheen" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
                  <Stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.12" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#addClassAura)" />
              <Rect width="100%" height="100%" fill="url(#addClassSheen)" />
            </Svg>

            <View style={styles.glassModalInner}>
              <View style={styles.modalHandle} />
              <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>Add New Class</Text>
                  <TouchableOpacity style={styles.modalClosePill} onPress={handleClose}>
                    <Text style={styles.closeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalSubtitle}>
                  Add a new subject card and choose its glass color theme.
                </Text>

                <Text style={styles.label}>Course Code</Text>
                <TextInput placeholder="e.g. CS 309" {...fieldProps('code')} />

                <Text style={styles.label}>Course Name</Text>
                <TextInput placeholder="e.g. Human-Computer Interaction" {...fieldProps('name')} />

                <Text style={styles.label}>Schedule</Text>
                <TextInput placeholder="e.g. MWF 10:30 AM" {...fieldProps('schedule')} />

                <View style={styles.rowInputs}>
                  <View style={styles.roomCol}>
                    <Text style={styles.label}>Room Assignment</Text>
                    <TextInput placeholder="Osmeña Rm 302" {...fieldProps('room')} />
                  </View>

                  <View style={styles.enrolledCol}>
                    <Text style={styles.label}>Enrolled</Text>
                    <TextInput
                      placeholder="35"
                      keyboardType="number-pad"
                      {...fieldProps('enrolled')}
                    />
                  </View>
                </View>

                <Text style={styles.label}>Classroom Seat Count</Text>
                <TextInput
                  placeholder="40"
                  keyboardType="number-pad"
                  {...fieldProps('seatCapacity')}
                />

                <Text style={styles.label}>Card Color Theme</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.modalColorScroll}
                >
                  {COLOR_PRESETS.map(({ name, hex }) => {
                    const active = form.base === hex;
                    return (
                      <TouchableOpacity
                        key={hex}
                        accessibilityLabel={`${name}. Hold for shades.`}
                        delayLongPress={320}
                        style={[
                          styles.modalSwatch,
                          { backgroundColor: hex },
                          active && styles.modalSwatchActive,
                          active && { shadowColor: hex }
                        ]}
                        onPress={() => {
                          springLayout();
                          setForm((prev) => ({ ...prev, color: hex, base: hex }));
                          setShadeBase(null);
                        }}
                        onLongPress={() => {
                          springLayout();
                          setShadeBase(hex);
                        }}
                      />
                    );
                  })}
                </ScrollView>

                {shadeBase ? (
                  <ShadeStrip
                    base={shadeBase}
                    current={form.color}
                    onPick={(shade) =>
                      setForm((prev) => ({ ...prev, color: shade, base: shadeBase }))
                    }
                  />
                ) : (
                  <Text style={styles.shadeHint}>
                    Hold a color for lighter or darker shades.
                  </Text>
                )}

                <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                  <TouchableOpacity
                    style={styles.glassPrimaryBtn}
                    activeOpacity={0.92}
                    onPressIn={() =>
                      Animated.spring(btnScale, {
                        toValue: 0.96,
                        friction: 7,
                        useNativeDriver: true
                      }).start()
                    }
                    onPressOut={() =>
                      Animated.spring(btnScale, {
                        toValue: 1,
                        friction: 6,
                        useNativeDriver: true
                      }).start()
                    }
                    onPress={handleSave}
                  >
                    <Text style={styles.primaryBtnText}>Add Card to Deck</Text>
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

export default function DashboardScreen({
  email,
  fullName,
  courses = [],
  onAddCourse,
  onUpdateCourse,
  onReorderCourses,
  onDeleteCourse,
  setCurrentScreen,
  onOpenRoster,
  onOpenLiveFeed
}) {
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const chevronRot = useRef(new Animated.Value(0)).current;

  const totalStudents = courses.reduce((sum, c) => sum + (c.enrolled_count || 0), 0);
  const totalAnomalies = courses.reduce((sum, c) => sum + (c.pending_anomalies || 0), 0);

  const chevronRotateDeg = chevronRot.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  const setMenuOpen = (open) => {
    springLayout();
    setMenuVisible(open);
    Animated.spring(chevronRot, {
      toValue: open ? 1 : 0,
      friction: 7,
      useNativeDriver: true
    }).start();
  };

  const navigateFromMenu = (screen) => {
    setMenuOpen(false);
    setCurrentScreen(screen);
  };

  const handleCreateCourse = (newCourse) => {
    springLayout();
    onAddCourse && onAddCourse(newCourse);
  };

  const handleSaveCourseEdits = (updates) => {
    if (editingCourse && onUpdateCourse) {
      springLayout();
      onUpdateCourse(editingCourse.course_id, updates);
    }
    setEditingCourse(null);
  };

  const handleDeleteCourse = (course) => {
    Alert.alert(
      'Delete Class',
      `Remove ${course.course_code} (${course.course_name}) from your deck?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            springLayout();
            onDeleteCourse && onDeleteCourse(course.course_id);
            if (selectedCardId === course.course_id) setSelectedCardId(null);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <DeckAmbientBackground accent={courses[0]?.card_color} />

      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.titleDropdownBtn}
          activeOpacity={0.7}
          onPress={() => setMenuOpen(!menuVisible)}
        >
          <Text style={styles.headerTitle}>Classes</Text>
          <Animated.Text
            style={[styles.chevronIcon, { transform: [{ rotate: chevronRotateDeg }] }]}
          >
            ⌄
          </Animated.Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addBtnCircle}
          activeOpacity={0.82}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addBtnPlus}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Collapsible Profile & System Drawer */}
      {menuVisible && (
        <QuickDrawer
          fullName={fullName}
          email={email}
          onOpenProfile={() => navigateFromMenu('PROFILE')}
          onOpenHealth={() => navigateFromMenu('HEALTH')}
          onLogOut={() => navigateFromMenu('AUTH')}
        />
      )}

      {/* Stacked Glass Wallet Deck */}
      <ScrollView
        scrollEnabled={!isDraggingCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.deckScrollContent}
      >
        <View style={[styles.stackLayer, isDraggingCard && styles.stackLayerDragging]}>
          <LiquidCardStack
            courses={courses}
            expandedCardId={selectedCardId}
            onToggleExpand={(course) => {
              springLayout();
              setSelectedCardId((prev) =>
                prev === course.course_id ? null : course.course_id
              );
            }}
            onOpenRoster={onOpenRoster}
            onOpenLiveFeed={onOpenLiveFeed}
            onEditCourse={(course) => setEditingCourse(course)}
            onDeleteCourse={handleDeleteCourse}
            onReorderCourses={(nextCourses) => {
              onReorderCourses && onReorderCourses(nextCourses);
            }}
            onDragStateChange={setIsDraggingCard}
          />
        </View>

        <AnalyticsCard
          courseCount={courses.length}
          totalStudents={totalStudents}
          totalAnomalies={totalAnomalies}
          onOpenHealth={() => setCurrentScreen('HEALTH')}
        />
      </ScrollView>

      {/* Glassmorphic Add New Class Modal */}
      <AddClassModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreateCourse}
      />

      {/* Glassmorphic Edit Class Modal */}
      <EditCourseModal
        visible={Boolean(editingCourse)}
        course={editingCourse}
        onCancel={() => setEditingCourse(null)}
        onSave={handleSaveCourseEdits}
      />
    </SafeAreaView>
  );
}

// =============================================================================
// 5. STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },

  // Header
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
    color: THEME.navy,
    letterSpacing: -0.8
  },
  chevronIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.navy,
    marginLeft: 8,
    marginTop: -2
  },
  addBtnCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(7, 11, 36, 0.9)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addBtnPlus: { color: '#FFFFFF', fontSize: 22, fontWeight: '600', marginTop: -2 },

  // Quick Drawer
  quickDrawerShadow: {
    marginHorizontal: 14,
    marginBottom: 12,
    borderRadius: 22,
    shadowColor: THEME.navy,
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
  drawerIdentityCol: { flex: 1, paddingRight: 10 },
  drawerName: { fontSize: 15, fontWeight: '800', color: THEME.navy },
  drawerEmail: { fontSize: 12, color: '#475569', marginTop: 2 },
  drawerPills: { flexDirection: 'row', flexShrink: 0 },
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
  drawerPillText: { fontSize: 12, fontWeight: '700', color: THEME.navy },

  // Stacked Wallet Deck
  deckScrollContent: {
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 80
  },
  stackLayer: {
    zIndex: 1,
    overflow: 'visible'
  },
  stackLayerDragging: {
    zIndex: 50
  },

  // Analytics Card
  walletCardShadow: {
    borderRadius: 30,
    shadowColor: THEME.navy,
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
  analyticsInner: { paddingBottom: 26 },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22
  },
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
    color: THEME.ink,
    letterSpacing: -0.5
  },
  cardRightMetric: {
    fontSize: 20,
    fontWeight: '600',
    color: THEME.ink,
    letterSpacing: -0.5,
    flexShrink: 0
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
  glyphText: { fontSize: 10, fontWeight: '900', color: THEME.navy },
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
  barDayLabelActive: { color: THEME.navy, fontWeight: '800' },
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
    color: THEME.navy,
    letterSpacing: -0.8
  },

  // Glass Add Class Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  modalBackdropTint: {
    flex: 1,
    backgroundColor: 'rgba(7, 11, 36, 0.28)'
  },
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
    maxHeight: SCREEN_H * 0.84
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
    alignItems: 'center',
    marginBottom: 4
  },
  modalTitle: { fontSize: 24, fontWeight: '900', color: THEME.navy },
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
  modalSubtitle: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 18,
    fontWeight: '500'
  },
  label: { color: '#1E293B', fontSize: 13, marginBottom: 6, fontWeight: '700' },
  glassInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    color: '#0F172A',
    padding: 14,
    borderRadius: 14,
    marginBottom: 13,
    borderWidth: 1.4,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    fontSize: 15
  },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
  roomCol: { flex: 0.58 },
  enrolledCol: { flex: 0.38 },
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.55,
    shadowRadius: 6,
    elevation: 6
  },
  shadeBlock: { marginBottom: 14 },
  shadeLabel: { fontSize: 11, fontWeight: '600', color: '#475569', marginBottom: 6 },
  shadeHint: { fontSize: 11, fontWeight: '600', color: '#475569', marginBottom: 14 },
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
  glassPrimaryBtn: {
    backgroundColor: 'rgba(7, 11, 36, 0.92)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 6,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.25)'
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});