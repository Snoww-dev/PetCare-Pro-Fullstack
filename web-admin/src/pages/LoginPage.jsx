import React, { useState } from 'react';
import { Form, Input, Button, Card, ConfigProvider, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Thay link API của bạn vào đây
      const res = await axios.post('https://petcare-api-tuyet.onrender.com/api/auth/login', values);
      if (res.data) {
        localStorage.setItem('adminToken', res.data.token);
        message.success('Đăng nhập thành công! 🌸');
        navigate('/dashboard'); // Chuyển hướng sang trang Dashboard
      }
    } catch (error) {
      message.error('Sai email hoặc mật khẩu rồi nè! 😅');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#ff69b4' } }}>
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fff0f5' }}>
        <Card style={{ width: 400, borderRadius: 20, boxShadow: '0 10px 30px rgba(255, 105, 180, 0.2)' }}>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <div style={{ fontSize: 50 }}>🐱</div>
            <h2 style={{ color: '#ff69b4', fontWeight: 'bold' }}>PetCare Admin</h2>
            <p style={{ color: '#aaa' }}>Hệ thống quản lý siêu cấp vip pro</p>
          </div>

          <Form name="login" onFinish={onFinish} size="large">
            <Form.Item name="email" rules={[{ required: true, message: 'Nhập email đi bạn ơi!' }]}>
              <Input prefix={<UserOutlined />} placeholder="Email" />
            </Form.Item>

            <Form.Item name="password" rules={[{ required: true, message: 'Quên nhập mật khẩu à?' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ borderRadius: 20, height: 45, fontWeight: 'bold' }}>
                ĐĂNG NHẬP NGAY 🚀
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default LoginPage;