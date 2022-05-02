import React from 'react';
import { Table } from 'reactstrap';
import { BigNumber, utils } from 'ethers';

import { MAX_SHARES_NUM } from '../../../consts';
import { useAppContext } from '../../contexts/app';
import RevealValue from '../RevealValue/RevealValue';

import styles from './MainInfo.module.css';

const MainInfo = () => {
    const { 
        contract, 
        soldShares, updateSoldShares, 
        balance, updateBalance,
        payed, updatePayedAmount,
    } = useAppContext();

    const handleTotalSharesRevealSuccess = React.useCallback((shares: number) => {
        updateSoldShares(shares);
    }, [ updateSoldShares ]);

    const handleBalanceRevealSuccess = React.useCallback((balance: BigNumber) => {
        updateBalance(utils.formatEther(balance));
    }, [ updateBalance ]);

    const handlePayedRevealSuccess = React.useCallback((payed: BigNumber) => {
        updatePayedAmount(utils.formatEther(payed));
    }, [ updatePayedAmount ]);

    return (
        <Table className={ styles.root }>
            <thead>
                <tr>
                    <th className="col-2">Total sold shares</th>
                    <th className="col-2">Total balance</th>
                    <th className="col-2">Total payed</th>
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
                            value={ balance }
                            onSuccess={ handleBalanceRevealSuccess }
                        >
                            { balance } ETH
                        </RevealValue>
                    </td>
                    <td className="col-2">
                        <RevealValue<string, BigNumber>
                            method={ contract?.getPayed }
                            value={ payed }
                            onSuccess={ handlePayedRevealSuccess }
                        >
                            { payed } ETH
                        </RevealValue>
                    </td>
                </tr>
            </tbody>
        </Table>
    );
};

export default MainInfo;