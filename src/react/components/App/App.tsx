import React from 'react';
import { Container, Row, Col } from 'reactstrap';

import Header from '../Header/Header';
import MainInfo from '../MainInfo/MainInfo';
import FormAddStakeholder from '../FormAddStakeholder/FormAddStakeholder';
import StakeholdersList from '../StakeholdersList/StakeholdersList';
import FormIssueDividends from '../FormIssueDividends/FormIssueDividends';
import Notification from '../Notification/Notification';
import { useAppContext } from '../../contexts/app';
import { ACCOUNTS } from '../../../consts';

import styles from './App.module.css';

function App() {
    const { contract, setStakeholders } = useAppContext();

    React.useEffect(() => {
        async function fetchAccounts() {
            return await Promise.all(
                ACCOUNTS.map((account) => contract?.['getStakeholderShares(address)'](account).catch(() => {})),
            );
        }
        fetchAccounts().then((sharesResult) => {
            ACCOUNTS.forEach((address, index) => {
                const shares = sharesResult[index]?.toNumber();
                if(shares) {
                    setStakeholders([ { address, shares: shares } ]);
                }
            });
        });
    }, [ contract, setStakeholders ]);

    return (
        <div className={ styles.root }>
            <Header/>
            <Container>
                <Row>
                    <h1 className={ `h1 ${ styles.header }` }>Dividends dApp</h1>
                    <Col xs="5">
                        <MainInfo/>
                    </Col>
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
