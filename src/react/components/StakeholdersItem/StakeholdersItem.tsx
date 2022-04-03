import React from 'react';
import { BigNumber, utils } from 'ethers';

import RevealValue from '../RevealValue/RevealValue';
import ClaimButton from '../ClaimButton/ClaimButton';
import { useAppContext } from '../../contexts/app';
import formatAddress from '../../utils/formatAddress';
import { MAX_SHARES_NUM } from '../../../consts';

interface Props {
    address: string;
    shares?: number;
    unclaimed?: string;
    index: number;
}

const StakeholdersItem = ({ address, shares, unclaimed, index }: Props) => {
    const { contract, updateStakeholder } = useAppContext();

    const handleSharesRevealSuccess = React.useCallback((shares: BigNumber) => {
        updateStakeholder({ address, shares: shares.toNumber() });
    }, [ updateStakeholder, address ]);

    const handleUnclaimedRevealSuccess = React.useCallback((unclaimed: BigNumber) => {
        updateStakeholder({ address, unclaimed: utils.formatEther(unclaimed) });
    }, [ updateStakeholder, address ]);

    return (
        <tr className="align-middle">
            <th className="col-1" scope="row">{ index + 1 }</th>
            <td className="col-5">{ formatAddress(address) }</td>
            <td className="col-2 text-end">
                <RevealValue<number, BigNumber> 
                    address={ address } 
                    method={ contract?.getStakeholderShares }
                    value={ shares } 
                    onSuccess={ handleSharesRevealSuccess }
                >
                    { shares } / { MAX_SHARES_NUM.toLocaleString('ru') }
                </RevealValue>
            </td>
            <td className="col-2 text-end">
                <RevealValue<string, BigNumber>
                    address={ address }
                    method={ contract?.getAmountToClaim }
                    value={ unclaimed }
                    onSuccess={ handleUnclaimedRevealSuccess }
                >
                    { unclaimed } ETH
                </RevealValue>
            </td>
            <td className="col-2 text-end">
                <ClaimButton unclaimed={ unclaimed } address={ address }/>
            </td>
        </tr>
    );
};

export default StakeholdersItem;