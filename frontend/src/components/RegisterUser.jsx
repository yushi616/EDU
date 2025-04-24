import React, { useState } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contracts/EducationGrades.json';
import contractAddressJson from '../contracts/contract-address.json';
import { Link } from 'react-router-dom';
import styles from './RegisterUser.module.css';

const RegisterUser = () => {
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone) => /^[0-9\-+]{7,15}$/.test(phone);

  const handleRegister = async () => {
    if (!studentId || !email || !contactNumber) {
      return alert("❌ 请填写完整信息");
    }
    if (!isValidEmail(email)) {
      return alert("❌ 邮箱格式不正确");
    }
    if (!isValidPhone(contactNumber)) {
      return alert("❌ 联系方式格式不正确");
    }
    if (!window.ethereum) {
      return alert("❌ 请安装 MetaMask 插件");
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddressJson.address, contractABI.abi, signer);

      const userAddress = await signer.getAddress();
      const userRole = await contract.getUserRole(userAddress);
      if (userRole === 0) {
        alert("❌ 管理员不能注册");
        return;
      }

      const userInfo = await contract.getUserInfo(userAddress);
      if (userInfo.isRegistered) {
        alert("❌ 当前地址已注册");
        return;
      }

      const tx = await contract.registerUser(studentId, email, contactNumber);
      await tx.wait();

      alert("✅ 注册成功");
      setStudentId('');
      setEmail('');
      setContactNumber('');
    } catch (err) {
      console.error(err);
      let msg = '❌ 注册失败';

      if (err?.code === 'UNPREDICTABLE_GAS_LIMIT') {
        msg = '❌ 交易失败，可能是Gas费用估算问题';
      } else if (err?.message.includes('studentId already used')) {
        msg = '❌ 学号已被注册，请更换';
      } else if (err?.message.includes('Already registered')) {
        msg = '❌ 当前地址已注册';
      } else {
        msg = '❌ 合约调用失败，请稍后再试';
      }

      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.link}>← 返回首页</Link>
      <h2 className={styles.heading}>📝 用户注册</h2>

      <input
        className={styles.inputField}
        placeholder="学号 / Student ID"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
      />
      <input
        className={styles.inputField}
        placeholder="邮箱"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className={styles.inputField}
        placeholder="联系方式"
        value={contactNumber}
        onChange={(e) => setContactNumber(e.target.value)}
      />

      <button
        className={`${styles.button} ${loading ? styles.loading : ''}`}
        onClick={handleRegister}
        disabled={loading}
      >
        {loading ? '注册中...' : '注册'}
      </button>

      {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
    </div>
  );
};

export default RegisterUser;
