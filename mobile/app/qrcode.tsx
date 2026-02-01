import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Share, TextInput, 
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function QrCodeScreen() {
  const { id, name, img } = useLocalSearchParams();
  const router = useRouter();

  // Link QR Code (Giữ nguyên)
  const qrValue = `https://petcare-api-tuyet.onrender.com/find/${id}`;

  // State để lưu lời nhắn
  const [contactInfo, setContactInfo] = useState('Đang tải...');
  const [isEditing, setIsEditing] = useState(false); // Chế độ chỉnh sửa
  const [loading, setLoading] = useState(false);

  // Gọi API lấy thông tin hiện tại của Pet
  useEffect(() => {
    fetchPetInfo();
  }, []);

  const fetchPetInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      // Gọi API lấy chi tiết Pet để xem dòng contact_info hiện tại là gì
      const res = await axios.get(`https://petcare-api-tuyet.onrender.com/api/pets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setContactInfo(res.data.data.contact_info || "Xin hãy gọi cho chủ của tôi!");
      }
    } catch (error) {
      console.log("Lỗi lấy thông tin:", error);
    }
  };

  // Hàm lưu thông tin mới
  const handleSaveContact = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `https://petcare-api-tuyet.onrender.com/api/pets/${id}`,
        { contact_info: contactInfo }, // Gửi lời nhắn mới lên Server
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Thành công ✅", "Đã cập nhật thông tin liên hệ cho bé!");
      setIsEditing(false); // Tắt chế độ sửa
    } catch (error) {
      Alert.alert("Lỗi", "Không cập nhật được lúc này.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🆘 Tìm trẻ lạc! Bé ${name} có mã định danh này. Quét ngay: ${qrValue}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient colors={['#FF9A9E', '#FECFEF']} style={styles.headerBackground} />
      
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#FF6B81" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animatable.View animation="zoomIn" duration={600} style={styles.card}>
          <Text style={styles.title}>THẺ TÊN ĐIỆN TỬ 🛡️</Text>
          <Text style={styles.subtitle}>Quét mã để hiện thông tin liên hệ</Text>

          {/* QR CODE */}
          <View style={styles.qrContainer}>
            <QRCode
              value={qrValue}
              size={180}
              color="#2C3E50"
              backgroundColor="white"
              logo={{ uri: (img as string) || 'https://cdn-icons-png.flaticon.com/512/616/616408.png' }}
              logoSize={40}
              logoBackgroundColor='white'
              logoBorderRadius={20}
            />
          </View>

          <Text style={styles.petName}>{name}</Text>
          
          {/* KHU VỰC CHỈNH SỬA THÔNG TIN */}
          <View style={styles.contactContainer}>
            <Text style={styles.label}>📞 Thông tin khi quét mã:</Text>
            
            {isEditing ? (
              <View>
                <TextInput 
                  style={styles.input}
                  value={contactInfo}
                  onChangeText={setContactInfo}
                  multiline
                  placeholder="Ví dụ: Gọi mẹ Tuyết 0909..."
                />
                <TouchableOpacity onPress={handleSaveContact} disabled={loading} style={styles.saveBtn}>
                  {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.saveText}>Lưu thông tin</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.contactText}>"{contactInfo}"</Text>
                <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtn}>
                   <Ionicons name="create-outline" size={16} color="#555" />
                   <Text style={styles.editText}> Chỉnh sửa</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={styles.desc}>⚠️ In mã này đeo vào cổ bé để phòng khi đi lạc.</Text>

          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
             <Ionicons name="share-social" size={20} color="#fff" />
             <Text style={styles.shareText}> Chia sẻ / In mã</Text>
          </TouchableOpacity>

        </Animatable.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FECFEF' },
  headerBackground: { position: 'absolute', top: 0, width: '100%', height: '100%' },
  backBtn: { position: 'absolute', top: 50, left: 20, backgroundColor: '#fff', padding: 10, borderRadius: 15, zIndex: 10, elevation: 5 },
  
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  
  card: { backgroundColor: '#fff', padding: 25, borderRadius: 30, alignItems: 'center', width: '90%', elevation: 15, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 5 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FF6B81', marginBottom: 5 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 20 },
  
  qrContainer: { padding: 15, borderWidth: 2, borderColor: '#FF9A9E', borderRadius: 20, marginBottom: 15, borderStyle: 'dashed' },
  
  petName: { fontSize: 26, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  
  // Style cho phần chỉnh sửa
  contactContainer: { width: '100%', backgroundColor: '#F8F9FA', padding: 15, borderRadius: 15, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 8 },
  contactText: { fontSize: 16, color: '#333', fontStyle: 'italic', lineHeight: 22 },
  
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDD', borderRadius: 10, padding: 10, fontSize: 16, height: 80, textAlignVertical: 'top', marginBottom: 10 },
  saveBtn: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 10, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold' },
  
  editBtn: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, alignItems: 'center' },
  editText: { color: '#555', fontSize: 14, fontWeight: '600' },

  desc: { textAlign: 'center', color: '#999', fontSize: 12, marginBottom: 20 },

  shareBtn: { flexDirection: 'row', backgroundColor: '#FF6B81', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 25, alignItems: 'center', elevation: 3 },
  shareText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }
});