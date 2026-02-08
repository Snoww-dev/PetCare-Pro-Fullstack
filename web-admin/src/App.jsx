import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

// --- CẤU HÌNH GIAO DIỆN MÀU HỒNG & GỌN GÀNG ---
const styles = {
  container: { padding: '40px', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif", backgroundColor: '#FFF0F5', minHeight: '100vh', color: '#4a4a4a' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  title: { color: '#D63384', margin: 0, fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' },
  subTitle: { color: '#E667A5', fontSize: '14px', marginTop: '5px' },
  
  // Cards thống kê
  cardContainer: { display: 'flex', gap: '20px', marginBottom: '30px' },
  card: { flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(255, 105, 180, 0.15)', textAlign: 'center', transition: 'transform 0.2s', border: '1px solid #FFE4E1' },
  cardValue: { fontSize: '42px', fontWeight: '800', color: '#FF69B4', margin: '10px 0' },
  cardLabel: { color: '#aaa', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' },
  
  // Bảng danh sách
  tableContainer: { backgroundColor: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' },
  tableHeaderParams: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'},
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }, // Tạo khoảng cách giữa các hàng
  th: { textAlign: 'left', padding: '15px', color: '#888', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' },
  tr: { transition: '0.2s' },
  td: { padding: '15px', backgroundColor: '#fff', borderTop: '1px solid #f8f9fa', borderBottom: '1px solid #f8f9fa', color: '#555', fontSize: '14px' },
  tdFirst: { borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px', borderLeft: '1px solid #f8f9fa' },
  tdLast: { borderTopRightRadius: '10px', borderBottomRightRadius: '10px', borderRight: '1px solid #f8f9fa' },
  
  // Các thành phần nhỏ
  badge: { padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' },
  searchInput: { padding: '12px 20px', width: '300px', borderRadius: '30px', border: '2px solid #FFC0CB', outline: 'none', color: '#D63384', backgroundColor: '#FFF0F5' },
  
  // Nút bấm
  btnGroup: { display:'flex', gap: '10px' },
  btnPrimary: { padding: '10px 20px', cursor:'pointer', backgroundColor:'#FF69B4', color:'white', border:'none', borderRadius:'30px', fontWeight:'bold', boxShadow: '0 4px 15px rgba(255, 105, 180, 0.4)', transition: '0.2s' },
  btnSecondary: { padding: '10px 20px', cursor:'pointer', backgroundColor:'#fff', color:'#FF69B4', border:'2px solid #FF69B4', borderRadius:'30px', fontWeight:'bold' },
  roleBtn: { padding: '6px 12px', fontSize: '11px', cursor: 'pointer', border: 'none', borderRadius: '8px', marginLeft: '10px', fontWeight: 'bold', transition: '0.2s' },

  // Login & Modal
  loginContainer: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF0F5' },
  loginBox: { width: '380px', padding: '40px', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 40px rgba(255, 105, 180, 0.2)', textAlign: 'center' },
  input: { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #eee', borderRadius: '10px', fontSize: '15px', backgroundColor: '#fafafa' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalBox: { width: '400px', backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', border: '1px solid #ffeff5' }
};

const BASE_URL = 'https://petcare-api-tuyet.onrender.com/api'; 

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalPets: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Create User State
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      setIsLoggedIn(true);
      fetchDashboardData();
    }
  }, []);

  const handleLogin = async () => {
    setLoginError('');
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
      if (res.data) {
        localStorage.setItem('adminToken', res.data.token);
        setIsLoggedIn(true);
        fetchDashboardData();
      }
    } catch (error) {
      setLoginError('Mật khẩu hoặc email không đúng nha!');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
    setUsers([]);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/admin/users-stats`);
      if (res.data.success) {
        setUsers(res.data.data);
        setStats(res.data.stats);
      }
    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newName || !newEmail || !newPassword) {
        alert("Nhập thiếu thông tin rồi nè! 😅");
        return;
    }
    try {
        const res = await axios.post(`${BASE_URL}/admin/create-user`, {
            name: newName,
            email: newEmail,
            password: newPassword
        });
        if (res.data.success) {
            alert("✅ " + res.data.message);
            setShowModal(false);
            setNewName(''); setNewEmail(''); setNewPassword('');
            fetchDashboardData();
        }
    } catch (error) {
        alert("❌ Lỗi: " + (error.response?.data?.message || "Không thể tạo user"));
    }
  };

  const handleUpdateRole = async (userId, currentRole, userName) => {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      const actionText = newRole === 'admin' ? 'THĂNG CHỨC' : 'HỦY QUYỀN';
      
      if (window.confirm(`Bạn muốn ${actionText} cho "${userName}" đúng không?`)) {
          try {
              await axios.put(`${BASE_URL}/admin/update-role`, { userId, newRole });
              fetchDashboardData(); 
          } catch (error) {
              alert("Lỗi cập nhật quyền!");
          }
      }
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <div style={{fontSize: '50px', marginBottom: '10px'}}>🐱</div>
          <h2 style={{color: '#FF69B4', marginBottom: '20px'}}>PetCare Login</h2>
          {loginError && <div style={{color: 'red', marginBottom: '15px', fontSize: '13px'}}>{loginError}</div>}
          <input type="email" placeholder="Email Admin" style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)}/>
          <input type="password" placeholder="Mật khẩu" style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)}/>
          <button style={{...styles.btnPrimary, width: '100%', marginTop: '10px'}} onClick={handleLogin} disabled={loading}>
              {loading ? 'Đang vào...' : 'ĐĂNG NHẬP 🌸'}
          </button>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(user => {
    const name = user.name || '';
    const email = user.email || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Xin chào, Tuyết! 👋</h1>
          <p style={styles.subTitle}>Hệ thống quản lý PetCare xinh đẹp</p>
        </div>
        <div style={styles.btnGroup}>
            <button onClick={() => setShowModal(true)} style={{...styles.btnPrimary, backgroundColor: '#20bf6b'}}>
                + Thêm User
            </button>
            <button onClick={fetchDashboardData} style={styles.btnSecondary}>Làm mới 🔄</button>
            <button onClick={handleLogout} style={{...styles.btnSecondary, borderColor:'#fab1a0', color: '#fab1a0'}}>Thoát 🚪</button>
        </div>
      </div>

      <div style={styles.cardContainer}>
        <div style={styles.card}>
            <div style={{fontSize:'30px', marginBottom:'10px'}}>👥</div>
            <div style={styles.cardLabel}>Tổng người dùng</div>
            <div style={styles.cardValue}>{stats.totalUsers}</div>
        </div>
        <div style={styles.card}>
            <div style={{fontSize:'30px', marginBottom:'10px'}}>🐾</div>
            <div style={styles.cardLabel}>Thú cưng</div>
            <div style={styles.cardValue}>{stats.totalPets}</div>
        </div>
        <div style={styles.card}>
            <div style={{fontSize:'30px', marginBottom:'10px'}}>📊</div>
            <div style={styles.cardLabel}>Tỷ lệ sở hữu</div>
            <div style={styles.cardValue}>{stats.totalUsers > 0 ? (stats.totalPets / stats.totalUsers).toFixed(1) : 0}</div>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <div style={styles.tableHeaderParams}>
          <h3 style={{margin:0, color: '#555'}}>Danh sách thành viên ({filteredUsers.length})</h3>
          <input 
            type="text" 
            placeholder="🔍 Tìm kiếm user..." 
            style={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Tên người dùng</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Chức vụ</th>
              <th style={styles.th}>Thú cưng</th>
              <th style={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => {
              // 👇 LOGIC ĐẶC BIỆT: NẾU LÀ TUYẾT THÌ LUÔN LÀ ADMIN
              const isBoss = user.email === 'tuyet@test.com';
              const displayRole = isBoss ? 'admin' : user.role; 

              return (
              <tr key={user._id} style={styles.tr}>
                <td style={{...styles.td, ...styles.tdFirst}}>#{index + 1}</td>
                <td style={styles.td}>
                  <div style={{fontWeight:'bold', color: '#333'}}>{user.name}</div>
                  <div style={{fontSize:'12px', color:'#bbb'}}>{format(new Date(user.createdAt), 'dd/MM/yyyy')}</div>
                </td>
                <td style={styles.td}>{user.email}</td>
                
                <td style={styles.td}>
                    {displayRole === 'admin' ? (
                        <span style={{...styles.badge, backgroundColor: '#FFF3CD', color: '#856404', border: '1px solid #FFEEBA'}}>
                            👑 ADMIN
                        </span>
                    ) : (
                        <span style={{...styles.badge, backgroundColor: '#F0F2F5', color: '#65676B'}}>
                            👤 User
                        </span>
                    )}
                </td>

                <td style={styles.td}>
                  <span style={{...styles.badge, backgroundColor: user.petCount > 0 ? '#E8F5E9' : '#fafafa', color: user.petCount > 0 ? '#2E7D32' : '#ccc'}}>
                    {user.petCount} 🐾
                  </span>
                </td>

                <td style={{...styles.td, ...styles.tdLast}}>
                    {/* Chỉ hiện nút sửa quyền nếu KHÔNG PHẢI là Tuyết */}
                    {!isBoss && ( 
                         <button 
                            onClick={() => handleUpdateRole(user._id, user.role, user.name)}
                            style={{
                                ...styles.roleBtn,
                                backgroundColor: user.role === 'admin' ? '#FF6B6B' : '#4ECDC4',
                                color: 'white',
                                boxShadow: user.role === 'admin' ? '0 2px 5px rgba(255,107,107,0.4)' : '0 2px 5px rgba(78,205,196,0.4)'
                            }}
                         >
                            {user.role === 'admin' ? 'Hủy quyền ⬇️' : 'Thăng chức ⬆️'}
                         </button>
                    )}
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {showModal && (
          <div style={styles.modalOverlay}>
              <div style={styles.modalBox}>
                  <div style={{textAlign:'center', fontSize:'40px', marginBottom:'10px'}}>✨</div>
                  <h3 style={{margin: '0 0 20px 0', color: '#FF69B4', textAlign:'center'}}>Tạo tài khoản mới</h3>
                  <input placeholder="Họ và tên" style={styles.input} value={newName} onChange={e => setNewName(e.target.value)} />
                  <input placeholder="Email đăng nhập" style={styles.input} value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                  <input placeholder="Mật khẩu" type="password" style={styles.input} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  
                  <div style={{display: 'flex', gap: '10px', marginTop:'20px'}}>
                      <button onClick={handleCreateUser} style={{...styles.btnPrimary, width:'100%', backgroundColor: '#20bf6b'}}>Tạo ngay</button>
                      <button onClick={() => setShowModal(false)} style={{...styles.btnSecondary, width:'100%', border:'1px solid #ddd', color: '#888'}}>Hủy</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

export default App;