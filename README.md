# 🐾 PetCare Pro - Hệ sinh thái Chăm sóc & Quản lý Thú cưng Thông minh

![PetCare Pro Banner](https://via.placeholder.com/1200x400?text=PetCare+Pro+Fullstack+System) 
*(Dự án Demo phục vụ mục đích học tập và tuyển dụng)*

## 📖 Giới thiệu (Introduction)

**PetCare Pro** là giải pháp công nghệ toàn diện dành cho những người yêu thú cưng. Dự án được xây dựng với kiến trúc **Monorepo** hiện đại, kết hợp sức mạnh của **Node.js** ở Backend và **React Native** ở Frontend, mang lại trải nghiệm mượt mà và đồng bộ trên đa nền tảng.

Sứ mệnh của PetCare Pro không chỉ dừng lại ở việc lưu trữ thông tin, mà còn là một "trợ lý ảo" đắc lực hỗ trợ sức khỏe, dinh dưỡng và kết nối cộng đồng người nuôi thú cưng.

---

## 🚀 Tech Stack (Công nghệ sử dụng)

Dự án sử dụng các công nghệ tiên tiến nhất hiện nay để đảm bảo hiệu năng và khả năng mở rộng:

| Phân hệ | Công nghệ chính | Mô tả |
| :--- | :--- | :--- |
| **Backend** | **Node.js, Express.js** | Xây dựng RESTful API hiệu suất cao. |
| **Database** | **MongoDB (Atlas)** | Lưu trữ dữ liệu linh hoạt (NoSQL) với Mongoose ODM. |
| **Mobile App** | **React Native (Expo)** | Ứng dụng đa nền tảng (iOS/Android) với giao diện hiện đại. |
| **Authentication**| **JWT (JSON Web Token)** | Cơ chế bảo mật và phân quyền người dùng (User/Admin). |
| **Networking** | **Axios** | Quản lý các request API và xử lý lỗi tập trung. |

---

## 🌟 Tính năng Chính (Key Features)

### 🧑‍⚕️ 1. Chăm sóc & Cá nhân hóa (Core)
- **Hồ sơ sức khỏe điện tử (E-Health Profile):** Quản lý timeline quá trình lớn lên của thú cưng. Lưu trữ lịch sử tiêm chủng, bệnh án.
- **Hệ thống CRUD:** Thêm, xem, sửa, xóa thông tin thú cưng nhanh chóng.

### 🔮 Lộ trình phát triển (Roadmap & Vision)

Dự án đang được phát triển theo lộ trình dài hạn với các tính năng đột phá:

#### Giai đoạn 1: Tiện ích thông minh (Smart Utilities)
- **Smart Reminders:** Hệ thống Cron Job quét database mỗi ngày, tự động bắn thông báo nhắc lịch tiêm phòng qua Push Notification/Zalo.
- **Nutrition Calculator:** Thuật toán tính toán khẩu phần ăn & calo dựa trên cân nặng, giống loài và mức độ vận động.
- **Booking & Services:** Tích hợp Google Maps API để tìm Spa/Phòng khám gần nhất và đặt lịch hẹn thời gian thực.

#### Giai đoạn 2: Kết nối & Gamification
- **Pet Social Feed:** Mạng xã hội thu nhỏ (tương tự Instagram) cho thú cưng với khả năng tương tác Real-time (Socket.io).
- **Pet Coin:** Hệ thống tích điểm đổi Voucher khi thực hiện các nhiệm vụ chăm sóc hàng ngày.

#### Giai đoạn 3: High-Tech & AI Integration (Mobile First)
- **AI Pet Scanner:** Sử dụng AI (TensorFlow.js) để nhận diện cảm xúc, giống loài và phát hiện bệnh ngoài da qua camera.
- **QR Smart Tag:** "Thẻ bài hộ mệnh" định danh thú cưng, tự động gửi GPS về cho chủ nhân khi được quét.
- **Dog Walking Tracker:** Vẽ bản đồ quãng đường đi dạo và tính calo tiêu thụ cho cả Sen và Boss.

---

## 🛠️ Hướng dẫn Cài đặt & Sử dụng (Installation Guide)

Để chạy dự án này trên máy local, bạn vui lòng làm theo các bước sau:

### 1. Yêu cầu hệ thống
- **Node.js** (v18 trở lên)
- **npm** hoặc **yarn**
- Ứng dụng **Expo Go** trên điện thoại (để test Mobile App)

### 2. Cài đặt & Chạy Backend (Server)

```bash
# Bước 1: Clone dự án về máy
git clone https://github.com/Snoww-dev/PetCare-Pro-Fullstack.git
cd PetCare-Pro-Fullstack/backend

# Bước 2: Cài đặt các thư viện
npm install

# Bước 3: Cấu hình môi trường (.env)
# Tạo file .env ở thư mục gốc backend và thêm nội dung:
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_super_secret_key
# PORT=5000

# Bước 4: Khởi chạy Server
npm start
# Server sẽ chạy tại: http://localhost:5000

### 3. Cài đặt & Chạy Mobile App

```bash
# Mở một terminal mới (Giữ nguyên Terminal đang chạy Server)
# Di chuyển vào thư mục mobile
cd mobile

# Bước 1: Cài đặt các thư viện cần thiết
npm install

# Bước 2: Cấu hình địa chỉ IP (Quan trọng!)
# Mở các file trong thư mục app/ (như home.tsx, add-pet.tsx, edit-pet.tsx)
# Tìm biến API_URL và đổi thành IP máy tính của bạn
# Ví dụ: [http://192.168.1.5:5000](http://192.168.1.5:5000) (Thay 192.168.1.5 bằng IP của bạn)

# Bước 3: Khởi chạy ứng dụng
npx expo start