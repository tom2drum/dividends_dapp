import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './react/components/App/App';
import { AppContextProvider } from './react/contexts/app';
import { NotificationContextProvider } from './react/contexts/notification';

ReactDOM.render(
    <React.StrictMode>
        <NotificationContextProvider>
            <AppContextProvider>
                <App/>
            </AppContextProvider>
        </NotificationContextProvider>
    </React.StrictMode>,
    window.document.getElementById('root'),
);
