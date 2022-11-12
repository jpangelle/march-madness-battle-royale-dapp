import { ethers } from "hardhat";

async function main() {
  const Survivor = await ethers.getContractFactory("Survivor");
  const survivor = await Survivor.deploy();

  await survivor.deployed();

  console.log(`Deployed to ${survivor.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
