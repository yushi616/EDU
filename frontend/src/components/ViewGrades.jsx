import React, { useState } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contracts/EducationGrades.json';
import contractAddressJson from '../contracts/contract-address.json';
import { Link } from 'react-router-dom';
import styles from './ViewGrades.module.css';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ViewGrades = () => {
  const [studentId, setStudentId] = useState('');
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddressJson.address, contractABI.abi, signer);
    return contract;
  };

  const handleSearch = async () => {
    if (!studentId) return alert("❌ 请输入学号");

    setLoading(true);
    try {
      const contract = await getContract();
      const result = await contract.getGradesByStudentId(studentId);

      const parsedGrades = result.map(g => ({
        studentId: g.studentId?.toString(),
        course: g.course?.toString(),
        score: Number(g.score),
        status: g.status?.toString(),
        timestamp: new Date(Number(g.timestamp) * 1000).toLocaleString(),
        remark: g.remark?.toString(),
        teacher: g.teacher  // 获取上传者信息
      }));

      setGrades(parsedGrades);
    } catch (err) {
      console.error("❌ 查询错误：", err);
      alert('❌ 查询失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (grades.length === 0) {
      alert("暂无可导出的成绩数据");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(grades);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Grades");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array"
    });

    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `Grades_${studentId}.xlsx`);
  };

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.link}>← 返回首页</Link>
      <h2 className={styles.heading}>📊 成绩查询</h2>

      <input
        className={styles.textInput}
        value={studentId}
        onChange={e => setStudentId(e.target.value)}
        placeholder="请输入学号"
      />

      <div className={styles.buttonRow}>
        <button
          className={styles.button}
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? '查询中...' : '查询成绩'}
        </button>

        <button
          className={styles.button}
          onClick={exportToExcel}
          disabled={grades.length === 0}
        >
          导出成绩
        </button>
      </div>

      <div className={styles.tableContainer}>
        {grades.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>学号</th>
                <th>课程名</th>
                <th>分数</th>
                <th>状态</th>
                <th>上传时间</th>
                <th>备注</th>
                <th>上传教师</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade, index) => (
                <tr key={index}>
                  <td>{grade.studentId}</td>
                  <td>{grade.course}</td>
                  <td>{grade.score}</td>
                  <td>{grade.status}</td>
                  <td>{grade.timestamp}</td>
                  <td>{grade.remark}</td>
                  <td>{grade.teacher}</td>
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
