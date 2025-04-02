import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contracts/EducationGrades.json';
import contractAddressJson from '../contracts/contract-address.json';
import { Link } from 'react-router-dom';

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

  const handleApproveGrade = async (gradeId) => {
    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract.approveGrade(gradeId);
      await tx.wait();
      alert("✅ 成绩审核通过");
      fetchPendingGrades();
    } catch (err) {
      console.error(err);
      alert("❌ 审核失败");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGradeStatus = async (gradeId, newStatus) => {
    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract.updateGradeStatus(gradeId, newStatus);
      await tx.wait();
      alert("✅ 成绩状态更新成功");
      fetchPendingGrades();
    } catch (err) {
      console.error(err);
      alert("❌ 更新失败");
    } finally {
      setLoading(false);
    }
  };

  // New functions to handle role assignment and user removal
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
      alert("❌ 角色移除失败");
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

  useEffect(() => {
    fetchUsers();
    fetchPendingGrades();
  }, []);

  return (
    <div>
      <Link to="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>← 返回首页</Link>
      <h2>⚙️ 管理员控制面板</h2>

      {/* 分配角色 */}
      <h3>🎭 分配角色</h3>
      <input
        placeholder="用户地址"
        value={targetAddressForRole}
        onChange={e => setTargetAddressForRole(e.target.value)}
      />
      <select
        value={roleIndex}
        onChange={e => setRoleIndex(Number(e.target.value))}
      >
        {roleLabels.map((label, idx) => <option key={idx} value={idx}>{label}</option>)}
      </select>
      <button onClick={handleAssignRole} disabled={loading}>分配角色</button>

      {/* 移除角色 */}
      <h3>🚫 移除角色</h3>
      <input
        placeholder="请输入用户地址"
        value={targetAddressForRemoveRole}
        onChange={e => setTargetAddressForRemoveRole(e.target.value)}
      />
      <button onClick={handleRemoveRole} disabled={loading}>移除角色</button>

      {/* 移除用户 */}
      <h3>👨‍🏫 移除用户</h3>
      <input
        placeholder="请输入用户地址"
        value={targetAddressForRemove}
        onChange={e => setTargetAddressForRemove(e.target.value)}
      />
      <button onClick={handleRemoveUser} disabled={loading}>移除用户</button>

      {/* 用户列表 */}
      <h3>📋 用户列表</h3>
      {loadingUsers ? (
        <p>加载用户列表...</p>
      ) : (
        <table border="1">
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

      {/* 待审核成绩 */}
      <h3>📝 待审核成绩</h3>
      {loadingGrades ? (
        <p>加载待审核成绩...</p>
      ) : (
        pendingGrades.length > 0 ? (
          <table border="1">
            <thead>
              <tr>
                <th>课程</th>
                <th>分数</th>
                <th>学生ID</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pendingGrades.map((grade, idx) => (
                <tr key={idx}>
                  <td>{grade.course}</td>
                  <td>{grade.score}</td>
                  <td>{grade.studentId}</td>
                  <td>
                    <button onClick={() => handleApproveGrade(grade.gradeId)} disabled={loading}>✅ 通过</button>
                    <button onClick={() => handleUpdateGradeStatus(grade.gradeId, "inactive")} disabled={loading}>❌ 驳回</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>暂无待审核成绩</p>
        )
      )}
    </div>
  );
};

export default AdminPanel;
