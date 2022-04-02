import React from 'react';
import { Spinner } from 'reactstrap';

import { useNotification } from '../../contexts/notification';
import sleep from '../../utils/sleep';
import genericMemo from '../../utils/genericMemo';
import { ReactComponent as Eye } from '../../icons/eye.svg';

import styles from './RevealValue.module.css';

interface Props<Value, Response> {
    value?: Value;
    address: string;
    method?: () => Promise<Response>;
    onSuccess: (value: Response) => void;
    children: React.ReactNode;
}

const RevealValue = <Value extends any, Response extends any>({ value, method, address, onSuccess, children }: Props<Value, Response>) => {

    const { open: openNotification } = useNotification();
    const [ isLoading, setLoadingState ] = React.useState(false);

    const handleRevealClick = React.useCallback(async() => {
        setLoadingState(true);

        try {
            if(method) {
                const transaction = method();
                const [ shares ] = await Promise.all([ transaction, sleep(500) ]);
    
                setLoadingState(false);
                onSuccess(shares);
                return;
            }

            throw new Error('Contract method is not provided');
        } catch (error: any) {
            openNotification({ status: 'error', text: error?.data?.message || error.message });
        }
    }, [ openNotification, method, onSuccess ]);

    let content;
    if(isLoading) {
        content = <Spinner size="sm" color="secondary"/>;
    } else if(value === undefined) {
        content = <Eye className={ styles.icon } onClick={ handleRevealClick }/>;
    } else {
        content = children;
    }

    return (
        <div>
            { content }
        </div>
    );
};

export default genericMemo(RevealValue);