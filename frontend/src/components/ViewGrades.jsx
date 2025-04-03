import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contracts/EducationGrades.json';
import contractAddressJson from '../contracts/contract-address.json';
import { Link } from 'react-router-dom';
import styles from './ViewGrades.module.css'; // Import the new CSS Module

const ViewGrades = () => {
  const [searchType, setSearchType] = useState('studentId');
  const [searchValue, setSearchValue] = useState('');
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isStudent, setIsStudent] = useState(false); // Check if the user is a student

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddressJson.address, contractABI.abi, signer);
    return { contract, signer };
  };

  const handleSearch = async () => {
    if (!searchValue) return alert("❌ 请填写查询值");

    setLoading(true);
    try {
        const { contract, signer } = await getContract();
        let result;

        if (searchType === 'studentId') {
            result = await contract.getGradesByStudentId(searchValue);
        } else if (searchType === 'address') {
            result = await contract.getGradesByAddress(searchValue);
        }

        // Explicitly convert fields to handle BigInt values
        const parsedGrades = result.map(g => ({
            studentId: g.studentId?.toString(),
            course: g.course?.toString(),
            score: Number(g.score),
            status: g.status?.toString(),
            timestamp: Number(g.timestamp),
            remark: g.remark?.toString(),
        }));

        setGrades(parsedGrades);
    } catch (err) {
        console.error("❌ 查询错误：", err);
        alert('❌ 查询失败，请检查输入值或稍后重试');
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    const checkRole = async () => {
      const { contract, signer } = await getContract();
      const role = await contract.isStudent();
      setIsStudent(role);
    };

    checkRole();
  }, []);

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.link}>← 返回首页</Link>
      <h2 className={styles.heading}>📊 成绩查询</h2>

      {/* Allow search options only if not a student */}
      {!isStudent && (
        <div>
          <select
            className={styles.selectInput}
            value={searchType}
            onChange={e => setSearchType(e.target.value)}
          >
            <option value="studentId">按学号</option>
            <option value="address">按地址</option>
          </select>
        </div>
      )}

      <input
        className={styles.textInput}
        value={searchValue}
        onChange={e => setSearchValue(e.target.value)}
        placeholder="请输入查询值"
      />

      <button
        className={styles.button}
        onClick={handleSearch}
        disabled={loading}
      >
        {loading ? '查询中...' : '查询成绩'}
      </button>

      <div className={styles.tableContainer}>
        {grades.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>学号/地址</th>
                <th>课程名</th>
                <th>分数</th>
                <th>状态</th>
                <th>上传时间</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade, index) => (
                <tr key={index}>
                  <td>{grade.studentId}</td>
                  <td>{grade.course}</td>
                  <td>{grade.score}</td>
                  <td>{grade.status}</td>
                  <td>{new Date(grade.timestamp * 1000).toLocaleString()}</td>
                  <td>{grade.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.noGrades}>未找到相关成绩</p>
        )}
      </div>
    </div>
  );
};

export default ViewGrades;
