import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
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
  const [role, setRole] = useState('');  // 角色状态

  const getUserRole = async (account) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddressJson.address, contractABI.abi, signer);
      const userRole = await contract.getUserRole(account);
  
      const roleValue = userRole.toString();
  
      console.log('获取到的角色:', roleValue);
  
      if (roleValue === '0') setRole('管理员');
      else if (roleValue === '1') setRole('教师');
      else if (roleValue === '2') setRole('学生');
      else if (roleValue === '3') setRole('成绩管理员');
      else setRole('未知角色');
    } catch (error) {
      console.error('获取角色时出错:', error);
    }
  };

  useEffect(() => {
    const getAccount = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          setAccount(accounts[0]);
          console.log('当前账户:', accounts[0]);

          getUserRole(accounts[0]);

          window.ethereum.on('accountsChanged', (accounts) => {
            setAccount(accounts[0] || '');
            console.log('账户切换至:', accounts[0]);
            getUserRole(accounts[0]);
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
      <header className="header">
        <div className="nav-links">
          <Link to="/" className="nav-link">🏠 首页</Link>
          <Link to="/register" className="nav-link">注册用户</Link>
          <Link to="/upload-grade" className="nav-link">上传成绩</Link>
          <Link to="/view-grades" className="nav-link">查询成绩</Link>
          {role === '管理员' && <Link to="/admin" className="nav-link">管理员界面</Link>}
        </div>
        <div className="account-info">
          {account ? (
            <>
              当前钱包：{account.slice(0, 6)}...{account.slice(-4)} <br />
              角色：{role || '未获取角色'}
            </>
          ) : '未连接'}
        </div>
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<RegisterUser />} />
          <Route path="/upload-grade" element={<UploadGrade />} />
          <Route path="/view-grades" element={<ViewGrades />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/grade-approval" element={<GradeApprovalPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </Router>
  );
};

const Home = () => (
  <div className="home">
    <h2>🎓 教育成绩管理系统</h2>
    <p>欢迎使用基于区块链的成绩管理系统，请选择上方导航功能：</p>
    <ul className="home-links">
      <li><Link to="/register" className="home-link">📝 注册用户</Link></li>
      <li><Link to="/upload-grade" className="home-link">📤 上传成绩</Link></li>
      <li><Link to="/view-grades" className="home-link">📊 查看成绩</Link></li>
      <li><Link to="/admin" className="home-link">⚙️ 管理员界面</Link></li>
    </ul>
  </div>
);

const NotFound = () => (
  <div className="not-found">
    <h3>页面未找到（404）</h3>
    <Link to="/">返回首页</Link>
  </div>
);

export default App;
