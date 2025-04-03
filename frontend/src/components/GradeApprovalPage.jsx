import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contracts/EducationGrades.json';
import contractAddressJson from '../contracts/contract-address.json';
import { useNavigate } from 'react-router-dom';

const GradeApprovalPage = () => {
  const [lowScoreGrades, setLowScoreGrades] = useState([]);  // 用于存储成绩低于60分的成绩
  const [loading, setLoading] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(true);  // 定义loadingGrades
  const navigate = useNavigate();

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddressJson.address, contractABI.abi, signer);
  };

  const fetchLowScoreGrades = async () => {
    setLoadingGrades(true);  // 设置加载状态
    try {
      const contract = await getContract();
      const grades = await contract.getAllGrades();  // 获取所有成绩
      console.log("Fetched grades: ", grades);  // 查看获取到的成绩数据
      const lowScoreGrades = grades.filter(grade => grade.score < 60);  // 过滤出成绩低于60分的成绩
      setLowScoreGrades(lowScoreGrades);
    } catch (err) {
      console.error(err);
      alert("❌ 获取成绩失败");
    } finally {
      setLoadingGrades(false);  // 重置加载状态
    }
  };

  const handleUpdateGradeStatus = async (gradeId, newStatus) => {
    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract.updateGradeStatus(gradeId, newStatus); // 更新成绩状态
      await tx.wait();
      alert("✅ 成绩状态更新成功");
      fetchLowScoreGrades();  // 更新低分成绩列表
    } catch (err) {
      console.error(err);
      alert("❌ 更新失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowScoreGrades();  // 初次加载时获取低分成绩
  }, []);

  return (
    <div>
      <h2>📝 成绩审核（低于60分）</h2>
      {loadingGrades ? (
        <p>加载低于60分的成绩...</p>
      ) : (
        lowScoreGrades.length > 0 ? (
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
              {lowScoreGrades.map((grade, idx) => (
                <tr key={idx}>
                  <td>{grade.course}</td>
                  <td>{grade.score}</td>
                  <td>{grade.studentId}</td>
                  <td>
                    <button 
                      onClick={() => handleUpdateGradeStatus(grade.gradeId, "rejected")} 
                      disabled={loading}>
                      ❌ 驳回
                    </button>
                    <button 
                      onClick={() => handleUpdateGradeStatus(grade.gradeId, "approved")} 
                      disabled={loading}>
                      ✅ 通过
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>暂无低于60分的成绩</p>
        )
      )}
      <button onClick={() => navigate('/admin')}>返回管理员面板</button>
    </div>
  );
};

export default GradeApprovalPage;
