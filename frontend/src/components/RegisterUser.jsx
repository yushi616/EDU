import React, { useState } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contracts/EducationGrades.json';
import contractAddressJson from '../contracts/contract-address.json';
import { Link } from 'react-router-dom';
import styles from './RegisterUser.module.css'; // 引入新的CSS Module

const RegisterUser = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    if (!username || !email || !contactNumber) {
      return alert("❌ 请填写完整信息");
    }
    if (!window.ethereum) {
      return alert("请安装 MetaMask");
    }

    setLoading(true);
    setErrorMessage(''); // 清空错误信息

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
      
    } catch (err) {
      console.error(err);

      // 根据错误消息提供具体提示
      let errorMessage = '❌ 注册失败';

      if (err?.code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorMessage = '❌ 交易失败，无法预测Gas费用。';
      } else if (err?.message.includes('revert')) {
        if (err?.message.includes('管理员不能注册')) {
          errorMessage = '❌ 你不能注册为用户，因为你是管理员。';
        } else if (err?.message.includes('User already exists')) {
          errorMessage = '❌ 用户已存在，请使用不同的用户名或联系方式。';
        } else {
          errorMessage = '❌ 合约操作失败，请稍后再试。';
        }
      } else {
        errorMessage = '❌ 未知错误，请稍后再试。';
      }

      setErrorMessage(errorMessage);
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
        placeholder="用户名"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <input
        className={styles.inputField}
        placeholder="邮箱"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        className={styles.inputField}
        placeholder="联系方式"
        value={contactNumber}
        onChange={e => setContactNumber(e.target.value)}
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
