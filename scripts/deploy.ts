import { ethers } from 'hardhat';

async function main() {
    const Shares = await ethers.getContractFactory('Shares');
    const sharesToken = await Shares.deploy(10000);

    await sharesToken.deployed();

    console.log('Shares deployed to:', sharesToken.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
