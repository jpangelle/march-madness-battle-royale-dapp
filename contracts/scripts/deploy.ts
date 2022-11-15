import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const BattleRoyaleFactory = await ethers.getContractFactory("BattleRoyale");
  const battleRoyalePool = await BattleRoyaleFactory.deploy([
    process.env.HOT_WALLET_PRIVATE_KEY,
  ]);

  await battleRoyalePool.deployed();

  console.log(`Deployed to ${battleRoyalePool.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
