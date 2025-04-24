import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contracts/EducationGrades.json';
import contractAddressJson from '../contracts/contract-address.json';
import { Link } from 'react-router-dom';
import styles from './AdminPanel.module.css';

const AdminPanel = () => {
  const [targetAddressForRole, setTargetAddressForRole] = useState('');
  const [targetAddressForRemove, setTargetAddressForRemove] = useState('');
  const [targetAddressForRemoveRole, setTargetAddressForRemoveRole] = useState('');
  const [roleIndex, setRoleIndex] = useState(0);
  const [userList, setUserList] = useState([]);
  const [userInfoMap, setUserInfoMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const roleLabels = ['Admin', 'Teacher', 'Student', 'GradeManager'];

  const getContract = async () => {
    if (!window.ethereum) return alert("请安装 MetaMask");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddressJson.address, contractABI.abi, signer);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const contract = await getContract();
      const addresses = await contract.getAllUsers();
      setUserList(addresses);

      const infoMap = {};
      for (let addr of addresses) {
        const user = await contract.getUserInfo(addr);
        const role = await contract.getUserRole(addr);
        infoMap[addr] = {
          username: user.username,
          email: user.email,
          contact: user.contactNumber,
          role: roleLabels[role],
        };
      }
      setUserInfoMap(infoMap);
    } catch (err) {
      console.error(err);
      alert("❌ 获取用户列表失败，请稍后重试。");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAssignRole = async () => {
    if (!ethers.isAddress(targetAddressForRole)) return alert("❌ 请输入有效的以太坊地址");
    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract.assignRole(targetAddressForRole, roleIndex);
      await tx.wait();
      alert("✅ 角色分配成功");
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("❌ 角色分配失败，请检查权限或稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async () => {
    if (!ethers.isAddress(targetAddressForRemoveRole)) return alert("❌ 请输入有效的以太坊地址");
    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract.assignRole(targetAddressForRemoveRole, 2); // 重设为 Student
      await tx.wait();
      alert("✅ 角色移除成功，已设为学生");
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("❌ 移除角色失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async () => {
    if (!ethers.isAddress(targetAddressForRemove)) return alert("❌ 请输入有效的以太坊地址");
    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract.removeUser(targetAddressForRemove);
      await tx.wait();
      alert("✅ 用户移除成功");
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("❌ 用户移除失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.mainContent}>
      <Link to="/" className={styles.backLink}>← 返回首页</Link>
      <h2 className={styles.panelTitle}>⚙️ 管理员控制面板</h2>

      <div className={styles.adminSection}>
        <h3>🎭 分配用户角色</h3>
        <input
          className={styles.inputField}
          placeholder="请输入用户地址"
          value={targetAddressForRole}
          onChange={e => setTargetAddressForRole(e.target.value)}
        />
        <select
          className={styles.selectField}
          value={roleIndex}
          onChange={e => setRoleIndex(Number(e.target.value))}
        >
          {roleLabels.map((label, idx) => <option key={idx} value={idx}>{label}</option>)}
        </select>
        <button className={styles.btnPrimary} onClick={handleAssignRole} disabled={loading}>分配角色</button>
      </div>

      <div className={styles.adminSection}>
        <h3>🚫 重设角色为学生</h3>
        <input
          className={styles.inputField}
          placeholder="请输入用户地址"
          value={targetAddressForRemoveRole}
          onChange={e => setTargetAddressForRemoveRole(e.target.value)}
        />
        <button className={styles.btnDanger} onClick={handleRemoveRole} disabled={loading}>重设为学生</button>
      </div>

      <div className={styles.adminSection}>
        <h3>🗑️ 移除用户</h3>
        <input
          className={styles.inputField}
          placeholder="请输入用户地址"
          value={targetAddressForRemove}
          onChange={e => setTargetAddressForRemove(e.target.value)}
        />
        <button className={styles.btnDanger} onClick={handleRemoveUser} disabled={loading}>移除用户</button>
      </div>

      <div className={styles.adminSection}>
        <h3>📋 所有注册用户</h3>
        {loadingUsers ? (
          <p>⏳ 正在加载用户数据...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>地址</th>
                <th>学号</th>
                <th>邮箱</th>
                <th>联系电话</th>
                <th>角色</th>
              </tr>
            </thead>
            <tbody>
              {userList.map((addr, idx) => {
                const info = userInfoMap[addr];
                return (
                  <tr key={idx}>
                    <td>{addr}</td>
                    <td>{info?.username}</td>
                    <td>{info?.email}</td>
                    <td>{info?.contact}</td>
                    <td>{info?.role}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.adminSection}>
        <h3>📝 低分成绩审核</h3>
        <Link to="/grade-approval" className={styles.btnPrimary}>进入审核页面</Link>
      </div>
    </div>
  );
};

export default AdminPanel;
