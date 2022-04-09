import React from 'react';
import { Table } from 'reactstrap';

import { useAppContext } from '../../contexts/app';
import StakeholdersItem from '../StakeholdersItem/StakeholdersItem';

const StakeholdersList = () => {

    const { stakeholders } = useAppContext();

    return (
        <section>
            <h2 className="h4 mb-4">Current stakeholders</h2>
            <Table >
                <thead>
                    <tr>
                        <th> # </th>
                        <th> Account Number </th>
                        <th> Shares </th>
                        <th> Unclaimed </th>
                        <th> Actions </th>
                    </tr>
                </thead>
                <tbody>
                    { stakeholders.map((stakeholder, index) => {
                        return <StakeholdersItem key={ stakeholder.address } { ...stakeholder } index={ index }/>;
                    }) }
                </tbody>
            </Table>
        </section>
    );
};

export default StakeholdersList;