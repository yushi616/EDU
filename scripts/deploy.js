const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const EducationGrades = await hre.ethers.getContractFactory("EducationGrades");
  const contract = await EducationGrades.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ Contract deployed at:", address);

  // 保存到前端目录
  saveFrontendFiles(contract);
}

function saveFrontendFiles(contract) {
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");
  if (!fs.existsSync(contractsDir)) fs.mkdirSync(contractsDir, { recursive: true });

  // 保存地址
  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ address: contract.target }, null, 2)
  );

  // 保存 ABI
  const artifact = hre.artifacts.readArtifactSync("EducationGrades");
  fs.writeFileSync(
    path.join(contractsDir, "EducationGrades.json"),
    JSON.stringify(artifact, null, 2)
  );
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exitCode = 1;
});
