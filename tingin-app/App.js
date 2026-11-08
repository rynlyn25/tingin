import React, { useState } from 'react';
import { Alert } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import RosterScreen from './screens/RosterScreen';
import HealthScreen from './screens/HealthScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('AUTH'); // AUTH | DASHBOARD | ROSTER | HEALTH
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [email, setEmail] = useState('juan.delacruz@dlsau.edu.ph');
  const [password, setPassword] = useState('********');

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
    setSelectedCourse(course);
    setCurrentScreen('ROSTER');
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
          setCurrentScreen={setCurrentScreen}
          onOpenRoster={handleOpenRoster}
        />
      )}
      {currentScreen === 'ROSTER' && (
        <RosterScreen
          course={selectedCourse}
          setCurrentScreen={setCurrentScreen}
        />
      )}
      {currentScreen === 'HEALTH' && (
        <HealthScreen setCurrentScreen={setCurrentScreen} />
      )}
    </>
  );
}0