import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './lib/ThemeContext';
import IndexPage from './pages/IndexPage';

function MockAuthScreen({ onLogin }: { onLogin: (role: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (role: string) => {
    if (!username || !password) {
      Alert.alert("Required", "Please enter a username and password.");
      return;
    }
    // Accept any credentials for demo
    onLogin(role);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f9ff', padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 10, color: '#0369a1' }}>HealthDrop</Text>
      <Text style={{ fontSize: 14, color: 'gray', marginBottom: 30 }}>Secure Staff Access</Text>
      
      <View style={{ width: '100%', maxWidth: 300, marginBottom: 20 }}>
        <Text style={{ marginBottom: 5, color: '#333', fontWeight: 'bold' }}>Username:</Text>
        <TextInput 
          style={{ backgroundColor: 'white', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 15 }}
          placeholder="e.g. admin"
          value={username}
          onChangeText={setUsername}
        />
        
        <Text style={{ marginBottom: 5, color: '#333', fontWeight: 'bold' }}>Password:</Text>
        <TextInput 
          style={{ backgroundColor: 'white', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 20 }}
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <Text style={{ fontSize: 14, color: 'gray', marginBottom: 10 }}>Select Role to Continue:</Text>

      <TouchableOpacity 
        style={{ backgroundColor: '#2563eb', padding: 15, borderRadius: 8, width: 300, marginBottom: 10 }}
        onPress={() => handleLogin('ASHA Worker')}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Login as ASHA Worker</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={{ backgroundColor: '#10b981', padding: 15, borderRadius: 8, width: 300, marginBottom: 10 }}
        onPress={() => handleLogin('Health Official')}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Login as Health Official</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={{ backgroundColor: '#eab308', padding: 15, borderRadius: 8, width: 300, marginBottom: 10 }}
        onPress={() => handleLogin('Community Volunteer')}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Login as Community Volunteer</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={{ backgroundColor: '#6b7280', padding: 15, borderRadius: 8, width: 300 }}
        onPress={() => handleLogin('Clinic Staff')}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Login as Clinic Staff</Text>
      </TouchableOpacity>
    </View>
  );
}

function AppContent() {
  const [role, setRole] = useState<string | null>(null);

  if (!role) {
    return <MockAuthScreen onLogin={(r) => setRole(r)} />;
  }

  return (
    <View style={styles.container}>
      <IndexPage userRole={role} onLogout={() => setRole(null)} />
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});