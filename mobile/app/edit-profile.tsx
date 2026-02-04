import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

export default function EditProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // Email thường không cho sửa, chỉ hiển thị
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Lấy thông tin cũ
    const fetchUser = async () => {
        const storedName = await AsyncStorage.getItem('userName');
        const storedEmail = await AsyncStorage.getItem('userEmail');
        setName(storedName || '');
        setEmail(storedEmail || '');
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
        const token = await AsyncStorage.getItem('token');
        // Gọi API cập nhật (Nếu backend đã sẵn sàng)
        // await axios.put('https://petcare-api-tuyet.onrender.com/api/users/me', { name }, { headers: { Authorization: `Bearer ${token}` } });
        
        // Tạm thời lưu local để demo
        await AsyncStorage.setItem('userName', name);
        
        Alert.alert("Thành công", "Đã cập nhật thông tin!");
        router.back();
    } catch (error) {
        Alert.alert("Lỗi", "Không thể cập nhật lúc này.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={styles.title}>Chỉnh sửa thông tin</Text>
        <View style={{width: 24}} /> 
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Họ và tên</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>Email (Không thể thay đổi)</Text>
        <TextInput style={[styles.input, {backgroundColor: '#f0f0f0', color: '#999'}]} value={email} editable={false} />

        <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Lưu thay đổi</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 20 },
  title: { fontSize: 20, fontWeight: 'bold' },
  form: { marginTop: 10 },
  label: { fontSize: 14, color: '#666', marginBottom: 8, marginTop: 15 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16 },
  btnSave: { backgroundColor: '#FF6B81', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 30 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});