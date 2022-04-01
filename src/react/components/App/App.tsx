import React from 'react';
import { Container, Row, Col } from 'reactstrap';

import Header from '../Header/Header';
import FormAddStakeholder from '../FormAddStakeholder/FormAddStakeholder';
import StakeholdersList from '../StakeholdersList/StakeholdersList';
import FormIssueDividends from '../FormIssueDividends/FormIssueDividends';
import { AppContextProvider } from '../../context';

import styles from './App.module.css';

function App() {
    return (
        <div className={ styles.root }>
            <AppContextProvider>
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
            </AppContextProvider>
        </div>
    );
}

export default App;
