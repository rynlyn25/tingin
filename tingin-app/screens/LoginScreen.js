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
  Image,
  Easing,
  LayoutAnimation,
  UIManager
} from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, {
  Path,
  Circle,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Rect
} from 'react-native-svg';
import { Accelerometer } from 'expo-sensors';
import { Asset } from 'expo-asset';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HEAD_IMG = require('../assets/meerkat-head.png');
const { width, height } = Dimensions.get('window');

// Exact warm ivory sampled from meerkat.webp so the mascot blends seamlessly
const CANVAS_BG = '#F7F1E5';

const springLayout = () => {
  LayoutAnimation.configureNext({
    duration: 300,
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

// ---- Meerkat geometry (preserved from your exact artwork measurements) ----
const HEAD_W = 200;
const K = HEAD_W / 610;
const HEAD_H = 450 * K;
const CARD_TOP = Math.round(420 * K);
const PAW_W = 44;
const PAW_H = 34;
const PAW_REST_TOP = CARD_TOP - PAW_H * 0.65;
const EYE_D = 98 * K + 1;
const EYE_L = { x: 187 * K, y: 234 * K };
const EYE_R = { x: 423.5 * K, y: 229.5 * K };
const PUPIL_D = 55 * K;
const REST_X = 48;
const EYE_OFFSET_X = HEAD_W / 2 - EYE_L.x;
const COVER_Y = PAW_REST_TOP + PAW_H / 2 - (EYE_L.y + EYE_R.y) / 2;
const COVER_X = REST_X - EYE_OFFSET_X;
const EYE_RANGE = 4.5;
const GAZE_CHARS = 26;

// Subtle ambient aura confined to the upper glass zone so it fades cleanly into CANVAS_BG
function AuthAmbientAura({ mode }) {
  const driftA = useRef(new Animated.Value(0)).current;
  const driftB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loopA = Animated.loop(
      Animated.sequence([
        Animated.timing(driftA, {
          toValue: 1,
          duration: 5800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(driftA, {
          toValue: 0,
          duration: 5800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );

    const loopB = Animated.loop(
      Animated.sequence([
        Animated.timing(driftB, {
          toValue: 1,
          duration: 7400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(driftB, {
          toValue: 0,
          duration: 7400,
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

  const shiftAY = driftA.interpolate({ inputRange: [0, 1], outputRange: [-10, 12] });
  const shiftAX = driftA.interpolate({ inputRange: [0, 1], outputRange: [-8, 12] });
  const shiftBX = driftB.interpolate({ inputRange: [0, 1], outputRange: [12, -12] });
  const shiftBY = driftB.interpolate({ inputRange: [0, 1], outputRange: [8, -10] });

  const isLanding = mode === 'LANDING';

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: CANVAS_BG }]} pointerEvents="none">
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX: shiftAX }, { translateY: shiftAY }] }
        ]}
      >
        <Svg width={width} height={height}>
          <Defs>
            <RadialGradient id="authOrbLime" cx="16%" cy={isLanding ? '16%' : '20%'} r="42%">
              <Stop offset="0%" stopColor="#98C93C" stopOpacity={isLanding ? '0.22' : '0.30'} />
              <Stop offset="100%" stopColor={CANVAS_BG} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle
            cx={width * 0.16}
            cy={height * (isLanding ? 0.16 : 0.2)}
            r={width * 0.65}
            fill="url(#authOrbLime)"
          />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX: shiftBX }, { translateY: shiftBY }] }
        ]}
      >
        <Svg width={width} height={height}>
          <Defs>
            <RadialGradient id="authOrbGold" cx="88%" cy={isLanding ? '32%' : '52%'} r="44%">
              <Stop offset="0%" stopColor="#D3C499" stopOpacity={isLanding ? '0.36' : '0.46'} />
              <Stop offset="100%" stopColor={CANVAS_BG} stopOpacity="0" />
            </RadialGradient>
            {!isLanding && (
              <RadialGradient id="authOrbLower" cx="20%" cy="78%" r="48%">
                <Stop offset="0%" stopColor="#98C93C" stopOpacity="0.22" />
                <Stop offset="100%" stopColor={CANVAS_BG} stopOpacity="0" />
              </RadialGradient>
            )}
          </Defs>
          <Circle
            cx={width * 0.88}
            cy={height * (isLanding ? 0.32 : 0.52)}
            r={width * 0.62}
            fill="url(#authOrbGold)"
          />
          {!isLanding && (
            <Circle
              cx={width * 0.2}
              cy={height * 0.78}
              r={width * 0.68}
              fill="url(#authOrbLower)"
            />
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}

// Modern frosted-glass button with smooth diagonal sheen (no harsh horizontal split line)
function SpringGlassButton({ variant = 'primary', onPress, children, style }) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const isPrimary = variant === 'primary';

  return (
    <Animated.View style={[{ transform: [{ scale: pressScale }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPressIn={() =>
          Animated.spring(pressScale, {
            toValue: 0.965,
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
        style={isPrimary ? styles.primaryGlassBtn : styles.secondaryGlassBtn}
      >
        <BlurView
          intensity={isPrimary ? 24 : 50}
          tint={isPrimary ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isPrimary
                ? 'rgba(7, 11, 36, 0.92)'
                : 'rgba(255, 255, 255, 0.64)'
            }
          ]}
        />
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
          <Defs>
            <LinearGradient
              id={isPrimary ? 'btnSheenDark' : 'btnSheenLight'}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop
                offset="0%"
                stopColor="#FFFFFF"
                stopOpacity={isPrimary ? '0.16' : '0.55'}
              />
              <Stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.02" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect
            width="100%"
            height="100%"
            fill={`url(#${isPrimary ? 'btnSheenDark' : 'btnSheenLight'})`}
          />
        </Svg>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

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
      useNativeDriver: true
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
    strokeLinejoin: 'round'
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
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [gaze, setGaze] = useState(0);
  const [headReady, setHeadReady] = useState(false);

  useEffect(() => {
    Asset.fromModule(HEAD_IMG).downloadAsync().catch(() => {});
  }, []);

  // 1. Accelerometer animations for Step 1 Landing Screen (clamped so image edge never exposes)
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;

  // 2. Interactive form meerkat
  const eyeX = useRef(new Animated.Value(0)).current;
  const eyeY = useRef(new Animated.Value(0)).current;
  const cover = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(0)).current;

  // 3. Staggered entrance animations
  const landingHeroAnim = useRef(new Animated.Value(0)).current;
  const landingDockAnim = useRef(new Animated.Value(0)).current;
  const landingMascotAnim = useRef(new Animated.Value(0)).current;

  const formHeaderAnim = useRef(new Animated.Value(0)).current;
  const formStageAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!showForm) {
      landingHeroAnim.setValue(0);
      landingDockAnim.setValue(0);
      landingMascotAnim.setValue(0);
      Animated.stagger(85, [
        Animated.spring(landingHeroAnim, {
          toValue: 1,
          friction: 7,
          tension: 52,
          useNativeDriver: true
        }),
        Animated.spring(landingDockAnim, {
          toValue: 1,
          friction: 7,
          tension: 52,
          useNativeDriver: true
        }),
        Animated.spring(landingMascotAnim, {
          toValue: 1,
          friction: 7,
          tension: 48,
          useNativeDriver: true
        })
      ]).start();
    } else {
      formHeaderAnim.setValue(0);
      formStageAnim.setValue(0);
      Animated.stagger(85, [
        Animated.spring(formHeaderAnim, {
          toValue: 1,
          friction: 7,
          tension: 55,
          useNativeDriver: true
        }),
        Animated.spring(formStageAnim, {
          toValue: 1,
          friction: 7,
          tension: 52,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [showForm]);

  useEffect(() => {
    Accelerometer.setUpdateInterval(40);
    const subscription = Accelerometer.addListener(({ x, y }) => {
      const clampedX = Math.max(-28, Math.min(28, x * 32));
      const clampedY = Math.max(-14, Math.min(16, (y + 0.5) * 18));

      Animated.spring(tiltX, {
        toValue: clampedX,
        friction: 7,
        tension: 45,
        useNativeDriver: true
      }).start();

      Animated.spring(tiltY, {
        toValue: clampedY,
        friction: 7,
        tension: 45,
        useNativeDriver: true
      }).start();
    });

    return () => {
      subscription && subscription.remove();
    };
  }, []);

  const pawsCovering = focusedField === 'PASSWORD' && !showPassword;

  useEffect(() => {
    Animated.spring(cover, {
      toValue: pawsCovering ? 1 : 0,
      friction: 6,
      tension: 70,
      useNativeDriver: true
    }).start();
  }, [pawsCovering]);

  useEffect(() => {
    let x = 0;
    let y = 0;
    if (focusedField && !pawsCovering) {
      x = (gaze * 2 - 1) * EYE_RANGE;
      y = 3.5;
    }
    Animated.parallel([
      Animated.spring(eyeX, { toValue: x, friction: 7, tension: 90, useNativeDriver: true }),
      Animated.spring(eyeY, { toValue: y, friction: 7, tension: 90, useNativeDriver: true })
    ]).start();
  }, [focusedField, pawsCovering, gaze]);

  useEffect(() => {
    if (!showForm) return;
    let alive = true;
    let timer;
    const loop = () => {
      timer = setTimeout(() => {
        if (!alive) return;
        Animated.sequence([
          Animated.timing(blink, { toValue: 1, duration: 90, useNativeDriver: true }),
          Animated.timing(blink, { toValue: 0, duration: 130, useNativeDriver: true })
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
    onSelectionChange: (e) => trackGaze(e.nativeEvent.selection.end)
  });

  // Derived animated values
  const headRotate = tiltX.interpolate({
    inputRange: [-32, 32],
    outputRange: ['-8deg', '8deg'],
    extrapolate: 'clamp'
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

  const toggleAuthMode = () => {
    springLayout();
    setIsSignUp(!isSignUp);
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
          { rotate: side === 'left' ? leftPawRot : rightPawRot }
        ]
      }}
    >
      <PawArt flip={side === 'right'} />
    </Animated.View>
  );

// STEP 1: SEAMLESS GLASSMORPHIC HOMEPAGE
  if (!showForm) {
    return (
      <View style={styles.container}>
        <AuthAmbientAura mode="LANDING" />

        {/* SafeAreaView only wraps the top content so the mascot reaches the true bottom edge */}
        <SafeAreaView style={styles.safeTopArea}>
          <View style={styles.topContent}>
            <Animated.View
              style={{
                opacity: landingHeroAnim,
                transform: [
                  {
                    translateY: landingHeroAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0]
                    })
                  }
                ]
              }}
            >
              <Text style={styles.brandTitle}>
                Let's track{'\n'}some classes!
              </Text>
              <Text style={styles.brandSubtitle}>
                Autonomous YOLO vision attendance for De La Salle Araneta University.
              </Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.landingGlassDockShadow,
                {
                  opacity: landingDockAnim,
                  transform: [
                    {
                      translateY: landingDockAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [24, 0]
                      })
                    }
                  ]
                }
              ]}
            >
              <View style={styles.landingGlassDockClip}>
                <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.glassSurfaceTint} />
                <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
                  <Defs>
                    <LinearGradient id="dockSheen" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.58" />
                      <Stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.14" />
                      <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
                    </LinearGradient>
                  </Defs>
                  <Rect width="100%" height="100%" fill="url(#dockSheen)" />
                </Svg>

                <View style={styles.landingGlassDockInner}>
                  <SpringGlassButton variant="primary" onPress={openSignUp}>
                    <Text style={styles.primaryBtnText}>Create Faculty Account</Text>
                  </SpringGlassButton>

                  <SpringGlassButton
                    variant="secondary"
                    onPress={openLogIn}
                    style={{ marginTop: 10 }}
                  >
                    <Text style={styles.secondaryBtnText}>Log In</Text>
                  </SpringGlassButton>
                </View>
              </View>
            </Animated.View>
          </View>
        </SafeAreaView>

        {/* Full-bleed Mascot Stage anchored directly to the bottom edge */}
        <Animated.View
          style={[
            styles.mascotContainer,
            {
              opacity: landingMascotAnim,
              transform: [
                {
                  translateY: landingMascotAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  })
                }
              ]
            }
          ]}
          pointerEvents="none"
        >
          <Animated.Image
            source={require('../assets/meerkat.webp')}
            style={[
              styles.mascotImage,
              {
                transform: [
                  { translateX: tiltX },
                  { translateY: tiltY },
                  { rotate: headRotate }
                ]
              }
            ]}
          />

          <View style={styles.mascotTopFeather} pointerEvents="none">
            <Svg width="100%" height="100%">
              <Defs>
                <LinearGradient id="mascotFeather" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={CANVAS_BG} stopOpacity="1" />
                  <Stop offset="35%" stopColor={CANVAS_BG} stopOpacity="0.72" />
                  <Stop offset="100%" stopColor={CANVAS_BG} stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#mascotFeather)" />
            </Svg>
          </View>
        </Animated.View>
      </View>
    );
  }

  // STEP 2: GLASSMORPHIC LOGIN & SIGN UP FORM WITH INTERACTIVE MEERKAT
  return (
    <SafeAreaView style={styles.container}>
      <AuthAmbientAura mode="FORM" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formBox}>
            <Animated.View
              style={{
                opacity: formHeaderAnim,
                transform: [
                  {
                    translateY: formHeaderAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0]
                    })
                  }
                ]
              }}
            >
              <TouchableOpacity
                style={styles.backGlassBtn}
                activeOpacity={0.8}
                onPress={() => {
                  setFocusedField(null);
                  setShowForm(false);
                }}
              >
                <BlurView intensity={48} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.backGlassTint} />
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>

              <Text style={styles.formTitle}>
                {isSignUp ? 'Create Faculty Account' : 'Welcome Back!'}
              </Text>
              <Text style={styles.formSubtitle}>
                DLSAU Faculty-Exclusive Portal (@dlsau.edu.ph)
              </Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.peekWrap,
                {
                  opacity: formStageAnim,
                  transform: [
                    {
                      translateY: formStageAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [28, 0]
                      })
                    }
                  ]
                }
              ]}
            >
              {/* LAYER 1: head, tucked behind the glass card */}
              <Animated.View
                style={[
                  styles.headLayer,
                  { transform: [{ translateX: leanShift }, { rotate: leanRotate }] }
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

              {/* LAYER 2: frosted glass credentials card */}
              <View style={styles.credentialsCardShadow}>
                <View style={styles.credentialsCardGlass}>
                  <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
                  <View style={styles.credentialsGlassTint} />
                  <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
                    <Defs>
                      <LinearGradient id="formCardSheen" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.58" />
                        <Stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.14" />
                        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
                      </LinearGradient>
                    </Defs>
                    <Rect width="100%" height="100%" fill="url(#formCardSheen)" />
                  </Svg>

                  <View style={styles.credentialsCardInner}>
                    {isSignUp && (
                      <>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                          style={[styles.input, focusedField === 'NAME' && styles.inputFocused]}
                          placeholder="Prof. Juan Dela Cruz"
                          placeholderTextColor="#64748B"
                          value={fullName}
                          {...fieldProps('NAME', fullName, setFullName)}
                        />
                        <Text style={styles.label}>DLSAU Employee ID</Text>
                        <TextInput
                          style={[styles.input, focusedField === 'ID' && styles.inputFocused]}
                          placeholder="FAC-2026-001"
                          placeholderTextColor="#64748B"
                          value={facultyId}
                          {...fieldProps('ID', facultyId, setFacultyId)}
                        />
                      </>
                    )}

                    <Text style={styles.label}>Institutional Email</Text>
                    <TextInput
                      style={[styles.input, focusedField === 'EMAIL' && styles.inputFocused]}
                      placeholder="juan.delacruz@dlsau.edu.ph"
                      placeholderTextColor="#64748B"
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
                        placeholderTextColor="#64748B"
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
                        <EyeIcon open={showPassword} color={showPassword ? '#070B24' : '#475569'} />
                      </TouchableOpacity>
                    </View>

                    <SpringGlassButton
                      variant="primary"
                      onPress={handleAuth}
                      style={{ marginTop: 4 }}
                    >
                      <Text style={styles.primaryBtnText}>
                        {isSignUp ? 'Complete Sign Up' : 'Log In to Dashboard'}
                      </Text>
                    </SpringGlassButton>
                  </View>
                </View>
              </View>

              {/* LAYER 3: paws, in front of the glass card edge */}
              {headReady && (
                <View style={styles.pawsLayer} pointerEvents="none">
                  <View style={styles.pawsRow}>
                    {renderPaw('left')}
                    {renderPaw('right')}
                  </View>
                </View>
              )}
            </Animated.View>

            <TouchableOpacity
              style={styles.switchGlassBtn}
              activeOpacity={0.8}
              onPress={toggleAuthMode}
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
    backgroundColor: CANVAS_BG
  },
  landingWrapper: {
    flex: 1,
    justifyContent: 'space-between'
  },

  // Pushed down comfortably to remove dead gap above the mascot
  safeTopArea: {
    zIndex: 10
  },
  topContent: {
    paddingHorizontal: 26,
    paddingTop: Math.max(64, height * 0.088),
    zIndex: 10
  },

  // Frosted Brand Eyebrow Pill
  brandGlassPillWrap: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 16
  },
  brandGlassPillTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.52)'
  },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#76A622',
    marginRight: 7
  },
  brandGlassPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#070B24',
    letterSpacing: 0.75
  },

  brandTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#070B24',
    lineHeight: 43,
    marginBottom: 10,
    letterSpacing: -1.1
  },
  brandSubtitle: {
    fontSize: 15,
    color: '#525866',
    lineHeight: 22,
    marginBottom: 26,
    fontWeight: '500',
    maxWidth: '92%'
  },

  // Concentric Frosted Glass Action Dock (outer: 26, pad: 10, inner buttons: 16)
  landingGlassDockShadow: {
    borderRadius: 26,
    shadowColor: '#070B24',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 5
  },
  landingGlassDockClip: {
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1.25,
    borderColor: 'rgba(255, 255, 255, 0.88)'
  },
  glassSurfaceTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.44)'
  },
  landingGlassDockInner: {
    padding: 10
  },

  // Refined Modern Glass Buttons
  primaryGlassBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  secondaryGlassBtn: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.4,
    borderColor: 'rgba(7, 11, 36, 0.14)'
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2
  },
  secondaryBtnText: {
    color: '#070B24',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2
  },

  // Seamless Clipped Mascot Stage + Top Feather Scrim
 mascotContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: width * 0.88,
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden'
  },
  mascotImage: {
    width: width * 1.4,
    height: width * 1.4,
    resizeMode: 'cover',
    marginTop: -(width * 0.18)
  },
  mascotTopFeather: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 68,
    zIndex: 5
  },

  // STEP 2: FORM & GLASS MEERKAT STYLES
  scrollContainer: {
    flexGrow: 1
  },
  formBox: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 36
  },
  backGlassBtn: {
    alignSelf: 'flex-start',
    marginBottom: 14,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.85)'
  },
  backGlassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.52)'
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#070B24'
  },
  formTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#070B24',
    marginBottom: 4,
    letterSpacing: -0.7
  },
  formSubtitle: {
    fontSize: 13,
    color: '#525866',
    marginBottom: 10,
    fontWeight: '600'
  },

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

  credentialsCardShadow: {
    marginTop: CARD_TOP,
    borderRadius: 26,
    shadowColor: '#070B24',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    zIndex: 2
  },
  credentialsCardGlass: {
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.88)'
  },
  credentialsGlassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.58)'
  },
  credentialsCardInner: {
    padding: 20,
    paddingTop: 26
  },
  label: {
    color: '#1E293B',
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '700'
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.66)',
    color: '#0F172A',
    padding: 15,
    borderRadius: 14,
    marginBottom: 15,
    borderWidth: 1.25,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    fontSize: 15
  },
  inputFocused: {
    borderColor: '#76A622',
    backgroundColor: 'rgba(255, 255, 255, 0.92)'
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.66)',
    borderRadius: 14,
    marginBottom: 18,
    borderWidth: 1.25,
    borderColor: 'rgba(255, 255, 255, 0.92)',
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
  switchGlassBtn: {
    marginTop: 18,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.56)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.88)'
  },
  switchBtnText: {
    color: '#5C8A12',
    fontSize: 14,
    fontWeight: '800'
  }
});