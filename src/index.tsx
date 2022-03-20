import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
// eslint-disable-next-line node/no-missing-import
import App from './App';

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    // eslint-disable-next-line no-undef
    window.document.getElementById('root')
);
