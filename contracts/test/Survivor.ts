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

  it("should eliminate entry", async () => {
    const { survivor, owner, otherAccount } = await loadFixture(
      deploySurvivorFixture
    );

    await survivor.openRegistration();

    await survivor.connect(otherAccount).registerEntry("slamma jamma");

    await expect(
      survivor.connect(otherAccount).eliminateEntry(otherAccount.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(survivor.eliminateEntry(owner.address)).to.be.revertedWith(
      "Entry is already eliminated or does not exist"
    );

    await survivor.eliminateEntry(otherAccount.address);

    await expect(
      survivor.eliminateEntry(otherAccount.address)
    ).to.be.revertedWith("Entry is already eliminated or does not exist");
  });

  it(" should payout winner", async () => {
    const { survivor, owner, otherAccount } = await loadFixture(
      deploySurvivorFixture
    );

    await survivor.openRegistration();

    await survivor.connect(otherAccount).registerEntry("slamma jamma");

    await expect(
      survivor.connect(otherAccount).payoutWinner(otherAccount.address, 1)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      survivor.payoutWinner(owner.address, ethers.utils.parseEther("1"))
    ).to.be.revertedWith("Entry is eliminated or does not exist");

    await expect(
      survivor.payoutWinner(otherAccount.address, ethers.utils.parseEther("1"))
    ).to.be.revertedWith("Contract does not have enough funds");

    await owner.sendTransaction({
      to: survivor.address,
      value: ethers.utils.parseEther("2"),
      gasLimit: 21055,
    });

    await survivor.payoutWinner(
      otherAccount.address,
      ethers.utils.parseEther("1")
    );
  });

  it("should handle making a pick", async () => {
    const { survivor, otherAccount } = await loadFixture(deploySurvivorFixture);

    await expect(
      survivor.connect(otherAccount).makeAPick("kentucky")
    ).to.be.revertedWith("Registration must be open in order to make a pick");

    await survivor.openRegistration();

    await expect(
      survivor.connect(otherAccount).makeAPick("kentucky")
    ).to.be.revertedWith("Entry is eliminated or does not exist");

    await survivor.connect(otherAccount).registerEntry("slamma jamma");

    await survivor.connect(otherAccount).makeAPick("kentucky");

    await survivor.connect(otherAccount).makeAPick("duke");

    const picks = await survivor
      .connect(otherAccount)
      .getPicks(otherAccount.address);

    expect(picks[0]).to.equal("kentucky");
    expect(picks[1]).to.equal("duke");
  });
});
