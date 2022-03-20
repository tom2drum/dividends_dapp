const { expect } = require('chai');
const { ethers } = require('hardhat');

const SHARES = { first: 80, second: 20 };
const DIVIDENDS_AMOUNT = 10000;

let contractToken;

beforeEach(async () => {
    const Shares = await ethers.getContractFactory('Shares');
    contractToken = await Shares.deploy(SHARES.first + SHARES.second);
    await contractToken.deployed();
});

describe('Shares', function () {
    describe('deploy', () => {
        it('will not deploy contract with invalid share amount', async () => {
            const Shares = await ethers.getContractFactory('Shares');
            await expect(Shares.deploy(1)).to.be.revertedWith('Total number of shares should be greater than 1');
        });
    });

    describe('dividends', () => {
        it('should add dividends to the contract', async function () {
            const { owner, firstAccount, secondAccount } = await getAccounts();

            await contractToken.registerStakeholder(firstAccount.address, SHARES.first);
            await contractToken.registerStakeholder(secondAccount.address, SHARES.second);

            let tr = owner.sendTransaction({
                to: contractToken.address,
                value: DIVIDENDS_AMOUNT,
            });

            await expect(tr).to.emit(contractToken, 'DividendsReceived').withArgs(DIVIDENDS_AMOUNT);

            let dividends = await contractToken.getDividendsPool();
            expect(dividends).to.equal(DIVIDENDS_AMOUNT);

            tr = owner.sendTransaction({
                to: contractToken.address,
                value: DIVIDENDS_AMOUNT,
            });
            await expect(tr).to.emit(contractToken, 'DividendsReceived').withArgs(DIVIDENDS_AMOUNT);

            dividends = await contractToken.getDividendsPool();
            expect(dividends).to.equal(DIVIDENDS_AMOUNT * 2);
        });

        it('will add dividends only if there is more than one stakeholder', async () => {
            const { owner, firstAccount } = await getAccounts();

            let tr = owner.sendTransaction({
                to: contractToken.address,
                value: DIVIDENDS_AMOUNT,
            });
            await expect(tr).to.be.revertedWith('There is not enough stakeholders yet');

            await contractToken.registerStakeholder(firstAccount.address, SHARES.first);

            tr = owner.sendTransaction({
                to: contractToken.address,
                value: DIVIDENDS_AMOUNT,
            });
            await expect(tr).to.be.revertedWith('There is not enough stakeholders yet');
        });

        describe('initial claim', () => {
            it('stakeholder should be able to claim dividends', async function () {
                const { secondAccount } = await registerAccountsAndAddDividends();
                const tx = await contractToken.connect(secondAccount).claimDividends();

                expect(tx)
                    .to.emit(contractToken, 'DividendsReleased')
                    .withArgs(secondAccount.address, DIVIDENDS_AMOUNT * 0.2);

                expect(tx).to.changeEtherBalance(secondAccount, DIVIDENDS_AMOUNT * 0.2);
            });

            it('stakeholder cannot claim dividends twice', async () => {
                const { secondAccount } = await registerAccountsAndAddDividends();
                await contractToken.connect(secondAccount).claimDividends();

                await expect(contractToken.connect(secondAccount).claimDividends()).to.be.revertedWith('No dividends to pay');
            });

            it('will not release dividends from empty pool', async () => {
                const { firstAccount, secondAccount } = await getAccounts();

                await contractToken.registerStakeholder(firstAccount.address, SHARES.first);
                await contractToken.registerStakeholder(secondAccount.address, SHARES.second);

                await expect(contractToken.connect(secondAccount).claimDividends()).to.be.revertedWith('Dividends pool is empty');
            });

            it('will not pay dividends to unknown stakeholder', async () => {
                const { owner, firstAccount, secondAccount } = await getAccounts();

                await contractToken.registerStakeholder(firstAccount.address, SHARES.first);
                await contractToken.registerStakeholder(secondAccount.address, SHARES.second);
                await owner.sendTransaction({
                    to: contractToken.address,
                    value: DIVIDENDS_AMOUNT,
                });

                await expect(contractToken.claimDividends()).to.be.revertedWith('There is no such stakeholder');
            });
        });

        describe('subsequent claims', () => {
            it('send correct amount on the second claim for the same address', async () => {
                const { owner, secondAccount } = await registerAccountsAndAddDividends();

                await contractToken.connect(secondAccount).claimDividends();
                await owner.sendTransaction({
                    to: contractToken.address,
                    value: 5000,
                });

                const tx = await contractToken.connect(secondAccount).claimDividends();
                expect(tx).to.emit(contractToken, 'DividendsReleased').withArgs(secondAccount.address, 1000);

                expect(tx).to.changeEtherBalance(secondAccount, 1000);
            });

            it('send correct amount on the second claim for another address', async () => {
                const { owner, firstAccount, secondAccount } = await registerAccountsAndAddDividends();

                await contractToken.connect(secondAccount).claimDividends();
                await owner.sendTransaction({
                    to: contractToken.address,
                    value: 5000,
                });

                const tx = await contractToken.connect(firstAccount).claimDividends();
                expect(tx).to.emit(contractToken, 'DividendsReleased').withArgs(firstAccount.address, 12000);

                expect(tx).to.changeEtherBalance(secondAccount, 12000);
            });

            it('will empty the pool when all dividends are paid', async () => {
                const { owner, firstAccount, secondAccount } = await registerAccountsAndAddDividends();

                await contractToken.connect(firstAccount).claimDividends();
                await owner.sendTransaction({
                    to: contractToken.address,
                    value: 5000,
                });
                await contractToken.connect(secondAccount).claimDividends();
                await contractToken.connect(firstAccount).claimDividends();

                const dividendsPool = await contractToken.getDividendsPool();
                expect(dividendsPool).to.equal(0);
            });
        });
    });

    describe('stakeholders', () => {
        it('should register a new stakeholder', async () => {
            const { firstAccount, secondAccount } = await getAccounts();

            await expect(contractToken.registerStakeholder(firstAccount.address, SHARES.first))
                .to.emit(contractToken, 'StakeholderRegistered')
                .withArgs(firstAccount.address, SHARES.first);

            await contractToken.registerStakeholder(secondAccount.address, SHARES.second);

            expect(await contractToken.connect(firstAccount).getStakeholderShares()).to.equal(SHARES.first);
            expect(await contractToken.connect(secondAccount).getStakeholderShares()).to.equal(SHARES.second);
            expect(await contractToken.getSoldShares()).to.equal(SHARES.first + SHARES.second);
        });

        it('not owner cannot register a new stakeholder', async () => {
            const { firstAccount } = await getAccounts();

            await expect(contractToken.connect(firstAccount).registerStakeholder(firstAccount.address, SHARES.first)).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('should increase share of a stakeholder if he is already registered', async () => {
            const { firstAccount } = await getAccounts();

            await contractToken.registerStakeholder(firstAccount.address, SHARES.first);
            await expect(contractToken.registerStakeholder(firstAccount.address, SHARES.second))
                .to.emit(contractToken, 'StakeholdersShareChanged')
                .withArgs(firstAccount.address, SHARES.first + SHARES.second);

            expect(await contractToken.connect(firstAccount).getStakeholderShares()).to.equal(SHARES.first + SHARES.second);
            expect(await contractToken.getSoldShares()).to.equal(SHARES.first + SHARES.second);
        });

        it('should not register a stakeholder with empty share', async () => {
            const { firstAccount } = await getAccounts();

            await expect(contractToken.registerStakeholder(firstAccount.address, 0)).to.be.revertedWith('Shares cannot be zero');
        });

        it('should not register a stakeholder if not all dividends were distributed', async () => {
            const { secondAccount } = await registerAccountsAndAddDividends();

            await expect(contractToken.registerStakeholder(secondAccount.address, 30)).to.be.revertedWith('Contract has undistributed dividends');

            expect(await contractToken.connect(secondAccount).getStakeholderShares()).to.equal(SHARES.second);
        });
    });

    describe('shares', () => {
        it('will not show shares info to unauthorized account', async () => {
            const { firstAccount } = await getAccounts();

            await contractToken.registerStakeholder(firstAccount.address, SHARES.first);

            await expect(contractToken.getStakeholderShares()).to.be.revertedWith('There is no such stakeholder');

            const shares = await contractToken.connect(firstAccount).getStakeholderShares();
            expect(shares).to.equal(SHARES.first);
        });
    });
});

async function getAccounts() {
    const [ owner, firstAccount, secondAccount ] = await ethers.getSigners();
    return { owner, firstAccount, secondAccount };
}

async function registerAccountsAndAddDividends() {
    const { owner, firstAccount, secondAccount } = await getAccounts();

    await contractToken.registerStakeholder(firstAccount.address, SHARES.first);
    await contractToken.registerStakeholder(secondAccount.address, SHARES.second);
    await owner.sendTransaction({
        to: contractToken.address,
        value: DIVIDENDS_AMOUNT,
    });

    return { owner, firstAccount, secondAccount };
}
