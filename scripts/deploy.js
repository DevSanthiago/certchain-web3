const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying CertChain to Sepolia...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const CertChain = await ethers.getContractFactory("CertChain");
  const certChain = await CertChain.deploy();

  await certChain.waitForDeployment();

  const address = await certChain.getAddress();
  console.log("CertChain deployed to:", address);
  console.log("Etherscan:", `https://sepolia.etherscan.io/address/${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
