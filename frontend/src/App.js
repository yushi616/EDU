import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import GradeApprovalPage from './components/GradeApprovalPage';
import RegisterUser from './components/RegisterUser';
import UploadGrade from './components/UploadGrade';
import ViewGrades from './components/ViewGrades';
import AdminPanel from './components/AdminPanel';
import contractABI from './contracts/EducationGrades.json';
import contractAddressJson from './contracts/contract-address.json';
import './App.css';

const App = () => {
  const [account, setAccount] = useState('');
  const [role, setRole] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [userInfo, setUserInfo] = useState({});  // 新增

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        alert('请安装 MetaMask');
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const currentAccount = accounts[0];
        setAccount(currentAccount);

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddressJson.address, contractABI.abi, signer);

        const userRole = await contract.getUserRole(currentAccount);
        const roleStr = userRole.toString();
        const user = await contract.getUserInfo(currentAccount);

        setUserInfo(user);  // 设置完整用户信息
        setIsRegistered(user.isRegistered || roleStr === '0');

        if (roleStr === '0') setRole('管理员');
        else if (roleStr === '1') setRole('教师');
        else if (roleStr === '2') setRole('学生');
        else if (roleStr === '3') setRole('成绩管理员');
        else setRole('未知角色');
      } catch (err) {
        console.error("初始化失败:", err);
      } finally {
        setCheckingStatus(false);
      }
    };

    init();

    window.ethereum?.on('accountsChanged', () => window.location.reload());
  }, []);

  if (!account) return <div className="loading">🔌 请连接钱包...</div>;
  if (checkingStatus) return <div className="loading">⏳ 正在加载用户状态...</div>;

  return (
    <Router>
      <header className="header">
        <div className="nav-links">
          <Link to="/" className="nav-link">🏠 首页</Link>
          <Link to="/register" className="nav-link">注册用户</Link>
          <Link to="/upload-grade" className="nav-link">上传成绩</Link>
          <Link to="/view-grades" className="nav-link">查询成绩</Link>
          <Link to="/admin" className="nav-link">管理员界面</Link>
        </div>
        <div className="account-info">
          当前钱包：{account.slice(0, 6)}...{account.slice(-4)}<br />
          角色：{role || '未获取角色'}
        </div>
      </header>

      <div className="app-layout">
        <Sidebar
          role={role}
          account={account}
          isRegistered={isRegistered}
          userInfo={userInfo}
        />
        <main className="main-content">
          <Routes>
            <Route path="/" element={
              !isRegistered && role !== '管理员' ? (
                <Navigate to="/register" replace />
              ) : role === '管理员' ? (
                <Navigate to="/admin" replace />
              ) : role === '教师' ? (
                <Navigate to="/upload-grade" replace />
              ) : role === '学生' ? (
                <Navigate to="/view-grades" replace />
              ) : role === '成绩管理员' ? (
                <Navigate to="/grade-approval" replace />
              ) : (
                <Home role={role} />
              )
            } />
            <Route path="/register" element={<RegisterUser />} />
            <Route path="/upload-grade" element={<UploadGrade />} />
            <Route path="/view-grades" element={<ViewGrades />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/grade-approval" element={<GradeApprovalPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const Sidebar = ({ role, account, isRegistered, userInfo }) => {
  const location = useLocation();

  const menusByRole = {
    管理员: [
      { path: '/admin', label: '管理界面' },
      { path: '/upload-grade', label: '成绩管理' },
      { path: '/view-grades', label: '查询成绩' },
      { path: '/grade-approval', label: '成绩审批' },
    ],
    教师: [
      { path: '/upload-grade', label: '上传成绩' },
      { path: '/view-grades', label: '查询成绩' },
    ],
    学生: [
      { path: '/view-grades', label: '我的成绩' },
    ],
    成绩管理员: [
      { path: '/grade-approval', label: '成绩审批' },
      { path: '/view-grades', label: '查询成绩' },
    ],
  };

  const menus = menusByRole[role] || [];

  return (
    <aside className="sidebar">
      <h3>📚 我的功能</h3>
      <ul className="menu-list">
        {menus.map(menu => (
          <li key={menu.path} className={location.pathname === menu.path ? 'active' : ''}>
            <Link to={menu.path}>{menu.label}</Link>
          </li>
        ))}
      </ul>

      <div className="sidebar-info">
        <h4>👤 用户信息</h4>
        <p><strong>地址：</strong>{account.slice(0, 6)}...{account.slice(-4)}</p>
        <p><strong>角色：</strong>{role}</p>
        <p><strong>注册状态：</strong>{isRegistered ? '✅ 已注册' : '❌ 未注册'}</p>
        {isRegistered && (
          <>
            <p><strong>姓名：</strong>{userInfo.name}</p>
            <p><strong>学号：</strong>{userInfo.username}</p>
            <p><strong>邮箱：</strong>{userInfo.email}</p>
            <p><strong>电话：</strong>{userInfo.contactNumber}</p>
          </>
        )}
      </div>
    </aside>
  );
};

const Home = ({ role }) => (
  <div className="home">
    <h2>🎓 教育成绩管理系统</h2>
    <p>欢迎使用系统，您当前的角色是：<strong>{role}</strong></p>
  </div>
);

const NotFound = () => (
  <div className="not-found">
    <h3>页面未找到（404）</h3>
    <Link to="/">返回首页</Link>
  </div>
);

export default App;
