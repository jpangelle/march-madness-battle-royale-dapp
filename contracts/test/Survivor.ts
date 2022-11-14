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

const deploySurvivorFixture = async () => {
  const [owner] = await ethers.getSigners();
  const impersonatedSigner1 = await ethers.getImpersonatedSigner(USDC_WHALE_1);
  const impersonatedSigner2 = await ethers.getImpersonatedSigner(USDC_WHALE_2);

  const SurvivorFactory = await ethers.getContractFactory("Survivor");
  const survivor = await SurvivorFactory.deploy();

  return {
    survivor,
    owner,
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

describe("Survivor", function () {
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

    await expect(
      survivor.connect(otherAccounts[0]).registerPoolEntry("slamma jamma")
    ).to.be.revertedWith("Not enough funds approved for transfer");

    await approveUSDCTokens(otherAccounts[0], survivor.address);

    await survivor.connect(otherAccounts[0]).registerPoolEntry("slamma jamma");

    const [entryName, isRegistered] = await survivor.poolEntries(
      otherAccounts[0].address
    );

    expect(await survivor.poolEntryAddresses(0)).to.equal(
      otherAccounts[0].address
    );
    expect(entryName).to.equal("slamma jamma");
    expect(isRegistered).to.equal(true);
  });

  it("should reset survivor pool", async function () {
    const { survivor, otherAccounts } = await loadFixture(
      deploySurvivorFixture
    );

    await survivor.openRegistration();

    await approveUSDCTokens(otherAccounts[0], survivor.address);

    await survivor.connect(otherAccounts[0]).registerPoolEntry("slamma jamma");

    const [entryName1, isRegistered1] = await survivor.poolEntries(
      otherAccounts[0].address
    );

    expect(entryName1).to.equal("slamma jamma");
    expect(isRegistered1).to.equal(true);

    await expect(survivor.resetSurvivorPool()).to.be.revertedWith(
      "Registration must be closed in order to reset"
    );

    await survivor.closeRegistration();

    await expect(
      survivor.connect(otherAccounts[0]).resetSurvivorPool()
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await survivor.resetSurvivorPool();

    const [entryName2, isRegistered2] = await survivor.poolEntries(
      otherAccounts[0].address
    );

    const day = await survivor.day();

    await expect(survivor.poolEntryAddresses(0)).to.be.revertedWithoutReason();
    await expect(survivor.eliminatedTeams(0)).to.be.revertedWithoutReason();

    expect(entryName2).to.equal("");
    expect(isRegistered2).to.equal(false);
    expect(day).to.equal(0);
  });

  it("should update eliminated teams", async () => {
    const { survivor, otherAccounts } = await loadFixture(
      deploySurvivorFixture
    );

    await survivor.openRegistration();

    await approveUSDCTokens(otherAccounts[0], survivor.address);

    await survivor.connect(otherAccounts[0]).registerPoolEntry("slamma jamma");

    await survivor.closeRegistration();

    await survivor.setDay(1);

    await survivor.connect(otherAccounts[0]).makeAPick(4);

    await expect(
      survivor.connect(otherAccounts[0]).updateEliminatedTeams([13])
    ).to.be.revertedWith("Ownable: caller is not the owner");

    const isEliminated1 = await survivor.isEntryEliminated(
      otherAccounts[0].address
    );

    expect(isEliminated1).to.be.false;

    await survivor.updateEliminatedTeams([13]);

    const isEliminated2 = await survivor.isEntryEliminated(
      otherAccounts[0].address
    );

    expect(isEliminated2).to.be.false;

    await survivor.setDay(2);

    await survivor.connect(otherAccounts[0]).makeAPick(7);

    await survivor.updateEliminatedTeams([7]);

    const isEliminated3 = await survivor.isEntryEliminated(
      otherAccounts[0].address
    );

    expect(isEliminated3).to.be.true;

    const eliminatedTeams = await survivor.getEliminatedTeams();

    expect(eliminatedTeams).to.deep.equal([13, 7]);
  });

  describe("payout winner", async () => {
    it("should payout winner", async () => {
      const { survivor, owner, otherAccounts } = await loadFixture(
        deploySurvivorFixture
      );

      await survivor.openRegistration();

      await approveUSDCTokens(otherAccounts[0], survivor.address);

      await survivor
        .connect(otherAccounts[0])
        .registerPoolEntry("slamma jamma");

      await expect(
        survivor
          .connect(otherAccounts[0])
          .payoutWinner(otherAccounts[0].address, 10000000)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        survivor.payoutWinner(owner.address, ethers.utils.parseEther("1"))
      ).to.be.revertedWith("Pool entry does not exist");

      await expect(
        survivor.payoutWinner(otherAccounts[0].address, 1000000000)
      ).to.be.revertedWith("Contract does not have enough funds");

      const usdcContract = getUSDCContract();

      const winnerBalance1 = await usdcContract.balanceOf(
        otherAccounts[0].address
      );

      await survivor.payoutWinner(otherAccounts[0].address, 10000000);

      const winnerBalance2 = await usdcContract.balanceOf(
        otherAccounts[0].address
      );

      expect(winnerBalance2.sub(winnerBalance1)).to.equal(10000000);
    });

    it("should handle paying out for eliminated pool entry", async () => {
      const { survivor, otherAccounts } = await loadFixture(
        deploySurvivorFixture
      );

      await survivor.openRegistration();

      await approveUSDCTokens(otherAccounts[0], survivor.address);

      await survivor
        .connect(otherAccounts[0])
        .registerPoolEntry("slamma jamma");

      await survivor.closeRegistration();

      await survivor.setDay(1);

      await survivor.connect(otherAccounts[0]).makeAPick(4);

      await survivor.updateEliminatedTeams([4, 12]);

      const isEntryEliminated = await survivor.isEntryEliminated(
        otherAccounts[0].address
      );

      expect(isEntryEliminated).to.be.true;

      await expect(
        survivor.payoutWinner(otherAccounts[0].address, 10000000)
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

      await approveUSDCTokens(otherAccounts[0], survivor.address);

      await survivor
        .connect(otherAccounts[0])
        .registerPoolEntry("slamma jamma");

      await survivor.closeRegistration();

      await expect(
        survivor.connect(otherAccounts[1]).makeAPick(0)
      ).to.be.rejectedWith("Pool entry does not exist");

      await expect(
        survivor.connect(otherAccounts[0]).makeAPick(64)
      ).to.be.rejectedWith("Pick is not valid");

      await survivor.connect(otherAccounts[0]).makeAPick(0);

      await expect(
        survivor.connect(otherAccounts[0]).makeAPick(0)
      ).to.be.rejectedWith("Pick already exists");

      await survivor.connect(otherAccounts[0]).makeAPick(1);
      await survivor.connect(otherAccounts[0]).makeAPick(2);
      await survivor.connect(otherAccounts[0]).makeAPick(3);
      await survivor.connect(otherAccounts[0]).makeAPick(4);
      await survivor.connect(otherAccounts[0]).makeAPick(5);
      await survivor.connect(otherAccounts[0]).makeAPick(6);
      await survivor.connect(otherAccounts[0]).makeAPick(7);
      await survivor.connect(otherAccounts[0]).makeAPick(8);
      await survivor.connect(otherAccounts[0]).makeAPick(9);

      const picks = await survivor
        .connect(otherAccounts[0])
        .getPoolEntryPicks(otherAccounts[0].address);

      expect(picks).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

      await expect(
        survivor.connect(otherAccounts[0]).makeAPick(10)
      ).to.be.revertedWith("Too many picks, use editPick");
    });

    it("should handle making a pick for eliminated pool entry", async () => {
      const { survivor, otherAccounts } = await loadFixture(
        deploySurvivorFixture
      );

      await survivor.openRegistration();

      await approveUSDCTokens(otherAccounts[0], survivor.address);

      await survivor
        .connect(otherAccounts[0])
        .registerPoolEntry("slamma jamma");

      await survivor.closeRegistration();

      await survivor.setDay(1);

      await survivor.connect(otherAccounts[0]).makeAPick(4);

      await survivor.updateEliminatedTeams([4]);

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

    await approveUSDCTokens(otherAccounts[0], survivor.address);
    await approveUSDCTokens(otherAccounts[1], survivor.address);

    await survivor.connect(otherAccounts[0]).registerPoolEntry("slamma jamma");
    await survivor.connect(otherAccounts[1]).registerPoolEntry("basketballa");

    const poolEntries = await survivor.getPoolEntries();

    expect(poolEntries).to.deep.equal([
      otherAccounts[0].address,
      otherAccounts[1].address,
    ]);
  });

  it("should edit pick", async () => {
    const { survivor, otherAccounts } = await loadFixture(
      deploySurvivorFixture
    );

    await survivor.openRegistration();

    await approveUSDCTokens(otherAccounts[0], survivor.address);

    await survivor.connect(otherAccounts[0]).registerPoolEntry("slamma jamma");

    await expect(
      survivor.connect(otherAccounts[0]).editPick(1, 1)
    ).to.be.rejectedWith("Registration must be closed in order to edit a pick");

    await survivor.closeRegistration();

    await survivor.connect(otherAccounts[0]).makeAPick(0);

    const picks1 = await survivor
      .connect(otherAccounts[0])
      .getPoolEntryPicks(otherAccounts[0].address);

    expect(picks1[0]).to.equal(0);

    await survivor.connect(otherAccounts[0]).editPick(4, 1);

    await expect(
      survivor.connect(otherAccounts[1]).editPick(1, 1)
    ).to.be.revertedWith("Pool entry does not exist");

    const picks2 = await survivor
      .connect(otherAccounts[0])
      .getPoolEntryPicks(otherAccounts[0].address);

    expect(picks2[0]).to.equal(4);

    await survivor.setDay(2);

    await expect(
      survivor.connect(otherAccounts[0]).editPick(1, 1)
    ).to.be.revertedWith("Invalid day");

    await survivor.updateEliminatedTeams([4]);

    await expect(
      survivor.connect(otherAccounts[0]).editPick(1, 1)
    ).to.be.revertedWith("Pool entry is eliminated");
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
