const { expect } = require("chai");
const { ethers } = require("hardhat");

const SHARES = { first: 80, second: 20 };
const DIVIDENDS_AMOUNT = 10000;

let contractToken;

beforeEach(async() => {
  const Shares = await ethers.getContractFactory("Shares");
  contractToken = await Shares.deploy();
  await contractToken.deployed();
})

describe("Shares", function () {
  describe('dividends', () => {
    it("should add dividends to the contract", async function () {
      const [ firstAccount ] = await ethers.getSigners();

      await expect(contractToken.connect(firstAccount).addDividends({ value: DIVIDENDS_AMOUNT }))
        .to.emit(contractToken, 'DividendsRegistered')
        .withArgs(DIVIDENDS_AMOUNT);

      let dividends = await contractToken.getDividendsPool();
      expect(dividends).to.equal(DIVIDENDS_AMOUNT);

      await expect(contractToken.connect(firstAccount).addDividends({ value: DIVIDENDS_AMOUNT }))
        .to.emit(contractToken, 'DividendsRegistered')
        .withArgs(DIVIDENDS_AMOUNT);

      dividends = await contractToken.getDividendsPool();
      expect(dividends).to.equal(2 * DIVIDENDS_AMOUNT);
    });

    describe('initial claim', () => {
      it("stakeholder should be able to claim dividends", async function () {
        const { secondAccount } = await registerAccountsAndAddDividends();
        const initialBalance = await secondAccount.getBalance();

        await expect(contractToken.claimDividends(secondAccount.address))
          .to.emit(contractToken, 'DividendsReleased')
          .withArgs(secondAccount.address, 2000);

        const newBalance = await secondAccount.getBalance();

        expect(newBalance.sub(initialBalance).toNumber()).to.equal(2000);
      });

      it('stakeholder cannot claim dividends twice', async() => {
        const { secondAccount } = await registerAccountsAndAddDividends();
        await contractToken.claimDividends(secondAccount.address);

        await expect(contractToken.claimDividends(secondAccount.address)).to.be.revertedWith('No dividends to pay');
      });

      it('will not release dividends from empty pool', async() => {
        const [ firstAccount, secondAccount ] = await ethers.getSigners();
        await contractToken.addStakeholder(firstAccount.address, SHARES.first);
        await contractToken.addStakeholder(secondAccount.address, SHARES.second);

        await expect(contractToken.claimDividends(secondAccount.address)).to.be.revertedWith('Dividends pool is empty');
      });

      it('will not pay dividends to unknown stakeholder', async() => {
        const [ firstAccount, secondAccount, thirdAccount ] = await ethers.getSigners();
        await contractToken.addStakeholder(firstAccount.address, SHARES.first);
        await contractToken.addStakeholder(secondAccount.address, SHARES.second);
        await contractToken.connect(firstAccount).addDividends({ value: 10000 });

        await expect(contractToken.claimDividends(thirdAccount.address)).to.be.revertedWith('There is no such stakeholder');
      });
    });

    describe('subsequent claims', () => {
      it('send correct amount on the second claim for the same address', async() => {
        const { firstAccount, secondAccount } = await registerAccountsAndAddDividends();
        const initialBalance = await secondAccount.getBalance();

        await contractToken.claimDividends(secondAccount.address);
        await contractToken.connect(firstAccount).addDividends({ value: 5000 });

        await expect(contractToken.claimDividends(secondAccount.address))
          .to.emit(contractToken, 'DividendsReleased')
          .withArgs(secondAccount.address, 1000);

        const newBalance = await secondAccount.getBalance();
        expect(newBalance.sub(initialBalance).toNumber()).to.equal(3000);
      });

      it('send correct amount on the second claim for another address', async() => {
        const { firstAccount, secondAccount, thirdAccount } = await registerAccountsAndAddDividends();
        const initialBalance = await thirdAccount.getBalance();

        await contractToken.claimDividends(secondAccount.address);
        await contractToken.connect(firstAccount).addDividends({ value: 5000 });

        await expect(contractToken.claimDividends(thirdAccount.address))
          .to.emit(contractToken, 'DividendsReleased')
          .withArgs(thirdAccount.address, 12000);

        const newBalance = await thirdAccount.getBalance();
        expect(newBalance.sub(initialBalance).toNumber()).to.equal(12000);
      });

      it('will empty the pool when all dividends are paid', async() => {
        const { firstAccount, secondAccount, thirdAccount } = await registerAccountsAndAddDividends();

        await contractToken.claimDividends(secondAccount.address);
        await contractToken.connect(firstAccount).addDividends({ value: 5000 });
        await contractToken.claimDividends(thirdAccount.address);
        await contractToken.claimDividends(secondAccount.address);

        const dividendsPool = await contractToken.getDividendsPool();
        expect(dividendsPool).to.equal(0);
      });
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

    it('should not register a stakeholder with empty share', async () => {
      const [ firstAccount ] = await ethers.getSigners();

      await expect(contractToken.addStakeholder(firstAccount.address, 0)).to.be.revertedWith('Share cannot be zero');
    });
  });
});

async function registerAccountsAndAddDividends() {
  const [ firstAccount, secondAccount, thirdAccount ] = await ethers.getSigners();

  await contractToken.addStakeholder(thirdAccount.address, SHARES.first);
  await contractToken.addStakeholder(secondAccount.address, SHARES.second);
  await contractToken.connect(firstAccount).addDividends({ value: DIVIDENDS_AMOUNT });

  return { firstAccount, secondAccount, thirdAccount };
}