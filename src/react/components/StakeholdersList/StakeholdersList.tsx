import React from 'react';
import { Table, Button } from 'reactstrap';

import { useAppContext } from '../../context';

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
                        <th> Unclaimed Amount </th>
                        <th> Actions </th>
                    </tr>
                </thead>
                <tbody>
                    { stakeholders.map((address, index) => {
                        return (
                            <tr key={ address }>
                                <th className="col-1" scope="row">{ index + 1 }</th>
                                <td className="col-4">{ address }</td>
                                <td className="col-3"> 800 ETH </td>
                                <td className="col-4">
                                    <Button color="info" size="sm" outline>Claim</Button>
                                </td>
                            </tr>
                        )
                    }) }
                </tbody>
            </Table>
        </section>
    );
};

export default StakeholdersList;