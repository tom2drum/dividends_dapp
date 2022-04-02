import { ethers } from 'hardhat';
import { MAX_SHARES_NUM } from '../src/consts';

async function main() {
    const Dividends = await ethers.getContractFactory('Dividends');
    const contractToken = await Dividends.deploy(MAX_SHARES_NUM, 20);

    await contractToken.deployed();

    console.log('Dividends deployed to:', contractToken.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
