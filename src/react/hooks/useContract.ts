import React from 'react';
// eslint-disable-next-line node/no-unpublished-import
import { ethers } from 'ethers';
import DividendsContract from '../../artifacts/contracts/Dividends.sol/Dividends.json';
import { Dividends } from '../../../typechain/Dividends';

// Update with the contract address logged out to the CLI when it was deployed 
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export default function useContract() {
    const [ contract, setContract ] = React.useState<Dividends | null>(null);
    const [ provider, setProvider ] = React.useState<ethers.providers.Web3Provider | null>(null);

    React.useEffect(() => {
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(contractAddress, DividendsContract.abi, signer) as Dividends;

            setProvider(provider);
            setContract(contract);
        }
    }, []);

    return { contract, provider };
}