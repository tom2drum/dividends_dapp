import React from 'react';
import { Table, Button } from 'reactstrap';

const StakeholdersList = () => {
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
                    <tr>
                        <th className="col-1" scope="row" > 1 </th>
                        <td className="col-4" > 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 </td>
                        <td className="col-3"> 800 ETH </td>
                        <td className="col-4">
                            <Button color="info" size="sm" outline>
                                Claim
                            </Button>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"> 2 </th>
                        <td> 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc </td>
                        <td> 5 ETH </td>
                        <td>
                            <Button color="info" size="sm" outline>
                                Claim
                            </Button>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"> 3 </th>
                        <td> 0x90f79bf6eb2c4f870365e785982e1f101e93b906 </td>
                        <td> 42 ETH </td>
                        <td> 
                            <Button color="info" size="sm" outline>
                                Claim
                            </Button>
                        </td>
                    </tr>
                </tbody>
            </Table>
        </section>
    );
};

export default StakeholdersList;