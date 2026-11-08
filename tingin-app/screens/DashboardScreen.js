import React, { useState, useRef } from 'react';
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
  Animated
} from 'react-native';
import Svg, { Path, Rect, Line } from 'react-native-svg';

// Crayola classic 8-box colors (Black removed).
// Press and hold a swatch to pick a lighter or darker shade of that color.
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

// ---- Color helpers ----
const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
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

// 3 lighter tints, the base color, then 3 darker shades
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

// Picks readable text / button colors for any card color (light or dark)
const getCardTheme = (bg) => {
  const L = luminance(bg);
  const useWhite = 1.05 / (L + 0.05) > (L + 0.05) / 0.056;
  const rgb = useWhite ? '255, 255, 255' : '7, 11, 36';
  return {
    ink: useWhite ? '#FFFFFF' : '#0B1320',
    inkSoft: `rgba(${rgb}, 0.72)`,
    line: `rgba(${rgb}, 0.2)`,
    badgeBg: `rgba(${rgb}, 0.16)`,
    solidBg: useWhite ? '#FFFFFF' : '#070B24',
    solidText: useWhite ? '#0B1320' : '#FFFFFF',
    softPillBg: useWhite ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.55)'
  };
};


const INITIAL_COURSES = [
  {
    course_id: 'CS301',
    course_code: 'CS 301',
    course_name: 'Software Engineering',
    schedule: 'MWF 09:00 AM',
    room: 'Osmeña Rm 302',
    enrolled_count: 35,
    pending_anomalies: 2,
    card_color: '#01A638'
  },
  {
    course_id: 'CS305',
    course_code: 'CS 305',
    course_name: 'Architecture & Org',
    schedule: 'TTH 01:00 PM',
    room: 'Osmeña Rm 304',
    enrolled_count: 40,
    pending_anomalies: 0,
    card_color: '#FF8833'
  },
  {
    course_id: 'CS309',
    course_code: 'CS 309',
    course_name: 'Human-Computer Interaction',
    schedule: 'MWF 10:30 AM',
    room: 'Ledesma Hall 201',
    enrolled_count: 38,
    pending_anomalies: 1,
    card_color: '#FBE870'
  }
];

const WEEKLY_BARS = [
  { day: 'Mon', val: 0.62, active: false },
  { day: 'Tue', val: 0.78, active: false },
  { day: 'Wed', val: 0.35, active: false },
  { day: 'Thu', val: 0.50, active: false },
  { day: 'Fri', val: 0.96, active: true },
  { day: 'Sat', val: 0.22, active: false },
  { day: 'Sun', val: 0.18, active: false }
];

