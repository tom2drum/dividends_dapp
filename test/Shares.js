const { expect } = require("chai");
const { ethers } = require("hardhat");

const SHARES = { first: 80, second: 20 };

let contractToken;
let dividendsRegistrationEvent;
let dividendsReleaseEvent;

beforeEach(async() => {
  const Shares = await ethers.getContractFactory("Shares");
  contractToken = await Shares.deploy();
  await contractToken.deployed();

  dividendsRegistrationEvent = new Promise((resolve, reject) => {
    contractToken.on('DividendsRegistered', (value, event) => {
      event.removeListener();

      resolve(value);
    });

    setTimeout(() => reject(new Error('timeout')), 60_000);
  });

  dividendsReleaseEvent = new Promise((resolve, reject) => {
    contractToken.on('DividendsReleased', (stakeholder, amount, event) => {
      event.removeListener();

      resolve({ stakeholder, amount });
    });

    setTimeout(() => reject(new Error('timeout')), 60_000);
  });
})

describe("Shares", function () {
  describe('dividends', () => {
    it("should add dividends to the contract", async function () {
      const DIVIDENDS_AMOUNT = 10000;
      const [ firstAccount ] = await ethers.getSigners();

      await contractToken.connect(firstAccount).addDividends({ value: DIVIDENDS_AMOUNT });
      const event = await dividendsRegistrationEvent;
      const dividends = await contractToken.getDividendsPool();

      expect(dividends).to.equal(DIVIDENDS_AMOUNT);
      expect(event.toNumber()).to.equal(DIVIDENDS_AMOUNT);
    });

    describe('claim process', () => {
      let initialBalance;
      let newBalance;
      let event;
      let secondAccount;

      beforeEach(async() => {
        const [ firstAccount, _secondAccount ] = await ethers.getSigners();
        secondAccount = _secondAccount;

        initialBalance = await secondAccount.getBalance();

        await contractToken.addStakeholder(firstAccount.address, SHARES.first);
        await contractToken.addStakeholder(secondAccount.address, SHARES.second);
        await contractToken.connect(firstAccount).addDividends({ value: 10000 });
        await contractToken.claimDividends(secondAccount.address);
        event = await dividendsReleaseEvent;

        newBalance = await secondAccount.getBalance();
      })
    
      it("stakeholder should be able to claim dividends", async function () {
        expect(event.stakeholder).to.equal(secondAccount.address);
        expect(event.amount).to.equal(2000);
        expect(newBalance.sub(initialBalance).toNumber()).to.equal(2000);
      });

      it.only('stakeholder cannot claim dividends twice', async() => {
        await expect(contractToken.claimDividends(secondAccount.address)).to.be.revertedWith('Dividends has been already claimed');
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
  });
});
