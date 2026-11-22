import React, { useState, useRef, useLayoutEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Animated,
  PanResponder
} from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

let Haptics = null;
try {
  Haptics = require('expo-haptics');
} catch (_) {
  // Optional haptic feedback when expo-haptics is installed
}

// =============================================================================
// 1. CONSTANTS & UTILITIES
// =============================================================================

const CHIP_GAP = 8;
const LONG_PRESS_MS = 220;
const DOUBLE_TAP_MS = 280;
const DEFAULT_ACCENT = '#01A638';

const THEME = {
  navy: '#070B24',
  white: '#FFFFFF'
};

const hexToRgba = (hex, alpha) => {
  const clean = (hex || DEFAULT_ACCENT).replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16) || 0);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const triggerHaptic = (type) => {
  try {
    if (!Haptics) return;
    if (type === 'pickup' && Haptics.impactAsync) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (type === 'shift' && Haptics.selectionAsync) {
      Haptics.selectionAsync();
    } else if (type === 'drop' && Haptics.impactAsync) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (_) {
    // Ignore haptic errors on unsupported devices
  }
};

function moveSectionByIndices(list, fromIdx, toIdx) {
  if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || toIdx >= list.length) {
    return list;
  }
  const next = [...list];
  const [picked] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, picked);
  return next;
}

function computeLandingDeltaX(list, layouts, fromIdx, toIdx) {
  if (fromIdx === toIdx) return 0;
  let delta = 0;

  if (fromIdx < toIdx) {
    for (let i = fromIdx + 1; i <= toIdx; i++) {
      const box = layouts[list[i]?.section_id];
      if (box) delta += box.width + CHIP_GAP;
    }
  } else {
    for (let i = toIdx; i < fromIdx; i++) {
      const box = layouts[list[i]?.section_id];
      if (box) delta -= box.width + CHIP_GAP;
    }
  }

  return delta;
}

// =============================================================================
// 2. LIQUID GLASS DRAGGABLE CHIP
// =============================================================================

function LiquidSectionChip({
  sec,
  index,
  isActive,
  isDragging,
  isAnotherDragging,
  accentColor,
  dragX,
  dragLift,
  shiftAnim,
  onLayoutChip,
  onTapChip,
  onStartDrag,
  onMoveDrag,
  onEndDrag
}) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const longPressTimerRef = useRef(null);
  const isDragActiveRef = useRef(false);

  // Keep latest props accessible inside PanResponder without stale closures
  const latestRef = useRef({});
  latestRef.current = {
    sec,
    index,
    onTapChip,
    onStartDrag,
    onMoveDrag,
    onEndDrag
  };

  const clearTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const animatePress = (toValue) => {
    Animated.spring(pressScale, {
      toValue,
      friction: 7,
      tension: 140,
      useNativeDriver: true
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => isDragActiveRef.current,
      onPanResponderTerminationRequest: () => !isDragActiveRef.current,

      onPanResponderGrant: () => {
        isDragActiveRef.current = false;
        animatePress(0.95);
        clearTimer();

        longPressTimerRef.current = setTimeout(() => {
          isDragActiveRef.current = true;
          animatePress(1);
          triggerHaptic('pickup');
          const { sec: currentSec, index: currentIdx, onStartDrag: start } = latestRef.current;
          start && start(currentSec, currentIdx);
        }, LONG_PRESS_MS);
      },

      onPanResponderMove: (_, g) => {
        if (!isDragActiveRef.current) {
          if (Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6) {
            clearTimer();
            animatePress(1);
          }
          return;
        }
        latestRef.current.onMoveDrag && latestRef.current.onMoveDrag(g.dx);
      },

      onPanResponderRelease: (_, g) => {
        clearTimer();
        animatePress(1);

        if (isDragActiveRef.current) {
          isDragActiveRef.current = false;
          latestRef.current.onEndDrag && latestRef.current.onEndDrag();
          return;
        }

        if (Math.abs(g.dx) < 8 && Math.abs(g.dy) < 8) {
          latestRef.current.onTapChip && latestRef.current.onTapChip(latestRef.current.sec);
        }
      },

      onPanResponderTerminate: () => {
        clearTimer();
        animatePress(1);

        if (isDragActiveRef.current) {
          isDragActiveRef.current = false;
          latestRef.current.onEndDrag && latestRef.current.onEndDrag();
        }
      }
    })
  ).current;

  const liftScale = dragLift.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.09]
  });
  const liftY = dragLift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4]
  });

  const animatedTransform = isDragging
    ? [
        { translateX: dragX },
        { translateY: liftY },
        { scale: liftScale }
      ]
    : [
        { translateX: shiftAnim },
        { scale: isAnotherDragging ? 0.96 : pressScale }
      ];

  const surfaceTint = isDragging
    ? 'rgba(255, 255, 255, 0.72)'
    : isActive
      ? 'rgba(7, 11, 36, 0.88)'
      : 'rgba(255, 255, 255, 0.56)';

  const textColor = isDragging
    ? THEME.navy
    : isActive
      ? THEME.white
      : THEME.navy;

  return (
    <Animated.View
      onLayout={(e) => onLayoutChip(sec.section_id, e.nativeEvent.layout)}
      {...panResponder.panHandlers}
      style={[
        styles.chipOuter,
        isDragging && [styles.chipFloatingShadow, { shadowColor: accentColor }],
        {
          opacity: isAnotherDragging ? 0.86 : 1,
          zIndex: isDragging ? 40 : 1,
          transform: animatedTransform
        }
      ]}
    >
      <View
        style={[
          styles.chipGlassClip,
          isActive && !isDragging && styles.chipClipActive,
          isDragging && styles.chipClipDragging
        ]}
      >
        <BlurView
          intensity={isDragging ? 78 : isActive ? 38 : 52}
          tint="light"
          style={StyleSheet.absoluteFill}
        />

        <View style={[StyleSheet.absoluteFill, { backgroundColor: surfaceTint }]} />

        {isDragging && (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: hexToRgba(accentColor, 0.16) }
            ]}
          />
        )}

        {/* Liquid specular reflection sheen */}
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
          <Defs>
            <LinearGradient id={`glassSheen-${sec.section_id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop
                offset="0%"
                stopColor="#FFFFFF"
                stopOpacity={isDragging ? '0.78' : isActive ? '0.24' : '0.52'}
              />
              <Stop
                offset="48%"
                stopColor="#FFFFFF"
                stopOpacity={isDragging ? '0.18' : '0.06'}
              />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#glassSheen-${sec.section_id})`} />
        </Svg>

        <View style={styles.chipContent}>
          {isDragging && (
            <View style={[styles.dragDot, { backgroundColor: accentColor }]} />
          )}
          <Text style={[styles.chipText, { color: textColor }]} numberOfLines={1}>
            {sec.section_name}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// =============================================================================
