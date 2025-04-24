import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contracts/EducationGrades.json';
import contractAddressJson from '../contracts/contract-address.json';
import { useNavigate } from 'react-router-dom';

const GradeApprovalPage = () => {
  const [lowScoreGrades, setLowScoreGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(true);
  const navigate = useNavigate();

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddressJson.address, contractABI.abi, signer);
  };

  const fetchLowScoreGrades = async () => {
    setLoadingGrades(true);
    try {
      const contract = await getContract();
      const grades = await contract.getLowScoreGrades();  // 使用合约中的 getLowScoreGrades()
      console.log("Fetched low score grades:", grades);
      setLowScoreGrades(grades);
    } catch (err) {
      console.error(err);
      alert("❌ 获取低分成绩失败");
    } finally {
      setLoadingGrades(false);
    }
  };

  const handleUpdateGradeStatus = async (gradeId, newStatus) => {
    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract.updateGradeStatus(gradeId, newStatus); // 与合约匹配的方法
      await tx.wait();
      alert("✅ 成绩状态已更新");
      fetchLowScoreGrades(); // 更新数据
    } catch (err) {
      console.error(err);
      alert("❌ 更新成绩状态失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowScoreGrades();
  }, []);

  return (
    <div>
      <h2>📝 成绩审核（低于60分）</h2>
      {loadingGrades ? (
        <p>正在加载成绩数据...</p>
      ) : (
        lowScoreGrades.length > 0 ? (
          <table border="1">
            <thead>
              <tr>
                <th>课程</th>
                <th>分数</th>
                <th>学生ID</th>
                <th>教师地址</th>
                <th>备注</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {lowScoreGrades.map((grade, idx) => (
                <tr key={idx}>
                  <td>{grade.course}</td>
                  <td>{grade.score}</td>
                  <td>{grade.studentId}</td>
                  <td>{grade.teacher}</td>
                  <td>{grade.remark}</td>
                  <td>{grade.status}</td>
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
          <p>暂无低于60分的待审成绩</p>
        )
      )}
      <button onClick={() => navigate('/admin')}>返回管理员面板</button>
    </div>
  );
};

export default GradeApprovalPage;
