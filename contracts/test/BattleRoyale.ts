import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import usdcAbi from "./usdc-abi.json";

const USDC_WHALE_1 = "0xF977814e90dA44bFA03b6295A0616a897441aceC";
const USDC_WHALE_2 = "0xe7804c37c13166fF0b37F5aE0BB07A3aEbb6e245";
const USDC_CONTRACT_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

const getUSDCContract = (signer?: SignerWithAddress) =>
  new ethers.Contract(
    USDC_CONTRACT_ADDRESS,
    usdcAbi,
    signer || ethers.provider
  );

const deployBattleRoyalePoolFixture = async () => {
  const [...admins] = await ethers.getSigners();
  const impersonatedSigner1 = await ethers.getImpersonatedSigner(USDC_WHALE_1);
  const impersonatedSigner2 = await ethers.getImpersonatedSigner(USDC_WHALE_2);

  const BattleRoyaleFactory = await ethers.getContractFactory("BattleRoyale");
  const battleRoyalePool = await BattleRoyaleFactory.deploy([
    admins[0].address,
    admins[1].address,
  ]);

  return {
    battleRoyalePool,
    admins: [admins[0], admins[1]],
    otherAccounts: [impersonatedSigner1, impersonatedSigner2],
  };
};

const approveUSDCTokens = async (
  signer: SignerWithAddress,
  spender: string
) => {
  const usdcContract = getUSDCContract(signer);

  await usdcContract.approve(spender, 10000000);
};

