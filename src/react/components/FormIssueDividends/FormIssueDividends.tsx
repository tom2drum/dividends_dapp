import React from 'react';
import { ethers, utils } from 'ethers';
import { Input, Form, Button, InputGroup, InputGroupText } from 'reactstrap';

import { useAppContext } from '../../contexts/app';
import { useNotification } from '../../contexts/notification';

interface Props {
    className: string
}

const FormIssueDividends = ({ className }: Props) => {

    const { provider, contract, updateBalance, issueDividends } = useAppContext();
    const { open: openNotification } = useNotification();

    const handleSubmit = React.useCallback(async(event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const isValid = form.checkValidity();

        if(isValid) {
            const dividendsElement = form.elements.namedItem('dividends');
            if (dividendsElement !== null && 'value' in dividendsElement) {
                try {
                    const dividends = dividendsElement.value;
                    const signer = provider?.getSigner();
                    const transaction = await signer?.sendTransaction({
                        to: process.env.REACT_APP_CONTRACT_ADDRESS,
                        value: ethers.utils.parseEther(dividends),
                    });
                    const result = await transaction?.wait();
                    
                    if (result?.status === 0) {
                        throw new Error('Transaction was reverted');
                    }

                    openNotification({ status: 'success', text: 'Dividends issued' });
                    issueDividends();

                    const balance = await contract?.getTotalBalance();
                    if (balance) updateBalance(utils.formatEther(balance));
                } catch (error: any) {
                    openNotification({ status: 'error', text: error?.data?.message || error.message });
                }
            }
        }
    }, [ provider, contract, openNotification, updateBalance, issueDividends ]);

    return (
        <section className={ className }>
            <h2 className="h4 mb-4">Issue Dividends</h2>
            <Form onSubmit={ handleSubmit }>
                <InputGroup>
                    <Input
                        id="dividends"
                        placeholder="Enter amount"
                        type="number"
                        min={ 0 }
                        max={ 5_000 }
                    />
                    <InputGroupText>
                        ETH
                    </InputGroupText>
                    <Button color="success">
                        Submit
                    </Button>
                </InputGroup>
            </Form>
        </section>
    );
};

export default FormIssueDividends;