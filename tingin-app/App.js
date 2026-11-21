import React, { useState } from 'react';
import { Alert } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import RosterScreen from './screens/RosterScreen';
import HealthScreen from './screens/HealthScreen';
import ProfileScreen from './screens/ProfileScreen';
import LiveFeedScreen from './screens/LiveFeedScreen';

// =============================================================================
// 1. CONSTANTS & INITIAL DATA
// =============================================================================

const DLSAU_EMAIL_DOMAIN = '@dlsau.edu.ph';
const DEFAULT_COLS_PER_ROW = 8;

const SCREENS = {
  AUTH: 'AUTH',
  DASHBOARD: 'DASHBOARD',
  ROSTER: 'ROSTER',
  LIVE_FEED: 'LIVE_FEED',
  HEALTH: 'HEALTH',
  PROFILE: 'PROFILE'
};

const INITIAL_PROFILE = {
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
  cardMode: 'dark'
};

const INITIAL_COURSES = [
  {
    course_id: 'CS301',
    course_code: 'CS 301',
    course_name: 'Software Engineering',
    schedule: 'MWF 09:00 AM',
    room: 'Osmeña Rm 302',
    enrolled_count: 35,
    seat_capacity: 40,
    pending_anomalies: 2,
    card_color: '#01A638',
    card_base: '#01A638'
  },
  {
    course_id: 'CS305',
    course_code: 'CS 305',
    course_name: 'Architecture & Org',
    schedule: 'TTH 01:00 PM',
    room: 'Osmeña Rm 304',
    enrolled_count: 40,
    seat_capacity: 40,
    pending_anomalies: 0,
    card_color: '#FF8833',
    card_base: '#FF8833'
  },
  {
    course_id: 'CS309',
    course_code: 'CS 309',
    course_name: 'Human-Computer Interaction',
    schedule: 'MWF 10:30 AM',
    room: 'Ledesma Hall 201',
    enrolled_count: 38,
    seat_capacity: 40,
    pending_anomalies: 1,
    card_color: '#FBE870',
    card_base: '#FBE870'
  }
];

const normalizeRoomKey = (room = '') => room.trim().toLowerCase().replace(/\s+/g, ' ');

const INITIAL_ROOM_LAYOUTS = {
  [normalizeRoomKey('Osmeña Rm 302')]: {
    roomName: 'Osmeña Rm 302',
    capacity: 40,
    colsPerRow: DEFAULT_COLS_PER_ROW,
    source: 'PRESET'
  },
  [normalizeRoomKey('Osmeña Rm 304')]: {
    roomName: 'Osmeña Rm 304',
    capacity: 40,
    colsPerRow: DEFAULT_COLS_PER_ROW,
    source: 'PRESET'
  },
  [normalizeRoomKey('Ledesma Hall 201')]: {
    roomName: 'Ledesma Hall 201',
    capacity: 40,
    colsPerRow: DEFAULT_COLS_PER_ROW,
    source: 'PRESET'
  }
};

// =============================================================================
// 2. ROOT APPLICATION
// =============================================================================

