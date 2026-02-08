import React, { useState, useEffect } from 'react';
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
  KeyboardAvoidingView,
  Modal,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');
const STORAGE_KEY = 'NUTRITION_PLAN_DATA';

// DỮ LIỆU CÁC LOẠI HẠT PHỔ BIẾN
const COMMON_FOODS = {
    dog: [
        { name: 'Royal Canin Mini Adult', kcal: 3950 },
        { name: 'Royal Canin Puppy', kcal: 4250 },
        { name: 'Taste of the Wild (High Protein)', kcal: 3700 },
        { name: 'SmartHeart (Thường)', kcal: 3200 },
        { name: 'Pedigree', kcal: 3400 },
        { name: 'Ganador', kcal: 3500 },
        { name: 'Zenith (Hạt mềm)', kcal: 3000 },
    ],
    cat: [
        { name: 'Royal Canin Indoor 27', kcal: 3750 },
        { name: 'Royal Canin Kitten', kcal: 4100 },
        { name: 'Catsrang (Hàn Quốc)', kcal: 3400 },
        { name: 'Me-O (Thường)', kcal: 3000 },
        { name: 'Whiskas', kcal: 3500 },
        { name: 'Taste of the Wild (Mèo)', kcal: 3800 },
        { name: 'Nutrience (Cao cấp)', kcal: 3900 },
    ]
};

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
  const [foodKcal, setFoodKcal] = useState('3500'); 
  const [treatKcal, setTreatKcal] = useState('0');

  // --- UI STATES ---
  const [foodModalVisible, setFoodModalVisible] = useState(false);

  // --- RESULT STATE ---
  const [result, setResult] = useState<any>(null);
  const [warnings, setWarnings] = useState<any[]>([]);

  useEffect(() => {
    loadSavedPlan();
  }, []);

  const loadSavedPlan = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setSpecies(parsed.species);
        setCurrentWeight(parsed.currentWeight);
        setTargetWeight(parsed.targetWeight);
        setAgeStage(parsed.ageStage);
        setIsNeutered(parsed.isNeutered);
        setActivity(parsed.activity);
        setFoodKcal(parsed.foodKcal);
        setTreatKcal(parsed.treatKcal);
        setResult(parsed.result);
        setWarnings(parsed.warnings);
      }
    } catch (error) {
      console.log('Lỗi tải dữ liệu:', error);
    }
  };

  const resetForm = () => {
    Alert.alert("Làm mới", "Bạn có muốn xóa hết dữ liệu và kế hoạch cũ?", [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa Hết", style: 'destructive', onPress: async () => {
          setCurrentWeight('');
          setTargetWeight('');
          setFoodKcal('3500');
          setTreatKcal('0');
          setResult(null);
          setWarnings([]);
          setSpecies('dog');
          setActivity('normal');
          setIsNeutered(true);
          await AsyncStorage.removeItem(STORAGE_KEY);
      }}
    ]);
  };

  const analyzeNutrition = async () => {
    Keyboard.dismiss();
    const w = parseFloat(currentWeight);
    const target = parseFloat(targetWeight);
    const kFood = parseFloat(foodKcal) || 3500;
    const kTreat = parseFloat(treatKcal) || 0;

    if (!w || !target) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập cân nặng hiện tại và mục tiêu!');
      return;
    }

    const RER = 70 * Math.pow(w, 0.75);

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

    let dailyCalories = Math.round(RER * K * goalFactor);

    const safeWarnings = [];
    if (goalType === 'lose' && dailyCalories < RER) {
        dailyCalories = Math.round(RER); 
        safeWarnings.push({ type: 'orange', msg: '⚠️ Mức ăn đã được chỉnh về tối thiểu (RER) để bảo vệ nội tạng.' });
    }
    if (Math.abs(w - target) > w * 0.3) {
        safeWarnings.push({ type: 'red', msg: '🛑 Mục tiêu thay đổi >30% trọng lượng là rất lớn. Hãy tham khảo ý kiến bác sĩ!' });
    }

    const kibbleCalories = dailyCalories - kTreat;
    const kibbleGrams = kibbleCalories > 0 ? Math.round((kibbleCalories / kFood) * 1000) : 0;

    let tipList: { icon: string; title: string; desc: string; id: string }[] = [];

    if (goalType === 'lose') {
        tipList = [
            { id: 'lose_1', icon: '🐢', title: 'Ăn chậm no lâu', desc: 'Sử dụng bát ăn chậm (Slow Feeder) để kéo dài thời gian ăn.' },
            { id: 'lose_2', icon: '🥦', title: 'Độn thêm chất xơ', desc: 'Trộn bí đỏ luộc hoặc đậu que vào hạt. Giúp no lâu mà ít calo.' },
            { id: 'lose_3', icon: '🚫', title: 'Không thức ăn người', desc: 'Tuyệt đối không chia sẻ đồ ăn vặt của bạn.' },
            { id: 'lose_4', icon: '💧', title: 'Uống nước trước ăn', desc: 'Cung cấp nước sạch trước khi cho ăn hạt khô.' }
        ];
    } else if (goalType === 'gain') {
        tipList = [
            { id: 'gain_1', icon: '🕒', title: 'Chia nhỏ bữa ăn', desc: 'Chia thành 4-5 bữa nhỏ/ngày để hấp thụ tốt hơn.' },
            { id: 'gain_2', icon: '🌡️', title: 'Hâm nóng thức ăn', desc: 'Thêm chút nước ấm vào hạt để dậy mùi thơm kích thích ăn.' },
            { id: 'gain_3', icon: '🥩', title: 'Chọn hạt giàu đạm', desc: 'Ưu tiên các dòng hạt High Protein hoặc hạt Puppy/Kitten.' },
            { id: 'gain_4', icon: '💊', title: 'Bổ sung vi chất', desc: 'Sử dụng thêm Gel dinh dưỡng hoặc men vi sinh.' }
        ];
    } else {
        tipList = [
            { id: 'main_1', icon: '💧', title: 'Công thức nước', desc: 'Cần nạp khoảng 50-60ml nước trên mỗi 1kg thể trọng/ngày.' },
            { id: 'main_2', icon: '💆', title: 'Massage tiêu hóa', desc: 'Massage nhẹ nhàng vùng bụng sau ăn 1 tiếng.' },
            { id: 'main_3', icon: '🦷', title: 'Chăm sóc răng', desc: 'Đánh răng hoặc dùng xương gặm sạch răng 2-3 lần/tuần.' },
            { id: 'main_4', icon: '⚖️', title: 'Kiểm soát cân nặng', desc: 'Cân định kỳ hàng tuần để theo dõi sức khỏe.' }
        ];
    }

    if (species === 'cat' && (activity === 'low' || goalType === 'maintain')) {
        tipList.unshift({ id: 'cat_1', icon: '⛲', title: 'Ngừa sỏi thận', desc: 'Mèo thích nước động. Hãy thử dùng đài phun nước cho bé.' });
    }

    const shuffledTips = tipList.sort(() => 0.5 - Math.random());
    const selectedTips = shuffledTips.slice(0, 3);

    const newResult = {
        dailyCalories,
        rer: Math.round(RER),
        kibbleGrams,
        goalType,
        weeksToGoal: Math.round(weeksToGoal),
        tips: selectedTips
    };

    setResult(newResult);
    setWarnings(safeWarnings);

    try {
        const dataToSave = {
            species, currentWeight, targetWeight, ageStage, isNeutered, activity, foodKcal, treatKcal,
            result: newResult,
            warnings: safeWarnings
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
        console.log("Lỗi lưu dữ liệu", e);
    }
  };

  const handlePressTip = (tip: any) => {
      Alert.alert(tip.title, "Chức năng xem chi tiết bài viết sẽ sớm ra mắt! 📚");
  };

  const selectFoodFromSuggestion = (kcal: number) => {
      setFoodKcal(kcal.toString());
      setFoodModalVisible(false);
  };

  // --- CHUẨN BỊ DỮ LIỆU BIỂU ĐỒ ---
  const pieData = result ? [
    {
        name: "Nghỉ (RER)",
        population: result.rer,
        color: "#FFAB76",
        legendFontColor: "#555",
        legendFontSize: 13
    },
    {
        name: "Vận động & Khác",
        population: Math.max(0, result.dailyCalories - result.rer),
        color: "#55E6C1",
        legendFontColor: "#555",
        legendFontSize: 13
    }
  ] : [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
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

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
                {/* FORM INPUTS */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>1. Hồ sơ sinh học</Text>
                    <View style={styles.row}>
                        <TouchableOpacity onPress={() => setSpecies('dog')} style={[styles.choiceBtn, species==='dog' && styles.choiceActive]}>
                            <Text style={styles.choiceText}>🐶 Chó</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSpecies('cat')} style={[styles.choiceBtn, species==='cat' && styles.choiceActive]}>
                            <Text style={styles.choiceText}>🐱 Mèo</Text>
                        </TouchableOpacity>
                    </View>
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

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>2. Lối sống & Vận động</Text>
                    <View style={[styles.row, {justifyContent:'space-between', alignItems:'center', marginBottom:15}]}>
                        <Text style={styles.textNormal}>Đã triệt sản?</Text>
                        <Switch trackColor={{ false: "#767577", true: "#81b0ff" }} thumbColor={isNeutered ? "#2575FC" : "#f4f3f4"} onValueChange={setIsNeutered} value={isNeutered} />
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

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>3. Thông tin thức ăn</Text>
                    <View style={styles.rowInput}>
                        <View style={{flex:1, marginRight:10}}>
                            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                                <Text style={styles.label}>Calo Hạt (Kcal/kg)</Text>
                                <TouchableOpacity onPress={() => setFoodModalVisible(true)}>
                                    <Text style={{color: '#2575FC', fontSize: 12, fontWeight: 'bold'}}>🔍 Gợi ý</Text>
                                </TouchableOpacity>
                            </View>
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

                <TouchableOpacity onPress={analyzeNutrition} style={styles.calcBtnWrapper}>
                    <LinearGradient colors={['#6A11CB', '#2575FC']} style={styles.calcBtn}>
                    <Text style={styles.btnText}>PHÂN TÍCH & LẬP KẾ HOẠCH ✨</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* --- RESULT AREA --- */}
                {result && (
                    <Animatable.View animation="fadeInUp" duration={800} style={styles.resultContainer}>
                        
                        <LinearGradient colors={['#FF9966', '#FF5E62']} style={styles.resultHeaderBox}>
                            <Text style={styles.resultLabelHeader}>NHU CẦU NĂNG LƯỢNG THỰC TẾ</Text>
                            <Text style={styles.resultBigNumber}>{result.dailyCalories} <Text style={{fontSize:20}}>Kcal/ngày</Text></Text>
                        </LinearGradient>

                        {/* 👇 BIỂU ĐỒ CALO (CUSTOM LEGEND) */}
                        <View style={styles.chartBox}>
                            <Text style={styles.chartTitle}>Cấu trúc năng lượng</Text>
                            
                            {/* Chart Area */}
                            <View style={{alignItems:'center', marginLeft: -30}}> 
                                <PieChart
                                    data={pieData}
                                    width={width - 60} 
                                    height={200}
                                    chartConfig={{
                                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                    }}
                                    accessor={"population"}
                                    backgroundColor={"transparent"}
                                    paddingLeft={"0"}
                                    center={[(width - 60) / 4, 0]} // Căn giữa vòng tròn
                                    hasLegend={false} // Ẩn legend mặc định
                                    absolute
                                />
                            </View>

                            {/* Custom Legend Area (Không bao giờ bị che) */}
                            <View style={styles.customLegendContainer}>
                                {pieData.map((item, index) => (
                                    <View key={index} style={styles.legendItem}>
                                        <View style={[styles.legendColorBox, {backgroundColor: item.color}]} />
                                        <View>
                                            <Text style={styles.legendTextTitle}>{item.name}</Text>
                                            <Text style={styles.legendTextValue}>{item.population} Kcal</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            <Text style={styles.chartNote}>
                                *RER: Năng lượng tối thiểu để duy trì sự sống (tim đập, hô hấp) khi bé nghỉ ngơi hoàn toàn.
                            </Text>
                        </View>

                        {/* Warnings */}
                        {warnings.map((w, index) => (
                            <View key={index} style={[styles.warningBox, w.type === 'red' ? {backgroundColor:'#FFEBEE', borderColor:'#FFCDD2'} : {backgroundColor:'#FFF3E0', borderColor:'#FFE0B2'}]}>
                                <Text style={{color: w.type==='red'?'#D32F2F':'#E65100'}}>{w.msg}</Text>
                            </View>
                        ))}

                        {/* Meal Plan */}
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

                        {/* Time Estimation */}
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

                        {/* Tips */}
                        <View style={styles.tipSection}>
                            <Text style={styles.tipSectionTitle}>💡 Mẹo chăm sóc dành riêng cho bé</Text>
                            {result.tips.map((tip: any, index: number) => (
                                <TouchableOpacity key={index} style={styles.tipCard} onPress={() => handlePressTip(tip)}>
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

      {/* Modal Suggestion */}
      <Modal animationType="slide" transparent={true} visible={foodModalVisible} onRequestClose={() => setFoodModalVisible(false)}>
        <View style={styles.modalBg}>
            <View style={styles.modalCard}>
                <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:15}}>
                    <Text style={styles.modalHeader}>Các loại hạt phổ biến ({species === 'dog' ? 'Chó' : 'Mèo'})</Text>
                    <TouchableOpacity onPress={() => setFoodModalVisible(false)}><Ionicons name="close" size={24} color="#333"/></TouchableOpacity>
                </View>
                <ScrollView style={{maxHeight: 400}}>
                    {COMMON_FOODS[species].map((item, index) => (
                        <TouchableOpacity key={index} style={styles.foodItem} onPress={() => selectFoodFromSuggestion(item.kcal)}>
                            <View>
                                <Text style={styles.foodName}>{item.name}</Text>
                                <Text style={styles.foodKcal}>{item.kcal} Kcal/kg</Text>
                            </View>
                            <Ionicons name="add-circle-outline" size={24} color="#2575FC" />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
      </Modal>

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
  
  // CHART STYLES (CUSTOM LEGEND)
  chartBox: { backgroundColor: '#fff', padding: 15, borderRadius: 20, marginBottom: 15, elevation: 2 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  chartNote: { fontSize: 11, color: '#888', fontStyle: 'italic', marginTop: 10, textAlign: 'center' },
  
  customLegendContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: -20, marginBottom: 10, flexWrap:'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 5 },
  legendColorBox: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendTextTitle: { fontSize: 12, color: '#666' },
  legendTextValue: { fontSize: 13, fontWeight: 'bold', color: '#333' },

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

  // TIPS
  tipSection: { marginTop: 10 },
  tipSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, marginLeft: 5 },
  tipCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  tipIconBox: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  tipTitleText: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  tipDescText: { fontSize: 12, color: '#666', lineHeight: 18 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 5, maxHeight: '70%' },
  modalHeader: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  foodItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  foodName: { fontSize: 14, fontWeight: '600', color: '#333' },
  foodKcal: { fontSize: 12, color: '#666' }
});