describe("Battle Royale", () => {
  it("should grant admin roles", async () => {
    const { battleRoyalePool, admins, otherAccounts } = await loadFixture(
      deployBattleRoyalePoolFixture
    );

    const isAdmin1 = await battleRoyalePool.hasRole(
      battleRoyalePool.ADMIN_ROLE(),
      admins[0].address
    );
    const isAdmin2 = await battleRoyalePool.hasRole(
      battleRoyalePool.ADMIN_ROLE(),
      admins[1].address
    );
    const isAdmin3 = await battleRoyalePool.hasRole(
      battleRoyalePool.ADMIN_ROLE(),
      otherAccounts[0].address
    );

    expect(isAdmin1).to.be.true;
    expect(isAdmin2).to.be.true;
    expect(isAdmin3).to.be.false;
  });

  it("should handle registration status", async () => {
    const { battleRoyalePool, otherAccounts } = await loadFixture(
      deployBattleRoyalePoolFixture
    );

    expect(await battleRoyalePool.isRegistrationOpen()).to.be.false;

    await expect(
      battleRoyalePool.connect(otherAccounts[0]).openRegistration()
    ).to.be.revertedWith(
      "AccessControl: account 0xf977814e90da44bfa03b6295a0616a897441acec is missing role 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"
    );

    await battleRoyalePool.openRegistration();

    await expect(battleRoyalePool.openRegistration()).to.be.revertedWith(
      "Registration is already open"
    );
    expect(await battleRoyalePool.isRegistrationOpen()).to.be.true;

    await expect(
      battleRoyalePool.connect(otherAccounts[0]).closeRegistration()
    ).to.be.revertedWith(
      "AccessControl: account 0xf977814e90da44bfa03b6295a0616a897441acec is missing role 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"
    );

    await battleRoyalePool.closeRegistration();
    await expect(battleRoyalePool.closeRegistration()).to.be.revertedWith(
      "Registration is already closed"
    );
    expect(await battleRoyalePool.isRegistrationOpen()).to.be.false;
  });

  it("should handle pool entry registration", async () => {
    const { battleRoyalePool, otherAccounts } = await loadFixture(
      deployBattleRoyalePoolFixture
    );

    await expect(
      battleRoyalePool
        .connect(otherAccounts[0])
        .registerPoolEntry("slamma jamma")
    ).to.be.revertedWith("Registration is closed");

    await battleRoyalePool.openRegistration();

    await expect(
      battleRoyalePool
        .connect(otherAccounts[0])
        .registerPoolEntry("slamma jamma")
    ).to.be.revertedWith("Not enough funds approved for transfer");

    await approveUSDCTokens(otherAccounts[0], battleRoyalePool.address);

    await battleRoyalePool
      .connect(otherAccounts[0])
      .registerPoolEntry("slamma jamma");

    const version = await battleRoyalePool.version();

    expect(version).to.equal(0);

    const [entryName, isRegistered] = await battleRoyalePool.poolEntries(
      version,
      otherAccounts[0].address
    );

    expect(entryName).to.equal("slamma jamma");
    expect(isRegistered).to.equal(true);
  });

  it("should reset battle royale pool", async () => {
    const { battleRoyalePool, otherAccounts } = await loadFixture(
      deployBattleRoyalePoolFixture
    );

    await battleRoyalePool.openRegistration();

    await approveUSDCTokens(otherAccounts[0], battleRoyalePool.address);

    await battleRoyalePool
      .connect(otherAccounts[0])
      .registerPoolEntry("slamma jamma");

    const version1 = await battleRoyalePool.version();

    expect(version1).to.equal(0);

    const [entryName1, isRegistered1] = await battleRoyalePool.poolEntries(
      version1,
      otherAccounts[0].address
    );

    expect(entryName1).to.equal("slamma jamma");
    expect(isRegistered1).to.equal(true);

    await expect(battleRoyalePool.resetBattleRoyalePool()).to.be.revertedWith(
      "Registration must be closed in order to reset"
    );

    await battleRoyalePool.closeRegistration();

    await expect(
      battleRoyalePool.connect(otherAccounts[0]).resetBattleRoyalePool()
    ).to.be.revertedWith(
      "AccessControl: account 0xf977814e90da44bfa03b6295a0616a897441acec is missing role 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"
    );

    await battleRoyalePool.resetBattleRoyalePool();

    const version2 = await battleRoyalePool.version();

    expect(version2).to.equal(1);

    const [entryName2, isRegistered2] = await battleRoyalePool.poolEntries(
      version2,
      otherAccounts[0].address
    );

    const day = await battleRoyalePool.day();

    await expect(
      battleRoyalePool.eliminatedTeams(0)
    ).to.be.revertedWithoutReason();

    expect(entryName2).to.equal("");
    expect(isRegistered2).to.equal(false);
    expect(day).to.equal(0);
  });

  it("should update eliminated teams", async () => {
    const { battleRoyalePool, otherAccounts } = await loadFixture(
      deployBattleRoyalePoolFixture
    );

    await battleRoyalePool.openRegistration();

    await approveUSDCTokens(otherAccounts[0], battleRoyalePool.address);

    await battleRoyalePool
      .connect(otherAccounts[0])
      .registerPoolEntry("slamma jamma");

    await battleRoyalePool.closeRegistration();

    await battleRoyalePool.connect(otherAccounts[0]).makeAPick(4, 0);

    await expect(
      battleRoyalePool.connect(otherAccounts[0]).updateEliminatedTeams([13])
    ).to.be.revertedWith(
      "AccessControl: account 0xf977814e90da44bfa03b6295a0616a897441acec is missing role 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"
    );

    const isEliminated1 = await battleRoyalePool.isEntryEliminated(
      otherAccounts[0].address
    );

    expect(isEliminated1).to.be.false;

    await battleRoyalePool.updateEliminatedTeams([13]);

    const isEliminated2 = await battleRoyalePool.isEntryEliminated(
      otherAccounts[0].address
    );

    expect(isEliminated2).to.be.false;

    await battleRoyalePool.setDay(1);

    await battleRoyalePool.connect(otherAccounts[0]).makeAPick(7, 1);

    await expect(
      battleRoyalePool.updateEliminatedTeams([65])
    ).to.be.revertedWith("Invalid team");

    await battleRoyalePool.updateEliminatedTeams([7]);

    const isEliminated3 = await battleRoyalePool.isEntryEliminated(
      otherAccounts[0].address
    );

    expect(isEliminated3).to.be.true;

    const eliminatedTeams = await battleRoyalePool.getEliminatedTeams();

    expect(eliminatedTeams).to.deep.equal([13, 7]);

    await expect(
      battleRoyalePool.updateEliminatedTeams(
        Array.from({ length: 64 }, (_, i) => i + 1)
      )
    ).to.be.revertedWith("Too many teams eliminated");
  });

  describe("payout winner", () => {
    it("should payout winner", async () => {
      const { battleRoyalePool, otherAccounts } = await loadFixture(
        deployBattleRoyalePoolFixture
      );

      await battleRoyalePool.openRegistration();

      await approveUSDCTokens(otherAccounts[0], battleRoyalePool.address);

      await battleRoyalePool
        .connect(otherAccounts[0])
        .registerPoolEntry("slamma jamma");

      await expect(
        battleRoyalePool
          .connect(otherAccounts[0])
          .payoutWinner(otherAccounts[0].address, 10000000)
      ).to.be.revertedWith(
        "AccessControl: account 0xf977814e90da44bfa03b6295a0616a897441acec is missing role 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"
      );

      await expect(
        battleRoyalePool.payoutWinner(
          otherAccounts[1].address,
          ethers.utils.parseEther("1")
        )
      ).to.be.revertedWith("Pool entry does not exist");

      await expect(
        battleRoyalePool.payoutWinner(otherAccounts[0].address, 1000000000)
      ).to.be.revertedWith("Contract does not have enough funds");

      const usdcContract = getUSDCContract();

      const winnerBalance1 = await usdcContract.balanceOf(
        otherAccounts[0].address
      );

      await battleRoyalePool.payoutWinner(otherAccounts[0].address, 10000000);

      const winnerBalance2 = await usdcContract.balanceOf(
        otherAccounts[0].address
      );

      expect(winnerBalance2.sub(winnerBalance1)).to.equal(10000000);
    });

    it("should handle paying out for eliminated pool entry", async () => {
      const { battleRoyalePool, otherAccounts } = await loadFixture(
        deployBattleRoyalePoolFixture
      );

      await battleRoyalePool.openRegistration();

      await approveUSDCTokens(otherAccounts[0], battleRoyalePool.address);

      await battleRoyalePool
        .connect(otherAccounts[0])
        .registerPoolEntry("slamma jamma");

      await battleRoyalePool.closeRegistration();

      await battleRoyalePool.connect(otherAccounts[0]).makeAPick(4, 0);

      await battleRoyalePool.updateEliminatedTeams([4, 12]);

      const isEntryEliminated = await battleRoyalePool.isEntryEliminated(
        otherAccounts[0].address
      );

      expect(isEntryEliminated).to.be.true;

      await expect(
        battleRoyalePool.payoutWinner(otherAccounts[0].address, 10000000)
      ).to.be.revertedWith("Pool entry is eliminated");
    });
  });

  describe("make a pick", () => {
    it("should handle making a pick", async () => {
      const { battleRoyalePool, otherAccounts } = await loadFixture(
        deployBattleRoyalePoolFixture
      );

      await battleRoyalePool.openRegistration();

      await expect(
        battleRoyalePool.connect(otherAccounts[0]).makeAPick(1, 0)
      ).to.be.revertedWith(
        "Registration must be closed in order to make or edit a pick"
      );

      await approveUSDCTokens(otherAccounts[0], battleRoyalePool.address);

      await battleRoyalePool
        .connect(otherAccounts[0])
        .registerPoolEntry("slamma jamma");

      await battleRoyalePool.closeRegistration();

      await expect(
        battleRoyalePool.connect(otherAccounts[1]).makeAPick(1, 0)
      ).to.be.rejectedWith("Pool entry does not exist");

      await expect(
        battleRoyalePool.connect(otherAccounts[0]).makeAPick(0, 0)
      ).to.be.rejectedWith("Pick is not valid");

      await expect(
        battleRoyalePool.connect(otherAccounts[0]).makeAPick(65, 0)
      ).to.be.rejectedWith("Pick is not valid");

      await battleRoyalePool.connect(otherAccounts[0]).makeAPick(1, 0);

      await expect(
        battleRoyalePool.connect(otherAccounts[0]).makeAPick(1, 1)
      ).to.be.rejectedWith("Pick already exists");

      await battleRoyalePool.connect(otherAccounts[0]).makeAPick(2, 1);
      await battleRoyalePool.connect(otherAccounts[0]).makeAPick(3, 2);
      await battleRoyalePool.connect(otherAccounts[0]).makeAPick(4, 3);
      await battleRoyalePool.connect(otherAccounts[0]).makeAPick(5, 4);
      await battleRoyalePool.connect(otherAccounts[0]).makeAPick(6, 5);
      await battleRoyalePool.connect(otherAccounts[0]).makeAPick(7, 6);
      await battleRoyalePool.connect(otherAccounts[0]).makeAPick(8, 7);
      await battleRoyalePool.connect(otherAccounts[0]).makeAPick(9, 8);
      await battleRoyalePool.connect(otherAccounts[0]).makeAPick(10, 9);

      const picks = await battleRoyalePool
        .connect(otherAccounts[0])
        .getPoolEntryPicks(otherAccounts[0].address);

      expect(picks).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

      await expect(
        battleRoyalePool.connect(otherAccounts[0]).makeAPick(11, 10)
      ).to.be.revertedWithPanic();
    });

    it("should handle making a pick for eliminated pool entry", async () => {
      const { battleRoyalePool, otherAccounts } = await loadFixture(
        deployBattleRoyalePoolFixture
      );

      await battleRoyalePool.openRegistration();

      await approveUSDCTokens(otherAccounts[0], battleRoyalePool.address);

      await battleRoyalePool
        .connect(otherAccounts[0])
        .registerPoolEntry("slamma jamma");

      await battleRoyalePool.closeRegistration();

      await battleRoyalePool.connect(otherAccounts[0]).makeAPick(4, 0);

      await battleRoyalePool.updateEliminatedTeams([4]);

      await expect(
        battleRoyalePool.connect(otherAccounts[0]).makeAPick(12, 1)
      ).to.be.revertedWith("Pool entry is eliminated");
    });
  });

  it("should increment version", async () => {
    const { battleRoyalePool, otherAccounts } = await loadFixture(
      deployBattleRoyalePoolFixture
    );

    const version1 = await battleRoyalePool.version();

    expect(version1).to.equal(0);

    await expect(
      battleRoyalePool.connect(otherAccounts[0]).incrementVersion()
    ).to.be.revertedWith(
      "AccessControl: account 0xf977814e90da44bfa03b6295a0616a897441acec is missing role 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"
    );

    await battleRoyalePool.incrementVersion();

    const version2 = await battleRoyalePool.version();

    expect(version2).to.equal(1);
  });

  it("should edit pick", async () => {
    const { battleRoyalePool, otherAccounts } = await loadFixture(
      deployBattleRoyalePoolFixture
    );

    await battleRoyalePool.openRegistration();

    await approveUSDCTokens(otherAccounts[0], battleRoyalePool.address);

    await battleRoyalePool
      .connect(otherAccounts[0])
      .registerPoolEntry("slamma jamma");

    await expect(
      battleRoyalePool.connect(otherAccounts[0]).makeAPick(1, 0)
    ).to.be.rejectedWith(
      "Registration must be closed in order to make or edit a pick"
    );

    await battleRoyalePool.closeRegistration();

    await battleRoyalePool.connect(otherAccounts[0]).makeAPick(17, 0);

    const picks1 = await battleRoyalePool
      .connect(otherAccounts[0])
      .getPoolEntryPicks(otherAccounts[0].address);

    expect(picks1[0]).to.equal(17);

    await battleRoyalePool.connect(otherAccounts[0]).makeAPick(4, 0);

    await expect(
      battleRoyalePool.connect(otherAccounts[1]).makeAPick(5, 0)
    ).to.be.revertedWith("Pool entry does not exist");

    const picks2 = await battleRoyalePool
      .connect(otherAccounts[0])
      .getPoolEntryPicks(otherAccounts[0].address);

    expect(picks2[0]).to.equal(4);

    await battleRoyalePool.setDay(1);

    await expect(
      battleRoyalePool.connect(otherAccounts[0]).makeAPick(1, 0)
    ).to.be.revertedWith("Invalid day");

    await battleRoyalePool.updateEliminatedTeams([4]);

    await expect(
      battleRoyalePool.connect(otherAccounts[0]).makeAPick(1, 1)
    ).to.be.revertedWith("Pool entry is eliminated");
  });

  it("should set day", async () => {
    const { battleRoyalePool, otherAccounts } = await loadFixture(
      deployBattleRoyalePoolFixture
    );

    await battleRoyalePool.openRegistration();

    await expect(
      battleRoyalePool.connect(otherAccounts[0]).setDay(1)
    ).to.be.revertedWith(
      "AccessControl: account 0xf977814e90da44bfa03b6295a0616a897441acec is missing role 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"
    );

    await expect(battleRoyalePool.setDay(1)).to.be.revertedWith(
      "Registration must be closed in order to set day"
    );

    await battleRoyalePool.closeRegistration();

    await battleRoyalePool.setDay(1);

    const day = await battleRoyalePool.day();

    expect(day).to.equal(1);
  });
});
