import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contracts/EducationGrades.json';
import contractAddressJson from '../contracts/contract-address.json';
import { Link } from 'react-router-dom';
import styles from './UploadGrade.module.css'; // 导入 CSS Module

const UploadGrade = () => {
  const [formData, setFormData] = useState({
    studentId: '',
    studentAddress: '',
    course: '',
    score: '',
    remark: '',
  });
  const [pendingGrades, setPendingGrades] = useState([]);
  const [loading, setLoading] = useState(false);

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddressJson.address, contractABI.abi, signer);
    return { contract, signer };
  };

  const getPendingGrades = async () => {
    try {
      const { contract, signer } = await getContract();
      const address = await signer.getAddress();
      const result = await contract.getPendingGradesByTeacher(address);
      setPendingGrades(result);
    } catch (err) {
      console.error("❌ 获取未审核成绩失败:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const { studentId, studentAddress, course, score } = formData;
    if (!studentId || !studentAddress || !course || !score) {
      return "❌ 请填写完整成绩信息";
    }

    if (!ethers.isAddress(studentAddress)) {
      return "❌ 学生地址格式不正确";
    }

    if (score < 0 || score > 100) {
      return "❌ 分数应在 0 到 100 之间";
    }

    return null;
  };

  const handleUpload = async () => {
    const validationMessage = validateForm();
    if (validationMessage) {
      return alert(validationMessage);
    }

    setLoading(true);
    try {
      const { contract, signer } = await getContract();
      const address = await signer.getAddress();

      const role = await contract.getUserRole(address);
      if (role.toString() !== '1') {
        alert("❌ 你不是教师角色");
        return;
      }

      const { studentAddress, studentId, course, score, remark } = formData;
      const userInfo = await contract.getUserInfo(studentAddress);
      if (!userInfo.isRegistered) {
        alert("❌ 学生未注册");
        return;
      }

      // 上传成绩
      const tx = await contract.uploadGrade(
        studentId,  // studentId 应该是 string 类型
        course,     // course 应该是 string 类型
        Number(score),  // score 应该是 uint8 类型
        remark,     // remark 应该是 string 类型
        studentAddress // studentAddress 应该是 address 类型
      );
      await tx.wait();
      alert("✅ 成绩上传成功");

      // 清空表单
      setFormData({
        studentId: '',
        studentAddress: '',
        course: '',
        score: '',
        remark: '',
      });

      // 获取未审核成绩
      getPendingGrades();
    } catch (err) {
      console.error("上传失败:", err);
      alert(`❌ 上传失败: ${err?.error?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPendingGrades();
  }, []);

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.link}>← 返回首页</Link>
      <h2 className={styles.heading}>🧑‍🏫 教师上传成绩</h2>

      {['studentId', 'studentAddress', 'course', 'score', 'remark'].map((field, idx) => (
        <input
          key={idx}
          name={field}
          className={styles.inputField}
          placeholder={field === 'score' ? '分数' : field === 'remark' ? '备注（可选）' : field}
          value={formData[field]}
          onChange={handleInputChange}
          type={field === 'score' ? 'number' : 'text'}
        />
      ))}

      <button 
        className={styles.button} 
        onClick={handleUpload} 
        disabled={loading}
      >
        {loading ? '上传中...' : '上传成绩'}
      </button>

      <h3 className="text-2xl font-semibold mt-8 mb-4">📋 未审核成绩（pending）</h3>
      {pendingGrades.length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>成绩ID</th>
              <th>课程</th>
              <th>学生ID</th>
              <th>分数</th>
              <th>状态</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {pendingGrades.map((g, idx) => (
              <tr key={idx}>
                <td>{g.gradeId}</td>
                <td>{g.course}</td>
                <td>{g.studentId}</td>
                <td>{g.score}</td>
                <td>{g.status}</td>
                <td>{g.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={styles.noGrades}>暂无未审核成绩</p>
      )}
    </div>
  );
};

export default UploadGrade;
