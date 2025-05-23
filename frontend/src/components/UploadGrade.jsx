import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import * as XLSX from 'xlsx';
import contractABI from '../contracts/EducationGrades.json';
import contractAddressJson from '../contracts/contract-address.json';
import { Link } from 'react-router-dom';
import styles from './UploadGrade.module.css';

const UploadGrade = () => {
  const [formData, setFormData] = useState({
    studentId: '',
    course: '',
    score: '',
    remark: '',
  });
  const [batchGrades, setBatchGrades] = useState([]);
  const [rejectedGrades, setRejectedGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddressJson.address, contractABI.abi, signer);
    return { contract, signer };
  };

  const getRejectedGrades = async () => {
    try {
      const { contract, signer } = await getContract();
      const address = await signer.getAddress();
      const result = await contract.getGradesByAddress(address);
      setRejectedGrades(result.filter(g => g.status === 'rejected'));
    } catch (err) {
      console.error("❌ 获取成绩失败:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const { studentId, course, score } = formData;
    if (!studentId || !course || !score) return "❌ 请填写完整成绩信息";
    if (score < 0 || score > 100) return "❌ 分数应在 0 到 100 之间";
    return null;
  };

  const handleUpload = async () => {
    const error = validateForm();
    if (error) return alert(error);

    setLoading(true);
    try {
      const { contract, signer } = await getContract();
      const address = await signer.getAddress();
      const role = await contract.getUserRole(address);
      if (role.toString() !== '1') return alert("❌ 你不是教师角色");

      const { studentId, course, score, remark } = formData;

      const tx = await contract.uploadGrade(
        studentId,
        course,
        Number(score),
        remark
      );
      await tx.wait();
      alert("✅ 成绩上传成功");

      setFormData({ studentId: '', course: '', score: '', remark: '' });
      getRejectedGrades();
    } catch (err) {
      console.error("上传失败:", err);
      alert(`❌ 上传失败: ${err?.error?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      setBatchGrades(rows);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBatchUpload = async () => {
    if (batchGrades.length === 0) return alert("❌ 请先上传 Excel 文件");

    setBatchLoading(true);
    try {
      const { contract, signer } = await getContract();
      const address = await signer.getAddress();
      const role = await contract.getUserRole(address);
      if (role.toString() !== '1') return alert("❌ 你不是教师角色");

      for (const grade of batchGrades) {
        const { studentId, course, score, remark = '' } = grade;
        if (!studentId || !course || isNaN(score)) continue;

        const tx = await contract.uploadGrade(
          studentId,
          course,
          Number(score),
          remark
        );
        await tx.wait();
      }

      alert("✅ 批量上传成功");
      setBatchGrades([]);
      getRejectedGrades();
    } catch (err) {
      console.error("批量上传失败:", err);
      alert("❌ 批量上传失败，请检查文件格式或稍后重试");
    } finally {
      setBatchLoading(false);
    }
  };

  useEffect(() => {
    getRejectedGrades();
  }, []);

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.link}>← 返回首页</Link>
      <h2 className={styles.heading}>🧑‍🏫 教师上传成绩</h2>

      {/* 单个上传 */}
      <div className={styles.section}>
        <h3>📌 单个上传</h3>
        {['studentId', 'course', 'score', 'remark'].map((field, idx) => (
          <input
            key={idx}
            name={field}
            className={styles.inputField}
            placeholder={field === 'score' ? '分数（0-100）' : field === 'remark' ? '备注（可选）' : field}
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
      </div>

      {/* 批量上传 */}
      <div className={styles.section}>
        <h3>📁 批量上传 (Excel)</h3>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleBatchFile}
        />
        <button
          className={styles.button}
          onClick={handleBatchUpload}
          disabled={batchLoading}
        >
          {batchLoading ? '批量上传中...' : '批量上传'}
        </button>
      </div>

      <h3 className="text-2xl font-semibold mt-8 mb-4">📋 不通过成绩（rejected）</h3>
{rejectedGrades.length > 0 ? (
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
      {rejectedGrades.map((g, idx) => (
        <tr key={idx}>
          <td>{g.gradeId.toString()}</td>
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
  <p className={styles.noGrades}>暂无不通过成绩</p>
)}
    </div>
  );
};

export default UploadGrade;
