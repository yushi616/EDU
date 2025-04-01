import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import RegisterUser from './components/RegisterUser';
import UploadGrade from './components/UploadGrade';
import ViewGrades from './components/ViewGrades';
import AdminPanel from './components/AdminPanel';

const App = () => {
  const [account, setAccount] = useState('');

  useEffect(() => {
    const getAccount = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          setAccount(accounts[0]);

          // 监听账户切换
          window.ethereum.on('accountsChanged', (accounts) => {
            setAccount(accounts[0] || '');
          });
        } catch (err) {
          console.error("获取钱包地址失败:", err);
        }
      } else {
        alert('请安装 MetaMask');
      }
    };

    getAccount();
  }, []);

  return (
    <Router>
      <header style={{ 
        padding: '1rem', 
        borderBottom: '1px solid #ddd', 
        marginBottom: '2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div>
          <Link to="/" style={{ marginRight: '1rem', fontWeight: 'bold' }}>🏠 首页</Link>
          <Link to="/register" style={{ marginRight: '1rem' }}>注册用户</Link>
          <Link to="/upload-grade" style={{ marginRight: '1rem' }}>上传成绩</Link>
          <Link to="/view-grades" style={{ marginRight: '1rem' }}>查询成绩</Link>
          <Link to="/admin">管理员界面</Link>
        </div>
        <div style={{ fontSize: '0.9rem', color: '#555' }}>
          {account ? `当前钱包：${account.slice(0, 6)}...${account.slice(-4)}` : '未连接'}
        </div>
      </header>

      <main style={{ padding: '1rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<RegisterUser />} />
          <Route path="/upload-grade" element={<UploadGrade />} />
          <Route path="/view-grades" element={<ViewGrades />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </Router>
  );
};

const Home = () => (
  <div>
    <h2>🎓 教育成绩管理系统</h2>
    <p>欢迎使用基于区块链的成绩管理系统，请选择上方导航功能：</p>
    <ul>
      <li>📝 <Link to="/register">注册用户</Link></li>
      <li>📤 <Link to="/upload-grade">上传成绩</Link></li>
      <li>📊 <Link to="/view-grades">查看成绩</Link></li>
      <li>⚙️ <Link to="/admin">管理员界面</Link></li>
    </ul>
  </div>
);

const NotFound = () => (
  <div>
    <h3>页面未找到（404）</h3>
    <Link to="/">返回首页</Link>
  </div>
);

export default App;
