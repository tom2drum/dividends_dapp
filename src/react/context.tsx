// eslint-disable-next-line node/no-unpublished-import
import { Contract } from 'ethers';
import React from 'react';

import useContract from './hooks/useContract';

interface Stakeholder {
    address: string;
    shares: number | null;
    unclaimed: number | null;
}

interface AppState {
    stakeholders: Array<Stakeholder>;
}

export type AppContextType = AppState & {
    contract: Contract | null;
    updateStakeholder: (payload: Stakeholder) => void;
    setStakeholders: (payload: Array<Stakeholder>) => void;
}

interface ActionSetStakeholder {
    type: 'SET_STAKEHOLDERS';
    payload: Array<Stakeholder>;
}

interface ActionUpdateStakeholder {
    type: 'UPDATE_STAKEHOLDER';
    payload: Stakeholder;
}

type Action = ActionUpdateStakeholder | ActionSetStakeholder;

function contextReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'UPDATE_STAKEHOLDER': {
            const isAddressExist = state.stakeholders.some(({ address }) => address.toLowerCase() === action.payload.address.toLowerCase());
            if (isAddressExist){
                const stakeholders = state.stakeholders.map((stakeholder) => {
                    if(stakeholder.address === action.payload.address){
                        return { ...action.payload };
                    }
                    return stakeholder;
                });

                return { ...state, stakeholders };
            }

            return {
                ...state,
                stakeholders: [ ...state.stakeholders, action.payload ]
            };
        }

        case 'SET_STAKEHOLDERS': {
            return { ...state, stakeholders: action.payload };
        }

        default:
            return state;
    }
}

const initialState: AppState = {
    stakeholders: [],
};

function useContextValue(): AppContextType {
    const [ { stakeholders }, dispatch ] = React.useReducer(contextReducer, initialState);
    const contract = useContract();

    const setStakeholders = React.useCallback((payload: Array<Stakeholder>) => {
        dispatch({ type: 'SET_STAKEHOLDERS', payload });
    }, []);

    const updateStakeholder = React.useCallback((payload: Stakeholder) => {
        dispatch({ type: 'UPDATE_STAKEHOLDER', payload });
    }, []);

    return React.useMemo(() => {
        return {
            stakeholders,
            contract,
            setStakeholders,
            updateStakeholder,
        };
    }, [ stakeholders, updateStakeholder, setStakeholders, contract ]);
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