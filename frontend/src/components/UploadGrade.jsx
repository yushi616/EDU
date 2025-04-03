import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contracts/EducationGrades.json';
import contractAddressJson from '../contracts/contract-address.json';
import { Link } from 'react-router-dom';

const UploadGrade = () => {
  const [studentId, setStudentId] = useState('');  // 学号
  const [studentAddress, setStudentAddress] = useState(''); // 学生地址
  const [course, setCourse] = useState('');
  const [score, setScore] = useState('');
  const [remark, setRemark] = useState('');
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

  const handleUpload = async () => {
    if (!studentId || !studentAddress || !course || !score) {
      return alert("❌ 请填写完整成绩信息");
    }

    if (!ethers.isAddress(studentAddress)) {
      return alert("❌ 学生地址格式不正确");
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

      const userInfo = await contract.getUserInfo(studentAddress);
      if (!userInfo.isRegistered) {
        alert("❌ 学生未注册");
        return;
      }

      // 自动生成gradeId
      const gradeId = Date.now();  // 使用当前时间戳生成唯一的成绩ID

      // 上传成绩
      const tx = await contract.uploadGrade(
        gradeId.toString(),
        studentId, // 使用学号
        course,
        Number(score),
        remark,
        studentAddress
      );
      await tx.wait();
      alert("✅ 成绩上传成功");

      // 清空表单
      setStudentId('');
      setStudentAddress('');
      setCourse('');
      setScore('');
      setRemark('');

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
    <div>
      <Link to="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>← 返回首页</Link>
      <h2>🧑‍🏫 教师上传成绩</h2>

      <input placeholder="学号" value={studentId} onChange={e => setStudentId(e.target.value)} />
      <input placeholder="学生地址" value={studentAddress} onChange={e => setStudentAddress(e.target.value)} />
      <input placeholder="课程名" value={course} onChange={e => setCourse(e.target.value)} />
      <input type="number" placeholder="分数" value={score} onChange={e => setScore(e.target.value)} />
      <input placeholder="备注（可选）" value={remark} onChange={e => setRemark(e.target.value)} />

      <button onClick={handleUpload} disabled={loading}>
        {loading ? '上传中...' : '上传成绩'}
      </button>

      <h3 style={{ marginTop: '2rem' }}>📋 未审核成绩（pending）</h3>
      {pendingGrades.length > 0 ? (
        <table border="1" cellPadding="6">
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
        <p>暂无未审核成绩</p>
      )}
    </div>
  );
};

export default UploadGrade;
