import { ethers } from 'hardhat';

async function main() {
    const Dividends = await ethers.getContractFactory('Dividends');
    const contractToken = await Dividends.deploy(10000, 20);

    await contractToken.deployed();

    console.log('Dividends deployed to:', contractToken.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
