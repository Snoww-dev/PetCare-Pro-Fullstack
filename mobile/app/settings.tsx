import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Switch, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Share 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();

  // --- STATES QUẢN LÝ CÀI ĐẶT ---
  const [isNotiEnabled, setIsNotiEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isBiometric, setIsBiometric] = useState(false); // Đăng nhập vân tay/FaceID
  const [language, setLanguage] = useState('Tiếng Việt');

  // --- CÁC HÀM XỬ LÝ CHỨC NĂNG ---

  // 1. Xóa Cache (Giả lập dọn dẹp bộ nhớ)
  const handleClearCache = () => {
    Alert.alert(
      "Dọn dẹp bộ nhớ",
      "Bạn có chắc muốn xóa bộ nhớ đệm? (Dữ liệu chính vẫn được giữ nguyên)",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa ngay", onPress: () => Alert.alert("Thành công", "Đã giải phóng 45MB bộ nhớ.") }
      ]
    );
  };

  // 2. Chia sẻ ứng dụng
  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Tải ngay PetCare Pro để chăm sóc thú cưng tốt hơn! https://petcare-pro.com',
      });
    } catch (error) {
      console.log(error);
    }
  };

  // 3. Xóa tài khoản (Quan trọng để được duyệt lên App Store/CH Play)
  const handleDeleteAccount = () => {
    Alert.alert(
      "Cảnh báo vùng nguy hiểm ⚠️",
      "Hành động này sẽ xóa vĩnh viễn tài khoản và dữ liệu thú cưng của bạn. Không thể khôi phục!",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa vĩnh viễn", 
          style: "destructive", 
          onPress: () => {
             // Gọi API xóa user ở đây
             Alert.alert("Đã gửi yêu cầu", "Tài khoản của bạn sẽ bị xóa sau 7 ngày.");
             router.replace('/(auth)/login' as any);
          } 
        }
      ]
    );
  };

  // --- COMPONENT CON: MỘT DÒNG CÀI ĐẶT ---
  const SettingItem = ({ icon, color, label, value, type = 'arrow', onPress }: any) => (
    <TouchableOpacity 
      style={styles.row} 
      onPress={type === 'switch' ? () => {} : onPress} // Nếu là switch thì ko bấm vào row
      disabled={type === 'switch'}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconBox, { backgroundColor: color }]}>
          <Ionicons name={icon} size={20} color="#fff" />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>
      
      <View style={styles.rowRight}>
        {type === 'switch' && (
          <Switch 
            value={value} 
            onValueChange={onPress} // Truyền hàm set state vào đây
            trackColor={{ false: "#E0E0E0", true: "#FF9A9E" }}
            thumbColor={value ? "#FF6B81" : "#f4f3f4"}
          />
        )}
        {type === 'arrow' && <Ionicons name="chevron-forward" size={20} color="#ccc" />}
        {type === 'text' && (
           <View style={{flexDirection: 'row', alignItems: 'center'}}>
             <Text style={styles.valueText}>{value}</Text>
             <Ionicons name="chevron-forward" size={20} color="#ccc" />
           </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Cài đặt</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        
        {/* NHÓM 1: TÙY CHỈNH CHUNG */}
        <Text style={styles.sectionTitle}>TÙY CHỈNH CHUNG</Text>
        <View style={styles.sectionContainer}>
            <SettingItem 
                icon="moon" color="#5C6BC0" 
                label="Chế độ tối (Dark Mode)" 
                type="switch" 
                value={isDarkMode} 
                onPress={setIsDarkMode} 
            />
            <View style={styles.separator} />
            <SettingItem 
                icon="language" color="#26A69A" 
                label="Ngôn ngữ" 
                type="text" 
                value={language} 
                onPress={() => Alert.alert("Thông báo", "Hiện tại chỉ hỗ trợ Tiếng Việt.")} 
            />
        </View>

        {/* NHÓM 2: BẢO MẬT & THÔNG BÁO */}
        <Text style={styles.sectionTitle}>BẢO MẬT & THÔNG BÁO</Text>
        <View style={styles.sectionContainer}>
            <SettingItem 
                icon="notifications" color="#FFCA28" 
                label="Thông báo nhắc nhở" 
                type="switch" 
                value={isNotiEnabled} 
                onPress={setIsNotiEnabled} 
            />
            <View style={styles.separator} />
            <SettingItem 
                icon="finger-print" color="#EC407A" 
                label="Đăng nhập vân tay / FaceID" 
                type="switch" 
                value={isBiometric} 
                onPress={setIsBiometric} 
            />
            <View style={styles.separator} />
            <SettingItem 
                icon="lock-closed" color="#78909C" 
                label="Đổi mật khẩu" 
                onPress={() => Alert.alert("Coming Soon", "Tính năng đang phát triển")} 
            />
        </View>

        {/* NHÓM 3: DỮ LIỆU */}
        <Text style={styles.sectionTitle}>DỮ LIỆU & BỘ NHỚ</Text>
        <View style={styles.sectionContainer}>
            <SettingItem 
                icon="trash-bin" color="#FF7043" 
                label="Xóa bộ nhớ đệm (Cache)" 
                onPress={handleClearCache} 
            />
            <View style={styles.separator} />
            <SettingItem 
                icon="cloud-download" color="#42A5F5" 
                label="Xuất dữ liệu sức khỏe (PDF)" 
                onPress={() => Alert.alert("Xuất PDF", "Đang tạo file báo cáo sức khỏe...")} 
            />
        </View>

        {/* NHÓM 4: KHÁC */}
        <Text style={styles.sectionTitle}>THÔNG TIN ỨNG DỤNG</Text>
        <View style={styles.sectionContainer}>
            <SettingItem 
                icon="share-social" color="#AB47BC" 
                label="Chia sẻ với bạn bè" 
                onPress={handleShareApp} 
            />
            <View style={styles.separator} />
            <SettingItem 
                icon="document-text" color="#8D6E63" 
                label="Điều khoản sử dụng" 
                onPress={() => {}} 
            />
            <View style={styles.separator} />
            <SettingItem 
                icon="information-circle" color="#29B6F6" 
                label="Phiên bản ứng dụng" 
                type="text"
                value="1.0.0"
                onPress={() => {}} 
            />
        </View>

        {/* VÙNG NGUY HIỂM */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>Xóa tài khoản vĩnh viễn</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' }, // Màu nền xám nhẹ hiện đại
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: '#fff', elevation: 2 },
  backBtn: { padding: 5 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },

  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#888', marginLeft: 20, marginTop: 25, marginBottom: 10, letterSpacing: 0.5 },
  sectionContainer: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 15, overflow: 'hidden', paddingVertical: 5, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15 },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  
  iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  label: { fontSize: 16, color: '#333', fontWeight: '500' },
  valueText: { fontSize: 14, color: '#888', marginRight: 5 },
  
  separator: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 60 }, // Đường kẻ mờ giữa các dòng

  deleteBtn: { marginTop: 30, marginBottom: 20, alignSelf: 'center', padding: 15 },
  deleteText: { color: '#FF3B30', fontWeight: 'bold', fontSize: 16 }
});