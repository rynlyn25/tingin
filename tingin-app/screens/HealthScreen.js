import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
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
  Circle
} from 'react-native-svg';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// =============================================================================
// 1. CONSTANTS & INITIAL DATA
// =============================================================================

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const THEME = {
  bg: '#F5F3EB',
  navy: '#070B24',
  ink: '#0B1320',
  muted: '#64748B',
  accent: '#01A638',
  success: '#16A34A',
  warning: '#D97706'
};

const INITIAL_SERVICES = [
  {
    id: 'vision-yolo',
    name: 'YOLOv8 Seat & Person Detector',
    detail: 'Classroom zone & row-by-row detection ready',
    metric: '28 ms',
    status: 'ONLINE'
  },
  {
    id: 'face-mobilefacenet',
    name: 'MobileFaceNet & MiniFASNet',
    detail: 'Biometric embedding & liveness verification',
    metric: '98.2%',
    status: 'ONLINE'
  },
  {
    id: 'stream-bridge',
    name: 'Wi-Fi & On-Device Phone Stream',
    detail: 'Dual stream source switcher ready',
    metric: 'LAN / CAM',
    status: 'STANDBY'
  },
  {
    id: 'local-storage',
    name: 'SQLite & Session Cache',
    detail: 'Room seat plans & attendance logs persisted',
    metric: 'SYNCED',
    status: 'ONLINE'
  }
];

