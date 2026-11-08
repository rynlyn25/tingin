import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Animated,
  Image
} from 'react-native';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import { Accelerometer } from 'expo-sensors';
import { Asset } from 'expo-asset';

const HEAD_IMG = require('../assets/meerkat-head.png');

const { width } = Dimensions.get('window');

// ---- Meerkat geometry ----
// The head is cut out of the SAME artwork as the landing page (assets/meerkat-head.png,
// 610 x 450). Pupils are animated on top of it, so the face is identical.
const HEAD_W = 200;
const K = HEAD_W / 610;                      // image px -> screen px
const HEAD_H = 450 * K;
const CARD_TOP = Math.round(420 * K);        // card's top edge (the neck hides behind it)
const PAW_W = 44;
const PAW_H = 34;
const PAW_REST_TOP = CARD_TOP - PAW_H * 0.65; // paws sit mostly ON the card's edge, not inside it
const EYE_D = 98 * K + 1;                    // outer eye diameter (covers the painted eye)
const EYE_L = { x: 187 * K, y: 234 * K };    // eye centres, measured from the artwork
const EYE_R = { x: 423.5 * K, y: 229.5 * K };
const PUPIL_D = 55 * K;
const REST_X = 48;                           // paw distance from centre when resting
const EYE_OFFSET_X = HEAD_W / 2 - EYE_L.x;   // eye distance from centre
const COVER_Y = PAW_REST_TOP + PAW_H / 2 - (EYE_L.y + EYE_R.y) / 2; // paws travel up to the eyes
const COVER_X = REST_X - EYE_OFFSET_X;       // paws slide inward over the eyes
const EYE_RANGE = 4.5;                       // max pupil travel
const GAZE_CHARS = 26;                       // characters it takes to sweep left -> right

// Paw drawn in the same tan / brown-fur palette as the artwork
function PawArt({ flip }) {
  return (
    <Svg
      width={PAW_W}
      height={PAW_H}
      viewBox="0 0 52 40"
      style={flip ? { transform: [{ scaleX: -1 }] } : undefined}
    >
      <Path
        d="M5 36 C2 24 6 8 20 5 C32 3 46 9 47 24 C48 33 44 37 40 37 Z"
        fill="#AD8E6F"
        stroke="#3A2312"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <Path d="M12 10 C16 6 24 5 30 6" stroke="#DCBD91" strokeWidth="3" strokeLinecap="round" fill="none" />
      <Path
        d="M17 27 L17 34 M25 25 L25 34 M33 27 L33 34"
        stroke="#6B4A2E"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Simple line-drawing eye. `open` = password is visible.
function EyeIcon({ open, color = '#64748B', size = 24 }) {
  const anim = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [open]);

  const closedOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const openScaleY = anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1] });
  const closedScaleY = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.15] });

  const svgProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: anim, transform: [{ scaleY: openScaleY }] }]}
      >
        <Svg {...svgProps}>
          <Path d="M2 12C4.5 7.5 8 5.5 12 5.5S19.5 7.5 22 12C19.5 16.5 16 18.5 12 18.5S4.5 16.5 2 12Z" />
          <Circle cx="12" cy="12" r="3" />
        </Svg>
      </Animated.View>
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: closedOpacity, transform: [{ scaleY: closedScaleY }] }]}
      >
        <Svg {...svgProps}>
          <Path d="M2 9.5C4.5 14 8 16 12 16S19.5 14 22 9.5" />
          <Path d="M5.5 13.2L4 15.8M12 16V19M18.5 13.2L20 15.8" />
        </Svg>
      </Animated.View>
    </View>
  );
}

