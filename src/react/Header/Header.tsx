import React from 'react';

import { ReactComponent as Logo } from './logo.svg';

import styles from  './Header.module.css';

const Header = () => {
    return (
        <header className={ styles.root }>
            <div className={ styles.content }>
                <Logo className={ styles.logo }/>
                <span>DONKYE ltd.</span>
            </div>
        </header>
    );
};

export default Header;