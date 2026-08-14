import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Image, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import axios from 'axios';
import { StatusBar } from 'expo-status-bar';

const BASE_URL = Constants.manifest?.extra?.API_BASE_URL || 'http://localhost:8000';

function RoleSelector({ role, setRole }) {
  const roles = ['operator', 'manager', 'admin'];
  return (
    <View style={{ flexDirection: 'row', marginTop: 12 }}>
      {roles.map(r => (
        <TouchableOpacity
          key={r}
          onPress={() => setRole(r)}
          style={{
            padding: 8,
            marginHorizontal: 6,
            borderRadius: 6,
            backgroundColor: role === r ? '#2563eb' : '#e5e7eb',
          }}
        >
          <Text style={{ color: role === r ? '#fff' : '#000' }}>{r}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Dashboard({ token, user, onLogout }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
      try {
        if (user.role === 'manager' || user.role === 'admin') {
          const [mresp, aresp] = await Promise.all([
            axios.get(`${BASE_URL}/api/maintenance`, { headers }),
            axios.get(`${BASE_URL}/api/alerts`, { headers }),
          ]);
          if (!mounted) return;
          setData({ maintenance: mresp.data, alerts: aresp.data });
        } else {
          // operator
          const mresp = await axios.get(`${BASE_URL}/api/machines`);
          if (!mounted) return;
          setData({ machines: mresp.data });
        }
      } catch (e) {
        Alert.alert('Error fetching dashboard', e.toString());
      } finally { setLoading(false); }
    };
    fetchData();
    return () => { mounted = false; };
  }, [token, user]);

  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Dashboard ({user.role})</Text>
      <Text style={{ marginTop: 8 }}>{user.name}</Text>
      <Button title="Logout" onPress={onLogout} />

      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}

      {user.role === 'manager' && data.maintenance && (
        <View style={{ marginTop: 12, width: '100%' }}>
          <Text style={{ fontWeight: '700' }}>Upcoming Maintenance</Text>
          {data.maintenance.slice(0,10).map(item => (
            <View key={item.log_id} style={{ padding: 8, borderBottomWidth: 1, borderColor: '#eee' }}>
              <Text style={{ fontWeight: '600' }}>{item.machine_name} — {item.type}</Text>
              <Text style={{ color: '#666' }}>{item.service_date} — {item.notes}</Text>
            </View>
          ))}
        </View>
      )}

      {user.role === 'manager' && data.alerts && (
        <View style={{ marginTop: 12, width: '100%' }}>
          <Text style={{ fontWeight: '700' }}>Active Alerts</Text>
          {data.alerts.slice(0,10).map(a => (
            <View key={a.alert_id} style={{ padding: 8, borderBottomWidth: 1, borderColor: '#eee' }}>
              <Text style={{ color: a.severity === 'critical' ? '#b91c1c' : '#ca8a04' }}>{a.message}</Text>
              <Text style={{ color: '#666' }}>{a.created_at}</Text>
            </View>
          ))}
        </View>
      )}

      {user.role === 'operator' && data.machines && (
        <View style={{ marginTop: 12, width: '100%' }}>
          <Text style={{ fontWeight: '700' }}>Machines</Text>
          {data.machines.map(m => (
            <View key={m.machine_id} style={{ padding: 8, borderBottomWidth: 1, borderColor: '#eee' }}>
              <Text style={{ fontWeight: '600' }}>{m.name}</Text>
              <Text style={{ color: '#666' }}>{m.type} • {m.location} • {m.status}</Text>
            </View>
          ))}
        </View>
      )}

    </View>
  );
}

export default function App() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('operator');

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera permission is required to use face login.');
      }
    })();
  }, []);

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: false });
    if (!result.cancelled) {
      setImage(result.uri);
    }
  };

  const registerFace = async () => {
    if (!image) { Alert.alert('No photo', 'Please take a photo first.'); return; }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('name', 'Mobile User');
      form.append('role', role);
      const uriParts = image.split('.');
      const fileType = uriParts[uriParts.length - 1];
      form.append('file', { uri: image, name: `photo.${fileType}`, type: `image/${fileType}` });
      const res = await axios.post(`${BASE_URL}/api/auth/register-face`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.data && res.data.token) {
          setToken(res.data.token);
          setUser(res.data.user);
          Alert.alert('Registered and logged in', `Welcome ${res.data.user.name}`);
        } else if (res.data && res.data.status === 'registered') {
          Alert.alert('Registered', `User registered as ${role}. Proceeding to login...`);
          // auto-login after register
          await loginFace();
        } else {
          Alert.alert('Registered', JSON.stringify(res.data));
        }
    } catch (e) { Alert.alert('Error', e.toString());
    } finally { setLoading(false); }
  };

  const loginFace = async () => {
    if (!image) { Alert.alert('No photo', 'Please take a photo first.'); return; }
    setLoading(true);
    try {
      const form = new FormData();
      const uriParts = image.split('.');
      const fileType = uriParts[uriParts.length - 1];
      form.append('file', { uri: image, name: `photo.${fileType}`, type: `image/${fileType}` });
      const res = await axios.post(`${BASE_URL}/api/auth/login-face`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        Alert.alert('Logged in', `Welcome ${res.data.user.name}`);
      } else if (res.data.error) {
        Alert.alert('Error', res.data.error);
      } else {
        Alert.alert('Unknown response', JSON.stringify(res.data));
      }
    } catch (e) {
      Alert.alert('Error', e.toString());
    } finally { setLoading(false); }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setImage(null);
  };

  if (token && user) {
    return (
      <View style={styles.container}>
        <Dashboard token={token} user={user} onLogout={logout} />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FAS Mobile (Face Login Prototype)</Text>
      <Button title="Take Photo" onPress={takePhoto} />
      {image && <Image source={{ uri: image }} style={styles.image} />}

      <RoleSelector role={role} setRole={setRole} />

      <View style={styles.row}>
        <Button title="Register Face" onPress={registerFace} />
        <View style={{ width: 12 }} />
        <Button title="Login Face" onPress={loginFace} />
      </View>
      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'flex-start', padding: 16, paddingTop: 60 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  image: { width: 240, height: 240, marginTop: 12, borderRadius: 8 },
  row: { flexDirection: 'row', marginTop: 12 }
});
