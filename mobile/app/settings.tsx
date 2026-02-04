import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();
  const [isNotiEnabled, setIsNotiEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={styles.title}>Cài đặt</Text>
        <View style={{width: 24}} />
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
            <Text style={styles.label}>Thông báo nhắc nhở</Text>
            <Switch 
                value={isNotiEnabled} 
                onValueChange={setIsNotiEnabled} 
                trackColor={{ false: "#767577", true: "#FF9A9E" }}
                thumbColor={isNotiEnabled ? "#FF6B81" : "#f4f3f4"}
            />
        </View>
        <View style={styles.row}>
            <Text style={styles.label}>Chế độ tối (Dark Mode)</Text>
            <Switch value={isDarkMode} onValueChange={setIsDarkMode} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 20 },
  title: { fontSize: 20, fontWeight: 'bold' },
  section: { marginTop: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  label: { fontSize: 16, color: '#333' }
});