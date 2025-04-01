import React, { useState } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contracts/EducationGrades.json';
import contractAddressJson from '../contracts/contract-address.json';
import { Link } from 'react-router-dom';

const UploadGrade = () => {
  const [gradeId, setGradeId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [course, setCourse] = useState('');
  const [score, setScore] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    // 验证是否填写完整信息
    if (!gradeId || !studentId || !course || !score) return alert("❌ 请填写完整成绩信息");

    // 验证分数是否在有效范围内
    if (score < 0 || score > 100) return alert("❌ 成绩必须在 0 到 100 之间");

    if (!window.ethereum) return alert("请安装 MetaMask");

    setLoading(true);

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddressJson.address, contractABI.abi, signer);

    try {
      // 检查当前用户是否为教师
      const role = await contract.getUserRole(signer.getAddress());
      if (role !== 1) { // 1代表教师角色
        alert("❌ 你不是教师角色，无法上传成绩");
        return;
      }

      // 上传成绩到区块链
      const tx = await contract.uploadGrade(gradeId, studentId, course, Number(score), remark);
      await tx.wait();
      alert('✅ 成绩上传成功');
    } catch (err) {
      console.error(err);
      alert('❌ 上传失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link to="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>← 返回首页</Link>
      <h2>🧑‍🏫 教师上传成绩</h2>
      <input
        placeholder="成绩 ID"
        value={gradeId}
        onChange={e => setGradeId(e.target.value)}
        style={{ padding: '0.5rem', margin: '0.5rem', width: '300px' }}
      />
      <input
        placeholder="学生 ID"
        value={studentId}
        onChange={e => setStudentId(e.target.value)}
        style={{ padding: '0.5rem', margin: '0.5rem', width: '300px' }}
      />
      <input
        placeholder="课程名"
        value={course}
        onChange={e => setCourse(e.target.value)}
        style={{ padding: '0.5rem', margin: '0.5rem', width: '300px' }}
      />
      <input
        placeholder="分数"
        value={score}
        onChange={e => setScore(e.target.value)}
        type="number"
        style={{ padding: '0.5rem', margin: '0.5rem', width: '300px' }}
      />
      <input
        placeholder="备注"
        value={remark}
        onChange={e => setRemark(e.target.value)}
        style={{ padding: '0.5rem', margin: '0.5rem', width: '300px' }}
      />
      <button
        onClick={handleUpload}
        disabled={loading}
        style={{ padding: '0.5rem 1rem', margin: '0.5rem' }}
      >
        {loading ? '上传中...' : '上传成绩'}
      </button>
    </div>
  );
};

export default UploadGrade;
