import React, { useState } from 'react';
import { Alert } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import HealthScreen from './screens/HealthScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('AUTH'); // AUTH | DASHBOARD | HEALTH
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
        <DashboardScreen email={email} setCurrentScreen={setCurrentScreen} />
      )}
      {currentScreen === 'HEALTH' && (
        <HealthScreen setCurrentScreen={setCurrentScreen} />
      )}
    </>
  );
}