export default function App() {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.AUTH);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  const [professorProfile, setProfessorProfile] = useState(INITIAL_PROFILE);
  const [courses, setCourses] = useState(INITIAL_COURSES);
  const [roomLayouts, setRoomLayouts] = useState(INITIAL_ROOM_LAYOUTS);
  const [sessionsByCourse, setSessionsByCourse] = useState({});

  // Auth Form State
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [email, setEmail] = useState('juan.delacruz@dlsau.edu.ph');
  const [password, setPassword] = useState('********');

  const selectedCourse =
    courses.find((course) => course.course_id === selectedCourseId) || courses[0] || null;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleAuth = () => {
    if (!email.trim().toLowerCase().endsWith(DLSAU_EMAIL_DOMAIN)) {
      Alert.alert(
        'Access Restricted',
        `Professor-Exclusive System: Please use a valid ${DLSAU_EMAIL_DOMAIN} institutional email.`
      );
      return;
    }

    if (isSignUp) {
      setProfessorProfile((prev) => ({
        ...prev,
        fullName: fullName.trim() || prev.fullName,
        nickname: fullName.trim() || prev.nickname,
        facultyId: facultyId.trim() || prev.facultyId
      }));
    }

    setCurrentScreen(SCREENS.DASHBOARD);
  };

  const handleOpenRoster = (course) => {
    setSelectedCourseId(course.course_id);
    setCurrentScreen(SCREENS.ROSTER);
  };

  const handleOpenLiveFeed = (course) => {
    setSelectedCourseId(course.course_id);
    setCurrentScreen(SCREENS.LIVE_FEED);
  };

  const handleAddCourse = (newCourse) => {
    const key = normalizeRoomKey(newCourse.room);
    const savedLayout = roomLayouts[key];
    const resolvedCapacity = savedLayout?.capacity || newCourse.seat_capacity || 40;

    setCourses((prev) => [
      { ...newCourse, seat_capacity: resolvedCapacity },
      ...prev
    ]);

    if (key && !savedLayout) {
      setRoomLayouts((prev) => ({
        ...prev,
        [key]: {
          roomName: newCourse.room.trim(),
          capacity: resolvedCapacity,
          colsPerRow: DEFAULT_COLS_PER_ROW,
          source: 'PRESET'
        }
      }));
    }
  };

  const handleDeleteCourse = (courseId) => {
    setCourses((prev) => prev.filter((item) => item.course_id !== courseId));
    setSessionsByCourse((prev) => {
      const next = { ...prev };
      delete next[courseId];
      return next;
    });

    if (selectedCourseId === courseId) {
      setSelectedCourseId(null);
      setCurrentScreen(SCREENS.DASHBOARD);
    }
  };

  const handleUpdateCourseColor = (courseId, newColor, baseHex) => {
    setCourses((prev) =>
      prev.map((course) =>
        course.course_id === courseId
          ? { ...course, card_color: newColor, card_base: baseHex || newColor }
          : course
      )
    );
  };

  const handleSaveRoomLayout = (roomName, layoutConfig) => {
    const key = normalizeRoomKey(roomName);
    if (!key) return;

    setRoomLayouts((prev) => ({
      ...prev,
      [key]: { ...layoutConfig, roomName: roomName.trim() }
    }));

    if (layoutConfig.capacity) {
      setCourses((prev) =>
        prev.map((course) =>
          normalizeRoomKey(course.room) === key
            ? { ...course, seat_capacity: layoutConfig.capacity }
            : course
        )
      );
    }
  };

  const handleUpdateCourseSession = (courseId, nextSession) => {
    if (!courseId) return;
    setSessionsByCourse((prev) => ({
      ...prev,
      [courseId]: nextSession
    }));
  };

  // ---------------------------------------------------------------------------
  // Screen Router
  // ---------------------------------------------------------------------------

  switch (currentScreen) {
    case SCREENS.DASHBOARD:
      return (
        <DashboardScreen
          email={email}
          fullName={professorProfile.nickname || fullName}
          courses={courses}
          onAddCourse={handleAddCourse}
          onDeleteCourse={handleDeleteCourse}
          setCurrentScreen={setCurrentScreen}
          onOpenRoster={handleOpenRoster}
          onOpenLiveFeed={handleOpenLiveFeed}
        />
      );

    case SCREENS.ROSTER:
      return (
        <RosterScreen
          course={selectedCourse}
          onUpdateCourseColor={handleUpdateCourseColor}
          onDeleteCourse={handleDeleteCourse}
          setCurrentScreen={setCurrentScreen}
        />
      );

    case SCREENS.LIVE_FEED:
      return (
        <LiveFeedScreen
          course={selectedCourse}
          savedRoomLayout={
            selectedCourse ? roomLayouts[normalizeRoomKey(selectedCourse.room)] : null
          }
          sessionState={
            selectedCourse ? sessionsByCourse[selectedCourse.course_id] : null
          }
          onSaveRoomLayout={handleSaveRoomLayout}
          onUpdateSession={handleUpdateCourseSession}
          setCurrentScreen={setCurrentScreen}
        />
      );

    case SCREENS.PROFILE:
      return (
        <ProfileScreen
          email={email}
          profile={professorProfile}
          courses={courses}
          onUpdateProfile={setProfessorProfile}
          setCurrentScreen={setCurrentScreen}
        />
      );

    case SCREENS.HEALTH:
      return <HealthScreen setCurrentScreen={setCurrentScreen} />;

    case SCREENS.AUTH:
    default:
      return (
        <LoginScreen
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          fullName={fullName}
          setFullName={setFullName}
          facultyId={facultyId}
          setFacultyId={setFacultyId}
          isSignUp={isSignUp}
          setIsSignUp={setIsSignUp}
          handleAuth={handleAuth}
        />
      );
  }
}