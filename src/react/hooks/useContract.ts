import React from 'react';
import { ethers } from 'ethers';
import DividendsContract from '../../artifacts/contracts/Dividends.sol/Dividends.json';
import { Dividends } from '../../../typechain/Dividends';

export default function useContract() {
    const [ contract, setContract ] = React.useState<Dividends | null>(null);
    const [ provider, setProvider ] = React.useState<ethers.providers.Web3Provider | null>(null);

    React.useEffect(() => {
        if (typeof window.ethereum !== 'undefined' && process.env.REACT_APP_CONTRACT_ADDRESS) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(process.env.REACT_APP_CONTRACT_ADDRESS, DividendsContract.abi, signer) as Dividends;

            setProvider(provider);
            setContract(contract);
        }
    }, []);

    return { contract, provider };
}