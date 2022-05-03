import fs from 'fs';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { parse, stringify } from 'envfile';

import { MAX_SHARES_NUM } from '../src/consts';

const deployFunc: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();

    const Dividends = await deploy('Dividends', {
        from: deployer,
        args: [ MAX_SHARES_NUM ],
        log: true,
    });

    let parsedFile = parse('.env');
    parsedFile.REACT_APP_CONTRACT_ADDRESS = Dividends.address;
    fs.writeFileSync('./.env', stringify(parsedFile));
};

export default deployFunc;
deployFunc.tags = [ 'Dividends' ];