require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100  // 可以调低，例如 50～200，适合部署大合约
      }
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};