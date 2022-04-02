import React from 'react';
import { Button } from 'reactstrap';
// eslint-disable-next-line node/no-unpublished-import
import { BigNumber } from 'ethers';

import RevealValue from '../RevealValue/RevealValue';
import { useAppContext } from '../../context';
import formatAddress from '../../utils/formatAddress';

import styles from './StakeholdersItem.module.css';

interface Props {
    address: string;
    shares?: number;
    unclaimed?: number;
    index: number;
}

const StakeholdersItem = ({ address, shares, unclaimed, index }: Props) => {
    const { contract, updateStakeholder } = useAppContext();

    const handleSharesRevealSuccess = React.useCallback((shares: BigNumber) => {
        updateStakeholder({ address, shares: shares.toNumber() });
    }, [ updateStakeholder, address ]);

    const handleUnclaimedRevealSuccess = React.useCallback((unclaimed: BigNumber) => {
        updateStakeholder({ address, unclaimed: unclaimed.toNumber() });
    }, [ updateStakeholder, address ]);

    return (
        <tr className={ styles.root }>
            <th className="col-1" scope="row">{ index + 1 }</th>
            <td className="col-5">{ formatAddress(address) }</td>
            <td className="col-2 text-end">
                <RevealValue<number, BigNumber> 
                    address={ address } 
                    method={ contract?.getStakeholderShares }
                    value={ shares } 
                    onSuccess={ handleSharesRevealSuccess }
                >
                    { shares }
                </RevealValue>
            </td>
            <td className="col-2 text-end">
                <RevealValue<number, BigNumber>
                    address={ address }
                    method={ contract?.getAmountToClaim }
                    value={ unclaimed }
                    onSuccess={ handleUnclaimedRevealSuccess }
                >
                    { unclaimed } ETH
                </RevealValue>
            </td>
            <td className="col-2">
                <Button color="info" size="sm" outline>Claim</Button>
            </td>
        </tr>
    );
};

export default StakeholdersItem;