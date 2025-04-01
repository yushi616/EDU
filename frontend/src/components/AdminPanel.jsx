import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contracts/EducationGrades.json';
import contractAddressJson from '../contracts/contract-address.json';
import { Link } from 'react-router-dom';

const AdminPanel = () => {
  const [targetAddress, setTargetAddress] = useState('');
  const [roleIndex, setRoleIndex] = useState(0); // 默认选择角色
  const [studentsGrades, setStudentsGrades] = useState([]);
  const [userList, setUserList] = useState([]);
  const [userInfoMap, setUserInfoMap] = useState({});
  const [loading, setLoading] = useState(false);

  const roleLabels = ['Admin', 'Teacher', 'Student', 'GradeManager'];

  const getContract = async () => {
    if (!window.ethereum) return alert("请安装 MetaMask");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddressJson.address, contractABI.abi, signer);
  };

  const handleAssignRole = async () => {
    if (!targetAddress) return alert("请输入地址");
    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract.assignRole(targetAddress, roleIndex);
      await tx.wait();
      alert("✅ 角色分配成功");
      fetchUsers(); // 刷新用户列表
    } catch (err) {
      console.error(err);
      alert("❌ 角色分配失败");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async () => {
    if (!targetAddress) return alert("请输入教师地址");
    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract.removeTeacher(targetAddress); // 调用合约中的 removeTeacher 函数
      await tx.wait(); // 等待交易确认
      alert("✅ 用户已移除");
      fetchUsers(); // 刷新用户列表
    } catch (err) {
      console.error(err);
      alert("❌ 移除失败");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGradeStatus = async (studentId, gradeIndex, newStatus) => {
    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract.updateGradeStatus(studentId, gradeIndex, newStatus);
      await tx.wait();
      alert("✅ 成绩状态更新成功");
      fetchGrades(); // 刷新成绩
    } catch (err) {
      console.error(err);
      alert("❌ 更新失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const fetchGrades = async () => {
    setLoading(true);
    try {
      const contract = await getContract();
      const grades = await contract.getAllGradesForStudent(targetAddress); // 根据实际需要调整
      setStudentsGrades(grades);
    } catch (err) {
      console.error(err);
      alert("❌ 获取成绩失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(); // 初始化用户列表
  }, []);

  return (
    <div>
      <Link to="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>← 返回首页</Link>
      <h2>⚙️ 管理员控制面板</h2>

      <h3>🎭 分配角色</h3>
      <input
        placeholder="用户地址"
        value={targetAddress}
        onChange={e => setTargetAddress(e.target.value)}
        style={{ padding: '0.5rem', margin: '0.5rem', width: '300px' }}
      />
      <select
        value={roleIndex}
        onChange={e => setRoleIndex(Number(e.target.value))}
        style={{ padding: '0.5rem', margin: '0.5rem', width: '300px' }}
      >
        {roleLabels.map((label, idx) => <option key={idx} value={idx}>{label}</option>)}
      </select>
      <button
        onClick={handleAssignRole}
        disabled={loading}
        style={{ padding: '0.5rem 1rem', margin: '0.5rem' }}
      >
        {loading ? '分配中...' : '分配角色'}
      </button>

      <h3>👨‍🏫 移除教师</h3>
      <input
        placeholder="请输入教师地址"
        value={targetAddress}
        onChange={e => setTargetAddress(e.target.value)}
        style={{ padding: '0.5rem', margin: '0.5rem', width: '300px' }}
      />
      <button
        onClick={handleRemoveUser}
        disabled={loading}
        style={{ padding: '0.5rem 1rem', margin: '0.5rem' }}
      >
        {loading ? '移除中...' : '移除教师'}
      </button>

      <h3>📋 用户列表</h3>
      <table border="1" cellPadding="6" style={{ marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>地址</th>
            <th>用户名</th>
            <th>邮箱</th>
            <th>联系方式</th>
            <th>角色</th>
            <th>操作</th>
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
                <td>
                  <button onClick={() => fetchGrades()} disabled={loading}>查看成绩</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h3>成绩管理</h3>
      {studentsGrades.length > 0 ? (
        <table border="1" cellPadding="6" style={{ marginTop: '1rem' }}>
          <thead>
            <tr>
              <th>课程</th>
              <th>分数</th>
              <th>状态</th>
              <th>更新状态</th>
            </tr>
          </thead>
          <tbody>
            {studentsGrades.map((grade, idx) => (
              <tr key={idx}>
                <td>{grade.course}</td>
                <td>{grade.score}</td>
                <td>{grade.status}</td>
                <td>
                  <select
                    onChange={(e) => handleUpdateGradeStatus(targetAddress, idx, e.target.value)}
                    style={{ padding: '0.5rem' }}
                  >
                    <option value="active">有效</option>
                    <option value="inactive">无效</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>暂无成绩数据</p>
      )}
    </div>
  );
};

export default AdminPanel;
