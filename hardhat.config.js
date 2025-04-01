require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20", // ✅ 对应合约的版本
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};
