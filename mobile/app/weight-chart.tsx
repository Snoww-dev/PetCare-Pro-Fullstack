import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, Modal, TextInput, Alert, Dimensions 
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

export default function WeightChartScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [petName, setPetName] = useState('');
  
  // Filter Time
  const [filter, setFilter] = useState('6M'); // 1M, 3M, 6M, ALL

  // Modal Add
  const [modalVisible, setModalVisible] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newDate, setNewDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Tooltip State (Khi bấm vào chấm tròn)
  const [tooltip, setTooltip] = useState<{x: number, y: number, value: number, index: number} | null>(null);

  const API_URL = `https://petcare-api-tuyet.onrender.com/api/pets/${petId}`;

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data.data;
      setPetName(data.name);
      
      // Sắp xếp lịch sử theo thời gian tăng dần
      const sortedHistory = (data.weight_history || []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setHistory(sortedHistory);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const handleAddWeight = async () => {
    if (!newWeight) return Alert.alert("Thiếu thông tin", "Vui lòng nhập số cân!");
    try {
        const token = await AsyncStorage.getItem('token');
        await axios.post(`${API_URL}/weight`, {
            weight: parseFloat(newWeight),
            date: newDate.toISOString(),
            note: newNote
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        setModalVisible(false);
        setNewWeight(''); setNewNote('');
        fetchData();
        Alert.alert("Thành công", "Đã cập nhật cân nặng mới! 📈");
    } catch (e) {
        Alert.alert("Lỗi", "Không lưu được.");
    }
  };

  const handleDelete = (recordId: string) => {
      Alert.alert("Xóa", "Xóa bản ghi này?", [
          { text: "Hủy" },
          { text: "Xóa", style:'destructive', onPress: async () => {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/weight/${recordId}`, { headers: { Authorization: `Bearer ${token}` }});
              fetchData();
          }}
      ]);
  };

  // --- LOGIC LỌC DỮ LIỆU ---
  const filteredData = useMemo(() => {
      if (history.length === 0) return [];
      const now = new Date();
      let cutoffDate = new Date();

      if (filter === '1M') cutoffDate.setMonth(now.getMonth() - 1);
      if (filter === '3M') cutoffDate.setMonth(now.getMonth() - 3);
      if (filter === '6M') cutoffDate.setMonth(now.getMonth() - 6);
      if (filter === 'ALL') cutoffDate = new Date(0); // Lấy tất cả

      return history.filter(item => new Date(item.date) >= cutoffDate);
  }, [history, filter]);

  // --- LOGIC PHÂN TÍCH SỨC KHỎE (LEVEL 4) ---
  const healthAnalysis = useMemo(() => {
      if (history.length < 2) return null;
      const latest = history[history.length - 1];
      const previous = history[history.length - 2];
      const diff = latest.weight - previous.weight;
      const percent = (diff / previous.weight) * 100;

      if (percent <= -10) return { 
          status: 'danger', 
          title: '🚨 BÁO ĐỘNG ĐỎ: Sụt cân nhanh!', 
          msg: `Giảm ${Math.abs(percent).toFixed(1)}% so với lần trước. Đây có thể là dấu hiệu bệnh lý (Giun sán, thận...). Hãy đi khám ngay!` 
      };
      if (percent >= 10) return { 
          status: 'warning', 
          title: '🟠 Cảnh báo: Tăng cân nhanh', 
          msg: `Tăng ${percent.toFixed(1)}%. Cẩn thận béo phì nhé. Hãy xem lại chế độ ăn.`,
          action: 'diet' 
      };
      if (diff < 0) return { status: 'info', title: '📉 Giảm nhẹ', msg: `Bé giảm ${Math.abs(diff)}kg. Hãy theo dõi thêm.` };
      return { status: 'success', title: '✅ Ổn định / Tăng trưởng tốt', msg: 'Cân nặng duy trì ở mức tốt.' };
  }, [history]);

  // --- CHART DATA PREPARATION ---
  const chartData = {
      labels: filteredData.map(d => {
          const date = new Date(d.date);
          return `${date.getDate()}/${date.getMonth()+1}`;
      }),
      datasets: [{
          data: filteredData.map(d => d.weight),
          color: (opacity = 1) => `rgba(255, 107, 129, ${opacity})`, 
          strokeWidth: 3 
      }]
  };

  return (
    <View style={styles.container}>
        <LinearGradient colors={['#FFF0F3', '#fff']} style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#FF6B81"/></TouchableOpacity>
            <Text style={styles.headerTitle}>Biểu Đồ Cân Nặng ⚖️</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}><Ionicons name="add" size={30} color="#FF6B81"/></TouchableOpacity>
        </LinearGradient>

        {loading ? <ActivityIndicator size="large" color="#FF6B81" style={{marginTop:50}}/> : (
            <ScrollView showsVerticalScrollIndicator={false}>
                
                {/* 1. FILTER TABS */}
                <View style={styles.filterContainer}>
                    {['1M', '3M', '6M', 'ALL'].map((f) => (
                        <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterBtn, filter === f && styles.filterBtnActive]}>
                            <Text style={[styles.filterText, filter === f && {color:'#fff'}]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 2. CHART AREA */}
                {filteredData.length > 0 ? (
                    <View style={styles.chartWrapper}>
                        <Text style={styles.chartTitle}>Xu hướng cân nặng ({petName})</Text>
                        <LineChart
                            data={chartData}
                            width={width - 40}
                            height={220}
                            yAxisSuffix="kg"
                            chartConfig={{
                                backgroundColor: "#fff",
                                backgroundGradientFrom: "#fff",
                                backgroundGradientTo: "#fff",
                                decimalPlaces: 1,
                                color: (opacity = 1) => `rgba(255, 107, 129, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                style: { borderRadius: 16 },
                                propsForDots: { r: "5", strokeWidth: "2", stroke: "#FF6B81" }
                            }}
                            bezier // Đường cong mềm mại
                            style={{ marginVertical: 8, borderRadius: 16 }}
                            onDataPointClick={(data) => {
                                const record = filteredData[data.index];
                                Alert.alert(
                                    `Ngày ${new Date(record.date).toLocaleDateString('vi-VN')}`,
                                    `Cân nặng: ${record.weight}kg\n${record.note ? 'Ghi chú: ' + record.note : ''}`
                                );
                            }}
                        />
                        <Text style={styles.hintText}>💡 Chạm vào chấm tròn để xem chi tiết</Text>
                    </View>
                ) : (
                    <View style={styles.emptyBox}>
                        <Text style={{color:'#999'}}>Chưa có dữ liệu trong khoảng thời gian này.</Text>
                    </View>
                )}

                {/* 3. HEALTH ANALYSIS (LEVEL 4 & 5) */}
                {healthAnalysis && (
                    <View style={[styles.analysisBox, 
                        healthAnalysis.status === 'danger' ? styles.bgDanger : 
                        healthAnalysis.status === 'warning' ? styles.bgWarning : styles.bgSuccess
                    ]}>
                        <Text style={[styles.analysisTitle, 
                             healthAnalysis.status === 'danger' ? {color:'#D32F2F'} : 
                             healthAnalysis.status === 'warning' ? {color:'#E65100'} : {color:'#2E7D32'}
                        ]}>{healthAnalysis.title}</Text>
                        <Text style={styles.analysisMsg}>{healthAnalysis.msg}</Text>
                        
                        {/* Level 5: Link to Diet */}
                        {healthAnalysis.action === 'diet' && (
                            <TouchableOpacity style={styles.linkBtn} onPress={() => router.push({ pathname: '/diet-plan', params: { petId } } as any)}>
                                <Text style={styles.linkText}>👉 Điều chỉnh thực đơn ngay</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* 4. HISTORY LIST */}
                <View style={styles.historySection}>
                    <Text style={styles.historyHeader}>Lịch sử chi tiết</Text>
                    {history.slice().reverse().map((item, index) => (
                        <View key={index} style={styles.historyItem}>
                            <View>
                                <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString('vi-VN')}</Text>
                                {item.note ? <Text style={styles.historyNote}>{item.note}</Text> : null}
                            </View>
                            <View style={{flexDirection:'row', alignItems:'center'}}>
                                <Text style={styles.historyWeight}>{item.weight} kg</Text>
                                <TouchableOpacity onPress={() => handleDelete(item._id)} style={{marginLeft:10}}>
                                    <Ionicons name="trash-outline" size={18} color="#ccc"/>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
                <View style={{height:50}}/>
            </ScrollView>
        )}

        {/* MODAL ADD */}
        <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
            <View style={styles.modalBg}>
                <View style={styles.modalCard}>
                    <Text style={styles.modalTitle}>Cập nhật cân nặng</Text>
                    
                    <Text style={styles.label}>Cân nặng (kg)</Text>
                    <TextInput style={styles.input} value={newWeight} onChangeText={setNewWeight} keyboardType="numeric" placeholder="VD: 5.2" autoFocus />

                    <Text style={styles.label}>Ngày cân</Text>
                    <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                        <Text>{newDate.toLocaleDateString('vi-VN')}</Text>
                        <Ionicons name="calendar" size={20} color="#FF6B81"/>
                    </TouchableOpacity>
                    {showDatePicker && <DateTimePicker value={newDate} mode="date" onChange={(e,d) => {setShowDatePicker(false); if(d) setNewDate(d)}} />}

                    <Text style={styles.label}>Ghi chú (Sự kiện)</Text>
                    <TextInput style={styles.input} value={newNote} onChangeText={setNewNote} placeholder="VD: Mới sổ giun, Ăn hạt mới..." />

                    <View style={styles.modalActions}>
                        <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{color:'#999'}}>Hủy</Text></TouchableOpacity>
                        <TouchableOpacity onPress={handleAddWeight} style={styles.saveBtn}><Text style={{color:'#fff', fontWeight:'bold'}}>Lưu lại</Text></TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { padding: 5 },
  addBtn: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  
  filterContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 15 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#F0F0F0', marginHorizontal: 5 },
  filterBtnActive: { backgroundColor: '#FF6B81' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#666' },

  chartWrapper: { alignItems: 'center', marginHorizontal: 10, padding: 10, backgroundColor: '#FFF0F3', borderRadius: 20 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#FF6B81', marginBottom: 5, alignSelf:'flex-start', marginLeft: 10 },
  hintText: { fontSize: 11, color: '#FF8E9E', marginTop: 5, fontStyle: 'italic' },
  emptyBox: { height: 200, justifyContent: 'center', alignItems: 'center' },

  // Analysis Box
  analysisBox: { margin: 20, padding: 15, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  bgDanger: { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' },
  bgWarning: { backgroundColor: '#FFF3E0', borderColor: '#FFE0B2' },
  bgSuccess: { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' },
  analysisTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  analysisMsg: { fontSize: 14, color: '#555', lineHeight: 20 },
  linkBtn: { marginTop: 10, alignSelf: 'flex-end' },
  linkText: { color: '#0288D1', fontWeight: 'bold', fontSize: 14 },

  historySection: { paddingHorizontal: 20 },
  historyHeader: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  historyDate: { fontSize: 14, color: '#333', fontWeight: '500' },
  historyNote: { fontSize: 12, color: '#999', marginTop: 2 },
  historyWeight: { fontSize: 16, fontWeight: 'bold', color: '#FF6B81' },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 25, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 10, marginBottom: 5 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 10, fontSize: 16 },
  dateBtn: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F5F5F5', padding: 10, borderRadius: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 25, alignItems: 'center', gap: 20 },
  saveBtn: { backgroundColor: '#FF6B81', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 }
});