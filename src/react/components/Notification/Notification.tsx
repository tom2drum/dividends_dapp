import React from 'react';
import { Toast, ToastHeader, ToastBody } from 'reactstrap';

import { useNotification } from '../../contexts/notification';

import styles from './Notification.module.css';

const Notification = () => {
    const { isOpen, status, text, close } = useNotification();

    React.useEffect(() => {
        let timeoutId: number;
        if(isOpen) {
            timeoutId = window.setTimeout(() => {
                close();
            }, 10_000);
        }

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [ isOpen, close ]);

    function getHeaderText() {
        switch (status) {
            case 'success':
                return 'Success';

            case 'error':
                return 'Something went wrong';
        
            default:
                return 'Notification';
        }
    }

    function getHeaderIcon() {
        switch (status) {
            case 'success':
                return 'success';

            case 'error':
                return 'danger';
        
            default:
                return 'info';
        }
    }

    return (
        <Toast isOpen={ isOpen } className={ styles.root }>
            <ToastHeader icon={ getHeaderIcon() }>
                { getHeaderText() }
            </ToastHeader>
            <ToastBody>
                { text }
            </ToastBody>
        </Toast>
    );
};

export default Notification;