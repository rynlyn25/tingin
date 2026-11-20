import React, { useState } from 'react';
import { Alert } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import RosterScreen from './screens/RosterScreen';
import HealthScreen from './screens/HealthScreen';

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

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('AUTH'); // AUTH | DASHBOARD | ROSTER | HEALTH
  const [courses, setCourses] = useState(INITIAL_COURSES);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [email, setEmail] = useState('juan.delacruz@dlsau.edu.ph');
  const [password, setPassword] = useState('********');

  const selectedCourse =
    courses.find((c) => c.course_id === selectedCourseId) || courses[0] || null;

  const handleAuth = () => {
    if (!email.toLowerCase().endsWith('@dlsau.edu.ph')) {
      Alert.alert(
        'Access Restricted',
        'Professor-Exclusive System: Please use a valid @dlsau.edu.ph institutional email.'
      );
      return;
    }
    setCurrentScreen('DASHBOARD');
  };

  const handleOpenRoster = (course) => {
    setSelectedCourseId(course.course_id);
    setCurrentScreen('ROSTER');
  };

  const handleAddCourse = (newCourse) => {
    setCourses((prev) => [newCourse, ...prev]);
  };

  const handleDeleteCourse = (courseId) => {
    setCourses((prev) => prev.filter((item) => item.course_id !== courseId));
    if (selectedCourseId === courseId) {
      setSelectedCourseId(null);
      setCurrentScreen('DASHBOARD');
    }
  };

  const handleUpdateCourseColor = (courseId, newColor, baseHex) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.course_id === courseId
          ? { ...c, card_color: newColor, card_base: baseHex || newColor }
          : c
      )
    );
  };

  return (
    <>
      {currentScreen === 'AUTH' && (
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
      )}
      {currentScreen === 'DASHBOARD' && (
        <DashboardScreen
          email={email}
          fullName={fullName}
          courses={courses}
          onAddCourse={handleAddCourse}
          onDeleteCourse={handleDeleteCourse}
          setCurrentScreen={setCurrentScreen}
          onOpenRoster={handleOpenRoster}
        />
      )}
      {currentScreen === 'ROSTER' && (
        <RosterScreen
          course={selectedCourse}
          onUpdateCourseColor={handleUpdateCourseColor}
          onDeleteCourse={handleDeleteCourse}
          setCurrentScreen={setCurrentScreen}
        />
      )}
      {currentScreen === 'HEALTH' && (
        <HealthScreen setCurrentScreen={setCurrentScreen} />
      )}
    </>
  );
}