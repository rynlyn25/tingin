import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
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
  Circle,
  Path
} from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// =============================================================================
// 1. CONSTANTS & PRESETS
// =============================================================================

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const THEME = {
  bg: '#F5F3EB',
  navy: '#070B24',
  darkCard: '#11131A',
  accentBlue: '#4C8DFF',
  accentLime: '#82B428',
  muted: '#64748B',
  danger: '#DC2626'
};

const DLSAU_COLLEGES = [
  'CAST',
  'CVMAS',
  'CBMA',
  'COED',
];

// Curated vibrant abstract cover presets matching the reference aesthetic
const COVER_PRESETS = [
  { id: 'aurora', label: 'Aurora', c1: '#1E1B4B', c2: '#9333EA', c3: '#F97316', c4: '#38BDF8' },
  { id: 'solar', label: 'Solar', c1: '#F43F5E', c2: '#F97316', c3: '#FACC15', c4: '#FB7185' },
  { id: 'lasalle', label: 'Lasallian', c1: '#064E3B', c2: '#059669', c3: '#98C93C', c4: '#34D399' },
  { id: 'cobalt', label: 'Cobalt', c1: '#0F172A', c2: '#2563EB', c3: '#06B6D4', c4: '#818CF8' }
];

const DEFAULT_PROFILE = {
  nickname: 'Sir Juan',
  fullName: 'Prof. Juan Dela Cruz',
  facultyId: 'FAC-2026-001',
  academicRank: 'Assistant Professor',
  college: 'CAST',
  department: 'Computer Science',
  officeLocation: 'Osmeña Hall Faculty Room',
  consultationHours: 'TTH 10:30 AM - 12:00 PM',
  term: '1st Trimester, AY 2026-2027',
  avatarUri: null,
  coverUri: null,
  coverPreset: 'aurora',
  cardMode: 'dark' // 'dark' | 'light'
};

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

const getInitials = (name = '') =>
  name
    .replace(/^(Prof\.|Dr\.|Engr\.|Sir|Ma'am)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'DL';

async function launchImageSource(source, aspect) {
  const isCamera = source === 'CAMERA';
  const permission = isCamera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      isCamera ? 'Camera Permission Needed' : 'Gallery Permission Needed',
      isCamera
        ? 'Allow camera access to take a new photo.'
        : 'Allow photo library access to choose an image.'
    );
    return null;
  }

  const options = { allowsEditing: true, aspect, quality: 0.8 };
  const result = isCamera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync({ ...options, mediaTypes: ['images'] });

  if (!result.canceled && result.assets?.length > 0) {
    return result.assets[0].uri;
  }
  return null;
}

// =============================================================================
// 3. SUB-COMPONENTS
// =============================================================================

