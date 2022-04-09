import React from 'react';
import { ethers } from 'ethers';
import DividendsContract from '../../artifacts/contracts/Dividends.sol/Dividends.json';
import { Dividends } from '../../../typechain/Dividends';
import { useNotification } from '../contexts/notification';

export default function useContract() {
    const [ contract, setContract ] = React.useState<Dividends | null>(null);
    const [ provider, setProvider ] = React.useState<ethers.providers.Web3Provider | null>(null);
    const { open: openNotification } = useNotification();

    React.useEffect(() => {
        try {
            if (typeof window.ethereum !== 'undefined' && process.env.REACT_APP_CONTRACT_ADDRESS) {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(process.env.REACT_APP_CONTRACT_ADDRESS, DividendsContract.abi, signer) as Dividends;
        
                setProvider(provider);
                setContract(contract);
            } else {
                throw new Error('Unable to find provider and access the blockchain data');
            }   
        } catch (error: any) {
            openNotification({ status: 'error', text: error?.data?.message || error.message });
        }
    }, [ openNotification ]);

    return { contract, provider };
}