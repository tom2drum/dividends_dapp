import React from 'react';
import { Table } from 'reactstrap';
// eslint-disable-next-line node/no-unpublished-import
import { BigNumber, utils } from 'ethers';

import { MAX_SHARES_NUM } from '../../../consts';
import { useAppContext } from '../../contexts/app';
import RevealValue from '../RevealValue/RevealValue';

import styles from './MainInfo.module.css';

const MainInfo = () => {
    const { contract, soldShares, updateSoldShares, totalBalance, updateTotalBalance } = useAppContext();

    const handleTotalSharesRevealSuccess = React.useCallback((shares: number) => {
        updateSoldShares(shares);
    }, [ updateSoldShares ]);

    const handleTotalBalanceRevealSuccess = React.useCallback((balance: BigNumber) => {
        updateTotalBalance(utils.formatEther(balance));
    }, [ updateTotalBalance ]);

    return (
        <Table className={ styles.root }>
            <thead>
                <tr>
                    <th className="col-2">Total sold shares</th>
                    <th className="col-2">Total balance</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td className="col-2">
                        <RevealValue<number, number>
                            method={ contract?.getSoldShares }
                            value={ soldShares }
                            onSuccess={ handleTotalSharesRevealSuccess }
                        >
                            { soldShares } / { MAX_SHARES_NUM.toLocaleString('ru') }
                        </RevealValue>
                    </td>
                    <td className="col-2">
                        <RevealValue<string, BigNumber>
                            method={ contract?.getTotalBalance }
                            value={ totalBalance }
                            onSuccess={ handleTotalBalanceRevealSuccess }
                        >
                            { totalBalance } ETH
                        </RevealValue>
                    </td>
                </tr>
            </tbody>
        </Table>
    );
};

export default MainInfo;