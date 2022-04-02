import React from 'react';

interface State {
    isOpen: boolean;
    status: 'success' | 'error';
    text: string; 
}

export type ContextType = State & {
    open: (payload: ActionOpen['payload']) => void;
    close: () => void;
}

interface ActionOpen {
    type: 'OPEN_NOTIFICATION';
    payload: {
        status: State['status'];
        text: string;
    };
}

interface ActionClose {
    type: 'CLOSE_NOTIFICATION';
}

type Action = ActionOpen | ActionClose;

function notificationReducer(state: State, action: Action): State {
    switch (action.type) {
        case 'OPEN_NOTIFICATION': {
            return { ...state, ...action.payload, isOpen: true };
        }

        case 'CLOSE_NOTIFICATION': {
            return { ...state, isOpen: false };
        }

        default:
            return state;
    }
}

const initialState: State = {
    isOpen: false,
    status: 'success',
    text: '',
};

function useContextValue(): ContextType {
    const [ { isOpen, status, text }, dispatch ] = React.useReducer(notificationReducer, initialState);

    const open = React.useCallback((payload: ActionOpen['payload']) => {
        dispatch({ type: 'OPEN_NOTIFICATION', payload });
    }, []);

    const close = React.useCallback(() => {
        dispatch({ type: 'CLOSE_NOTIFICATION' });
    }, []);

    return React.useMemo(() => {
        return {
            isOpen,
            status,
            text,
            open,
            close,
        };
    }, [ isOpen, status, text, open, close ]);
}

const NotificationContext = React.createContext<ContextType | undefined>(undefined);
NotificationContext.displayName = 'Notification Context';

export function NotificationContextProvider({ children }: { children: React.ReactNode }) {
    const value = useContextValue();
    return <NotificationContext.Provider value={ value }>{ children }</NotificationContext.Provider>;
}

export function useNotification(): ContextType {
    const context = React.useContext(NotificationContext);

    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationContextProvider');
    }

    return context;
}

export const NotificationContextConsumer = NotificationContext.Consumer;