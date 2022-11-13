import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Survivor", function () {
  async function deploySurvivorFixture() {
    const [owner, ...otherAccounts] = await ethers.getSigners();

    const Survivor = await ethers.getContractFactory("Survivor");
    const survivor = await Survivor.deploy();

    return { survivor, owner, otherAccounts };
  }

  it("should handle registration status", async function () {
    const { survivor, otherAccounts } = await loadFixture(
      deploySurvivorFixture
    );

    expect(await survivor.isRegistrationOpen()).to.be.false;

    await expect(
      survivor.connect(otherAccounts[0]).openRegistration()
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await survivor.openRegistration();

    await expect(survivor.openRegistration()).to.be.revertedWith(
      "Registration is already open"
    );
    expect(await survivor.isRegistrationOpen()).to.be.true;

    await expect(
      survivor.connect(otherAccounts[0]).closeRegistration()
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await survivor.closeRegistration();
    await expect(survivor.closeRegistration()).to.be.revertedWith(
      "Registration is already closed"
    );
    expect(await survivor.isRegistrationOpen()).to.be.false;
  });

  it("should handle pool entry registration", async function () {
    const { survivor, otherAccounts } = await loadFixture(
      deploySurvivorFixture
    );

    await expect(
      survivor.connect(otherAccounts[0]).registerPoolEntry("slamma jamma")
    ).to.be.revertedWith("Registration is closed");

    await survivor.openRegistration();

    await survivor.connect(otherAccounts[0]).registerPoolEntry("slamma jamma");

    const [entryName, alive, isRegistered] = await survivor.poolEntries(
      otherAccounts[0].address
    );

    expect(await survivor.poolEntryAddresses(0)).to.equal(
      otherAccounts[0].address
    );
    expect(entryName).to.equal("slamma jamma");
    expect(alive).to.equal(true);
    expect(isRegistered).to.equal(true);
  });

  it("should reset survivor pool", async function () {
    const { survivor, otherAccounts } = await loadFixture(
      deploySurvivorFixture
    );

    await survivor.openRegistration();

    await survivor.connect(otherAccounts[0]).registerPoolEntry("slamma jamma");

    const [entryName1, alive1, isRegistered1] = await survivor.poolEntries(
      otherAccounts[0].address
    );

    expect(entryName1).to.equal("slamma jamma");
    expect(alive1).to.equal(true);
    expect(isRegistered1).to.equal(true);

    await expect(survivor.resetSurvivorPool()).to.be.revertedWith(
      "Registration must be closed in order to reset"
    );

    await survivor.closeRegistration();

    await expect(
      survivor.connect(otherAccounts[0]).resetSurvivorPool()
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await survivor.resetSurvivorPool();

    const [entryName2, alive2, isRegistered2] = await survivor.poolEntries(
      otherAccounts[0].address
    );

    const day = await survivor.day();

    await expect(survivor.poolEntryAddresses(0)).to.be.revertedWithoutReason();

    expect(entryName2).to.equal("");
    expect(alive2).to.equal(false);
    expect(isRegistered2).to.equal(false);
    expect(day).to.equal(0);
  });

  it("should eliminate pool entry", async () => {
    const { survivor, owner, otherAccounts } = await loadFixture(
      deploySurvivorFixture
    );

    await survivor.openRegistration();

    await survivor.connect(otherAccounts[0]).registerPoolEntry("slamma jamma");

    await expect(
      survivor
        .connect(otherAccounts[0])
        .eliminatePoolEntry(otherAccounts[0].address)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(survivor.eliminatePoolEntry(owner.address)).to.be.revertedWith(
      "Pool entry does not exist"
    );

    await survivor.eliminatePoolEntry(otherAccounts[0].address);

    await expect(
      survivor.eliminatePoolEntry(otherAccounts[0].address)
    ).to.be.revertedWith("Pool entry is already eliminated");
  });

  describe("payout out winner", async () => {
    it("should payout winner", async () => {
      const { survivor, owner, otherAccounts } = await loadFixture(
        deploySurvivorFixture
      );

      await survivor.openRegistration();

      await survivor
        .connect(otherAccounts[0])
        .registerPoolEntry("slamma jamma");

      await expect(
        survivor
          .connect(otherAccounts[0])
          .payoutWinner(otherAccounts[0].address, 1)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        survivor.payoutWinner(owner.address, ethers.utils.parseEther("1"))
      ).to.be.revertedWith("Pool entry does not exist");

      await expect(
        survivor.payoutWinner(
          otherAccounts[0].address,
          ethers.utils.parseEther("1")
        )
      ).to.be.revertedWith("Contract does not have enough funds");

      await owner.sendTransaction({
        to: survivor.address,
        value: ethers.utils.parseEther("2"),
        gasLimit: 21055,
      });

      await survivor.payoutWinner(
        otherAccounts[0].address,
        ethers.utils.parseEther("1")
      );
    });

    it("should handle paying out for eliminated pool entry", async () => {
      const { survivor, owner, otherAccounts } = await loadFixture(
        deploySurvivorFixture
      );

      await survivor.openRegistration();

      await survivor
        .connect(otherAccounts[0])
        .registerPoolEntry("slamma jamma");

      await survivor.eliminatePoolEntry(otherAccounts[0].address);

      await owner.sendTransaction({
        to: survivor.address,
        value: ethers.utils.parseEther("2"),
        gasLimit: 21055,
      });

      await expect(
        survivor.payoutWinner(
          otherAccounts[0].address,
          ethers.utils.parseEther("1")
        )
      ).to.be.revertedWith("Pool entry is eliminated");
    });
  });

  describe("make a pick", async () => {
    it("should handle making a pick", async () => {
      const { survivor, otherAccounts } = await loadFixture(
        deploySurvivorFixture
      );

      await survivor.openRegistration();

      await expect(
        survivor.connect(otherAccounts[0]).makeAPick(0)
      ).to.be.revertedWith(
        "Registration must be closed in order to make a pick"
      );

      await survivor
        .connect(otherAccounts[0])
        .registerPoolEntry("slamma jamma");

      await survivor.closeRegistration();

      await expect(
        survivor.connect(otherAccounts[1]).makeAPick(0)
      ).to.be.rejectedWith("Pool entry does not exist");

      await expect(
        survivor.connect(otherAccounts[0]).makeAPick(0)
      ).to.be.rejectedWith("Can not pick yet");

      await survivor.setDay(1);

      await expect(
        survivor.connect(otherAccounts[0]).makeAPick(64)
      ).to.be.rejectedWith("Pick is not valid");

      await survivor.connect(otherAccounts[0]).makeAPick(0);

      await survivor.setDay(2);

      await expect(
        survivor.connect(otherAccounts[0]).makeAPick(0)
      ).to.be.rejectedWith("Pick already exists");

      await survivor.connect(otherAccounts[0]).makeAPick(1);

      const picks = await survivor
        .connect(otherAccounts[0])
        .getPoolEntryPicks(otherAccounts[0].address);

      expect(picks[0]).to.equal(0);
      expect(picks[1]).to.equal(1);
    });

    it("should handle making a pick for eliminated pool entry", async () => {
      const { survivor, otherAccounts } = await loadFixture(
        deploySurvivorFixture
      );

      await survivor.openRegistration();

      await survivor
        .connect(otherAccounts[0])
        .registerPoolEntry("slamma jamma");

      await survivor.closeRegistration();

      await survivor.eliminatePoolEntry(otherAccounts[0].address);

      await expect(
        survivor.connect(otherAccounts[0]).makeAPick(0)
      ).to.be.revertedWith("Pool entry is eliminated");
    });
  });

  it("should get pool entries", async () => {
    const { survivor, otherAccounts } = await loadFixture(
      deploySurvivorFixture
    );

    await survivor.openRegistration();

    await survivor.connect(otherAccounts[0]).registerPoolEntry("slamma jamma");
    await survivor.connect(otherAccounts[1]).registerPoolEntry("basketballa");

    const poolEntries = await survivor.getPoolEntries();

    expect(poolEntries).to.deep.equal([
      otherAccounts[0].address,
      otherAccounts[1].address,
    ]);
  });

  it("should set day", async () => {
    const { survivor, otherAccounts } = await loadFixture(
      deploySurvivorFixture
    );

    await expect(
      survivor.connect(otherAccounts[0]).setDay(1)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await survivor.openRegistration();

    await expect(survivor.setDay(1)).to.be.revertedWith(
      "Registration must be closed in order to set day"
    );

    await survivor.closeRegistration();

    await survivor.setDay(1);

    const day = await survivor.day();

    expect(day).to.equal(1);
  });
});
