import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contracts/EducationGrades.json';
import contractAddressJson from '../contracts/contract-address.json';
import { Link } from 'react-router-dom';

const ViewGrades = () => {
  const [searchType, setSearchType] = useState('studentId');
  const [searchValue, setSearchValue] = useState('');
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isStudent, setIsStudent] = useState(false); // 用于判断当前用户是否是学生

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner(); // 获取签名者
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

        // 显式转换所有字段（确保 BigInt 转为 Number 类型）
        const parsedGrades = result.map(g => ({
            studentName: g.studentName?.toString(),  // 假设合约返回学生姓名
            courseCode: g.courseCode?.toString(),    // 假设合约返回课程代码
            teacherId: g.teacherId?.toString(),      // 假设合约返回教师ID
            course: g.course?.toString(),
            score: Number(g.score),
            status: g.status?.toString(),
            remark: g.remark?.toString(),
            timestamp: Number(g.timestamp),
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
    <div>
      <Link to="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>← 返回首页</Link>
      <h2>📊 成绩查询</h2>

      {/* 只有不是学生时才允许选择查询方式 */}
      <select value={searchType} onChange={e => setSearchType(e.target.value)}>
        <option value="studentId">按学号</option>
        <option value="address">按地址</option>
      </select>

      {/* 显示输入框 */}
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
              <th>学生姓名</th>
              <th>学号/地址</th>
              <th>课程名</th>
              <th>课程代码</th>
              <th>教师ID</th>
              <th>分数</th>
              <th>状态</th>
              <th>备注</th>
              <th>上传时间</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((grade, index) => (
              <tr key={index}>
                <td>{grade.studentName}</td>  {/* 显示学生姓名 */}
                <td>{searchValue}</td>        {/* 显示查询的学号或地址 */}
                <td>{grade.course}</td>
                <td>{grade.courseCode}</td>    {/* 显示课程代码 */}
                <td>{grade.teacherId}</td>     {/* 显示教师ID */}
                <td>{grade.score}</td>
                <td>{grade.status}</td>
                <td>{grade.remark}</td>
                <td>{new Date(grade.timestamp * 1000).toLocaleString()}</td> {/* 转换时间戳 */}
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
