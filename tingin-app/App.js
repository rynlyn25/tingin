import React, { useState } from 'react';
import { Alert } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import RosterScreen from './screens/RosterScreen';
import HealthScreen from './screens/HealthScreen';
import ProfileScreen from './screens/ProfileScreen';

// =============================================================================
// 1. CONSTANTS & INITIAL DATA
// =============================================================================

const DLSAU_EMAIL_DOMAIN = '@dlsau.edu.ph';

const SCREENS = {
  AUTH: 'AUTH',
  DASHBOARD: 'DASHBOARD',
  ROSTER: 'ROSTER',
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
    pending_anomalies: 1,
    card_color: '#FBE870',
    card_base: '#FBE870'
  }
];

// =============================================================================
// 2. ROOT APPLICATION
// =============================================================================

export default function App() {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState(SCREENS.AUTH);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  // Domain State
  const [professorProfile, setProfessorProfile] = useState(INITIAL_PROFILE);
  const [courses, setCourses] = useState(INITIAL_COURSES);

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

  const handleAddCourse = (newCourse) => {
    setCourses((prev) => [newCourse, ...prev]);
  };

  const handleDeleteCourse = (courseId) => {
    setCourses((prev) => prev.filter((item) => item.course_id !== courseId));
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