// 3. MAIN EXPORT: LIQUID SECTION BAR
// =============================================================================

export default function LiquidSectionBar({
  sections = [],
  activeSectionId,
  accentColor = DEFAULT_ACCENT,
  onSelectSection,
  onDoubleTapSection,
  onReorderSections
}) {
  const [draggingId, setDraggingId] = useState(null);

  const dragX = useRef(new Animated.Value(0)).current;
  const dragLift = useRef(new Animated.Value(0)).current;
  const shiftAnimsRef = useRef({});
  const layoutsRef = useRef({});
  const dragSessionRef = useRef({ fromIdx: -1, hoverIdx: -1 });
  const lastTapRef = useRef({ id: null, time: 0 });
  const pendingResetRef = useRef(false);

  const getShiftAnim = (id) => {
    if (!shiftAnimsRef.current[id]) {
      shiftAnimsRef.current[id] = new Animated.Value(0);
    }
    return shiftAnimsRef.current[id];
  };

  const resetAllMotion = () => {
    dragX.setValue(0);
    dragLift.setValue(0);
    Object.values(shiftAnimsRef.current).forEach((anim) => anim.setValue(0));
    dragSessionRef.current = { fromIdx: -1, hoverIdx: -1 };
  };

  // Clear transforms in the same layout pass as the newly ordered sections
  useLayoutEffect(() => {
    if (pendingResetRef.current) {
      pendingResetRef.current = false;
      resetAllMotion();
      setDraggingId(null);
    }
  }, [sections]);

  if (!Array.isArray(sections) || sections.length === 0) return null;

  const handleLayoutChip = (id, layout) => {
    if (draggingId) return;
    layoutsRef.current[id] = layout;
  };

  const handleTap = (sec) => {
    if (draggingId) return;

    const now = Date.now();
    const isDoubleTap =
      lastTapRef.current.id === sec.section_id &&
      now - lastTapRef.current.time < DOUBLE_TAP_MS;

    lastTapRef.current = { id: sec.section_id, time: now };

    if (isDoubleTap && onDoubleTapSection) {
      lastTapRef.current = { id: null, time: 0 };
      onDoubleTapSection(sec);
      return;
    }

    onSelectSection && onSelectSection(sec);
  };

  const animateNeighborSlots = (fromIdx, toIdx) => {
    const draggedSec = sections[fromIdx];
    const fromBox = draggedSec ? layoutsRef.current[draggedSec.section_id] : null;
    if (!fromBox) return;

    const stride = fromBox.width + CHIP_GAP;

    sections.forEach((item, idx) => {
      if (idx === fromIdx) return;

      let targetShift = 0;
      if (fromIdx < toIdx && idx > fromIdx && idx <= toIdx) {
        targetShift = -stride;
      } else if (fromIdx > toIdx && idx >= toIdx && idx < fromIdx) {
        targetShift = stride;
      }

      Animated.spring(getShiftAnim(item.section_id), {
        toValue: targetShift,
        tension: 120,
        friction: 14,
        useNativeDriver: true
      }).start();
    });
  };

  const handleStartDrag = (sec, index) => {
    dragSessionRef.current = { fromIdx: index, hoverIdx: index };
    dragX.setValue(0);
    setDraggingId(sec.section_id);
    onSelectSection && onSelectSection(sec);

    Animated.spring(dragLift, {
      toValue: 1,
      tension: 140,
      friction: 11,
      useNativeDriver: true
    }).start();
  };

  const handleMoveDrag = (dx) => {
    const { fromIdx, hoverIdx } = dragSessionRef.current;
    if (fromIdx < 0) return;

    dragX.setValue(dx);

    const draggedSec = sections[fromIdx];
    const fromBox = draggedSec ? layoutsRef.current[draggedSec.section_id] : null;
    if (!fromBox) return;

    const draggedCenterX = fromBox.x + fromBox.width / 2 + dx;
    let nextIdx = fromIdx;

    if (dx > 0) {
      for (let i = fromIdx + 1; i < sections.length; i++) {
        const box = layoutsRef.current[sections[i].section_id];
        if (box && draggedCenterX > box.x + box.width / 2) {
          nextIdx = i;
        }
      }
    } else if (dx < 0) {
      for (let i = fromIdx - 1; i >= 0; i--) {
        const box = layoutsRef.current[sections[i].section_id];
        if (box && draggedCenterX < box.x + box.width / 2) {
          nextIdx = i;
        }
      }
    }

    if (nextIdx !== hoverIdx) {
      dragSessionRef.current.hoverIdx = nextIdx;
      triggerHaptic('shift');
      animateNeighborSlots(fromIdx, nextIdx);
    }
  };

  const handleEndDrag = () => {
    const { fromIdx, hoverIdx } = dragSessionRef.current;
    if (fromIdx < 0) {
      resetAllMotion();
      setDraggingId(null);
      return;
    }

    const landingX = computeLandingDeltaX(sections, layoutsRef.current, fromIdx, hoverIdx);
    triggerHaptic('drop');

    Animated.parallel([
      Animated.spring(dragX, {
        toValue: landingX,
        tension: 130,
        friction: 15,
        useNativeDriver: true
      }),
      Animated.spring(dragLift, {
        toValue: 0,
        tension: 130,
        friction: 15,
        useNativeDriver: true
      })
    ]).start(() => {
      if (hoverIdx !== fromIdx && onReorderSections) {
        pendingResetRef.current = true;
        onReorderSections(moveSectionByIndices(sections, fromIdx, hoverIdx));
      } else {
        resetAllMotion();
        setDraggingId(null);
      }
    });
  };

  return (
    <View style={styles.barWrap}>
      <ScrollView
        horizontal
        scrollEnabled={!draggingId}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollOverflow}
        contentContainerStyle={styles.barScrollContent}
      >
        {sections.map((sec, index) => (
          <LiquidSectionChip
            key={sec.section_id}
            sec={sec}
            index={index}
            isActive={sec.section_id === activeSectionId}
            isDragging={sec.section_id === draggingId}
            isAnotherDragging={Boolean(draggingId && sec.section_id !== draggingId)}
            accentColor={accentColor}
            dragX={dragX}
            dragLift={dragLift}
            shiftAnim={getShiftAnim(sec.section_id)}
            onLayoutChip={handleLayoutChip}
            onTapChip={handleTap}
            onStartDrag={handleStartDrag}
            onMoveDrag={handleMoveDrag}
            onEndDrag={handleEndDrag}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// =============================================================================
// 4. STYLES
// =============================================================================

const styles = StyleSheet.create({
  barWrap: {
    marginBottom: 8,
    marginTop: -4,
    overflow: 'visible'
  },
  scrollOverflow: {
    overflow: 'visible'
  },
  barScrollContent: {
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignItems: 'center'
  },
  chipOuter: {
    marginRight: CHIP_GAP,
    borderRadius: 14,
    shadowColor: THEME.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2
  },
  chipFloatingShadow: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10
  },
  chipGlassClip: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.88)'
  },
  chipClipActive: {
    borderColor: 'rgba(255, 255, 255, 0.32)'
  },
  chipClipDragging: {
    borderWidth: 1.6,
    borderColor: 'rgba(255, 255, 255, 0.98)'
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14
  },
  dragDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  chipText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.1
  }
});