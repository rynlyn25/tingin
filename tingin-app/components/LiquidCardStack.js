import React, { useState, useRef, useLayoutEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
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

const CARD_OVERLAP = 38;
const LONG_PRESS_MS = 220;
const DOUBLE_TAP_MS = 280;

const THEME = {
  navy: '#070B24',
  ink: '#0B1320',
  defaultCardColor: '#0066FF'
};

const hexToRgb = (hex) => {
  const clean = (hex || THEME.defaultCardColor).replace('#', '');
  return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16) || 0);
};

const hexToRgba = (hex, alpha) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

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
    inkSoft: `rgba(${rgb}, 0.78)`,
    line: `rgba(${rgb}, 0.22)`,
    solidBg: useWhite ? 'rgba(255, 255, 255, 0.92)' : 'rgba(7, 11, 36, 0.88)',
    solidText: useWhite ? THEME.ink : '#FFFFFF',
    softPillBg: useWhite ? 'rgba(255, 255, 255, 0.24)' : 'rgba(255, 255, 255, 0.55)'
  };
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

function moveItemByIndices(list, fromIdx, toIdx) {
  if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || toIdx >= list.length) {
    return list;
  }
  const next = [...list];
  const [picked] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, picked);
  return next;
}

function computeLandingDeltaY(list, layouts, fromIdx, toIdx) {
  if (fromIdx === toIdx) return 0;
  let delta = 0;

  if (fromIdx < toIdx) {
    for (let i = fromIdx + 1; i <= toIdx; i++) {
      const box = layouts[list[i]?.course_id];
      if (box) delta += box.height - CARD_OVERLAP;
    }
  } else {
    for (let i = toIdx; i < fromIdx; i++) {
      const box = layouts[list[i]?.course_id];
      if (box) delta -= box.height - CARD_OVERLAP;
    }
  }

  return delta;
}

// =============================================================================
// 2. WALLET DECK DRAGGABLE CARD
// =============================================================================