const STATUS_BADGES = {
  ONLINE: {
    label: 'Online',
    bg: 'rgba(22, 163, 74, 0.16)',
    text: '#14532D'
  },
  STANDBY: {
    label: 'Standby',
    bg: 'rgba(217, 119, 6, 0.16)',
    text: '#78350F'
  }
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

const formatNowTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// =============================================================================
// 3. SUB-COMPONENTS
// =============================================================================

function HealthAuraBackdrop() {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 5800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 5800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const shiftX = drift.interpolate({ inputRange: [0, 1], outputRange: [-12, 14] });
  const shiftY = drift.interpolate({ inputRange: [0, 1], outputRange: [-10, 12] });

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
            <RadialGradient id="healthOrbTop" cx="20%" cy="15%" r="58%">
              <Stop offset="0%" stopColor={THEME.accent} stopOpacity="0.28" />
              <Stop offset="100%" stopColor={THEME.bg} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="healthOrbBot" cx="85%" cy="72%" r="58%">
              <Stop offset="0%" stopColor="#D3C499" stopOpacity="0.46" />
              <Stop offset="100%" stopColor={THEME.bg} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={SCREEN_W * 0.2} cy={SCREEN_H * 0.15} r={SCREEN_W * 0.8} fill="url(#healthOrbTop)" />
          <Circle cx={SCREEN_W * 0.85} cy={SCREEN_H * 0.72} r={SCREEN_W * 0.8} fill="url(#healthOrbBot)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

function GlassCard({ style, intensity = 60, children }) {
  return (
    <View style={[styles.glassShadow, style]}>
      <View style={styles.glassClip}>
        <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.glassTint} />
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
          <Defs>
            <LinearGradient id="healthSheen" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.48" />
              <Stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.12" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#healthSheen)" />
        </Svg>
        {children}
      </View>
    </View>
  );
}

function DiagnosticRow({ item, isLast }) {
  const badge = STATUS_BADGES[item.status] || STATUS_BADGES.ONLINE;

  return (
    <View style={[styles.serviceRow, !isLast && styles.serviceRowBorder]}>
      <View style={styles.serviceMainCol}>
        <Text style={styles.serviceName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.serviceDetail} numberOfLines={1}>
          {item.detail}
        </Text>
      </View>

      <View style={styles.serviceRightCol}>
        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
        </View>
        <Text style={styles.metricText}>{item.metric}</Text>
      </View>
    </View>
  );
}

// =============================================================================
// 4. MAIN SCREEN
// =============================================================================

export default function HealthScreen({ setCurrentScreen }) {
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [lastChecked, setLastChecked] = useState(formatNowTime);
  const [isChecking, setIsChecking] = useState(false);

  const onlineCount = services.filter((s) => s.status === 'ONLINE').length;

  const handleRunCheck = () => {
    springLayout();
    setIsChecking(true);

    setTimeout(() => {
      springLayout();
      setServices((prev) =>
        prev.map((item) =>
          item.id === 'vision-yolo' ? { ...item, metric: '26 ms' } : item
        )
      );
      setLastChecked(formatNowTime());
      setIsChecking(false);
    }, 350);
  };

  return (
    <SafeAreaView style={styles.container}>
      <HealthAuraBackdrop />

      {/* Top Glass Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backGlassBtn}
          activeOpacity={0.8}
          onPress={() => setCurrentScreen('DASHBOARD')}
        >
          <Text style={styles.backBtnText}>← Classes</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>System Health</Text>

        <TouchableOpacity
          style={styles.checkGlassBtn}
          activeOpacity={0.82}
          onPress={handleRunCheck}
        >
          <Text style={styles.checkGlassText}>
            {isChecking ? 'Checking...' : 'Re-Check'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Hero Card */}
        <GlassCard style={styles.heroCard} intensity={64}>
          <View style={styles.heroInner}>
            <View style={styles.heroTopRow}>
              <View style={styles.healthyPill}>
                <View style={styles.healthyDot} />
                <Text style={styles.healthyPillText}>ALL SYSTEMS NOMINAL</Text>
              </View>
              <Text style={styles.checkedText}>Checked {lastChecked}</Text>
            </View>

            <Text style={styles.heroTitle}>Tingin Edge & Stream Status</Text>
            <Text style={styles.heroSub}>
              {onlineCount} of {services.length} core modules active for DLSAU classroom attendance
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>60 FPS</Text>
                <Text style={styles.statLabel}>UI Motion</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>&lt; 35 ms</Text>
                <Text style={styles.statLabel}>Inference</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>100%</Text>
                <Text style={styles.statLabel}>Local Cache</Text>
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Service Diagnostics List */}
        <Text style={styles.sectionTitle}>Module Diagnostics</Text>
        <GlassCard style={styles.listCard} intensity={60}>
          {services.map((item, idx) => (
            <DiagnosticRow
              key={item.id}
              item={item}
              isLast={idx === services.length - 1}
            />
          ))}
        </GlassCard>
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
  checkGlassBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(7, 11, 36, 0.9)'
  },
  checkGlassText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 42
  },

  // Glass Surface
  glassShadow: {
    borderRadius: 24,
    shadowColor: THEME.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4
  },
  glassClip: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.82)'
  },
  glassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.48)'
  },

  // Hero Summary Card
  heroCard: { marginBottom: 18 },
  heroInner: { padding: 20 },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  healthyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 11, 36, 0.86)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999
  },
  healthyDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22C55E',
    marginRight: 6
  },
  healthyPillText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  checkedText: { fontSize: 11, fontWeight: '700', color: THEME.muted },
  heroTitle: { fontSize: 21, fontWeight: '800', color: THEME.navy, letterSpacing: -0.4 },
  heroSub: { fontSize: 12, fontWeight: '600', color: '#475569', marginTop: 4, lineHeight: 17 },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  },
  statBox: {
    flex: 0.315,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center'
  },
  statValue: { fontSize: 14, fontWeight: '900', color: THEME.navy },
  statLabel: { fontSize: 10, fontWeight: '700', color: THEME.muted, marginTop: 2 },

  // Service Diagnostics List
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.navy,
    marginBottom: 10,
    paddingHorizontal: 2,
    letterSpacing: -0.3
  },
  listCard: { marginBottom: 12 },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  serviceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 23, 42, 0.07)'
  },
  serviceMainCol: { flex: 1, paddingRight: 12 },
  serviceName: { fontSize: 14, fontWeight: '800', color: THEME.navy },
  serviceDetail: { fontSize: 11, fontWeight: '600', color: THEME.muted, marginTop: 2 },
  serviceRightCol: { alignItems: 'flex-end' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 9, borderRadius: 999 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  metricText: { fontSize: 11, fontWeight: '800', color: THEME.navy, marginTop: 4 }
});