import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contracts/EducationGrades.json';
import contractAddressJson from '../contracts/contract-address.json';
import { Link } from 'react-router-dom';
import styles from './AdminPanel.module.css';  // 导入 CSS Module

const AdminPanel = () => {
  const [targetAddressForRole, setTargetAddressForRole] = useState('');
  const [targetAddressForRemove, setTargetAddressForRemove] = useState('');
  const [targetAddressForRemoveRole, setTargetAddressForRemoveRole] = useState('');
  const [roleIndex, setRoleIndex] = useState(0);
  const [studentsGrades, setStudentsGrades] = useState([]);
  const [userList, setUserList] = useState([]);
  const [userInfoMap, setUserInfoMap] = useState({});
  const [pendingGrades, setPendingGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(true);

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
      alert("❌ 获取用户列表失败");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPendingGrades = async () => {
    setLoadingGrades(true); 
    try {
      const contract = await getContract();
      const grades = await contract.getPendingGradesByTeacher(await contract.getSigner().getAddress());
      console.log("待审核成绩：", grades);

      if (Array.isArray(grades)) {
        setPendingGrades(grades);
      } else {
        alert("❌ 获取待审核成绩失败，返回的数据格式不正确");
      }
    } catch (err) {
      console.error(err);
      alert("❌ 获取待审核成绩失败");
    } finally {
      setLoadingGrades(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPendingGrades();
  }, []);

  const handleAssignRole = async () => {
    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract.assignRole(targetAddressForRole, roleIndex);
      await tx.wait();
      alert("✅ 角色分配成功");
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("❌ 角色分配失败");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async () => {
    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract.removeRole(targetAddressForRemoveRole);
      await tx.wait();
      alert("✅ 角色移除成功");
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("❌ 移除角色失败");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async () => {
    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract.removeUser(targetAddressForRemove);
      await tx.wait();
      alert("✅ 用户移除成功");
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("❌ 用户移除失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.mainContent}>
      <Link to="/" className={styles.backLink}>← 返回首页</Link>
      <h2 className={styles.panelTitle}>⚙️ 管理员控制面板</h2>

      {/* 分配角色 */}
      <div className={styles.adminSection}>
        <h3>🎭 分配角色</h3>
        <input
          className={styles.inputField}
          placeholder="用户地址"
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

      {/* 移除角色 */}
      <div className={styles.adminSection}>
        <h3>🚫 移除角色</h3>
        <input
          className={styles.inputField}
          placeholder="请输入用户地址"
          value={targetAddressForRemoveRole}
          onChange={e => setTargetAddressForRemoveRole(e.target.value)}
        />
        <button className={styles.btnDanger} onClick={handleRemoveRole} disabled={loading}>移除角色</button>
      </div>

      {/* 移除用户 */}
      <div className={styles.adminSection}>
        <h3>👨‍🏫 移除用户</h3>
        <input
          className={styles.inputField}
          placeholder="请输入用户地址"
          value={targetAddressForRemove}
          onChange={e => setTargetAddressForRemove(e.target.value)}
        />
        <button className={styles.btnDanger} onClick={handleRemoveUser} disabled={loading}>移除用户</button>
      </div>

      {/* 用户列表 */}
      <div className={styles.adminSection}>
        <h3>📋 用户列表</h3>
        {loadingUsers ? (
          <p>加载用户列表...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>地址</th>
                <th>用户名</th>
                <th>邮箱</th>
                <th>联系方式</th>
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

      {/* 待审核成绩 */}
      <div className={styles.adminSection}>
        <h3>📝 待审核成绩</h3>
        <Link to="/grade-approval" className={styles.btnPrimary}>审核成绩</Link>
      </div>
    </div>
  );
};

export default AdminPanel;
