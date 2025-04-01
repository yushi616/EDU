import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ethers } from 'ethers';

import RegisterUser from './components/RegisterUser';
import UploadGrade from './components/UploadGrade';
import ViewGrades from './components/ViewGrades';
import AdminPanel from './components/AdminPanel';
import contractABI from './contracts/EducationGrades.json';
import contractAddressJson from './contracts/contract-address.json';

const App = () => {
  const [account, setAccount] = useState('');
  const [role, setRole] = useState('');  // 角色状态

  // 获取角色的函数
  const getUserRole = async (account) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddressJson.address, contractABI.abi, signer);
      const userRole = await contract.getUserRole(account);
  
      // 转换 BigNumber 为字符串或数字
      const roleValue = userRole.toString();  // 或者 userRole.toNumber()，根据需要
  
      console.log('获取到的角色:', roleValue);
  
      // 设置角色
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

          // 获取账户角色
          getUserRole(accounts[0]);

          // 监听账户切换
          window.ethereum.on('accountsChanged', (accounts) => {
            setAccount(accounts[0] || '');
            console.log('账户切换至:', accounts[0]);
            getUserRole(accounts[0]); // 获取新账户的角色
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
          {role === '管理员' && <Link to="/admin" style={{ marginRight: '1rem' }}>管理员界面</Link>}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#555' }}>
          {account ? (
            <>
              当前钱包：{account.slice(0, 6)}...{account.slice(-4)} <br />
              角色：{role || '未获取角色'}
            </>
          ) : '未连接'}
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
