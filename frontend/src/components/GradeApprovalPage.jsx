import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contracts/EducationGrades.json';
import contractAddressJson from '../contracts/contract-address.json';
import { useNavigate } from 'react-router-dom';
import styles from './GradeApprovalPage.module.css';

const GradeApprovalPage = () => {
  const [lowScoreGrades, setLowScoreGrades] = useState([]);
  const [allGrades, setAllGrades] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [course, setCourse] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(true);
  const navigate = useNavigate();

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddressJson.address, contractABI.abi, signer);
  };

  const fetchGrades = async () => {
    setLoadingGrades(true);
    try {
      const contract = await getContract();
      const grades = await contract.getLowScoreGrades();
      setLowScoreGrades(grades);
    } catch (err) {
      console.error(err);
      alert("❌ 获取成绩失败");
    } finally {
      setLoadingGrades(false);
    }
  };

  const fetchSpecificGrade = async (studentId, course) => {
  setLoadingGrades(true);
  try {
    const contract = await getContract();
    const grades = await contract.getGradesByStudentAndCourse(studentId, course); 
    setAllGrades(grades);
  } catch (err) {
    console.error("❌ 查询失败：", err);
    alert("❌ 获取成绩失败，请确认学号与课程是否正确");
  } finally {
    setLoadingGrades(false);
  }
};

  const handleUpdateGradeStatus = async (gradeId, newStatus) => {
    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract.updateGradeStatus(gradeId, newStatus);
      await tx.wait();
      alert("✅ 成绩状态已更新");
      fetchGrades();
    } catch (err) {
      console.error(err);
      alert("❌ 更新成绩状态失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  return (
    <div className={styles.pageWrapper}>
      <h2 className={styles.pageTitle}>📝 成绩审核</h2>

      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="输入学号"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />
        <input
          type="text"
          placeholder="输入课程名称"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
        />
        <button
          onClick={() => fetchSpecificGrade(studentId, course)}
          disabled={loading}
        >
          查询成绩
        </button>
      </div>

      {loadingGrades ? (
        <p className={styles.loadingText}>正在加载成绩数据...</p>
      ) : (
        <div className={styles.tableContainer}>
          <h3>查询结果</h3>
          {allGrades.length > 0 ? (
            <table className={styles.table}>
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
                {allGrades.map((grade, idx) => (
                  <tr key={idx}>
                    <td>{grade.course}</td>
                    <td>{grade.score}</td>
                    <td>{grade.studentId}</td>
                    <td>{grade.teacher}</td>
                    <td>{grade.remark}</td>
                    <td>{grade.status}</td>
                    <td>
                      <button
                        className={styles.btnDanger}
                        onClick={() => handleUpdateGradeStatus(grade.gradeId, "rejected")}
                        disabled={loading}
                      >
                        ❌ 驳回
                      </button>
                      <button
                        className={styles.btnPrimary}
                        onClick={() => handleUpdateGradeStatus(grade.gradeId, "approved")}
                        disabled={loading}
                      >
                        ✅ 通过
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.noData}>没有找到相关成绩</p>
          )}
        </div>
      )}

      {lowScoreGrades.length > 0 && (
        <div className={styles.tableContainer}>
          <h3>低于60分成绩审核</h3>
          <table className={styles.table}>
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
                      className={styles.btnDanger}
                      onClick={() => handleUpdateGradeStatus(grade.gradeId, "rejected")}
                      disabled={loading}
                    >
                      ❌ 驳回
                    </button>
                    <button
                      className={styles.btnPrimary}
                      onClick={() => handleUpdateGradeStatus(grade.gradeId, "approved")}
                      disabled={loading}
                    >
                      ✅ 通过
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button className={styles.backBtn} onClick={() => navigate('/admin')}>
        ← 返回管理员面板
      </button>
    </div>
  );
};

export default GradeApprovalPage;
