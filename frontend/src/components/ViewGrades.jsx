import React, { useState } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contracts/EducationGrades.json';
import contractAddressJson from '../contracts/contract-address.json';
import { Link } from 'react-router-dom';

const ViewGrades = () => {
  const [studentId, setStudentId] = useState('');
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetchGrades = async () => {
    if (!studentId) {
      return alert('❌ 请提供学生 ID');
    }

    if (!window.ethereum) return alert("请安装 MetaMask");

    setLoading(true);
    setError('');  // 清除错误信息

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddressJson.address, contractABI.abi, signer);

    try {
      // 检查当前用户是否是学生角色
      const role = await contract.getUserRole(signer.getAddress());
      if (role !== 2) { // 2代表学生角色
        alert("❌ 你不是学生角色，无法查询成绩");
        return;
      }

      // 查询成绩
      const results = await contract.getGrades(studentId);
      if (results.length === 0) {
        setError('没有找到成绩数据');
      } else {
        setGrades(results);
      }
    } catch (err) {
      console.error(err);
      setError('❌ 查询失败，可能你没有学生权限或数据不可用');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link to="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>← 返回首页</Link>
      <h2>📊 学生成绩查询</h2>
      <input
        placeholder="学生 ID"
        value={studentId}
        onChange={e => setStudentId(e.target.value)}
        style={{ padding: '0.5rem', margin: '0.5rem', width: '300px' }}
      />
      <button
        onClick={handleFetchGrades}
        disabled={loading}
        style={{ padding: '0.5rem 1rem', margin: '0.5rem' }}
      >
        {loading ? '查询中...' : '查询'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <ul>
        {grades.length === 0 ? (
          <p>暂无成绩数据</p>
        ) : (
          grades.map((grade, idx) => (
            <li key={idx}>
              [{grade.course}] - 分数: {grade.score} - 状态: {grade.status}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default ViewGrades;
