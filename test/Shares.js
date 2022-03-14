const { expect } = require("chai");
const { ethers } = require("hardhat");

const SHARES = { first: 80, second: 20 };

let contractToken;

beforeEach(async() => {
  const Shares = await ethers.getContractFactory("Shares");
  contractToken = await Shares.deploy();
  await contractToken.deployed();
})

describe("Shares", function () {
  describe('dividends', () => {
    it("should add dividends to the contract", async function () {
      const DIVIDENDS_AMOUNT = 10000;

      await contractToken.addDividends(DIVIDENDS_AMOUNT);
      const dividends = await contractToken.getAccumulatedDividends();
      expect(dividends).to.equal(DIVIDENDS_AMOUNT);
    });
  });

  describe('stakeholders', () => {
    it('should register a new stakeholder', async() => {
      const [ firstAccount, secondAccount ] = await ethers.getSigners();

      await contractToken.addStakeholder(firstAccount.address, SHARES.first);
      await contractToken.addStakeholder(secondAccount.address, SHARES.second);

      expect(await contractToken.getShare(firstAccount.address)).to.equal(SHARES.first);
      expect(await contractToken.getShare(secondAccount.address)).to.equal(SHARES.second);
      expect(await contractToken.getTotalShares()).to.equal(SHARES.first + SHARES.second);
    });

    it('should increase share of a stakeholder if he is already registered', async() => {
      const [ firstAccount ] = await ethers.getSigners();

      await contractToken.addStakeholder(firstAccount.address, SHARES.first);
      await contractToken.addStakeholder(firstAccount.address, SHARES.second);

      expect(await contractToken.getShare(firstAccount.address)).to.equal(SHARES.first + SHARES.second);
      expect(await contractToken.getTotalShares()).to.equal(SHARES.first + SHARES.second);
    });
  });
});
