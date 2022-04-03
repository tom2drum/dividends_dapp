import { providers } from 'ethers';
import React from 'react';
import { Dividends } from '../../../typechain/Dividends';

import useContract from '../hooks/useContract';

interface Stakeholder {
    address: string;
    shares?: number;
    unclaimed?: string;
}

interface AppState {
    stakeholders: Array<Stakeholder>;
    soldShares?: number;
    balance?: string;
    payed?: string;
}

export type AppContextType = AppState & {
    contract: Dividends | null;
    provider: providers.Web3Provider | null;
    updateStakeholder: (payload: Stakeholder) => void;
    setStakeholders: (payload: Array<Stakeholder>) => void;
    updateSoldShares: (payload: number) => void;
    updateBalance: (payload: string) => void;
    updatePayedAmount: (payload: string) => void;
    issueDividends: () => void;
}

interface ActionSetStakeholder {
    type: 'SET_STAKEHOLDERS';
    payload: Array<Stakeholder>;
}

interface ActionUpdateStakeholder {
    type: 'UPDATE_STAKEHOLDER';
    payload: Stakeholder;
}

interface ActionUpdateSoldShares {
    type: 'UPDATE_SOLD_SHARES';
    payload: number;
}

interface ActionUpdateBalance {
    type: 'UPDATE_BALANCE';
    payload: string;
}

interface ActionUpdatePayedAmount {
    type: 'UPDATE_PAYED_AMOUNT';
    payload: string;
}

interface ActionIssueDividends {
    type: 'ISSUE_DIVIDENDS';
}

type Action = ActionUpdateStakeholder | ActionSetStakeholder | ActionUpdateSoldShares | ActionUpdateBalance | ActionUpdatePayedAmount
| ActionIssueDividends;

function contextReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'UPDATE_STAKEHOLDER': {
            const isAddressExist = state.stakeholders.some(({ address }) => address.toLowerCase() === action.payload.address.toLowerCase());
            if (isAddressExist) {
                const stakeholders = state.stakeholders.map((stakeholder) => {
                    if(stakeholder.address === action.payload.address) {
                        return { ...stakeholder, ...action.payload };
                    }
                    return stakeholder;
                });

                return { ...state, stakeholders };
            }

            return {
                ...state,
                stakeholders: [ ...state.stakeholders, action.payload ],
            };
        }

        case 'SET_STAKEHOLDERS': {
            return { ...state, stakeholders: action.payload };
        }

        case 'UPDATE_SOLD_SHARES': {
            return { ...state, soldShares: action.payload };
        }

        case 'UPDATE_BALANCE': {
            return { ...state, balance: action.payload };
        }

        case 'UPDATE_PAYED_AMOUNT': {
            return { ...state, payed: action.payload };
        }

        case 'ISSUE_DIVIDENDS': {
            const stakeholders = state.stakeholders.map((stakeholder) => ({ ...stakeholder, unclaimed: undefined }));
            return { ...state, stakeholders };
        }

        default:
            return state;
    }
}

const initialState: AppState = {
    stakeholders: [],
};

function useContextValue(): AppContextType {
    const [ { stakeholders, soldShares, balance, payed }, dispatch ] = React.useReducer(contextReducer, initialState);
    const { contract, provider } = useContract();

    const setStakeholders = React.useCallback((payload: Array<Stakeholder>) => {
        dispatch({ type: 'SET_STAKEHOLDERS', payload });
    }, []);

    const updateStakeholder = React.useCallback((payload: Stakeholder) => {
        dispatch({ type: 'UPDATE_STAKEHOLDER', payload });
    }, []);

    const updateSoldShares = React.useCallback((payload: number) => {
        dispatch({ type: 'UPDATE_SOLD_SHARES', payload });
    }, []);

    const updateBalance = React.useCallback((payload: string) => {
        dispatch({ type: 'UPDATE_BALANCE', payload });
    }, []);

    const updatePayedAmount = React.useCallback((payload: string) => {
        dispatch({ type: 'UPDATE_PAYED_AMOUNT', payload });
    }, []);

    const issueDividends = React.useCallback(() => {
        dispatch({ type: 'ISSUE_DIVIDENDS' });
    }, []);

    return React.useMemo(() => {
        return {
            stakeholders,
            soldShares,
            balance,
            payed,
            contract,
            provider,
            setStakeholders,
            updateStakeholder,
            updateSoldShares,
            updateBalance,
            updatePayedAmount,
            issueDividends,
        };
    }, [ 
        stakeholders, updateStakeholder, setStakeholders, contract, provider, soldShares, updateSoldShares, balance, updateBalance,
        payed, updatePayedAmount, issueDividends,
    ]);
}

const AppContext = React.createContext<AppContextType | undefined>(undefined);
AppContext.displayName = 'App Context';

export function AppContextProvider({ children }: { children: React.ReactNode }) {
    const value = useContextValue();
    return <AppContext.Provider value={ value }> { children } </AppContext.Provider>;
}

export function useAppContext(): AppContextType {
    const context = React.useContext(AppContext);

    if (context === undefined) {
        throw new Error('useAppContext must be used within a AppContextProvider');
    }

    return context;
}

export const AppContextConsumer = AppContext.Consumer;