function HatchedBar({ height, active }) {
  const w = 28;
  if (active) {
    return (
      <View
        style={{
          width: w,
          height,
          backgroundColor: '#070B24',
          borderRadius: 7
        }}
      />
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
        stroke="rgba(7, 11, 36, 0.25)"
        strokeWidth="1.6"
      />
    );
  }
  return (
    <View style={{ width: w, height, borderRadius: 7, overflow: 'hidden' }}>
      <Svg width={w} height={height}>
        <Rect width={w} height={height} fill="rgba(7, 11, 36, 0.04)" rx={7} />
        {lines}
      </Svg>
    </View>
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
  setCurrentScreen,
  onOpenRoster
}) {
  const [courses, setCourses] = useState(INITIAL_COURSES);
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

    setCourses([newCourse, ...courses]);
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
    Alert.alert(
      'Delete Class',
      `Remove ${code} (${name}) from your deck?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setCourses((prev) => prev.filter((item) => item.course_id !== courseId));
            if (selectedCardId === courseId) setSelectedCardId(null);
          }
        }
      ]
    );
  };

  const handleChangeCardColor = (courseId, newColor, baseHex) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.course_id === courseId
          ? { ...c, card_color: newColor, card_base: baseHex || newColor }
          : c
      )
    );
  };

  const CARD_STEP = 126;

  return (
    <SafeAreaView style={styles.container}>
      {/* Editorial Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.titleDropdownBtn}
          activeOpacity={0.7}
          onPress={() => setMenuVisible(!menuVisible)}
        >
          <Text style={styles.headerTitle}>Classes</Text>
          <Text style={styles.chevronIcon}>{menuVisible ? '⌃' : '⌄'}</Text>
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.addBtnCircle}
            onPress={() => {
              setShadePicker(null);
              setModalVisible(true);
            }}
          >
            <Text style={styles.addBtnPlus}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Collapsible Quick Drawer */}
      {menuVisible && (
        <View style={styles.quickDrawer}>
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
        </View>
      )}

      {/* Stacked Wallet Card Deck */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={styles.deckScrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {courses.map((item, index) => {
          const cardBg = item.card_color || DEFAULT_COLOR;
          const theme = getCardTheme(cardBg);
          const activeBase = item.card_base || cardBg;
          const isExpanded = selectedCardId === item.course_id;

          const startPin = index * CARD_STEP;
          const translateY = scrollY.interpolate({
            inputRange: [-200, 0, startPin, startPin + 600],
            outputRange: [index * 8, 0, 0, 600 - index * (CARD_STEP - 14)],
            extrapolate: 'clamp'
          });

          const scale = scrollY.interpolate({
            inputRange: [startPin - 40, startPin + 220],
            outputRange: [1, 0.965],
            extrapolate: 'clamp'
          });

          return (
            <Animated.View
              key={item.course_id}
              style={[
                styles.walletCard,
                {
                  backgroundColor: cardBg,
                  marginTop: index === 0 ? 0 : -38,
                  zIndex: index + 1,
                  transform: [{ translateY }, { scale }]
                }
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => {
                  setShadePicker(null);
                  setSelectedCardId(isExpanded ? null : item.course_id);
                }}
              >
                <View style={styles.cardTopRow}>
                  <View style={[styles.glyphBadge, { backgroundColor: theme.badgeBg }]}>
                    <Text
                      style={[styles.glyphText, { color: theme.ink }]}
                      numberOfLines={1}
                    >
                      {item.course_code.replace(/\s+/g, '').slice(0, 8)}
                    </Text>
                  </View>

                  {item.pending_anomalies > 0 && (
                    <View
                      style={[styles.anomalyDotBadge, { backgroundColor: theme.solidBg }]}
                    >
                      <Text style={[styles.anomalyDotText, { color: theme.solidText }]}>
                        {item.pending_anomalies} flagged
                      </Text>
                    </View>
                  )}
                </View>

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

                {/* Expanded Action Bar with Color Picker */}
                {isExpanded && (
                  <View style={[styles.expandedDrawer, { borderTopColor: theme.line }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pickerLabel, { color: theme.inkSoft }]}>
                        Card Theme Color
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.colorPickerScroll}
                      >
                        {COLOR_PRESETS.map(({ name, hex }) => (
                          <TouchableOpacity
                            key={hex}
                            accessibilityLabel={`${name}. Hold for shades.`}
                            delayLongPress={350}
                            style={[
                              styles.colorSwatch,
                              { backgroundColor: hex },
                              activeBase === hex && styles.colorSwatchActive
                            ]}
                            onPress={() => {
                              handleChangeCardColor(item.course_id, hex, hex);
                              setShadePicker(null);
                            }}
                            onLongPress={() =>
                              setShadePicker({
                                target: 'card',
                                courseId: item.course_id,
                                base: hex
                              })
                            }
                          />
                        ))}
                      </ScrollView>

                      {shadePicker &&
                      shadePicker.target === 'card' &&
                      shadePicker.courseId === item.course_id ? (
                        <ShadeStrip
                          base={shadePicker.base}
                          current={cardBg}
                          labelColor={theme.inkSoft}
                          onPick={(shade) =>
                            handleChangeCardColor(item.course_id, shade, shadePicker.base)
                          }
                        />
                      ) : (
                        <Text style={[styles.shadeLabel, { color: theme.inkSoft, marginBottom: 14 }]}>
                          Hold a color for lighter or darker shades.
                        </Text>
                      )}

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
                            handleDeleteClass(
                              item.course_id,
                              item.course_code,
                              item.course_name
                            )
                          }
                        >
                          <Text style={styles.actionDeleteText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Analytics Card */}
        <View
          style={[
            styles.walletCard,
            styles.analyticsCard,
            {
              marginTop: courses.length === 0 ? 0 : -38,
              zIndex: courses.length + 2
            }
          ]}
        >
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
            {WEEKLY_BARS.map((bar) => (
              <View key={bar.day} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <HatchedBar
                    height={Math.round(bar.val * 88)}
                    active={bar.active}
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
      </Animated.ScrollView>

      {/* MODAL: ADD NEW CLASS WITH COLOR PICKER */}
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
                style={[
                  styles.input,
                  focusedField === 'CODE' && styles.inputFocused
                ]}
                placeholder="e.g. CS 309"
                placeholderTextColor="#94A3B8"
                value={courseCode}
                onFocus={() => setFocusedField('CODE')}
                onBlur={() => setFocusedField(null)}
                onChangeText={setCourseCode}
              />

              <Text style={styles.label}>Course Name</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'NAME' && styles.inputFocused
                ]}
                placeholder="e.g. Human-Computer Interaction"
                placeholderTextColor="#94A3B8"
                value={courseName}
                onFocus={() => setFocusedField('NAME')}
                onBlur={() => setFocusedField(null)}
                onChangeText={setCourseName}
              />

              <Text style={styles.label}>Schedule</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'SCHED' && styles.inputFocused
                ]}
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
                    style={[
                      styles.input,
                      focusedField === 'ROOM' && styles.inputFocused
                    ]}
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
                    style={[
                      styles.input,
                      focusedField === 'COUNT' && styles.inputFocused
                    ]}
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

              {/* Color Picker (hold a color for shades) */}
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
                      onLongPress={() => setShadePicker({ target: 'modal', base: hex })}
                    />
                  );
                })}
              </ScrollView>

              {shadePicker && shadePicker.target === 'modal' ? (
                <ShadeStrip
                  base={shadePicker.base}
                  current={selectedColor}
                  labelColor="#64748B"
                  onPick={(shade) => {
                    setSelectedColor(shade);
                    setSelectedBase(shadePicker.base);
                  }}
                />
              ) : (
                <Text style={[styles.shadeLabel, { color: '#64748B', marginBottom: 14 }]}>
                  Hold a color for lighter or darker shades.
                </Text>
              )}

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleAddClass}
              >
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
  container: {
    flex: 1,
    backgroundColor: '#F5F3EB'
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14
  },
  titleDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center'
  },
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  addBtnCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#070B24',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addBtnPlus: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    marginTop: -2
  },
  quickDrawer: {
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  drawerProfileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  drawerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#070B24'
  },
  drawerEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  drawerPills: {
    flexDirection: 'row'
  },
  drawerPillBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginLeft: 8
  },
  logoutPill: {
    backgroundColor: '#FEF2F2'
  },
  drawerPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#070B24'
  },
  deckScrollContent: {
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 80
  },
  walletCard: {
    borderRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 56,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 26
  },
  glyphBadge: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: 'rgba(7, 11, 36, 0.10)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  glyphText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#070B24',
    letterSpacing: -0.3,
    flexShrink: 0
  },
  anomalyDotBadge: {
    backgroundColor: 'rgba(7, 11, 36, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  anomalyDotText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  cardMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  cardCategorySub: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(11, 19, 32, 0.55)',
    marginBottom: 3
  },
  cardTitleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0B1320',
    letterSpacing: -0.5
  },
  cardRightMetric: {
    fontSize: 21,
    fontWeight: '600',
    color: '#0B1320',
    letterSpacing: -0.5,
    flexShrink: 0
  },
  expandedDrawer: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(7, 11, 36, 0.12)'
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(11, 19, 32, 0.7)',
    marginBottom: 8
  },
  colorPickerScroll: {
    paddingTop: 3,
    paddingBottom: 12,
    paddingHorizontal: 3
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    borderWidth: 3,
    borderColor: 'transparent'
  },
  colorSwatchActive: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.12 }],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4
  },
  shadeBlock: {
    marginBottom: 14
  },
  shadeLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6
  },
  shadeRow: {
    flexDirection: 'row'
  },
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
  actionRowButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  actionDarkPill: {
    backgroundColor: '#070B24',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginRight: 6
  },
  actionDarkPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  actionLightPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginRight: 6
  },
  actionLightPillText: {
    color: '#070B24',
    fontSize: 13,
    fontWeight: '700'
  },
  actionDeletePill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#B91C1C',
    paddingVertical: 7.5,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginLeft: 'auto'
  },
  actionDeleteText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700'
  },
  analyticsCard: {
    backgroundColor: '#D3C499',
    paddingBottom: 26
  },
  healthLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(7, 11, 36, 0.65)'
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 112,
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 4
  },
  barCol: {
    alignItems: 'center'
  },
  barTrack: {
    height: 90,
    justifyContent: 'flex-end'
  },
  barDayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(7, 11, 36, 0.45)',
    marginTop: 6
  },
  barDayLabelActive: {
    color: '#070B24',
    fontWeight: '800'
  },
  analyticsFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 6
  },
  allTimeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(7, 11, 36, 0.55)'
  },
  allTimeValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#070B24',
    letterSpacing: -0.8
  },
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
  },
  modalColorScroll: {
    paddingTop: 4,
    paddingBottom: 12,
    paddingHorizontal: 4
  },
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
  primaryBtn: {
    backgroundColor: '#070B24',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 6
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  }
});