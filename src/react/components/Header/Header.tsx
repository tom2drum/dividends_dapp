import React from 'react';
import { Container } from 'reactstrap';
import { ReactComponent as Logo } from './logo.svg';

import styles from  './Header.module.css';

const Header = () => {
    return (
        <header className={ styles.root }>
            <Container className={ styles.container }>
                <Logo className={ styles.logo }/>
                <span>DONKYE ltd.</span>
            </Container>
        </header>
    );
};

export default Header;