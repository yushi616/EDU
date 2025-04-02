import React, { useState } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contracts/EducationGrades.json';
import contractAddressJson from '../contracts/contract-address.json';
import { Link } from 'react-router-dom';

const ViewGrades = () => {
  const [searchType, setSearchType] = useState('studentId');
  const [searchValue, setSearchValue] = useState('');
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddressJson.address, contractABI.abi, signer);
  };

  const handleSearch = async () => {
    if (!searchValue) return alert("❌ 请填写查询值");

    setLoading(true);
    try {
      const contract = await getContract();
      let result;

      if (searchType === 'studentId') {
        result = await contract.getGradesByStudentId(searchValue);
      } else if (searchType === 'username') {
        result = await contract.getGradesByUsername(searchValue);
      } else if (searchType === 'address') {
        result = await contract.getGradesByAddress(searchValue);
      }

      setGrades(result);
    } catch (err) {
      console.error(err);
      alert('❌ 查询失败，请检查输入值或稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link to="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>← 返回首页</Link>
      <h2>📊 成绩查询</h2>

      <select value={searchType} onChange={e => setSearchType(e.target.value)}>
        <option value="studentId">按学号</option>
        <option value="username">按用户名</option>
        <option value="address">按地址</option>
      </select>

      <input 
        value={searchValue} 
        onChange={e => setSearchValue(e.target.value)} 
        placeholder="请输入查询值" 
      />

      <button onClick={handleSearch} disabled={loading}>
        {loading ? '查询中...' : '查询成绩'}
      </button>

      {grades.length > 0 ? (
        <table border="1" cellPadding="6" style={{ marginTop: '1rem' }}>
          <thead>
            <tr>
              <th>课程名</th>
              <th>分数</th>
              <th>状态</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((grade, index) => (
              <tr key={index}>
                <td>{grade.course}</td>
                <td>{grade.score}</td>
                <td>{grade.status}</td>
                <td>{grade.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>未找到相关成绩</p>
      )}
    </div>
  );
};

export default ViewGrades;
