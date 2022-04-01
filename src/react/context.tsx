import React from 'react';

interface Stakeholder {
    address: string;
    shares: number;
    unclaimed: number;
}

interface AppState {
    stakeholders: Array<Stakeholder>;
}

export type AppContextType = AppState & {
    updateStakeholder: (payload: Stakeholder) => void;
}

interface ActionUpdateStakeholder {
    type: 'UPDATE_STAKEHOLDER';
    payload: Stakeholder;
}

type Action = ActionUpdateStakeholder;

function contextReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'UPDATE_STAKEHOLDER': {
            if(state.stakeholders.some(({ address }) => address === action.payload.address)){
                const stakeholders = state.stakeholders.map((stakeholder) => {
                    if(stakeholder.address === action.payload.address){
                        return { ...action.payload }
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

        default:
            return state;
    }
}

const initialState: AppState = {
    stakeholders: [],
};

function useContextValue(): AppContextType {
    const [ { stakeholders }, dispatch ] = React.useReducer(contextReducer, initialState);

    const updateStakeholder = React.useCallback((payload: Stakeholder) => {
        dispatch({ type: 'UPDATE_STAKEHOLDER', payload })
    }, []);

    return React.useMemo(() => {
        return {
            stakeholders,
            updateStakeholder,
        }
    }, [ stakeholders, updateStakeholder ]);
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
        throw new Error('useAppContext must be used within a AppContextProvider')
    }

    return context;
}

export const AppContextConsumer = AppContext.Consumer;