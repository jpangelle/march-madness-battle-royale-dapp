import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Survivor", function () {
  async function deploySurvivorFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const Survivor = await ethers.getContractFactory("Survivor");
    const survivor = await Survivor.deploy();

    return { survivor, owner, otherAccount };
  }

  it("should", async function () {
    const { survivor } = await loadFixture(deploySurvivorFixture);
  });
});
