import React, { useState } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contracts/EducationGrades.json';
import contractAddressJson from '../contracts/contract-address.json';
import { Link } from 'react-router-dom';

const RegisterUser = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [role, setRole] = useState(2); // 默认角色是学生 (Role.Student)
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !contactNumber) return alert("❌ 请填写完整信息");
    if (!window.ethereum) return alert("请安装 MetaMask");

    setLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddressJson.address, contractABI.abi, signer);

      // 防止管理员自己注册
      const userRole = await contract.getUserRole(signer.getAddress());
      if (userRole === 0) {
        alert("❌ 管理员不能注册");
        return;
      }

      // 调用合约的注册函数
      const tx = await contract.registerUser(username, email, contactNumber);
      await tx.wait();
      alert('✅ 注册成功');

      // 自动为用户分配角色 (示例: 学生 / 教师)
      const txRole = await contract.assignRole(signer.getAddress(), role);
      await txRole.wait();
      alert('✅ 角色分配成功');
      
    } catch (err) {
      console.error(err);
      alert('❌ 注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link to="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>← 返回首页</Link>
      <h2>📝 用户注册</h2>
      <input
        placeholder="用户名"
        value={username}
        onChange={e => setUsername(e.target.value)}
        style={{ padding: '0.5rem', margin: '0.5rem', width: '300px' }}
      />
      <input
        placeholder="邮箱"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ padding: '0.5rem', margin: '0.5rem', width: '300px' }}
      />
      <input
        placeholder="联系方式"
        value={contactNumber}
        onChange={e => setContactNumber(e.target.value)}
        style={{ padding: '0.5rem', margin: '0.5rem', width: '300px' }}
      />
      <select
        value={role}
        onChange={e => setRole(Number(e.target.value))}
        style={{ padding: '0.5rem', margin: '0.5rem', width: '300px' }}
      >
        <option value={2}>学生 (Student)</option>
        <option value={1}>教师 (Teacher)</option>
        <option value={3}>成绩管理员 (GradeManager)</option>
      </select>
      <button
        onClick={handleRegister}
        disabled={loading}
        style={{ padding: '0.5rem 1rem', margin: '0.5rem' }}
      >
        {loading ? '注册中...' : '注册'}
      </button>
    </div>
  );
};

export default RegisterUser;
