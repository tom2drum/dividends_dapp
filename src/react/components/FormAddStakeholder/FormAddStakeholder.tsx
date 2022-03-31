import React from 'react';
import { Col, Input, Form, FormGroup, Label, Button } from 'reactstrap';

const FormAddStakeholder = () => {
    return (
        <section>
            <h2 className="h4 mb-4">Add or edit stakeholder</h2>
            <Form>
                <FormGroup row>
                    <Label for="account" xs="4">
                        Account number
                    </Label>
                    <Col xs="8">
                        <Input
                            id="account"
                            type="select"
                            placeholder="Select account"
                        >
                            <option>
                                Account #1
                            </option>
                            <option>
                                Account #2
                            </option>
                            <option>
                                Account #3
                            </option>
                        </Input>
                    </Col>
                </FormGroup>
                <FormGroup row>
                    <Label for="shares" xs="4">
                        Share amount
                    </Label>
                    <Col xs="8">
                        <Input
                            id="shares"
                            placeholder="Enter amount"
                            type="number"
                            min={ 0 }
                            max={ 1_000 }
                        />
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