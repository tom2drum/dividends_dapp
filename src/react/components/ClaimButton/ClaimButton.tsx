import React from 'react';
import { Button } from 'reactstrap';
import { utils } from 'ethers';

import { useAppContext } from '../../contexts/app';
import { useNotification } from '../../contexts/notification';
import sleep from '../../utils/sleep';

interface Props {
    address: string;
    unclaimed?: string;
}

const ClaimButton = ({ address, unclaimed }: Props) => {
    const { contract, provider, updatePayedAmount, updateStakeholder } = useAppContext();
    const { open: openNotification } = useNotification();

    const handleClaimClick = React.useCallback(async() => {
        try {
            if (unclaimed === '0.0') throw new Error('Nothing to claim');

            const signer = provider?.getSigner();
            const sigherAddress = await signer?.getAddress();

            if (sigherAddress?.toLowerCase() !== address.toLowerCase()) {
                await sleep(500);
                throw new Error('Unauthorized request');
            }

            const transaction = await contract?.claim();
            const [ result ] = await Promise.all([ transaction?.wait(), sleep(500) ]);

            if (result?.status === 0) throw new Error('Transaction was reverted');

            openNotification({ status: 'success', text: 'Dividends released' });
            updateStakeholder({ address, unclaimed: '0.0' });

            const payed = await contract?.getPayed();
            if (payed) updatePayedAmount(utils.formatEther(payed));

        } catch (error: any) {
            openNotification({ status: 'error', text: error?.data?.message || error.message });
        }
    }, [ address, unclaimed, contract, provider, openNotification, updatePayedAmount, updateStakeholder ]);

    return <Button color="info" size="sm" outline onClick={ handleClaimClick }>Claim</Button>;
};

export default React.memo(ClaimButton);