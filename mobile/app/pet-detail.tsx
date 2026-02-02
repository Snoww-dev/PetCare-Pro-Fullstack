import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  Image, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Alert // 👈 Đã thêm import Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function PetDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Link API gốc của Pet này
  const API_URL = `https://petcare-api-tuyet.onrender.com/api/pets/${params.id}`;

  // Tự động tải lại dữ liệu mỗi khi quay lại màn hình này
  useFocusEffect(
    useCallback(() => {
      fetchPetDetail();
    }, [])
  );

  const fetchPetDetail = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPet(response.data.data);
      setLoading(false);
    } catch (error) {
      console.log("Lỗi lấy chi tiết:", error);
      setLoading(false);
    }
  };

  // 👇 HÀM XỬ LÝ XÓA BỆNH ÁN
  const handleDeleteRecord = async (recordId: string) => {
    Alert.alert("Xóa hồ sơ", "Bạn chắc chắn muốn xóa dòng lịch sử này chứ?", [
        { text: "Hủy", style: "cancel" },
        {
            text: "Xóa", style: "destructive", onPress: async () => {
                try {
                    const token = await AsyncStorage.getItem('token');
                    // Gọi API Delete: /api/pets/:petId/medical/:recordId
                    await axios.delete(`${API_URL}/medical/${recordId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    // Xóa xong thì load lại dữ liệu để cập nhật danh sách
                    fetchPetDetail(); 
                    Alert.alert("Thành công", "Đã xóa bản ghi.");
                } catch (error) {
                    console.log(error);
                    Alert.alert("Lỗi", "Không xóa được lúc này.");
                }
            }
        }
    ]);
  };

  // 👇 GIAO DIỆN MỘT DÒNG LỊCH SỬ KHÁM (ĐÃ CẬP NHẬT)
  const renderMedicalRecord = ({ item }: any) => (
    <View style={styles.timelineItem}>
        <View style={styles.timelineDot} />
        <View style={styles.timelineLine} />
        <View style={styles.recordCard}>
            
            {/* Hàng tiêu đề + Nút thao tác */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.recordDate}>{new Date(item.date).toLocaleDateString('vi-VN')}</Text>
                    <Text style={styles.recordTitle}>{item.title} ({item.type === 'vaccine' ? '💉' : '🏥'})</Text>
                </View>

                {/* Khu vực nút Sửa & Xóa */}
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity 
                        style={{ padding: 5, marginRight: 5 }}
                        onPress={() => router.push({
                            pathname: '/edit-medical',
                            params: { 
                                petId: pet._id, 
                                recordId: item._id, 
                                // Truyền dữ liệu cũ sang màn hình sửa
                                oldData: JSON.stringify(item) 
                            }
                        } as any)}
                    >
                        <Text style={{fontSize: 18}}>✏️</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={{ padding: 5 }} onPress={() => handleDeleteRecord(item._id)}>
                        <Text style={{fontSize: 18}}>🗑️</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {item.description ? <Text style={styles.recordDesc}>{item.description}</Text> : null}
            {item.doctor ? <Text style={styles.recordDoctor}>👨‍⚕️ {item.doctor}</Text> : null}

            {/* 👇 HIỂN THỊ NGÀY TÁI KHÁM (NẾU CÓ) */}
            {item.next_appointment ? (
                <View style={{ marginTop: 8, backgroundColor: '#FFF0F3', padding: 8, borderRadius: 8 }}>
                    <Text style={{ color: '#FF6B81', fontWeight: 'bold', fontSize: 12 }}>
                        ⏰ Lịch tái khám: {new Date(item.next_appointment).toLocaleDateString('vi-VN')}
                    </Text>
                </View>
            ) : null}

            {/* HIỂN THỊ ẢNH NẾU CÓ */}
            {item.img_url ? (
              <Image 
                source={{ uri: item.img_url }} 
                style={{ width: '100%', height: 150, borderRadius: 10, marginTop: 10, resizeMode: 'cover' }} 
              />
            ) : null}
        </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#FF8E9E" style={{ marginTop: 50 }} />;
  if (!pet) return <View><Text>Không tìm thấy dữ liệu</Text></View>;

  return (
    <View style={styles.container}>
      
      {/* 1. Header Ảnh & Thông tin cơ bản */}
      <View style={styles.header}>
        <Image source={{ uri: pet.img_url || 'https://cdn-icons-png.flaticon.com/512/616/616408.png' }} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={styles.name}>{pet.name} 🐾</Text>
          <Text style={styles.subText}>{pet.species} - {pet.breed}</Text>
          <Text style={styles.subText}>{pet.weight} kg - {pet.gender === 'male' ? 'Đực' : 'Cái'}</Text>
        </View>
      </View>

      {/* 2. Khu vực Nút bấm (QR Code & Chỉnh sửa) */}
      <View style={styles.actionRow}>
        {/* Nút QR Code */}
        <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => router.push({ 
                pathname: '/qrcode', 
                params: { id: pet._id, name: pet.name, img: pet.img_url } 
            } as any)}
        >
            <View style={styles.iconCircle}>
                <Text style={{fontSize: 24}}>🛡️</Text>
            </View>
            <Text style={styles.btnLabel}>Lấy mã QR</Text>
        </TouchableOpacity>

        {/* Nút Chỉnh sửa Pet */}
        <TouchableOpacity 
            style={[styles.actionBtn, {flex: 1.5}]} 
            onPress={() => router.push({ pathname: '/edit-pet', params: { id: pet._id } } as any)}
        >
            <LinearGradient colors={['#FF9A9E', '#FF6B81']} style={styles.gradientBtn}>
                <Text style={{fontSize: 20, marginRight: 5}}>✏️</Text>
                <Text style={styles.gradientText}>Chỉnh sửa</Text>
            </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* 3. Phần Hồ sơ sức khỏe */}
      <View style={styles.body}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hồ sơ sức khỏe 🩺</Text>
            <TouchableOpacity 
                style={styles.addRecordBtn}
                onPress={() => router.push({ pathname: '/add-medical', params: { petId: pet._id } } as any)}
            >
                <Text style={{color: '#fff', fontWeight: 'bold'}}>+ Thêm</Text>
            </TouchableOpacity>
        </View>
        
        <FlatList 
            data={pet.medical_records?.reverse() || []}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderMedicalRecord}
            ListEmptyComponent={<Text style={{textAlign: 'center', color: '#999', marginTop: 20}}>Chưa có lịch sử khám/tiêm nào.</Text>}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
        />
      </View>
      
      {/* Nút quay lại */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/home' as any)}>
        <Text style={{color: '#FF8E9E', fontWeight: 'bold'}}>⬅ Quay lại</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F3' },
  
  // Header
  header: { flexDirection: 'row', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center', elevation: 5 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#eee', borderWidth: 3, borderColor: '#FF8E9E' },
  info: { marginLeft: 20, flex: 1 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subText: { color: '#666', marginTop: 4, fontSize: 15 },

  // Action Row
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 20 },
  actionBtn: { alignItems: 'center', justifyContent: 'center', marginHorizontal: 5 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 3, marginBottom: 5 },
  btnLabel: { color: '#FF6B81', fontWeight: 'bold', fontSize: 12 },
  
  gradientBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, width: '100%', elevation: 4 },
  gradientText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Body
  body: { flex: 1, padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  addRecordBtn: { backgroundColor: '#FF8E9E', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, elevation: 2 },

  // Timeline Styles
  timelineItem: { flexDirection: 'row', marginBottom: 20 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#FF8E9E', marginTop: 5, zIndex: 1, borderWidth: 2, borderColor: '#fff' },
  timelineLine: { position: 'absolute', left: 6, top: 15, bottom: -25, width: 2, backgroundColor: '#FFD1DC' },
  recordCard: { flex: 1, marginLeft: 15, backgroundColor: '#fff', padding: 15, borderRadius: 15, elevation: 2 },
  recordDate: { fontSize: 12, color: '#999', marginBottom: 5, fontWeight: 'bold' },
  recordTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  recordDesc: { color: '#555', marginTop: 5, lineHeight: 20 },
  recordDoctor: { fontSize: 12, color: '#FF8E9E', marginTop: 8, fontStyle: 'italic' },
  
  backBtn: { position: 'absolute', bottom: 30, left: 30, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#fff', borderRadius: 20, elevation: 5 }
});