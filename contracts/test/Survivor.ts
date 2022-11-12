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

  it("should handle registration status", async function () {
    const { survivor, otherAccount } = await loadFixture(deploySurvivorFixture);

    expect(await survivor.isRegistrationOpen()).to.be.false;

    await expect(
      survivor.connect(otherAccount).openRegistration()
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await survivor.openRegistration();

    await expect(survivor.openRegistration()).to.be.revertedWith(
      "Registration is already open"
    );
    expect(await survivor.isRegistrationOpen()).to.be.true;

    await expect(
      survivor.connect(otherAccount).closeRegistration()
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await survivor.closeRegistration();
    await expect(survivor.closeRegistration()).to.be.revertedWith(
      "Registration is already closed"
    );
    expect(await survivor.isRegistrationOpen()).to.be.false;
  });

  it("should handle entry registration", async function () {
    const { survivor, otherAccount } = await loadFixture(deploySurvivorFixture);

    await expect(
      survivor.connect(otherAccount).registerEntry("slamma jamma")
    ).to.be.revertedWith("Registration is closed");

    await survivor.openRegistration();

    await survivor.connect(otherAccount).registerEntry("slamma jamma");

    const [entryName, alive] = await survivor.entries(otherAccount.address);

    expect(await survivor.entryAddresses(0)).to.equal(otherAccount.address);
    expect(entryName).to.equal("slamma jamma");
    expect(alive).to.equal(true);
  });

  it("should reset survivor", async function () {
    const { survivor, otherAccount } = await loadFixture(deploySurvivorFixture);

    await survivor.openRegistration();

    await survivor.connect(otherAccount).registerEntry("slamma jamma");

    const [entryName1, alive1] = await survivor.entries(otherAccount.address);

    expect(entryName1).to.equal("slamma jamma");
    expect(alive1).to.equal(true);

    await expect(survivor.resetSurvivor()).to.be.revertedWith(
      "Registration must be closed in order to reset"
    );

    await survivor.closeRegistration();

    await expect(
      survivor.connect(otherAccount).resetSurvivor()
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await survivor.resetSurvivor();

    const [entryName2, alive2] = await survivor.entries(otherAccount.address);

    await expect(survivor.entryAddresses(0)).to.be.revertedWithoutReason();
    expect(entryName2).to.equal("");
    expect(alive2).to.equal(false);
  });
});
