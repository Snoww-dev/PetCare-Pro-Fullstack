import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, Modal, TextInput, Alert, Platform 
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';

// Cấu hình thông báo
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true
  }),
});

export default function DietPlanScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams();
  
  const [dietPlans, setDietPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState(''); // Bữa sáng/trưa...
  const [food, setFood] = useState('');   // Loại hạt/thịt...
  const [amount, setAmount] = useState(''); // Bao nhiêu gram?
  const [time, setTime] = useState(new Date()); // Giờ ăn
  const [showTimePicker, setShowTimePicker] = useState(false);

  const API_URL = `https://petcare-api-tuyet.onrender.com/api/pets/${petId}`;

  useFocusEffect(
    useCallback(() => {
      fetchDietPlans();
    }, [])
  );

  const fetchDietPlans = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      // Sắp xếp bữa ăn theo giờ (Time String)
      const sorted = (res.data.data.diet_plans || []).sort((a: any, b: any) => a.time.localeCompare(b.time));
      setDietPlans(sorted);
      setLoading(false);
    } catch (error) {
      console.log("Lỗi tải diet:", error);
      setLoading(false);
    }
  };

  // 👇 HÀM ĐẶT THÔNG BÁO LẶP LẠI HÀNG NGÀY
  const scheduleDailyReminder = async (h: number, m: number, mealTitle: string) => {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "🍽️ ĐẾN GIỜ ĂN RỒI!",
                body: `Đã đến giờ ${mealTitle} cho bé cưng. Menu: ${food} (${amount})`,
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY, // Lặp hàng ngày
                hour: h,
                minute: m,
            },
        });
        Alert.alert("Đã đặt nhắc nhở! ⏰", `App sẽ nhắc bạn vào ${h}:${m < 10 ? '0'+m : m} hàng ngày.`);
    } catch (error) {
        console.log("Lỗi noti:", error);
    }
  };

  const handleAddDiet = async () => {
    if (!title || !food) {
        Alert.alert("Thiếu thông tin", "Vui lòng nhập tên bữa và món ăn!");
        return;
    }
    setSubmitting(true);
    try {
        const token = await AsyncStorage.getItem('token');
        // Format giờ thành chuỗi HH:mm để lưu DB
        const timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

        await axios.post(`${API_URL}/diet`, {
            title, food, amount, time: timeString
        }, { headers: { Authorization: `Bearer ${token}` } });

        // Đặt lịch nhắc nhở
        await scheduleDailyReminder(time.getHours(), time.getMinutes(), title);

        setModalVisible(false);
        fetchDietPlans();
        
        // Reset form
        setTitle(''); setFood(''); setAmount(''); setTime(new Date());

    } catch (error) {
        Alert.alert("Lỗi", "Không lưu được thực đơn.");
    } finally {
        setSubmitting(false);
    }
  };

  const handleDelete = (dietId: string) => {
      Alert.alert("Xóa bữa ăn", "Bạn muốn xóa lịch ăn này?", [
          { text: "Hủy", style: "cancel" },
          { text: "Xóa", style: 'destructive', onPress: async () => {
              try {
                  const token = await AsyncStorage.getItem('token');
                  await axios.delete(`${API_URL}/diet/${dietId}`, {
                      headers: { Authorization: `Bearer ${token}` }
                  });
                  fetchDietPlans();
              } catch (e) { Alert.alert("Lỗi", "Không xóa được"); }
          }}
      ]);
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
      setShowTimePicker(false);
      if (selectedDate) setTime(selectedDate);
  };

  const renderItem = ({ item }: any) => (
      <View style={styles.card}>
          <View style={styles.timeBox}>
              <Text style={styles.timeText}>{item.time}</Text>
              <Text style={styles.dailyText}>Hàng ngày</Text>
          </View>
          <View style={styles.infoBox}>
              <Text style={styles.mealTitle}>{item.title}</Text>
              <Text style={styles.foodText}>🍲 {item.food}</Text>
              {item.amount ? <Text style={styles.amountText}>⚖️ Khẩu phần: {item.amount}</Text> : null}
          </View>
          <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={20} color="#FF6B81" />
          </TouchableOpacity>
      </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#E8F5E9', '#FFFFFF']} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#2E7D32" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thực Đơn Ăn Uống 🥗</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
              <Ionicons name="add" size={28} color="#2E7D32" />
          </TouchableOpacity>
      </LinearGradient>

      {loading ? (
          <ActivityIndicator color="#4CAF50" style={{marginTop: 50}} />
      ) : (
          <FlatList 
            data={dietPlans} 
            renderItem={renderItem} 
            keyExtractor={(item) => item._id} 
            contentContainerStyle={{padding: 20}}
            ListEmptyComponent={
                <View style={styles.emptyBox}>
                    <Ionicons name="restaurant-outline" size={60} color="#C8E6C9" />
                    <Text style={{color:'#888', marginTop:10}}>Chưa có lịch ăn nào.</Text>
                    <Text style={{color:'#888'}}>Bấm dấu (+) để thêm.</Text>
                </View>
            }
          />
      )}

      {/* MODAL THÊM BỮA ĂN */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Thêm Bữa Ăn Mới</Text>
                  
                  <Text style={styles.label}>Tên bữa (Sáng/Trưa/Tối)</Text>
                  <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="VD: Bữa sáng" />

                  <Text style={styles.label}>Giờ ăn</Text>
                  <TouchableOpacity style={styles.timeBtn} onPress={() => setShowTimePicker(true)}>
                      <Text style={{fontSize: 16, color: '#333'}}>
                          {time.getHours().toString().padStart(2,'0')}:{time.getMinutes().toString().padStart(2,'0')}
                      </Text>
                      <Ionicons name="time-outline" size={20} color="#4CAF50" />
                  </TouchableOpacity>
                  {showTimePicker && <DateTimePicker value={time} mode="time" display="default" onChange={onTimeChange} />}

                  <Text style={styles.label}>Món ăn / Loại hạt</Text>
                  <TextInput style={styles.input} value={food} onChangeText={setFood} placeholder="VD: Hạt Royal Canin" />

                  <Text style={styles.label}>Khẩu phần (Gram/Bát)</Text>
                  <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="VD: 50g" />

                  <View style={styles.modalActions}>
                      <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}><Text>Hủy</Text></TouchableOpacity>
                      <TouchableOpacity onPress={handleAddDiet} style={styles.confirmBtn}>
                          {submitting ? <ActivityIndicator color="#fff"/> : <Text style={{color:'#fff', fontWeight:'bold'}}>Lưu & Nhắc nhở</Text>}
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { height: 100, paddingTop: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2E7D32' },
  backBtn: { padding: 5 },
  addBtn: { padding: 5 },
  
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, alignItems: 'center' },
  timeBox: { alignItems: 'center', marginRight: 15, borderRightWidth: 1, borderRightColor: '#eee', paddingRight: 15 },
  timeText: { fontSize: 22, fontWeight: 'bold', color: '#4CAF50' },
  dailyText: { fontSize: 10, color: '#888' },
  infoBox: { flex: 1 },
  mealTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  foodText: { fontSize: 14, color: '#555', marginBottom: 2 },
  amountText: { fontSize: 12, color: '#777' },
  deleteBtn: { padding: 10 },
  
  emptyBox: { alignItems: 'center', marginTop: 100 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 25, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#2E7D32' },
  label: { fontSize: 13, color: '#666', marginBottom: 5, marginTop: 10, fontWeight: '600' },
  input: { backgroundColor: '#F1F8E9', borderRadius: 10, padding: 10, fontSize: 15 },
  timeBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F1F8E9', padding: 12, borderRadius: 10 },
  
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 30, gap: 15 },
  cancelBtn: { padding: 10, borderRadius: 10, backgroundColor: '#eee', minWidth: 80, alignItems: 'center' },
  confirmBtn: { padding: 10, borderRadius: 10, backgroundColor: '#4CAF50', minWidth: 120, alignItems: 'center' }
});