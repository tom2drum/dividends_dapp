import { ethers } from 'ethers';

export { };

declare global {
    interface Window {
        ethereum: ethers.providers.ExternalProvider;
    }
}