import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const BattleRoyaleFactory = await ethers.getContractFactory("BattleRoyale");
  const battleRoyalePool = await BattleRoyaleFactory.deploy([
    "0x89E27f651186DE46D656f8Cd55bA9620dc556320",
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
