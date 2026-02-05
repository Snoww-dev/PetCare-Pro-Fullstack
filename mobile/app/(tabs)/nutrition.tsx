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
  StatusBar,
  Alert,
  Switch,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';

export default function NutritionScreen() {
  const router = useRouter();

  // --- 1. BIOLOGICAL PROFILE ---
  const [species, setSpecies] = useState<'dog' | 'cat'>('dog');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [ageStage, setAgeStage] = useState<'baby' | 'adult' | 'senior'>('adult');

  // --- 2. LIFESTYLE ---
  const [isNeutered, setIsNeutered] = useState(true);
  const [activity, setActivity] = useState<'low' | 'normal' | 'high'>('normal');

  // --- 3. NUTRITION DATA ---
  const [foodKcal, setFoodKcal] = useState('3500'); // Kcal/kg của hạt
  const [treatKcal, setTreatKcal] = useState('0');  // Kcal pate/súp ăn thêm

  // --- RESULT STATE ---
  const [result, setResult] = useState<any>(null);
  const [warnings, setWarnings] = useState<any[]>([]);

  // --- LOGIC: LÀM MỚI DỮ LIỆU ---
  const resetForm = () => {
    Alert.alert("Làm mới", "Bạn có muốn xóa hết dữ liệu đang nhập?", [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa", style: 'destructive', onPress: () => {
          setCurrentWeight('');
          setTargetWeight('');
          setFoodKcal('3500');
          setTreatKcal('0');
          setResult(null);
          setWarnings([]);
          setSpecies('dog');
          setActivity('normal');
          setIsNeutered(true);
      }}
    ]);
  };

  // --- LOGIC TÍNH TOÁN (THE BRAIN) ---
  const analyzeNutrition = () => {
    Keyboard.dismiss();
    const w = parseFloat(currentWeight);
    const target = parseFloat(targetWeight);
    const kFood = parseFloat(foodKcal) || 3500;
    const kTreat = parseFloat(treatKcal) || 0;

    if (!w || !target) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập cân nặng hiện tại và mục tiêu!');
      return;
    }

    // 1. Tính RER (Năng lượng nghỉ)
    const RER = 70 * Math.pow(w, 0.75);

    // 2. Xác định hệ số K (Factor)
    let K = 1.0;
    if (species === 'dog') {
        if (ageStage === 'baby') K = 3.0;
        else if (isNeutered) K = 1.6;
        else K = 1.8;
        
        if (activity === 'low') K -= 0.2;
        if (activity === 'high') K += 0.4;
    } else {
        if (ageStage === 'baby') K = 2.5;
        else if (isNeutered) K = 1.2;
        else K = 1.4;

        if (activity === 'low') K -= 0.1;
        if (activity === 'high') K += 0.2;
    }

    // 3. Điều chỉnh theo Mục tiêu (Goal)
    let goalFactor = 1.0;
    let goalType = 'maintain'; 
    let weeksToGoal = 0;

    if (target < w) {
        goalType = 'lose';
        goalFactor = 1.0; 
        const weeklyLoss = w * 0.015; 
        weeksToGoal = (w - target) / weeklyLoss;
    } else if (target > w) {
        goalType = 'gain';
        goalFactor = 1.2; 
        const weeklyGain = w * 0.015;
        weeksToGoal = (target - w) / weeklyGain;
    }

    // 4. Tính toán tổng Calo cần thiết
    let dailyCalories = Math.round(RER * K * goalFactor);

    // *Guardrails: Cảnh báo an toàn*
    const safeWarnings = [];
    if (goalType === 'lose' && dailyCalories < RER) {
        dailyCalories = Math.round(RER); 
        safeWarnings.push({ type: 'orange', msg: '⚠️ Mức ăn đã được chỉnh về tối thiểu (RER) để bảo vệ nội tạng.' });
    }
    if (Math.abs(w - target) > w * 0.3) {
        safeWarnings.push({ type: 'red', msg: '🛑 Mục tiêu thay đổi >30% trọng lượng là rất lớn. Hãy tham khảo ý kiến bác sĩ!' });
    }

    // 5. Tính toán khẩu phần Hạt
    const kibbleCalories = dailyCalories - kTreat;
    const kibbleGrams = kibbleCalories > 0 ? Math.round((kibbleCalories / kFood) * 1000) : 0;

    // 6. Contextual Tips Generator (Danh sách mẹo)
    // Cấu trúc dữ liệu chuẩn bị cho việc link tới bài viết sau này
    let tipList: { icon: string; title: string; desc: string; id: string }[] = [];

    if (goalType === 'lose') {
        tipList = [
            { id: 'lose_1', icon: '🐢', title: 'Ăn chậm no lâu', desc: 'Sử dụng bát ăn chậm (Slow Feeder) để kéo dài thời gian ăn, giúp não bộ thú cưng kịp nhận tín hiệu no.' },
            { id: 'lose_2', icon: '🥦', title: 'Độn thêm chất xơ', desc: 'Trộn bí đỏ luộc hoặc đậu que vào hạt. Vừa tăng thể tích bữa ăn giúp no bụng, vừa ít calo.' },
            { id: 'lose_3', icon: '🚫', title: 'Nói không với thức ăn người', desc: 'Tuyệt đối không chia sẻ đồ ăn vặt của bạn. Một miếng phô mai nhỏ với người là cả một bữa ăn với chúng.' },
            { id: 'lose_4', icon: '💧', title: 'Uống nước trước bữa ăn', desc: 'Cung cấp nước sạch trước khi cho ăn hạt khô để tăng cảm giác no.' }
        ];
    } else if (goalType === 'gain') {
        tipList = [
            { id: 'gain_1', icon: '🕒', title: 'Chia nhỏ bữa ăn', desc: 'Chia thành 4-5 bữa nhỏ/ngày thay vì 2 bữa lớn để hệ tiêu hóa hấp thụ tối đa dưỡng chất.' },
            { id: 'gain_2', icon: '🌡️', title: 'Kích thích khứu giác', desc: 'Hâm nóng thức ăn nhẹ hoặc thêm chút nước ấm vào hạt để dậy mùi thơm, kích thích thèm ăn.' },
            { id: 'gain_3', icon: '🥩', title: 'Chọn hạt giàu đạm', desc: 'Ưu tiên các dòng hạt High Protein hoặc hạt dành cho con non (Puppy/Kitten) có năng lượng cao.' },
            { id: 'gain_4', icon: '💊', title: 'Bổ sung vi chất', desc: 'Sử dụng thêm Gel dinh dưỡng hoặc men vi sinh theo chỉ định để cải thiện đường ruột.' }
        ];
    } else {
        tipList = [
            { id: 'main_1', icon: '💧', title: 'Công thức nước chuẩn', desc: 'Luôn cung cấp đủ nước sạch. Trung bình 1kg thể trọng cần nạp khoảng 50-60ml nước/ngày.' },
            { id: 'main_2', icon: '💆', title: 'Massage tiêu hóa', desc: 'Massage nhẹ nhàng vùng bụng theo chiều kim đồng hồ sau ăn 1 tiếng để hỗ trợ tiêu hóa.' },
            { id: 'main_3', icon: '🦷', title: 'Chăm sóc răng miệng', desc: 'Đánh răng hoặc dùng xương gặm sạch răng 2-3 lần/tuần để nướu luôn khỏe mạnh.' },
            { id: 'main_4', icon: '⚖️', title: 'Kiểm soát cân nặng', desc: 'Cân định kỳ hàng tuần. Thay đổi cân nặng đột ngột là dấu hiệu sớm của nhiều bệnh lý.' }
        ];
    }

    // Mẹo đặc biệt cho Mèo
    if (species === 'cat') {
        if (activity === 'low' || goalType === 'maintain') {
             tipList.unshift({ id: 'cat_1', icon: '⛲', title: 'Ngừa sỏi thận', desc: 'Mèo thích nước động. Hãy thử dùng đài phun nước (Water Fountain) để kích thích bé uống nhiều hơn.' });
        }
    }

    setResult({
        dailyCalories,
        kibbleGrams,
        goalType,
        weeksToGoal: Math.round(weeksToGoal),
        tips: tipList // Trả về cả danh sách
    });
    setWarnings(safeWarnings);
  };

  // Hàm xử lý khi bấm vào mẹo (Chuẩn bị cho tương lai)
  const handlePressTip = (tip: any) => {
      // Sau này sẽ navigate tới trang bài viết chi tiết
      // router.push(`/articles/${tip.id}`);
      Alert.alert(tip.title, "Chức năng xem chi tiết bài viết sẽ sớm ra mắt! 📚");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient colors={['#6A11CB', '#2575FC']} style={styles.header}>
        <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={resetForm} style={styles.refreshBtn}>
                <Ionicons name="refresh" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
        <View>
          <Text style={styles.headerTitle}>Smart Nutrition Coach 🧬</Text>
          <Text style={styles.headerSubtitle}>Trợ lý dinh dưỡng chuẩn chuyên gia</Text>
        </View>
      </LinearGradient>

      {/* ScrollView & Keyboard Handling */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
      >
        <ScrollView 
            contentContainerStyle={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
                {/* --- SECTION 1: HỒ SƠ SINH HỌC --- */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>1. Hồ sơ sinh học</Text>
                    
                    {/* Chọn loài */}
                    <View style={styles.row}>
                        <TouchableOpacity onPress={() => setSpecies('dog')} style={[styles.choiceBtn, species==='dog' && styles.choiceActive]}>
                            <Text style={styles.choiceText}>🐶 Chó</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSpecies('cat')} style={[styles.choiceBtn, species==='cat' && styles.choiceActive]}>
                            <Text style={styles.choiceText}>🐱 Mèo</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Cân nặng */}
                    <View style={styles.rowInput}>
                        <View style={{flex:1, marginRight:10}}>
                            <Text style={styles.label}>Hiện tại (kg)</Text>
                            <TextInput style={styles.input} keyboardType="numeric" value={currentWeight} onChangeText={setCurrentWeight} placeholder="0.0" />
                        </View>
                        <View style={{flex:1}}>
                            <Text style={styles.label}>Mục tiêu (kg)</Text>
                            <TextInput style={[styles.input, {borderColor: '#2575FC'}]} keyboardType="numeric" value={targetWeight} onChangeText={setTargetWeight} placeholder="0.0" />
                        </View>
                    </View>

                    {/* Độ tuổi */}
                    <Text style={styles.label}>Giai đoạn phát triển</Text>
                    <View style={styles.row}>
                        <TouchableOpacity onPress={() => setAgeStage('baby')} style={[styles.choiceBtnSmall, ageStage==='baby' && styles.choiceActive]}>
                            <Text style={styles.choiceTextSmall}>Sơ sinh</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setAgeStage('adult')} style={[styles.choiceBtnSmall, ageStage==='adult' && styles.choiceActive]}>
                            <Text style={styles.choiceTextSmall}>Trưởng thành</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setAgeStage('senior')} style={[styles.choiceBtnSmall, ageStage==='senior' && styles.choiceActive]}>
                            <Text style={styles.choiceTextSmall}>Già</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- SECTION 2: LỐI SỐNG --- */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>2. Lối sống & Vận động</Text>
                    
                    <View style={[styles.row, {justifyContent:'space-between', alignItems:'center', marginBottom:15}]}>
                        <Text style={styles.textNormal}>Đã triệt sản?</Text>
                        <Switch 
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            thumbColor={isNeutered ? "#2575FC" : "#f4f3f4"}
                            onValueChange={setIsNeutered} value={isNeutered} 
                        />
                    </View>

                    <Text style={styles.label}>Mức độ vận động</Text>
                    <View style={styles.row}>
                        <TouchableOpacity onPress={() => setActivity('low')} style={[styles.choiceBtnSmall, activity==='low' && styles.choiceActive]}>
                            <Text style={styles.choiceTextSmall}>💤 Lười</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setActivity('normal')} style={[styles.choiceBtnSmall, activity==='normal' && styles.choiceActive]}>
                            <Text style={styles.choiceTextSmall}>🐕 Vừa phải</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setActivity('high')} style={[styles.choiceBtnSmall, activity==='high' && styles.choiceActive]}>
                            <Text style={styles.choiceTextSmall}>⚡ Siêu quậy</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- SECTION 3: DINH DƯỠNG --- */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>3. Thông tin thức ăn</Text>
                    <View style={styles.rowInput}>
                        <View style={{flex:1, marginRight:10}}>
                            <Text style={styles.label}>Calo Hạt (Kcal/kg)</Text>
                            <TextInput style={styles.input} keyboardType="numeric" value={foodKcal} onChangeText={setFoodKcal} placeholder="3500" />
                            <Text style={styles.hint}>*Xem trên bao bì</Text>
                        </View>
                        <View style={{flex:1}}>
                            <Text style={styles.label}>Ăn thêm (Kcal/ngày)</Text>
                            <TextInput style={styles.input} keyboardType="numeric" value={treatKcal} onChangeText={setTreatKcal} placeholder="0" />
                            <Text style={styles.hint}>*Pate, súp thưởng...</Text>
                        </View>
                    </View>
                </View>

                {/* BUTTON TÍNH TOÁN */}
                <TouchableOpacity onPress={analyzeNutrition} style={styles.calcBtnWrapper}>
                    <LinearGradient colors={['#6A11CB', '#2575FC']} style={styles.calcBtn}>
                    <Text style={styles.btnText}>PHÂN TÍCH & LẬP KẾ HOẠCH ✨</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* --- RESULT AREA --- */}
                {result && (
                    <Animatable.View animation="fadeInUp" duration={800} style={styles.resultContainer}>
                        
                        {/* 1. Nhu cầu Calo */}
                        <LinearGradient colors={['#FF9966', '#FF5E62']} style={styles.resultHeaderBox}>
                            <Text style={styles.resultLabelHeader}>NHU CẦU NĂNG LƯỢNG THỰC TẾ</Text>
                            <Text style={styles.resultBigNumber}>{result.dailyCalories} <Text style={{fontSize:20}}>Kcal/ngày</Text></Text>
                        </LinearGradient>

                        {/* Cảnh báo */}
                        {warnings.map((w, index) => (
                            <View key={index} style={[styles.warningBox, w.type === 'red' ? {backgroundColor:'#FFEBEE', borderColor:'#FFCDD2'} : {backgroundColor:'#FFF3E0', borderColor:'#FFE0B2'}]}>
                                <Text style={{color: w.type==='red'?'#D32F2F':'#E65100'}}>{w.msg}</Text>
                            </View>
                        ))}

                        {/* 2. Gợi ý thực đơn */}
                        <View style={styles.planBox}>
                            <Text style={styles.planTitle}>🍖 Thực đơn gợi ý</Text>
                            <View style={styles.planRow}>
                                <View style={styles.planItem}>
                                    <Text style={styles.planValue}>{result.kibbleGrams}g</Text>
                                    <Text style={styles.planLabel}>Hạt khô</Text>
                                </View>
                                <Ionicons name="add-circle" size={24} color="#ccc" />
                                <View style={styles.planItem}>
                                    <Text style={styles.planValue}>{parseFloat(treatKcal) > 0 ? treatKcal : 0} Kcal</Text>
                                    <Text style={styles.planLabel}>Pate/Súp</Text>
                                </View>
                            </View>
                            <View style={styles.divider} />
                            <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:10}}>
                                <Text style={{color:'#555'}}>🌞 Sáng: {Math.round(result.kibbleGrams / 2)}g</Text>
                                <Text style={{color:'#555'}}>🌙 Tối: {Math.round(result.kibbleGrams / 2)}g</Text>
                            </View>
                        </View>

                        {/* 3. Thời gian ước tính (Nếu tăng/giảm cân) */}
                        {result.goalType !== 'maintain' && (
                            <View style={styles.timeBox}>
                                <Text style={styles.timeTitle}>🕒 Lộ trình ước tính</Text>
                                <View style={styles.progressBarBg}>
                                    <LinearGradient colors={['#56CCF2', '#2F80ED']} style={[styles.progressBarFill, {width: '50%'}]} />
                                </View>
                                <Text style={styles.timeText}>
                                    Để đạt {targetWeight}kg, bé cần khoảng <Text style={{fontWeight:'bold', color:'#2F80ED'}}>{result.weeksToGoal} tuần</Text> nếu tuân thủ đúng lộ trình này.
                                </Text>
                            </View>
                        )}

                        {/* 5. DANH SÁCH MẸO HAY (Nâng cấp) */}
                        <View style={styles.tipSection}>
                            <Text style={styles.tipSectionTitle}>💡 Mẹo chăm sóc dành riêng cho bé</Text>
                            {result.tips.map((tip: any, index: number) => (
                                <TouchableOpacity 
                                    key={index} 
                                    style={styles.tipCard}
                                    onPress={() => handlePressTip(tip)} // Sự kiện click
                                >
                                    <View style={styles.tipIconBox}>
                                        <Text style={{fontSize: 24}}>{tip.icon}</Text>
                                    </View>
                                    <View style={{flex:1}}>
                                        <Text style={styles.tipTitleText}>{tip.title}</Text>
                                        <Text style={styles.tipDescText}>{tip.desc}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={{height: 100}}/>
                    </Animatable.View>
                )}
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 8,
    zIndex: 10
  },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  backBtn: { padding: 5 },
  refreshBtn: { padding: 5 }, 
  
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  content: { padding: 20, paddingBottom: 150 }, 
  
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2, shadowColor:'#000', shadowOpacity:0.05 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15, borderBottomWidth:1, borderBottomColor:'#eee', paddingBottom:10 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  rowInput: { flexDirection: 'row', marginBottom: 15 },
  
  label: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8 },
  textNormal: { fontSize: 15, color: '#333' },
  hint: { fontSize: 11, color: '#999', marginTop: 4, fontStyle: 'italic' },

  input: {
    backgroundColor: '#F8F9FA', borderRadius: 12, padding: 12, fontSize: 16,
    borderWidth: 1, borderColor: '#eee', color: '#333', fontWeight: 'bold', textAlign: 'center'
  },

  choiceBtn: { flex: 0.48, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee', alignItems: 'center' },
  choiceBtnSmall: { flex: 0.3, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#eee', alignItems: 'center' },
  choiceActive: { backgroundColor: '#E3F2FD', borderColor: '#2575FC' },
  choiceText: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  choiceTextSmall: { fontSize: 12, fontWeight: '600', color: '#555' },

  calcBtnWrapper: { marginVertical: 10 },
  calcBtn: { padding: 18, borderRadius: 30, alignItems: 'center', shadowColor: '#2575FC', shadowOpacity: 0.3, elevation: 5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },

  // RESULTS
  resultContainer: { marginTop: 10 },
  resultHeaderBox: { padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 15, elevation: 3 },
  resultLabelHeader: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  resultBigNumber: { fontSize: 36, fontWeight: 'bold', color: '#fff' },

  warningBox: { padding: 10, borderRadius: 10, marginBottom: 15, borderWidth: 1 },

  planBox: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 15, elevation: 2 },
  planTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  planRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  planItem: { alignItems: 'center' },
  planValue: { fontSize: 24, fontWeight: 'bold', color: '#2575FC' },
  planLabel: { fontSize: 13, color: '#888' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },

  timeBox: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 15 },
  timeTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  progressBarBg: { height: 8, backgroundColor: '#eee', borderRadius: 4, marginBottom: 10, overflow:'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  timeText: { fontSize: 13, color: '#666', lineHeight: 20 },

  // TIP SECTION STYLES (NEW)
  tipSection: { marginTop: 10 },
  tipSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, marginLeft: 5 },
  tipCard: { 
      flexDirection: 'row', alignItems: 'center', 
      backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 10, 
      elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 
  },
  tipIconBox: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  tipTitleText: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  tipDescText: { fontSize: 12, color: '#666', lineHeight: 18 },
});