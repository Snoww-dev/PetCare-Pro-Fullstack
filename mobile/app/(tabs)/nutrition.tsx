import React, { useState } from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

export default function NutritionScreen() {
  const router = useRouter();
  
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState<number | null>(null);
  const [result, setResult] = useState<any>(null);

  // Danh sách mức độ vận động
  const activities = [
    { id: 1.2, label: '💤 Lười / Đã triệt sản', icon: '🛋️' },
    { id: 1.6, label: '🐕 Bình thường', icon: '🎾' },
    { id: 2.0, label: '⚡ Hiếu động / Bé con', icon: '🚀' },
  ];

  const calculateNutrition = () => {
    Keyboard.dismiss();
    const w = parseFloat(weight);

    if (!w || !activity) {
      alert('Vui lòng nhập cân nặng và chọn mức độ vận động!');
      return;
    }

    // 1. Tính RER (Năng lượng nghỉ) = 70 * weight^0.75
    const rer = 70 * Math.pow(w, 0.75);
    
    // 2. Tính MER (Năng lượng cần thiết mỗi ngày)
    const dailyCalories = rer * activity;

    // 3. Tính lượng thức ăn (Giả sử hạt trung bình 350 kcal/100g => 3.5 kcal/g)
    const foodGrams = dailyCalories / 3.5;

    setResult({
      calories: Math.round(dailyCalories),
      grams: Math.round(foodGrams)
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Header */}
        <LinearGradient colors={['#FF9A9E', '#FECFEF']} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={{fontSize: 22}}>⬅️</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tính Khẩu Phần 🥦</Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.content}>
          
          {/* 1. Nhập cân nặng */}
          <Animatable.View animation="fadeInLeft" delay={200} style={styles.section}>
            <Text style={styles.label}>Cân nặng của bé (kg):</Text>
            <TextInput 
              style={styles.input} 
              keyboardType="numeric" 
              placeholder="Ví dụ: 5.5"
              placeholderTextColor="#ccc"
              value={weight}
              onChangeText={setWeight}
            />
          </Animatable.View>

          {/* 2. Chọn mức độ vận động */}
          <Animatable.View animation="fadeInRight" delay={400} style={styles.section}>
            <Text style={styles.label}>Mức độ hoạt động:</Text>
            <View style={styles.grid}>
              {activities.map((item) => (
                <TouchableOpacity 
                  key={item.id}
                  style={[styles.optionCard, activity === item.id && styles.optionSelected]}
                  onPress={() => setActivity(item.id)}
                >
                  <Text style={styles.optionIcon}>{item.icon}</Text>
                  <Text style={[styles.optionLabel, activity === item.id && {color: '#FF6B81', fontWeight: 'bold'}]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animatable.View>

          {/* 3. Nút tính toán */}
          <TouchableOpacity onPress={calculateNutrition} style={styles.calcBtnWrapper}>
            <LinearGradient colors={['#FF9A9E', '#FF6B81']} style={styles.calcBtn}>
              <Text style={styles.btnText}>TÍNH TOÁN NGAY ✨</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* 4. Kết quả (Chỉ hiện khi đã tính) */}
          {result && (
            <Animatable.View animation="bounceIn" style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>🍽️ Thực đơn hôm nay</Text>
              </View>
              
              <View style={styles.resultRow}>
                <View style={styles.resultItem}>
                  <Text style={styles.resultValue}>{result.calories}</Text>
                  <Text style={styles.resultUnit}>Kcal / ngày</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.resultItem}>
                  <Text style={styles.resultValue}>{result.grams}</Text>
                  <Text style={styles.resultUnit}>Gram hạt</Text>
                </View>
              </View>

              <Text style={styles.note}>
                *Lưu ý: Đây là số liệu ước tính cho thức ăn hạt tiêu chuẩn. Hãy điều chỉnh tùy theo thực tế nhé!
              </Text>
            </Animatable.View>
          )}

        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F3' },
  header: {
    paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center',
    borderBottomLeftRadius: 25, borderBottomRightRadius: 25, elevation: 5
  },
  backBtn: { marginRight: 15, backgroundColor: 'rgba(255,255,255,0.4)', padding: 5, borderRadius: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },

  content: { padding: 20 },
  section: { marginBottom: 25 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#555', marginBottom: 10 },
  
  input: {
    backgroundColor: '#fff', borderRadius: 15, padding: 15, fontSize: 18,
    borderWidth: 1, borderColor: '#eee', color: '#FF6B81', fontWeight: 'bold', textAlign: 'center'
  },

  grid: { flexDirection: 'column' },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: 'transparent',
    elevation: 2
  },
  optionSelected: { borderColor: '#FF9A9E', backgroundColor: '#FFF0F3' },
  optionIcon: { fontSize: 24, marginRight: 15 },
  optionLabel: { fontSize: 16, color: '#555' },

  calcBtnWrapper: { marginVertical: 10 },
  calcBtn: { padding: 18, borderRadius: 30, alignItems: 'center', shadowColor: '#FF6B81', shadowOpacity: 0.3, elevation: 5 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  resultCard: {
    marginTop: 20, backgroundColor: '#fff', borderRadius: 20, padding: 20,
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.1
  },
  resultHeader: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10, marginBottom: 15 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#FF6B81', textAlign: 'center' },
  
  resultRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  resultItem: { alignItems: 'center' },
  resultValue: { fontSize: 32, fontWeight: 'bold', color: '#333' },
  resultUnit: { fontSize: 14, color: '#888' },
  divider: { width: 1, height: 40, backgroundColor: '#eee' },

  note: { marginTop: 15, fontSize: 12, color: '#aaa', fontStyle: 'italic', textAlign: 'center' }
});