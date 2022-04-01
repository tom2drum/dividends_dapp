import React from 'react';
import { Button } from 'reactstrap';

import { ReactComponent as Eye } from './eye.svg';

import styles from './StakeholdersItem.module.css';

interface Props {
    address: string;
    shares: number | null;
    unclaimed: number | null;
    index: number;
}

const StakeholdersItem = ({ address, shares, unclaimed, index }: Props) => {
    return (
        <tr>
            <th className="col-1" scope="row">{ index + 1 }</th>
            <td className="col-4">{ address }</td>
            <td className="col-3">
                { shares === null ? <Eye className={ styles.icon }/> : shares }
            </td>
            <td className="col-2">{ unclaimed === null ? <Eye className={ styles.icon }/> : `${unclaimed}ETH` }</td>
            <td className="col-2">
                <Button color="info" size="sm" outline>Claim</Button>
            </td>
        </tr>
    );
};

export default StakeholdersItem;