export default function LoginScreen({
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  facultyId,
  setFacultyId,
  isSignUp,
  setIsSignUp,
  handleAuth
}) {
  const [showForm, setShowForm] = useState(false);
  const [focusedField, setFocusedField] = useState(null); // 'NAME' | 'ID' | 'EMAIL' | 'PASSWORD' | null
  const [showPassword, setShowPassword] = useState(false);
  const [gaze, setGaze] = useState(0); // 0 (start of text) -> 1 (far end of text)
  const [headReady, setHeadReady] = useState(false); // eyes/paws only show once the face has loaded

  // Preload the face so it's already decoded when the form opens
  useEffect(() => {
    Asset.fromModule(HEAD_IMG).downloadAsync().catch(() => {});
  }, []);

  // 1. Accelerometer animations for Step 1 Landing Screen
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;

  // 2. Interactive form meerkat
  const eyeX = useRef(new Animated.Value(0)).current;
  const eyeY = useRef(new Animated.Value(0)).current;
  const cover = useRef(new Animated.Value(0)).current; // 0 = paws resting, 1 = paws over eyes
  const blink = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Accelerometer.setUpdateInterval(40);
    const subscription = Accelerometer.addListener(({ x, y }) => {
      Animated.spring(tiltX, {
        toValue: x * 35,
        friction: 7,
        tension: 45,
        useNativeDriver: true,
      }).start();

      Animated.spring(tiltY, {
        toValue: (y + 0.5) * 20,
        friction: 7,
        tension: 45,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      subscription && subscription.remove();
    };
  }, []);

  const pawsCovering = focusedField === 'PASSWORD' && !showPassword;

  // Paws: cover the eyes while a hidden password is being typed
  useEffect(() => {
    Animated.spring(cover, {
      toValue: pawsCovering ? 1 : 0,
      friction: 6,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [pawsCovering]);

  // Eyes: follow the text as it's typed (email, name, id, or a visible password)
  useEffect(() => {
    let x = 0;
    let y = 0;
    if (focusedField && !pawsCovering) {
      x = (gaze * 2 - 1) * EYE_RANGE;
      y = 3.5;
    }
    Animated.parallel([
      Animated.spring(eyeX, { toValue: x, friction: 7, tension: 90, useNativeDriver: true }),
      Animated.spring(eyeY, { toValue: y, friction: 7, tension: 90, useNativeDriver: true }),
    ]).start();
  }, [focusedField, pawsCovering, gaze]);

  // Idle blinking
  useEffect(() => {
    if (!showForm) return;
    let alive = true;
    let timer;
    const loop = () => {
      timer = setTimeout(() => {
        if (!alive) return;
        Animated.sequence([
          Animated.timing(blink, { toValue: 1, duration: 90, useNativeDriver: true }),
          Animated.timing(blink, { toValue: 0, duration: 130, useNativeDriver: true }),
        ]).start(() => alive && loop());
      }, 2200 + Math.random() * 2800);
    };
    loop();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [showForm]);

  const trackGaze = (pos) => setGaze(Math.min(Math.max(pos / GAZE_CHARS, 0), 1));

  const fieldProps = (name, value, setter) => ({
    onFocus: () => {
      setFocusedField(name);
      trackGaze((value || '').length);
    },
    onBlur: () => setFocusedField((prev) => (prev === name ? null : prev)),
    onChangeText: (t) => {
      setter(t);
      trackGaze(t.length);
    },
    onSelectionChange: (e) => trackGaze(e.nativeEvent.selection.end),
  });

  // Derived animated values
  const headRotate = tiltX.interpolate({
    inputRange: [-45, 45],
    outputRange: ['-10deg', '10deg'],
    extrapolate: 'clamp',
  });
  const leanShift = eyeX.interpolate({ inputRange: [-EYE_RANGE, EYE_RANGE], outputRange: [-4, 4], extrapolate: 'clamp' });
  const leanRotate = eyeX.interpolate({ inputRange: [-EYE_RANGE, EYE_RANGE], outputRange: ['-3deg', '3deg'], extrapolate: 'clamp' });
  const lidY = blink.interpolate({ inputRange: [0, 1], outputRange: [-EYE_D, 0] });
  const pawY = cover.interpolate({ inputRange: [0, 1], outputRange: [0, -COVER_Y] });
  const leftPawX = cover.interpolate({ inputRange: [0, 1], outputRange: [0, COVER_X] });
  const rightPawX = cover.interpolate({ inputRange: [0, 1], outputRange: [0, -COVER_X] });
  const leftPawRot = cover.interpolate({ inputRange: [0, 1], outputRange: ['8deg', '0deg'] });
  const rightPawRot = cover.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '0deg'] });

  const openSignUp = () => {
    setIsSignUp(true);
    setShowForm(true);
  };

  const openLogIn = () => {
    setIsSignUp(false);
    setShowForm(true);
  };

  const renderEye = () => (
    <View style={styles.eyeball}>
      <Animated.View
        style={[styles.pupil, { transform: [{ translateX: eyeX }, { translateY: eyeY }] }]}
      >
        <View style={styles.eyeGlint} />
      </Animated.View>
      <Animated.View style={[styles.eyelid, { transform: [{ translateY: lidY }] }]}>
        <View style={styles.closedEyeLine} />
      </Animated.View>
    </View>
  );

  const renderPaw = (side) => (
    <Animated.View
      style={{
        width: PAW_W,
        height: PAW_H,
        transform: [
          { translateY: pawY },
          { translateX: side === 'left' ? leftPawX : rightPawX },
          { rotate: side === 'left' ? leftPawRot : rightPawRot },
        ],
      }}
    >
      <PawArt flip={side === 'right'} />
    </Animated.View>
  );

  // STEP 1: WELCOME LANDING VIEW
  if (!showForm) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.landingWrapper}>
          <View style={styles.topContent}>
            <Text style={styles.brandTitle}>
              Let's track{'\n'}some classes!
            </Text>
            <Text style={styles.brandSubtitle}>
              Autonomous Vision-Based Attendance.{'\n'}
              Welcome to Tingin.
            </Text>

            <TouchableOpacity style={styles.primaryBtn} onPress={openSignUp}>
              <Text style={styles.primaryBtnText}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={openLogIn}>
              <Text style={styles.secondaryBtnText}>Log In</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mascotContainer} pointerEvents="none">
            <Animated.Image
              source={require('../assets/meerkat.webp')}
              style={[
                styles.mascotImage,
                {
                  transform: [
                    { translateX: tiltX },
                    { translateY: tiltY },
                    { rotate: headRotate },
                  ],
                },
              ]}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // STEP 2: INTERACTIVE MEERKAT PEEKING OVER THE FORM CARD
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false} keyboardShouldPersistTaps="handled">
          <View style={styles.formBox}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                setFocusedField(null);
                setShowForm(false);
              }}
            >
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.formTitle}>
              {isSignUp ? 'Create Faculty Account' : 'Welcome Back!'}
            </Text>
            <Text style={styles.formSubtitle}>
              DLSAU Faculty-Exclusive Portal (@dlsau.edu.ph)
            </Text>

            <View style={styles.peekWrap}>
              {/* LAYER 1: head, tucked behind the card */}
              <Animated.View
                style={[
                  styles.headLayer,
                  { transform: [{ translateX: leanShift }, { rotate: leanRotate }] },
                ]}
                pointerEvents="none"
              >
                <View style={styles.headBox}>
                  <Image
                    source={HEAD_IMG}
                    style={{ width: HEAD_W, height: HEAD_H }}
                    fadeDuration={0}
                    onLoad={() => setHeadReady(true)}
                    onError={(e) =>
                      console.warn('meerkat-head.png failed to load. Is it in /assets? ', e.nativeEvent)
                    }
                  />
                  {headReady && (
                    <>
                      <View style={[styles.eyeSocket, { left: EYE_L.x - EYE_D / 2, top: EYE_L.y - EYE_D / 2 }]}>
                        {renderEye()}
                      </View>
                      <View style={[styles.eyeSocket, { left: EYE_R.x - EYE_D / 2, top: EYE_R.y - EYE_D / 2 }]}>
                        {renderEye()}
                      </View>
                    </>
                  )}
                </View>
              </Animated.View>

              {/* LAYER 2: the credentials card */}
              <View style={styles.credentialsCard}>
                {isSignUp && (
                  <>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                      style={[styles.input, focusedField === 'NAME' && styles.inputFocused]}
                      placeholder="Prof. Juan Dela Cruz"
                      placeholderTextColor="#94A3B8"
                      value={fullName}
                      {...fieldProps('NAME', fullName, setFullName)}
                    />
                    <Text style={styles.label}>DLSAU Employee ID</Text>
                    <TextInput
                      style={[styles.input, focusedField === 'ID' && styles.inputFocused]}
                      placeholder="FAC-2026-001"
                      placeholderTextColor="#94A3B8"
                      value={facultyId}
                      {...fieldProps('ID', facultyId, setFacultyId)}
                    />
                  </>
                )}

                <Text style={styles.label}>Institutional Email</Text>
                <TextInput
                  style={[styles.input, focusedField === 'EMAIL' && styles.inputFocused]}
                  placeholder="juan.delacruz@dlsau.edu.ph"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  {...fieldProps('EMAIL', email, setEmail)}
                />

                <Text style={styles.label}>Password</Text>
                <View
                  style={[
                    styles.passwordContainer,
                    focusedField === 'PASSWORD' && styles.inputFocused
                  ]}
                >
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    value={password}
                    {...fieldProps('PASSWORD', password, setPassword)}
                  />
                  <TouchableOpacity
                    style={styles.eyeToggleBtn}
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showPassword} color={showPassword ? '#070B24' : '#64748B'} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={handleAuth}>
                  <Text style={styles.primaryBtnText}>
                    {isSignUp ? 'Complete Sign Up' : 'Log In to Dashboard'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* LAYER 3: paws, in front of the card edge */}
              {headReady && (
                <View style={styles.pawsLayer} pointerEvents="none">
                  <View style={styles.pawsRow}>
                    {renderPaw('left')}
                    {renderPaw('right')}
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text style={styles.switchBtnText}>
                {isSignUp
                  ? 'Already have an account? Log In'
                  : 'Need a faculty account? Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3EB'
  },
  landingWrapper: {
    flex: 1,
    justifyContent: 'space-between'
  },
  topContent: {
    paddingHorizontal: 32,
    paddingTop: 48,
    zIndex: 10
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#070B24',
    lineHeight: 48,
    marginBottom: 14,
    letterSpacing: -0.5
  },
  brandSubtitle: {
    fontSize: 17,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 36,
    fontWeight: '400'
  },
  primaryBtn: {
    backgroundColor: '#070B24',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 6
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#98C93C',
    marginTop: 14
  },
  secondaryBtnText: {
    color: '#82B428',
    fontSize: 17,
    fontWeight: '700'
  },
  mascotContainer: {
    height: width * 0.82,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'visible'
  },
  mascotImage: {
    width: width * 1.4,
    height: width * 1.4,
    resizeMode: 'cover',
    marginTop: -(width * 0.20)
  },

  // STEP 2: FORM & INTERACTIVE MEERKAT STYLES
  scrollContainer: {
    flexGrow: 1
  },
  formBox: {
    paddingHorizontal: 26,
    paddingTop: 16,
    paddingBottom: 36
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingVertical: 4,
    paddingRight: 12
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#070B24'
  },
  formTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#070B24',
    marginBottom: 4
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 10,
    fontWeight: '500'
  },

  // Meerkat peeking over the card (3 stacked layers: head < card < paws)
  peekWrap: {
    position: 'relative'
  },
  headLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
    elevation: 1
  },
  headBox: {
    width: HEAD_W,
    height: HEAD_H
  },
  eyeSocket: {
    position: 'absolute',
    width: EYE_D,
    height: EYE_D
  },
  eyeball: {
    width: EYE_D,
    height: EYE_D,
    borderRadius: EYE_D / 2,
    backgroundColor: '#FFFFFB',
    borderWidth: 2,
    borderColor: '#2B190F',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  pupil: {
    width: PUPIL_D,
    height: PUPIL_D,
    borderRadius: PUPIL_D / 2,
    backgroundColor: '#412517'
  },
  eyeGlint: {
    position: 'absolute',
    width: 13.5 * K,
    height: 13.5 * K,
    borderRadius: 7 * K,
    left: PUPIL_D / 2 + 9.5 * K - 6.75 * K,
    top: PUPIL_D / 2 - 10.5 * K - 6.75 * K,
    backgroundColor: '#FFFFFF'
  },
  eyelid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#7A6551',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10
  },
  closedEyeLine: {
    width: 18,
    height: 2,
    backgroundColor: '#2B190F',
    borderRadius: 2
  },

  pawsLayer: {
    position: 'absolute',
    top: PAW_REST_TOP,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 3,
    elevation: 8
  },
  pawsRow: {
    width: REST_X * 2 + PAW_W,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  // White Box Card Holding Email & Password
  credentialsCard: {
    marginTop: CARD_TOP,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    paddingTop: 28,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#070B24',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
    zIndex: 2
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
    padding: 15,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    fontSize: 15
  },
  inputFocused: {
    borderColor: '#82B428',
    backgroundColor: '#FFFFFF'
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingRight: 12
  },
  passwordInput: {
    flex: 1,
    color: '#0F172A',
    padding: 15,
    fontSize: 15
  },
  eyeToggleBtn: {
    padding: 2
  },
  switchBtn: {
    marginTop: 18,
    alignItems: 'center'
  },
  switchBtnText: {
    color: '#65A30D',
    fontSize: 15,
    fontWeight: '700'
  }
});