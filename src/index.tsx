import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './react/components/App/App';
import { AppContextProvider } from './react/context';

ReactDOM.render(
    <React.StrictMode>
        <AppContextProvider>
            <App/>
        </AppContextProvider>
    </React.StrictMode>,
    // eslint-disable-next-line no-undef
    window.document.getElementById('root')
);
