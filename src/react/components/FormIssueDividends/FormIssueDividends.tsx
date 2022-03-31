import React from 'react';
import { Input, Form, Button, InputGroup, InputGroupText } from 'reactstrap';

interface Props {
    className: string
}

const FormIssueDividends = ({ className }: Props) => {
    return (
        <section className={ className }>
            <h2 className="h4 mb-4">Issue Dividends</h2>
            <Form>
                <InputGroup>
                    <Input
                        id="shares"
                        placeholder="Enter amount"
                        type="number"
                        min={ 0 }
                        max={ 1_000_000 }
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
    )
}

export default FormIssueDividends;