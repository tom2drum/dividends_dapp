import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './react/components/App/App';
import { AppContextProvider } from './react/context';
import { NotificationContextProvider } from './react/contexts/notification';

ReactDOM.render(
    <React.StrictMode>
        <AppContextProvider>
            <NotificationContextProvider>
                <App/>
            </NotificationContextProvider>
        </AppContextProvider>
    </React.StrictMode>,
    // eslint-disable-next-line no-undef
    window.document.getElementById('root'),
);
