import React from 'react';
import { Spinner } from 'reactstrap';

import { useAppContext } from '../../context';
import { useNotification } from '../../contexts/notification';
import sleep from '../../utils/sleep';
import { ReactComponent as Eye } from '../../icons/eye.svg';

import styles from './SharesCell.module.css';

interface Props {
    shares?: number;
    address: string;
}

const SharesCell = ({ shares, address }: Props) => {

    const { contract, updateStakeholder } = useAppContext();
    const { open: openNotification } = useNotification();
    const [ isLoading, setLoadingState ] = React.useState(false);

    const handleRevealClick = React.useCallback(async() => {
        setLoadingState(true);

        try {
            const transaction = contract?.getStakeholderShares();
            const [ shares ] = await Promise.all([ transaction, sleep(500) ]);

            setLoadingState(false);
            updateStakeholder({ address, shares: shares.toNumber() });
        } catch (error: any) {
            openNotification({ status: 'error', text: error?.data?.message || error.message });
        }
    }, [ contract, updateStakeholder, address, openNotification ]);

    let content;
    if(isLoading) {
        content = <Spinner size="sm" color="secondary"/>;
    } else if(shares === undefined) {
        content = <Eye className={ styles.icon } onClick={ handleRevealClick }/>;
    } else {
        content = shares;
    }

    return (
        <div>
            { content }
        </div>
    );
};

export default React.memo(SharesCell);