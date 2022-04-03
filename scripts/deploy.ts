import { ethers } from 'hardhat';
import { MAX_SHARES_NUM } from '../src/consts';
import fs from 'fs';
import { parse, stringify } from 'envfile';

async function main() {
    const Dividends = await ethers.getContractFactory('Dividends');
    const contractToken = await Dividends.deploy(MAX_SHARES_NUM, 20);

    await contractToken.deployed();

    console.log('Dividends deployed to:', contractToken.address);

    let parsedFile = parse('.env');
    parsedFile.REACT_APP_CONTRACT_ADDRESS = contractToken.address;
    fs.writeFileSync('./.env', stringify(parsedFile));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
