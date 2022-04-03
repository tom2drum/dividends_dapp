import React from 'react';
import { ethers } from 'ethers';
import DividendsContract from '../../artifacts/contracts/Dividends.sol/Dividends.json';
import { Dividends } from '../../../typechain/Dividends';
import { CONTRACT_ADDRESS } from '../../consts';

export default function useContract() {
    const [ contract, setContract ] = React.useState<Dividends | null>(null);
    const [ provider, setProvider ] = React.useState<ethers.providers.Web3Provider | null>(null);

    React.useEffect(() => {
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, DividendsContract.abi, signer) as Dividends;

            setProvider(provider);
            setContract(contract);
        }
    }, []);

    return { contract, provider };
}