import React from 'react';
import { Col, Input, Form, FormGroup, Label, Button, InputGroup, InputGroupText } from 'reactstrap';

import { useAppContext } from '../../contexts/app';
import { useNotification } from '../../contexts/notification';
import formatAddress from '../../utils/formatAddress';
import { MAX_SHARES_NUM, ACCOUNTS } from '../../../consts';

const FormAddStakeholder = () => {

    const { updateStakeholder, updateSoldShares, contract, stakeholders } = useAppContext();
    const { open: openNotification } = useNotification();
    const [ shares, setShares ] = React.useState('');

    const handleSharesChange = React.useCallback((event: React.SyntheticEvent<HTMLInputElement>) => {
        const value = event.currentTarget.value;
        const normalizedValue = Number(value);
        if(!Object.is(normalizedValue, NaN)) {
            setShares(String(normalizedValue));
        }
    }, []);

    const handleStakeholderChange = React.useCallback(async(event: React.SyntheticEvent<HTMLInputElement>) => {
        const value = event.currentTarget.value;
        const stakeholder = stakeholders.find(({ address }) => address.toLowerCase() === value.toLowerCase());

        if(!stakeholder) {
            setShares('');
            return;
        }

        if(stakeholder.shares) {
            setShares(String(stakeholder.shares));
            return;
        }

        try {
            const result = await contract?.['getStakeholderShares(address)'](stakeholder.address);
            if(result) {
                updateStakeholder({ address: stakeholder.address, shares: result.toNumber() });
                setShares(String(result.toNumber()));
            }
        } catch (error) {
            setShares('');
        }

    }, [ stakeholders, contract, updateStakeholder ]);

    const handleFormSubmit = React.useCallback(async(event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const isValid = form.checkValidity();

        if(isValid) {
            const accountElement = form.elements.namedItem('account');
            const sharesElement = form.elements.namedItem('shares');
            if (
                accountElement !== null && 'value' in accountElement && 
                sharesElement !== null && 'value' in sharesElement
            ) {
                try {
                    const address = accountElement.value;
                    const shares = Number(sharesElement.value);
                    const transaction = await contract?.setShares(address, shares);
                    const result = await transaction?.wait();
                    
                    if (result?.status === 0) throw new Error('Transaction was reverted');

                    updateStakeholder({ address, shares });
                    openNotification({ status: 'success', text: 'Successfully changed shares' });

                    const soldShares = await contract?.getSoldShares();
                    if (soldShares) updateSoldShares(soldShares);
                } catch (error: any) {
                    openNotification({ status: 'error', text: error?.data?.message || error.message });
                }
            }
        }
    }, [ updateStakeholder, updateSoldShares, contract, openNotification ]) ;

    return (
        <section>
            <h2 className="h4 mb-4">Add or edit stakeholder</h2>
            <Form onSubmit={ handleFormSubmit }>
                <FormGroup row>
                    <Label for="account" xs="4">
                        Account number
                    </Label>
                    <Col xs="8">
                        <Input
                            id="account"
                            type="select"
                            placeholder="Select account"
                            required
                            onChange={ handleStakeholderChange }
                        >
                            { ACCOUNTS.map((account) => (
                                <option key={ account } value={ account }>
                                    { formatAddress(account) }
                                </option>
                            )) }
                        </Input>
                    </Col>
                </FormGroup>
                <FormGroup row>
                    <Label for="shares" xs="4">
                        Share amount
                    </Label>
                    <Col xs="8">
                        <InputGroup>
                            <Input
                                id="shares"
                                placeholder="Enter amount"
                                type="number"
                                min={ 0 }
                                max={ 1_000 }
                                required
                                value={ shares }
                                onChange={ handleSharesChange }
                            />
                            <InputGroupText>
                                / { MAX_SHARES_NUM.toLocaleString('ru') }
                            </InputGroupText>
                        </InputGroup>
                    </Col>
                </FormGroup>
                <FormGroup row >
                    <Col xs={{ offset: 4, size: 8 }} >
                        <Button color="primary">
                            Submit
                        </Button>
                    </Col>
                </FormGroup>
            </Form>
        </section>
    );
};

export default FormAddStakeholder;