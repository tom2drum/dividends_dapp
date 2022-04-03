import React from 'react';
import { Container, Row, Col } from 'reactstrap';

import Header from '../Header/Header';
import FormAddStakeholder from '../FormAddStakeholder/FormAddStakeholder';
import StakeholdersList from '../StakeholdersList/StakeholdersList';
import FormIssueDividends from '../FormIssueDividends/FormIssueDividends';
import Notification from '../Notification/Notification';
import { useAppContext } from '../../contexts/app';

import styles from './App.module.css';

function App() {
    const { contract, setStakeholders } = useAppContext();

    React.useEffect(() => {
        contract?.getStakeholders()
            .then((addresses: Array<string>) => {
                const stakeholders = addresses.map((address) => ({ address }));
                setStakeholders(stakeholders);
            })
            .catch(console.error);
    }, [ contract, setStakeholders ]);

    return (
        <div className={ styles.root }>
            <Header/>
            <Container>
                <Row>
                    <h1 className={ `h1 ${ styles.header }` }>Dividends dApp</h1>
                </Row>
                <Row>
                    <Col xs="4">
                        <FormAddStakeholder/>
                        <FormIssueDividends className="mt-5"/>
                    </Col>
                    <Col xs="8">
                        <StakeholdersList/>
                    </Col>
                </Row>
            </Container>
            <Notification/>
        </div>
    );
}

export default App;
