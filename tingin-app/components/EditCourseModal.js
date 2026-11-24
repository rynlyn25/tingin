import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Rect } from 'react-native-svg';

const { height: SCREEN_H } = Dimensions.get('window');

const THEME = {
  navy: '#070B24',
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

export default function EditCourseModal({ visible, course, onCancel, onSave }) {
  const [courseName, setCourseName] = useState('');
  const [schedule, setSchedule] = useState('');
  const [room, setRoom] = useState('');
  const [studentsInput, setStudentsInput] = useState('35');
  const [cardColor, setCardColor] = useState(THEME.defaultCardColor);
  const [cardBase, setCardBase] = useState(THEME.defaultCardColor);
  const [shadeBase, setShadeBase] = useState(null);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(70)).current;

  useEffect(() => {
    if (!visible || !course) return;

    setCourseName(course.course_name || '');
    setSchedule(course.schedule || '');
    setRoom(course.room || '');
    setStudentsInput(String(course.enrolled_count ?? 35));
    setCardColor(course.card_color || THEME.defaultCardColor);
    setCardBase(course.card_base || course.card_color || THEME.defaultCardColor);
    setShadeBase(null);

    backdropOpacity.setValue(0);
    sheetY.setValue(70);

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true
      }),
      Animated.spring(sheetY, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true
      })
    ]).start();
  }, [visible, course]);

  const stepStudents = (delta) => {
    const current = parseInt(studentsInput, 10) || 0;
    const next = Math.max(1, Math.min(200, current + delta));
    setStudentsInput(String(next));
  };

  const handleSave = () => {
    const trimmedName = courseName.trim();
    if (!trimmedName) {
      Alert.alert('Subject Name Required', 'Please enter a subject name.');
      return;
    }

    const parsedStudents = Math.max(1, Math.min(200, parseInt(studentsInput, 10) || 1));

    onSave({
      course_name: trimmedName,
      schedule: schedule.trim() || 'TBA',
      room: room.trim() || 'Room TBA',
      enrolled_count: parsedStudents,
      card_color: cardColor,
      card_base: cardBase
    });
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={styles.backdropTint} activeOpacity={1} onPress={onCancel} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheetShadow,
            { opacity: backdropOpacity, transform: [{ translateY: sheetY }] }
          ]}
        >
          <View style={styles.sheetClip}>
            <BlurView intensity={82} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.sheetTint} />

            <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
              <Defs>
                <RadialGradient id="editAura" cx="85%" cy="8%" r="65%">
                  <Stop offset="0%" stopColor={cardColor} stopOpacity="0.38" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </RadialGradient>
                <LinearGradient id="editSheen" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
                  <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.12" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#editAura)" />
              <Rect width="100%" height="100%" fill="url(#editSheen)" />
            </Svg>

            <View style={styles.sheetInner}>
              <View style={styles.handle} />
              <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
                <View style={styles.headerRow}>
                  <Text style={styles.title}>Edit Class</Text>
                  <TouchableOpacity style={styles.closeBtn} onPress={onCancel}>
                    <Text style={styles.closeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Subject Name</Text>
                <TextInput
                  style={styles.input}
                  value={courseName}
                  onChangeText={setCourseName}
                  placeholder="e.g. Software Engineering"
                  placeholderTextColor={THEME.muted}
                />

                <View style={styles.twoColRow}>
                  <View style={styles.halfCol}>
                    <Text style={styles.label}>Schedule</Text>
                    <TextInput
                      style={styles.input}
                      value={schedule}
                      onChangeText={setSchedule}
                      placeholder="MWF 09:00 AM"
                      placeholderTextColor={THEME.muted}
                    />
                  </View>

                  <View style={styles.halfCol}>
                    <Text style={styles.label}>Room</Text>
                    <TextInput
                      style={styles.input}
                      value={room}
                      onChangeText={setRoom}
                      placeholder="Osmeña Rm 302"
                      placeholderTextColor={THEME.muted}
                    />
                  </View>
                </View>

                <View style={styles.studentsRow}>
                  <Text style={styles.label}>Students Enrolled</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => stepStudents(-1)}>
                      <Text style={styles.stepBtnText}>-</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.stepInput}
                      value={studentsInput}
                      keyboardType="number-pad"
                      maxLength={3}
                      onChangeText={(txt) => setStudentsInput(txt.replace(/[^0-9]/g, ''))}
                    />
                    <TouchableOpacity style={styles.stepBtn} onPress={() => stepStudents(1)}>
                      <Text style={styles.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.label}>Card Color</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.swatchRow}
                >
                  {COLOR_PRESETS.map(({ name, hex }) => (
                    <TouchableOpacity
                      key={hex}
                      accessibilityLabel={`${name}. Hold for shades.`}
                      delayLongPress={280}
                      style={[
                        styles.swatch,
                        { backgroundColor: hex },
                        cardBase === hex && styles.swatchActive
                      ]}
                      onPress={() => {
                        setCardColor(hex);
                        setCardBase(hex);
                        setShadeBase(null);
                      }}
                      onLongPress={() => setShadeBase(hex)}
                    />
                  ))}
                </ScrollView>

                {shadeBase ? (
                  <View style={styles.shadeRow}>
                    {getShades(shadeBase).map((shade) => (
                      <TouchableOpacity
                        key={shade}
                        style={[
                          styles.shadeChip,
                          { backgroundColor: shade },
                          cardColor.toUpperCase() === shade && styles.shadeChipActive
                        ]}
                        onPress={() => {
                          setCardColor(shade);
                          setCardBase(shadeBase);
                        }}
                      />
                    ))}
                  </View>
                ) : (
                  <Text style={styles.hint}>Hold any color for lighter or darker shades.</Text>
                )}

                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdropTint: { flex: 1, backgroundColor: 'rgba(7, 11, 36, 0.3)' },
  sheetShadow: {
    marginHorizontal: 10,
    marginBottom: Platform.OS === 'ios' ? 14 : 10,
    borderRadius: 28,
    shadowColor: THEME.navy,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 10
  },
  sheetClip: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.88)'
  },
  sheetTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.68)'
  },
  sheetInner: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: SCREEN_H * 0.84
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(7, 11, 36, 0.2)',
    alignSelf: 'center',
    marginBottom: 12
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  title: { fontSize: 21, fontWeight: '900', color: THEME.navy },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeBtnText: { fontSize: 14, fontWeight: '800', color: THEME.muted },
  label: { fontSize: 12, fontWeight: '800', color: '#334155', marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: '700',
    color: THEME.navy,
    marginBottom: 12
  },
  twoColRow: { flexDirection: 'row', justifyContent: 'space-between' },
  halfCol: { flex: 0.485 },
  studentsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(7, 11, 36, 0.14)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepBtnText: { fontSize: 17, fontWeight: '800', color: THEME.navy },
  stepInput: {
    width: 54,
    height: 34,
    marginHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(7, 11, 36, 0.14)',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: THEME.navy,
    paddingVertical: 0
  },
  swatchRow: { paddingVertical: 4 },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
    borderWidth: 3,
    borderColor: 'transparent'
  },
  swatchActive: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.12 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  shadeRow: { flexDirection: 'row', marginTop: 8, marginBottom: 4 },
  shadeChip: {
    flex: 1,
    height: 28,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  shadeChipActive: { borderColor: THEME.navy },
  hint: { fontSize: 11, fontWeight: '600', color: '#475569', marginTop: 4 },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18
  },
  cancelBtn: {
    flex: 0.44,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(7, 11, 36, 0.14)'
  },
  cancelText: { fontSize: 14, fontWeight: '800', color: THEME.navy },
  saveBtn: {
    flex: 0.52,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: THEME.navy
  },
  saveText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' }
});