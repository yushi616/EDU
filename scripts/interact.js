const hre = require("hardhat");

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // 部署成功后替换
    const EducationGrades = await hre.ethers.getContractFactory("EducationGrades");
    const contract = await EducationGrades.attach(contractAddress);

    // 设置成绩
    const [owner] = await hre.ethers.getSigners();
    let tx = await contract.setGrade(owner.address, 95);
    await tx.wait();
    console.log("✅ 成绩已设置！");

    // 获取成绩
    const grade = await contract.getGrade(owner.address);
    console.log(`🎓 ${owner.address} 的成绩: ${grade}`);
}

main().catch((error) => {
    console.error("❌ 交互失败:", error);
    process.exitCode = 1;
});
