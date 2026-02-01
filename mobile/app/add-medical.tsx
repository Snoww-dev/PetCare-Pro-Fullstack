import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
// 👇 1. IMPORT THƯ VIỆN THÔNG BÁO & ICON
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';

export default function AddMedicalScreen() {
  const { petId } = useLocalSearchParams();
  const router = useRouter();

  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [doctor, setDoctor] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Link API
  const API_URL = `https://petcare-api-tuyet.onrender.com/api/pets/${petId}/medical`;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      // 👇 SỬA LỖI 1: Dùng MediaTypeOptions cho chắc ăn
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 👇 HÀM PHỤ TRỢ: LÊN LỊCH THÔNG BÁO
  const scheduleReminder = async (recordTitle: string, recordDate: Date) => {
    console.log("--- Bắt đầu đặt lịch ---");
    try {
      // 1. Xin quyền thông báo
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Bạn chưa cấp quyền thông báo cho App!');
        return;
      }

      // 2. Tạo kênh thông báo (Bắt buộc cho Android)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // 3. Cấu hình thời gian: 8:00 SÁNG ngày hẹn
      const triggerDate = new Date(recordDate);
      triggerDate.setHours(8, 0, 0, 0); 

      // Kiểm tra nếu 8h sáng ngày đó đã qua
      if (triggerDate <= new Date()) {
         console.log("Đã qua 8h sáng ngày hẹn, không đặt lịch.");
         return; 
      }
      
      console.log("Đang lên lịch vào lúc:", triggerDate);

      // 4. Lên lịch
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🗓️ Nhắc nhở lịch thú cưng",
          body: `Hôm nay bé có lịch: ${recordTitle}. Đừng quên nhé!`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        // 👇 SỬA LỖI 2: Thêm 'as any' để TypeScript không báo lỗi dòng này nữa
        trigger: triggerDate as any, 
      });

      console.log("Đã lên lịch thành công!");
      Alert.alert("Đã đặt lịch! ⏰", "App sẽ nhắc bạn vào 8:00 sáng ngày hẹn.");
      
    } catch (error) {
      console.log("Lỗi đặt lịch:", error);
      Alert.alert("Lỗi", "Có lỗi khi đặt lịch: " + error);
    }
  };

  const handleAddRecord = async () => {
    if (!title || !description) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề và nội dung!');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('date', date);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('doctor', doctor);
      formData.append('type', 'medical');

      if (image) {
        // @ts-ignore
        formData.append('image', {
          uri: image,
          type: 'image/jpeg',
          name: 'medical-record.jpg',
        });
      }
      
      await axios.post(API_URL, formData, {
        headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}` 
        }
      });

      // 👇 LOGIC HỎI NHẮC NHỞ
      const recordDate = new Date(date);
      const now = new Date();
      
      if (recordDate > now) {
        Alert.alert(
          "Đã lưu hồ sơ! ✅",
          "Đây là lịch hẹn trong tương lai. Bạn có muốn App nhắc nhở vào sáng ngày đó không?",
          [
            { text: "Không cần", style: "cancel", onPress: () => router.back() },
            { 
              text: "Có, nhắc tôi!", 
              onPress: async () => {
                await scheduleReminder(title, recordDate);
                router.back();
              } 
            }
          ]
        );
      } else {
        Alert.alert('Thành công! 🏥', 'Đã lưu hồ sơ sức khỏe.');
        router.back();
      }

    } catch (error) {
      console.log('Lỗi thêm medical:', error);
      Alert.alert('Lỗi', 'Không thể lưu hồ sơ lúc này.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient colors={['#FF9A9E', '#FECFEF']} style={styles.headerBackground} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FF6B81" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm Hồ Sơ Y Tế 💊</Text>
      </View>

      <Animatable.View animation="fadeInUp" duration={800} style={styles.formContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          
          <Text style={styles.instruction}>Lưu giữ đơn thuốc, lịch tiêm hoặc hình ảnh X-quang.</Text>

          {/* Chọn ảnh */}
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="camera" size={50} color="#FF9A9E" />
                <Text style={{ color: '#FF8E9E', marginTop: 5 }}>Chụp/Chọn ảnh đơn thuốc</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form nhập liệu */}
          <Text style={styles.label}>Tiêu đề (*)</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Ví dụ: Tiêm phòng dại, Khám da liễu..." />

          <View style={styles.row}>
            <View style={{flex: 1, marginRight: 10}}>
                <Text style={styles.label}>Ngày khám (YYYY-MM-DD)</Text>
                <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
            </View>
            <View style={{flex: 1}}>
                <Text style={styles.label}>Bác sĩ / Nơi khám</Text>
                <TextInput style={styles.input} value={doctor} onChangeText={setDoctor} placeholder="BS. Nam / PetMart" />
            </View>
          </View>

          <Text style={styles.label}>Chi tiết / Chẩn đoán (*)</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            value={description} 
            onChangeText={setDescription}
            placeholder="Ghi chú chi tiết về bệnh tình hoặc loại thuốc..."
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity onPress={handleAddRecord} disabled={loading} style={{ marginTop: 20, marginBottom: 50 }}>
            <LinearGradient colors={['#FF9A9E', '#FF6B81']} style={styles.submitBtn}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>LƯU HỒ SƠ ✅</Text>}
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </Animatable.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FECFEF' },
  headerBackground: { height: 150, width: '100%', position: 'absolute', top: 0 },
  header: { marginTop: 50, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  backBtn: { backgroundColor: '#fff', padding: 10, borderRadius: 15, marginRight: 15, elevation: 5 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },

  formContainer: { flex: 1, backgroundColor: '#fff', marginTop: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, elevation: 10 },
  instruction: { textAlign: 'center', color: '#888', marginBottom: 20, fontStyle: 'italic' },

  imagePicker: {
    height: 150, width: '100%', backgroundColor: '#FFF0F3',
    borderRadius: 15, borderStyle: 'dashed', borderWidth: 2, borderColor: '#FF9A9E',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden'
  },
  previewImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  placeholder: { alignItems: 'center' },

  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, padding: 12, fontSize: 16, color: '#333' },
  textArea: { height: 100 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },

  submitBtn: { padding: 18, borderRadius: 15, alignItems: 'center', shadowColor: '#FF6B81', shadowOpacity: 0.3, elevation: 5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});