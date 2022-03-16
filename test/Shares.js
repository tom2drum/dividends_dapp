const { expect } = require('chai');
const { ethers } = require('hardhat');

const SHARES = { first: 80, second: 20 };
const DIVIDENDS_AMOUNT = 10000;

let contractToken;

beforeEach(async () => {
	const Shares = await ethers.getContractFactory('Shares');
	contractToken = await Shares.deploy();
	await contractToken.deployed();
});

describe('Shares', function () {
	describe('dividends', () => {
		it('should add dividends to the contract', async function () {
			const { incomeSource, firstAccount, secondAccount } = await getAccounts();

			await contractToken.addStakeholder(firstAccount.address, SHARES.first);
			await contractToken.addStakeholder(secondAccount.address, SHARES.second);

			let tr = incomeSource.sendTransaction({
				to: contractToken.address,
				value: DIVIDENDS_AMOUNT,
			});

			await expect(tr).to.emit(contractToken, 'DividendsRegistered').withArgs(DIVIDENDS_AMOUNT);

			let dividends = await contractToken.getDividendsPool();
			expect(dividends).to.equal(DIVIDENDS_AMOUNT);

			tr = incomeSource.sendTransaction({
				to: contractToken.address,
				value: DIVIDENDS_AMOUNT,
			});
			await expect(tr).to.emit(contractToken, 'DividendsRegistered').withArgs(DIVIDENDS_AMOUNT);

			dividends = await contractToken.getDividendsPool();
			expect(dividends).to.equal(DIVIDENDS_AMOUNT * 2);
		});

		it('will add dividends only if there is more than one stakeholder', async () => {
			const { incomeSource, firstAccount } = await getAccounts();

			let tr = incomeSource.sendTransaction({
				to: contractToken.address,
				value: DIVIDENDS_AMOUNT,
			});
			await expect(tr).to.be.revertedWith('There is not enough stakeholders yet');

			await contractToken.addStakeholder(firstAccount.address, SHARES.first);

			tr = incomeSource.sendTransaction({
				to: contractToken.address,
				value: DIVIDENDS_AMOUNT,
			});
			await expect(tr).to.be.revertedWith('There is not enough stakeholders yet');
		});

		describe('initial claim', () => {
			it('stakeholder should be able to claim dividends', async function () {
				const { secondAccount } = await registerAccountsAndAddDividends();
				const initialBalance = await secondAccount.getBalance();

				await expect(contractToken.claimDividends(secondAccount.address))
					.to.emit(contractToken, 'DividendsReleased')
					.withArgs(secondAccount.address, DIVIDENDS_AMOUNT * 0.2);

				const newBalance = await secondAccount.getBalance();

				expect(newBalance.sub(initialBalance).toNumber()).to.equal(DIVIDENDS_AMOUNT * 0.2);
			});

			it('stakeholder cannot claim dividends twice', async () => {
				const { secondAccount } = await registerAccountsAndAddDividends();
				await contractToken.claimDividends(secondAccount.address);

				await expect(contractToken.claimDividends(secondAccount.address)).to.be.revertedWith('No dividends to pay');
			});

			it('will not release dividends from empty pool', async () => {
				const { firstAccount, secondAccount } = await getAccounts();

				await contractToken.addStakeholder(firstAccount.address, SHARES.first);
				await contractToken.addStakeholder(secondAccount.address, SHARES.second);

				await expect(contractToken.claimDividends(secondAccount.address)).to.be.revertedWith('Dividends pool is empty');
			});

			it('will not pay dividends to unknown stakeholder', async () => {
				const { incomeSource, firstAccount, secondAccount } = await getAccounts();

				await contractToken.addStakeholder(firstAccount.address, SHARES.first);
				await contractToken.addStakeholder(secondAccount.address, SHARES.second);
				await incomeSource.sendTransaction({
					to: contractToken.address,
					value: DIVIDENDS_AMOUNT,
				});

				await expect(contractToken.claimDividends(incomeSource.address)).to.be.revertedWith('There is no such stakeholder');
			});
		});

		describe('subsequent claims', () => {
			it('send correct amount on the second claim for the same address', async () => {
				const { incomeSource, secondAccount } = await registerAccountsAndAddDividends();
				const initialBalance = await secondAccount.getBalance();

				await contractToken.claimDividends(secondAccount.address);
				await incomeSource.sendTransaction({
					to: contractToken.address,
					value: 5000,
				});

				await expect(contractToken.claimDividends(secondAccount.address)).to.emit(contractToken, 'DividendsReleased').withArgs(secondAccount.address, 1000);

				const newBalance = await secondAccount.getBalance();
				expect(newBalance.sub(initialBalance).toNumber()).to.equal(3000);
			});

			it('send correct amount on the second claim for another address', async () => {
				const { incomeSource, firstAccount, secondAccount } = await registerAccountsAndAddDividends();
				const initialBalance = await firstAccount.getBalance();

				await contractToken.claimDividends(secondAccount.address);
				await incomeSource.sendTransaction({
					to: contractToken.address,
					value: 5000,
				});

				await expect(contractToken.claimDividends(firstAccount.address)).to.emit(contractToken, 'DividendsReleased').withArgs(firstAccount.address, 12000);

				const newBalance = await firstAccount.getBalance();
				expect(newBalance.sub(initialBalance).toNumber()).to.equal(12000);
			});

			it('will empty the pool when all dividends are paid', async () => {
				const { incomeSource, firstAccount, secondAccount } = await registerAccountsAndAddDividends();

				await contractToken.claimDividends(firstAccount.address);
				await incomeSource.sendTransaction({
					to: contractToken.address,
					value: 5000,
				});
				await contractToken.claimDividends(secondAccount.address);
				await contractToken.claimDividends(firstAccount.address);

				const dividendsPool = await contractToken.getDividendsPool();
				expect(dividendsPool).to.equal(0);
			});
		});
	});

	describe('stakeholders', () => {
		it('should register a new stakeholder', async () => {
			const { firstAccount, secondAccount } = await getAccounts();

			await expect(contractToken.addStakeholder(firstAccount.address, SHARES.first))
				.to.emit(contractToken, 'StakeholderRegistered')
				.withArgs(firstAccount.address, SHARES.first);

			await contractToken.addStakeholder(secondAccount.address, SHARES.second);

			expect(await contractToken.getShare(firstAccount.address)).to.equal(SHARES.first);
			expect(await contractToken.getShare(secondAccount.address)).to.equal(SHARES.second);
			expect(await contractToken.getTotalShares()).to.equal(SHARES.first + SHARES.second);
		});

		it('should increase share of a stakeholder if he is already registered', async () => {
			const { firstAccount } = await getAccounts();

			await contractToken.addStakeholder(firstAccount.address, SHARES.first);
			await expect(contractToken.addStakeholder(firstAccount.address, SHARES.second))
				.to.emit(contractToken, 'StakeholdersShareChanged')
				.withArgs(firstAccount.address, SHARES.first + SHARES.second);

			expect(await contractToken.getShare(firstAccount.address)).to.equal(SHARES.first + SHARES.second);
			expect(await contractToken.getTotalShares()).to.equal(SHARES.first + SHARES.second);
		});

		it('should not register a stakeholder with empty share', async () => {
			const { firstAccount } = await getAccounts();

			await expect(contractToken.addStakeholder(firstAccount.address, 0)).to.be.revertedWith('Share cannot be zero');
		});

		it('should not register a stakeholder if not all dividends were distributed', async () => {
			const { secondAccount } = await registerAccountsAndAddDividends();

			await expect(contractToken.addStakeholder(secondAccount.address, 30)).to.be.revertedWith('Contract has undistributed dividends');

			expect(await contractToken.getShare(secondAccount.address)).to.equal(SHARES.second);
		});
	});

	describe('share', () => {
		it('will not return shares for unknown stakeholder', async () => {
			const { firstAccount, secondAccount } = await getAccounts();

			await contractToken.addStakeholder(firstAccount.address, SHARES.first);

			await expect(contractToken.getShare(secondAccount.address)).to.be.revertedWith('There is no such stakeholder');
		});
	});
});

async function getAccounts() {
	const [incomeSource, firstAccount, secondAccount] = await ethers.getSigners();
	return { incomeSource, firstAccount, secondAccount };
}

async function registerAccountsAndAddDividends() {
	const { incomeSource, firstAccount, secondAccount } = await getAccounts();

	await contractToken.addStakeholder(firstAccount.address, SHARES.first);
	await contractToken.addStakeholder(secondAccount.address, SHARES.second);
	await incomeSource.sendTransaction({
		to: contractToken.address,
		value: DIVIDENDS_AMOUNT,
	});

	return { incomeSource, firstAccount, secondAccount };
}
