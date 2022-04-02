import React from 'react';
import { Button } from 'reactstrap';

import SharesCell from '../SharesCell/SharesCell';

import styles from './StakeholdersItem.module.css';

interface Props {
    address: string;
    shares?: number;
    unclaimed?: number;
    index: number;
}

const StakeholdersItem = ({ address, shares, unclaimed, index }: Props) => {
    return (
        <tr className={ styles.root }>
            <th className="col-1" scope="row">{ index + 1 }</th>
            <td className="col-4">{ address }</td>
            <td className="col-3 text-end">
                <SharesCell shares={ shares } address={ address }/>
            </td>
            <td className="col-2 text-end">{ unclaimed } ETH</td>
            <td className="col-2">
                <Button color="info" size="sm" outline>Claim</Button>
            </td>
        </tr>
    );
};

export default StakeholdersItem;