function ProfileAmbientAura({ presetId }) {
  const drift = useRef(new Animated.Value(0)).current;
  const preset = COVER_PRESETS.find((p) => p.id === presetId) || COVER_PRESETS[0];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(drift, {
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

  const shiftX = drift.interpolate({ inputRange: [0, 1], outputRange: [-14, 16] });
  const shiftY = drift.interpolate({ inputRange: [0, 1], outputRange: [-10, 14] });

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
            <RadialGradient id="profAuraTop" cx="22%" cy="18%" r="55%">
              <Stop offset="0%" stopColor={preset.c2} stopOpacity="0.24" />
              <Stop offset="100%" stopColor={THEME.bg} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="profAuraBot" cx="85%" cy="68%" r="55%">
              <Stop offset="0%" stopColor={preset.c3} stopOpacity="0.24" />
              <Stop offset="100%" stopColor={THEME.bg} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={SCREEN_W * 0.22} cy={SCREEN_H * 0.18} r={SCREEN_W * 0.78} fill="url(#profAuraTop)" />
          <Circle cx={SCREEN_W * 0.85} cy={SCREEN_H * 0.68} r={SCREEN_W * 0.78} fill="url(#profAuraBot)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

function CoverBannerArt({ coverUri, presetId }) {
  if (coverUri) {
    return <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />;
  }

  const preset = COVER_PRESETS.find((p) => p.id === presetId) || COVER_PRESETS[0];

  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient id="coverBase" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={preset.c1} />
          <Stop offset="52%" stopColor={preset.c2} />
          <Stop offset="100%" stopColor={preset.c3} />
        </LinearGradient>
        <RadialGradient id="coverFlareA" cx="82%" cy="22%" r="60%">
          <Stop offset="0%" stopColor={preset.c3} stopOpacity="0.92" />
          <Stop offset="100%" stopColor={preset.c2} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="coverFlareB" cx="24%" cy="85%" r="55%">
          <Stop offset="0%" stopColor={preset.c4} stopOpacity="0.65" />
          <Stop offset="100%" stopColor={preset.c1} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#coverBase)" />
      <Circle cx="82%" cy="22%" r="120" fill="url(#coverFlareA)" />
      <Circle cx="24%" cy="85%" r="110" fill="url(#coverFlareB)" />
    </Svg>
  );
}

// Small crisp vector icons for the 3-column metrics & card actions
function MetricIcon({ type }) {
  if (type === 'star') {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24">
        <Path
          d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.5z"
          fill="#FACC15"
        />
      </Svg>
    );
  }
  if (type === 'flag') {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24">
        <Path
          d="M5 3v18M5 4h11l-2 4.5L16 13H5"
          stroke="#4C8DFF"
          strokeWidth="2.2"
          fill="#4C8DFF"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="9.5" fill="#A855F7" />
      <Path
        d="M12 7v5l3.5 2"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ThemeModeIcon({ isDark }) {
  return isDark ? (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="4.5" stroke="#FFFFFF" strokeWidth="2" />
      <Path
        d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  ) : (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"
        fill="#475569"
      />
    </Svg>
  );
}

function ProfessorHeroCard({
  profile,
  stats,
  enterAnim,
  onToggleCardMode,
  onQuickEditPhoto,
  onOpenEdit
}) {
  const isDark = profile.cardMode === 'dark';
  const ctaScale = useRef(new Animated.Value(1)).current;

  const cardSurface = isDark ? THEME.darkCard : 'rgba(255, 255, 255, 0.92)';
  const primaryInk = isDark ? '#FFFFFF' : '#0B1320';
  const secondaryInk = isDark ? 'rgba(255, 255, 255, 0.56)' : '#64748B';
  const modeBtnBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.05)';
  const modeBtnBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';

  const animateCta = (toValue) =>
    Animated.spring(ctaScale, {
      toValue,
      friction: toValue < 1 ? 7 : 6,
      useNativeDriver: true
    }).start();

  return (
    <Animated.View
      style={[
        styles.heroOuterShadow,
        {
          opacity: enterAnim,
          transform: [
            {
              translateY: enterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [26, 0]
              })
            }
          ]
        }
      ]}
    >
      <View
        style={[
          styles.heroCardFrame,
          {
            backgroundColor: cardSurface,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.92)'
          }
        ]}
      >
        {/* Top Inset Cover Banner + Overlapping Avatar + Floating Department Pill */}
        <View style={styles.bannerWrap}>
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => onQuickEditPhoto('COVER')}
            style={styles.bannerClip}
          >
            <CoverBannerArt coverUri={profile.coverUri} presetId={profile.coverPreset} />

            {/* Subtle top-right edit cover cue */}
            <View style={styles.coverEditPill}>
              <Text style={styles.coverEditText}>Edit Cover</Text>
            </View>
          </TouchableOpacity>

          {/* Floating Department Badge (Matches "Things" / "Sketch" pill) */}
          <View
            style={[
              styles.deptBadgePill,
              isDark ? styles.deptBadgeDark : styles.deptBadgeLight
            ]}
          >
            <View style={styles.deptBadgeDot} />
            <Text style={[styles.deptBadgeText, { color: isDark ? '#FFFFFF' : '#0B1320' }]}>
              {profile.college || 'CAST'} • DLSAU
            </Text>
          </View>

          {/* Overlapping Circular Profile Picture */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onQuickEditPhoto('AVATAR')}
            style={[styles.avatarRing, { borderColor: cardSurface }]}
          >
            {profile.avatarUri ? (
              <Image source={{ uri: profile.avatarUri }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>
                  {getInitials(profile.fullName || profile.nickname)}
                </Text>
              </View>
            )}
            <View style={styles.avatarCamBadge}>
              <Text style={styles.avatarCamText}>+</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Card Body: Nickname, Full Name/Rank, Light/Dark Card Toggle */}
        <View style={styles.heroBody}>
          <View style={styles.identityRow}>
            <View style={styles.identityTextCol}>
              <Text style={[styles.nicknameHeading, { color: primaryInk }]} numberOfLines={1}>
                {profile.nickname || profile.fullName}
              </Text>
              <Text style={[styles.roleSubtitle, { color: secondaryInk }]} numberOfLines={1}>
                {profile.fullName} • {profile.academicRank}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.modeCircleBtn,
                { backgroundColor: modeBtnBg, borderColor: modeBtnBorder }
              ]}
              activeOpacity={0.8}
              onPress={onToggleCardMode}
              accessibilityLabel="Toggle dark or light profile card"
            >
              <ThemeModeIcon isDark={isDark} />
            </TouchableOpacity>
          </View>

          {/* 3-Column Metrics Row (Matches Rating / Hours / Month) */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <MetricIcon type="star" />
              <View style={styles.metricTextWrap}>
                <Text style={[styles.metricValue, { color: primaryInk }]}>
                  {stats.avgRate}
                </Text>
                <Text style={[styles.metricLabel, { color: secondaryInk }]}>
                  Attendance
                </Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <MetricIcon type="flag" />
              <View style={styles.metricTextWrap}>
                <Text style={[styles.metricValue, { color: primaryInk }]}>
                  {stats.classCount}
                </Text>
                <Text style={[styles.metricLabel, { color: secondaryInk }]}>
                  Classes
                </Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <MetricIcon type="clock" />
              <View style={styles.metricTextWrap}>
                <Text style={[styles.metricValue, { color: primaryInk }]}>
                  {stats.studentCount}
                </Text>
                <Text style={[styles.metricLabel, { color: secondaryInk }]}>
                  Students
                </Text>
              </View>
            </View>
          </View>

          {/* Full-Width Pill CTA (Matches "Get In Touch" button) */}
          <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPressIn={() => animateCta(0.97)}
              onPressOut={() => animateCta(1)}
              onPress={onOpenEdit}
              style={[
                styles.heroCtaBtn,
                isDark ? styles.heroCtaDark : styles.heroCtaLight
              ]}
            >
              <Text
                style={[
                  styles.heroCtaText,
                  { color: isDark ? '#FFFFFF' : '#0B1320' }
                ]}
              >
                Edit Faculty Profile
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

function FacultyDetailsSection({ profile, email, enterAnim, onOpenHealth, onLogOut }) {
  const details = [
    { label: 'Institutional Email', value: email || 'juan.delacruz@dlsau.edu.ph' },
    { label: 'Employee ID', value: profile.facultyId },
    { label: 'College & Department', value: `${profile.college} — ${profile.department}` },
    { label: 'Faculty Office', value: profile.officeLocation },
    { label: 'Consultation Hours', value: profile.consultationHours },
    { label: 'Active Term', value: profile.term }
  ];

  return (
    <Animated.View
      style={{
        opacity: enterAnim,
        transform: [
          {
            translateY: enterAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [28, 0]
            })
          }
        ]
      }}
    >
      <Text style={styles.sectionTitle}>Faculty Information</Text>

      <View style={styles.glassSectionShadow}>
        <View style={styles.glassSectionClip}>
          <BlurView intensity={62} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.glassSectionTint} />

          {details.map((row, idx) => (
            <View
              key={row.label}
              style={[
                styles.detailRow,
                idx < details.length - 1 && styles.detailRowBorder
              ]}
            >
              <Text style={styles.detailLabel}>{row.label}</Text>
              <Text style={styles.detailValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Account Actions */}
      <View style={styles.accountActionsRow}>
        <TouchableOpacity
          style={styles.glassActionBtn}
          activeOpacity={0.85}
          onPress={onOpenHealth}
        >
          <Text style={styles.glassActionBtnText}>System Health ↗</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.glassActionBtn, styles.logoutActionBtn]}
          activeOpacity={0.85}
          onPress={onLogOut}
        >
          <Text style={[styles.glassActionBtnText, { color: THEME.danger }]}>
            Log Out
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function EditProfileModal({ visible, profile, onClose, onSave }) {
  const [form, setForm] = useState(profile);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(80)).current;
  const sheetScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (!visible) return;
    setForm(profile);

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

  const handlePickMedia = async (target, source) => {
    const aspect = target === 'AVATAR' ? [1, 1] : [16, 9];
    const uri = await launchImageSource(source, aspect);
    if (!uri) return;
    updateField(target === 'AVATAR' ? 'avatarUri' : 'coverUri', uri);
  };

  const handleSave = () => {
    if (!form.nickname.trim() || !form.fullName.trim()) {
      Alert.alert('Missing Name', 'Please enter both your nickname and full name.');
      return;
    }
    onSave({
      ...form,
      nickname: form.nickname.trim(),
      fullName: form.fullName.trim(),
      facultyId: form.facultyId.trim() || 'FAC-2026-001',
      academicRank: form.academicRank.trim() || 'Faculty',
      department: form.department.trim() || 'Computer Science',
      officeLocation: form.officeLocation.trim() || 'DLSAU Campus',
      consultationHours: form.consultationHours.trim() || 'By Appointment',
      term: form.term.trim() || '1st Trimester, AY 2026-2027'
    });
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
            <BlurView intensity={82} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.glassModalTint} />

            <View style={styles.glassModalInner}>
              <View style={styles.modalHandle} />
              <ScrollView bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>Edit Faculty Profile</Text>
                  <TouchableOpacity style={styles.modalClosePill} onPress={handleClose}>
                    <Text style={styles.closeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Profile Picture Controls */}
                <Text style={styles.inputLabel}>Profile Picture</Text>
                <View style={styles.mediaActionRow}>
                  <TouchableOpacity
                    style={styles.mediaBtn}
                    onPress={() => handlePickMedia('AVATAR', 'CAMERA')}
                  >
                    <Text style={styles.mediaBtnText}>📷 Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.mediaBtn}
                    onPress={() => handlePickMedia('AVATAR', 'GALLERY')}
                  >
                    <Text style={styles.mediaBtnText}>🖼️ Upload Avatar</Text>
                  </TouchableOpacity>
                </View>

                {/* Background Cover Controls */}
                <Text style={styles.inputLabel}>Background Cover Photo or Theme</Text>
                <View style={styles.mediaActionRow}>
                  <TouchableOpacity
                    style={styles.mediaBtn}
                    onPress={() => handlePickMedia('COVER', 'GALLERY')}
                  >
                    <Text style={styles.mediaBtnText}>🖼️ Upload Cover</Text>
                  </TouchableOpacity>
                  {form.coverUri && (
                    <TouchableOpacity
                      style={[styles.mediaBtn, styles.clearCoverBtn]}
                      onPress={() => updateField('coverUri', null)}
                    >
                      <Text style={[styles.mediaBtnText, { color: THEME.danger }]}>
                        Use Gradient
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Abstract Cover Gradient Presets */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.presetScroll}
                >
                  {COVER_PRESETS.map((preset) => {
                    const active = !form.coverUri && form.coverPreset === preset.id;
                    return (
                      <TouchableOpacity
                        key={preset.id}
                        style={[
                          styles.presetChip,
                          { backgroundColor: preset.c2 },
                          active && styles.presetChipActive
                        ]}
                        onPress={() =>
                          setForm((prev) => ({
                            ...prev,
                            coverUri: null,
                            coverPreset: preset.id
                          }))
                        }
                      >
                        <Text style={styles.presetChipText}>{preset.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Identity Fields */}
                <Text style={styles.inputLabel}>Nickname (Display Name)</Text>
                <TextInput
                  style={styles.glassInput}
                  placeholder="e.g. Sir Juan / Ma'am Ana"
                  placeholderTextColor={THEME.muted}
                  value={form.nickname}
                  onChangeText={(val) => updateField('nickname', val)}
                />

                <Text style={styles.inputLabel}>Full Official Name</Text>
                <TextInput
                  style={styles.glassInput}
                  placeholder="e.g. Prof. Juan Dela Cruz"
                  placeholderTextColor={THEME.muted}
                  value={form.fullName}
                  onChangeText={(val) => updateField('fullName', val)}
                />

                <View style={styles.twoColRow}>
                  <View style={{ flex: 0.48 }}>
                    <Text style={styles.inputLabel}>Employee ID</Text>
                    <TextInput
                      style={styles.glassInput}
                      placeholder="FAC-2026-001"
                      placeholderTextColor={THEME.muted}
                      value={form.facultyId}
                      onChangeText={(val) => updateField('facultyId', val)}
                    />
                  </View>
                  <View style={{ flex: 0.48 }}>
                    <Text style={styles.inputLabel}>Academic Rank</Text>
                    <TextInput
                      style={styles.glassInput}
                      placeholder="Assistant Professor"
                      placeholderTextColor={THEME.muted}
                      value={form.academicRank}
                      onChangeText={(val) => updateField('academicRank', val)}
                    />
                  </View>
                </View>

                {/* DLSAU College Selector */}
                <Text style={styles.inputLabel}>DLSAU College</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.collegeScroll}
                >
                  {DLSAU_COLLEGES.map((col) => {
                    const active = form.college === col;
                    return (
                      <TouchableOpacity
                        key={col}
                        style={[styles.collegeChip, active && styles.collegeChipActive]}
                        onPress={() => updateField('college', col)}
                      >
                        <Text
                          style={[
                            styles.collegeChipText,
                            active && styles.collegeChipTextActive
                          ]}
                        >
                          {col}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={styles.inputLabel}>Department</Text>
                <TextInput
                  style={styles.glassInput}
                  placeholder="e.g. Computer Science"
                  placeholderTextColor={THEME.muted}
                  value={form.department}
                  onChangeText={(val) => updateField('department', val)}
                />

                <Text style={styles.inputLabel}>Faculty Office / Room</Text>
                <TextInput
                  style={styles.glassInput}
                  placeholder="e.g. Osmeña Hall Faculty Room"
                  placeholderTextColor={THEME.muted}
                  value={form.officeLocation}
                  onChangeText={(val) => updateField('officeLocation', val)}
                />

                <Text style={styles.inputLabel}>Consultation Hours</Text>
                <TextInput
                  style={styles.glassInput}
                  placeholder="e.g. TTH 10:30 AM - 12:00 PM"
                  placeholderTextColor={THEME.muted}
                  value={form.consultationHours}
                  onChangeText={(val) => updateField('consultationHours', val)}
                />

                <Text style={styles.inputLabel}>Active Academic Term</Text>
                <TextInput
                  style={styles.glassInput}
                  placeholder="e.g. 1st Trimester, AY 2026-2027"
                  placeholderTextColor={THEME.muted}
                  value={form.term}
                  onChangeText={(val) => updateField('term', val)}
                />

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Save Profile Changes</Text>
                </TouchableOpacity>
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

export default function ProfileScreen({
  email,
  profile,
  courses = [],
  onUpdateProfile,
  setCurrentScreen
}) {
  const activeProfile = { ...DEFAULT_PROFILE, ...(profile || {}) };
  const [editModalVisible, setEditModalVisible] = useState(false);

  const heroEnter = useRef(new Animated.Value(0)).current;
  const detailsEnter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.spring(heroEnter, {
        toValue: 1,
        friction: 7,
        tension: 52,
        useNativeDriver: true
      }),
      Animated.spring(detailsEnter, {
        toValue: 1,
        friction: 7,
        tension: 52,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const totalStudents = courses.reduce((sum, c) => sum + (c.enrolled_count || 0), 0);
  const stats = {
    avgRate: '96.4%',
    classCount: courses.length,
    studentCount: totalStudents
  };

  const handleToggleCardMode = () => {
    springLayout();
    const nextMode = activeProfile.cardMode === 'dark' ? 'light' : 'dark';
    onUpdateProfile && onUpdateProfile({ ...activeProfile, cardMode: nextMode });
  };

  const handleQuickEditPhoto = (target) => {
    const title = target === 'AVATAR' ? 'Update Profile Picture' : 'Update Background Cover';
    const aspect = target === 'AVATAR' ? [1, 1] : [16, 9];

    Alert.alert(title, 'Choose a photo source:', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const uri = await launchImageSource('CAMERA', aspect);
          if (uri && onUpdateProfile) {
            onUpdateProfile({
              ...activeProfile,
              [target === 'AVATAR' ? 'avatarUri' : 'coverUri']: uri
            });
          }
        }
      },
      {
        text: 'Upload from Library',
        onPress: async () => {
          const uri = await launchImageSource('GALLERY', aspect);
          if (uri && onUpdateProfile) {
            onUpdateProfile({
              ...activeProfile,
              [target === 'AVATAR' ? 'avatarUri' : 'coverUri']: uri
            });
          }
        }
      },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProfileAmbientAura presetId={activeProfile.coverPreset} />

      {/* Top Glass Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backGlassBtn}
          activeOpacity={0.8}
          onPress={() => setCurrentScreen('DASHBOARD')}
        >
          <Text style={styles.backBtnText}>← Classes</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Profile</Text>

        <TouchableOpacity
          style={styles.editTopBtn}
          activeOpacity={0.8}
          onPress={() => setEditModalVisible(true)}
        >
          <Text style={styles.editTopText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ProfessorHeroCard
          profile={activeProfile}
          stats={stats}
          enterAnim={heroEnter}
          onToggleCardMode={handleToggleCardMode}
          onQuickEditPhoto={handleQuickEditPhoto}
          onOpenEdit={() => setEditModalVisible(true)}
        />

        <FacultyDetailsSection
          profile={activeProfile}
          email={email}
          enterAnim={detailsEnter}
          onOpenHealth={() => setCurrentScreen('HEALTH')}
          onLogOut={() => setCurrentScreen('AUTH')}
        />
      </ScrollView>

      <EditProfileModal
        visible={editModalVisible}
        profile={activeProfile}
        onClose={() => setEditModalVisible(false)}
        onSave={(updated) => onUpdateProfile && onUpdateProfile(updated)}
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
  editTopBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(7, 11, 36, 0.9)'
  },
  editTopText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 42
  },

  // Reference-Inspired Professor Hero Card
  heroOuterShadow: {
    borderRadius: 34,
    marginBottom: 24,
    shadowColor: '#070B24',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10
  },
  heroCardFrame: {
    borderRadius: 34,
    padding: 14,
    borderWidth: 1.5
  },
  bannerWrap: {
    position: 'relative',
    marginBottom: 42
  },
  bannerClip: {
    height: 152,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1E1B4B'
  },
  coverEditPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(17, 19, 26, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  coverEditText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  // Floating Department Pill (Bottom-Right of Banner)
  deptBadgePill: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1
  },
  deptBadgeDark: {
    backgroundColor: 'rgba(22, 24, 34, 0.82)',
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  deptBadgeLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(255, 255, 255, 1)'
  },
  deptBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.accentLime,
    marginRight: 7
  },
  deptBadgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },

  // Overlapping Circular Avatar
  avatarRing: {
    position: 'absolute',
    left: 16,
    bottom: -34,
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    overflow: 'visible',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 36 },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarInitials: { fontSize: 24, fontWeight: '900', color: THEME.navy },
  avatarCamBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.accentBlue,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarCamText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', marginTop: -1 },

  // Hero Card Body
  heroBody: {
    paddingHorizontal: 8,
    paddingBottom: 6
  },
  identityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  identityTextCol: { flex: 1, paddingRight: 12 },
  nicknameHeading: {
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.5
  },
  roleSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3
  },
  modeCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },

  // 3-Column Metrics Row
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 22,
    paddingHorizontal: 2
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  metricTextWrap: { marginLeft: 7 },
  metricValue: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  metricLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  // Full-Width Pill CTA
  heroCtaBtn: {
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroCtaDark: {
    backgroundColor: THEME.accentBlue
  },
  heroCtaLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.4,
    borderColor: 'rgba(15, 23, 42, 0.12)'
  },
  heroCtaText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.1
  },

  // Faculty Information Glass Card
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.navy,
    marginBottom: 10,
    paddingHorizontal: 4,
    letterSpacing: -0.3
  },
  glassSectionShadow: {
    borderRadius: 24,
    shadowColor: THEME.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 16
  },
  glassSectionClip: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)'
  },
  glassSectionTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.5)'
  },
  detailRow: {
    paddingVertical: 14,
    paddingHorizontal: 18
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 23, 42, 0.07)'
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.navy
  },

  // Bottom Account Action Pills
  accountActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  glassActionBtn: {
    flex: 0.48,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1.3,
    borderColor: 'rgba(255, 255, 255, 0.92)'
  },
  logoutActionBtn: {
    backgroundColor: 'rgba(254, 242, 242, 0.82)',
    borderColor: 'rgba(252, 165, 165, 0.55)'
  },
  glassActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.navy
  },

  // Glass Edit Profile Modal
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
    borderColor: 'rgba(255, 255, 255, 0.88)'
  },
  glassModalTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.72)'
  },
  glassModalInner: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 24,
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
    alignItems: 'center',
    marginBottom: 14
  },
  modalTitle: { fontSize: 22, fontWeight: '900', color: THEME.navy },
  modalClosePill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeBtnText: { fontSize: 16, fontWeight: '800', color: THEME.muted },

  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6
  },
  glassInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    color: '#0F172A',
    padding: 13,
    borderRadius: 14,
    marginBottom: 13,
    borderWidth: 1.25,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    fontSize: 14
  },
  twoColRow: { flexDirection: 'row', justifyContent: 'space-between' },

  // Media Picker Buttons & Presets
  mediaActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  mediaBtn: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1.25,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center'
  },
  clearCoverBtn: {
    backgroundColor: 'rgba(254, 242, 242, 0.85)',
    borderColor: 'rgba(252, 165, 165, 0.6)'
  },
  mediaBtnText: { fontSize: 13, fontWeight: '700', color: THEME.navy },
  presetScroll: { paddingBottom: 14 },
  presetChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  presetChipActive: { borderColor: THEME.navy },
  presetChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  // College Chips
  collegeScroll: { paddingBottom: 14 },
  collegeChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    marginRight: 8
  },
  collegeChipActive: {
    backgroundColor: THEME.navy,
    borderColor: THEME.navy
  },
  collegeChipText: { fontSize: 13, fontWeight: '700', color: '#334155' },
  collegeChipTextActive: { color: '#FFFFFF' },

  saveBtn: {
    backgroundColor: THEME.navy,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 6
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});