function DeckCourseCard({
  course,
  index,
  isExpanded,
  isDragging,
  isAnotherDragging,
  dragY,
  dragLift,
  shiftAnim,
  onLayoutCard,
  onTapCard,
  onStartDrag,
  onMoveDrag,
  onEndDrag,
  onOpenRoster,
  onOpenLiveFeed,
  onEditCourse,
  onDeleteCourse
}) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const longPressTimerRef = useRef(null);
  const isDragActiveRef = useRef(false);

  const latestRef = useRef({});
  latestRef.current = {
    course,
    index,
    onTapCard,
    onStartDrag,
    onMoveDrag,
    onEndDrag
  };

  const cardBg = course.card_color || THEME.defaultCardColor;
  const theme = getCardTheme(cardBg);

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
      tension: 130,
      useNativeDriver: true
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => isDragActiveRef.current,
      onMoveShouldSetPanResponderCapture: () => isDragActiveRef.current,
      onPanResponderTerminationRequest: () => !isDragActiveRef.current,

      onPanResponderGrant: () => {
        isDragActiveRef.current = false;
        animatePress(0.98);
        clearTimer();

        longPressTimerRef.current = setTimeout(() => {
          isDragActiveRef.current = true;
          animatePress(1);
          triggerHaptic('pickup');
          const { course: picked, index: idx, onStartDrag: start } = latestRef.current;
          start && start(picked, idx);
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
        latestRef.current.onMoveDrag && latestRef.current.onMoveDrag(g.dy);
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
          latestRef.current.onTapCard && latestRef.current.onTapCard(latestRef.current.course);
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
    outputRange: [1, 1.035]
  });

  const animatedTransform = isDragging
    ? [{ translateY: dragY }, { scale: liftScale }]
    : [{ translateY: shiftAnim }, { scale: isAnotherDragging ? 0.975 : pressScale }];

  return (
    <Animated.View
      onLayout={(e) => onLayoutCard(course.course_id, e.nativeEvent.layout)}
      style={[
        styles.walletCardShadow,
        index > 0 && styles.walletCardOverlap,
        {
          shadowColor: isDragging ? cardBg : THEME.navy,
          opacity: isAnotherDragging ? 0.9 : 1,
          zIndex: isDragging ? 100 : index + 1,
          elevation: isDragging ? 18 : 6,
          transform: animatedTransform
        },
        isDragging && styles.walletCardFloating
      ]}
    >
      <View style={[styles.walletCardClip, isDragging && styles.walletCardClipDragging]}>
        <BlurView intensity={isDragging ? 76 : 55} tint="light" style={StyleSheet.absoluteFill} />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: hexToRgba(cardBg, isDragging ? 0.78 : 0.68) }
          ]}
        />

        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
          <Defs>
            <LinearGradient id={`deckSheen-${course.course_id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={isDragging ? '0.68' : '0.46'} />
              <Stop offset="38%" stopColor="#FFFFFF" stopOpacity={isDragging ? '0.18' : '0.12'} />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#deckSheen-${course.course_id})`} />
        </Svg>

        {/* Card Face: tap to expand, double-tap to edit, long-press + drag to reorder */}
        <View
          {...panResponder.panHandlers}
          style={[
            styles.cardTouchArea,
            isExpanded && styles.cardTouchAreaExpanded
          ]}
        >
          <View style={styles.cardMainRow}>
            <View style={styles.cardTitleCol}>
              <View style={styles.subMetaRow}>
                {isDragging && <View style={[styles.dragDot, { backgroundColor: theme.ink }]} />}
                <Text style={[styles.cardCategorySub, { color: theme.inkSoft }]} numberOfLines={1}>
                  {course.schedule} • {course.room}
                </Text>
              </View>
              <Text style={[styles.cardTitleText, { color: theme.ink }]} numberOfLines={1}>
                {course.course_name}
              </Text>
            </View>

            <Text style={[styles.cardRightMetric, { color: theme.ink }]}>
              {course.enrolled_count} {course.enrolled_count === 1 ? 'student' : 'students'}
            </Text>
          </View>
        </View>

        {/* Inline Expanded Action Bar */}
        {isExpanded && (
          <View style={styles.expandedDrawerOuter}>
            <View style={[styles.expandedDrawer, { borderTopColor: theme.line }]}>
              <View style={styles.actionRowButtons}>
                <TouchableOpacity
                  style={[styles.actionDarkPill, { backgroundColor: theme.solidBg }]}
                  activeOpacity={0.85}
                  onPress={() => onOpenRoster && onOpenRoster(course)}
                >
                  <Text style={[styles.actionDarkPillText, { color: theme.solidText }]}>
                    Open List
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionLightPill, { backgroundColor: theme.softPillBg }]}
                  activeOpacity={0.85}
                  onPress={() => onOpenLiveFeed && onOpenLiveFeed(course)}
                >
                  <Text style={[styles.actionLightPillText, { color: theme.ink }]}>
                    Live Feed
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionLightPill, { backgroundColor: theme.softPillBg }]}
                  activeOpacity={0.85}
                  onPress={() => onEditCourse && onEditCourse(course)}
                >
                  <Text style={[styles.actionLightPillText, { color: theme.ink }]}>
                    Edit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionDeletePill}
                  activeOpacity={0.85}
                  onPress={() => onDeleteCourse && onDeleteCourse(course)}
                >
                  <Text style={styles.actionDeleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// =============================================================================
// 3. MAIN EXPORT: LIQUID CARD STACK
// =============================================================================

export default function LiquidCardStack({
  courses = [],
  expandedCardId,
  onToggleExpand,
  onOpenRoster,
  onOpenLiveFeed,
  onEditCourse,
  onDeleteCourse,
  onReorderCourses,
  onDragStateChange
}) {
  const [draggingId, setDraggingId] = useState(null);

  const dragY = useRef(new Animated.Value(0)).current;
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
    dragY.setValue(0);
    dragLift.setValue(0);
    Object.values(shiftAnimsRef.current).forEach((anim) => anim.setValue(0));
    dragSessionRef.current = { fromIdx: -1, hoverIdx: -1 };
  };

  useLayoutEffect(() => {
    if (pendingResetRef.current) {
      pendingResetRef.current = false;
      resetAllMotion();
      setDraggingId(null);
      onDragStateChange && onDragStateChange(false);
    }
  }, [courses]);

  if (!Array.isArray(courses) || courses.length === 0) return null;

  const handleLayoutCard = (id, layout) => {
    if (draggingId) return;
    layoutsRef.current[id] = layout;
  };

  const handleTapCard = (course) => {
    if (draggingId) return;

    const now = Date.now();
    const isDoubleTap =
      lastTapRef.current.id === course.course_id &&
      now - lastTapRef.current.time < DOUBLE_TAP_MS;

    lastTapRef.current = { id: course.course_id, time: now };

    if (isDoubleTap && onEditCourse) {
      lastTapRef.current = { id: null, time: 0 };
      onEditCourse(course);
      return;
    }

    onToggleExpand && onToggleExpand(course);
  };

  const animateNeighborCards = (fromIdx, toIdx) => {
    const draggedCourse = courses[fromIdx];
    const fromBox = draggedCourse ? layoutsRef.current[draggedCourse.course_id] : null;
    if (!fromBox) return;

    const stride = fromBox.height - CARD_OVERLAP;

    courses.forEach((item, idx) => {
      if (idx === fromIdx) return;

      let targetShift = 0;
      if (fromIdx < toIdx && idx > fromIdx && idx <= toIdx) {
        targetShift = -stride;
      } else if (fromIdx > toIdx && idx >= toIdx && idx < fromIdx) {
        targetShift = stride;
      }

      Animated.spring(getShiftAnim(item.course_id), {
        toValue: targetShift,
        tension: 120,
        friction: 14,
        useNativeDriver: true
      }).start();
    });
  };

  const handleStartDrag = (course, index) => {
    dragSessionRef.current = { fromIdx: index, hoverIdx: index };
    dragY.setValue(0);
    setDraggingId(course.course_id);
    onDragStateChange && onDragStateChange(true);

    Animated.spring(dragLift, {
      toValue: 1,
      tension: 140,
      friction: 11,
      useNativeDriver: true
    }).start();
  };

  const handleMoveDrag = (dy) => {
    const { fromIdx, hoverIdx } = dragSessionRef.current;
    if (fromIdx < 0) return;

    dragY.setValue(dy);

    const draggedCourse = courses[fromIdx];
    const fromBox = draggedCourse ? layoutsRef.current[draggedCourse.course_id] : null;
    if (!fromBox) return;

    const draggedCenterY = fromBox.y + fromBox.height / 2 + dy;
    let nextIdx = fromIdx;

    if (dy > 0) {
      for (let i = fromIdx + 1; i < courses.length; i++) {
        const box = layoutsRef.current[courses[i].course_id];
        if (box && draggedCenterY > box.y + box.height / 2) {
          nextIdx = i;
        }
      }
    } else if (dy < 0) {
      for (let i = fromIdx - 1; i >= 0; i--) {
        const box = layoutsRef.current[courses[i].course_id];
        if (box && draggedCenterY < box.y + box.height / 2) {
          nextIdx = i;
        }
      }
    }

    if (nextIdx !== hoverIdx) {
      dragSessionRef.current.hoverIdx = nextIdx;
      triggerHaptic('shift');
      animateNeighborCards(fromIdx, nextIdx);
    }
  };

  const handleEndDrag = () => {
    const { fromIdx, hoverIdx } = dragSessionRef.current;
    if (fromIdx < 0) {
      resetAllMotion();
      setDraggingId(null);
      onDragStateChange && onDragStateChange(false);
      return;
    }

    const landingY = computeLandingDeltaY(courses, layoutsRef.current, fromIdx, hoverIdx);
    triggerHaptic('drop');

    Animated.parallel([
      Animated.spring(dragY, {
        toValue: landingY,
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
      if (hoverIdx !== fromIdx && onReorderCourses) {
        pendingResetRef.current = true;
        onReorderCourses(moveItemByIndices(courses, fromIdx, hoverIdx));
      } else {
        resetAllMotion();
        setDraggingId(null);
        onDragStateChange && onDragStateChange(false);
      }
    });
  };

  return (
    <View style={styles.stackWrap}>
      {courses.map((course, index) => (
        <DeckCourseCard
          key={course.course_id}
          course={course}
          index={index}
          isExpanded={expandedCardId === course.course_id}
          isDragging={course.course_id === draggingId}
          isAnotherDragging={Boolean(draggingId && course.course_id !== draggingId)}
          dragY={dragY}
          dragLift={dragLift}
          shiftAnim={getShiftAnim(course.course_id)}
          onLayoutCard={handleLayoutCard}
          onTapCard={handleTapCard}
          onStartDrag={handleStartDrag}
          onMoveDrag={handleMoveDrag}
          onEndDrag={handleEndDrag}
          onOpenRoster={onOpenRoster}
          onOpenLiveFeed={onOpenLiveFeed}
          onEditCourse={onEditCourse}
          onDeleteCourse={onDeleteCourse}
        />
      ))}
    </View>
  );
}

// =============================================================================
// 4. STYLES
// =============================================================================

const styles = StyleSheet.create({
  stackWrap: {
    overflow: 'visible'
  },
  walletCardShadow: {
    borderRadius: 30,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 14
  },
  walletCardOverlap: {
    marginTop: -CARD_OVERLAP
  },
  walletCardFloating: {
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.34,
    shadowRadius: 22
  },
  walletCardClip: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.64)'
  },
  walletCardClipDragging: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.96)'
  },
  cardTouchArea: {
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 56
  },
  cardTouchAreaExpanded: {
    paddingBottom: 18
  },
  cardMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  cardTitleCol: {
    flex: 1,
    paddingRight: 12
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3
  },
  dragDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  cardCategorySub: {
    fontSize: 13,
    fontWeight: '600'
  },
  cardTitleText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5
  },
  cardRightMetric: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.5,
    flexShrink: 0
  },
  expandedDrawerOuter: {
    paddingHorizontal: 22,
    paddingBottom: 52
  },
  expandedDrawer: {
    paddingTop: 14,
    borderTopWidth: 1
  },
  actionRowButtons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  actionDarkPill: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 14,
    marginRight: 6
  },
  actionDarkPillText: {
    fontSize: 12,
    fontWeight: '700'
  },
  actionLightPill: {
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 14,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)'
  },
  actionLightPillText: {
    fontSize: 12,
    fontWeight: '700'
  },
  actionDeletePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderWidth: 1.5,
    borderColor: '#B91C1C',
    paddingVertical: 7.5,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginLeft: 'auto'
  },
  actionDeleteText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '700'
  }
});