import React from 'react';

interface AppState {
    stakeholders: Array<string>;
}

export type AppContextType = AppState & {
    updateStakeholders: (payload: Array<string>) => void;
}

interface ActionAddStakeholder {
    type: 'ADD_STAKEHOLDER';
    payload: Array<string>;
}

type Action = ActionAddStakeholder;

function contextReducer(state: AppState, action: Action) {
    switch (action.type) {
        case 'ADD_STAKEHOLDER':
            return {
                ...state,
                stakeholders: [ ...state.stakeholders, ...action.payload ]
            };

        default:
            return state;
    }
}

const initialState: AppState = {
    stakeholders: [],
};

function useContextValue() {
    const [ { stakeholders }, dispatch ] = React.useReducer(contextReducer, initialState);

    const updateStakeholders = React.useCallback((payload: Array<string>) => {
        dispatch({ type: 'ADD_STAKEHOLDER', payload })
    }, []);

    return React.useMemo(() => {
        return {
            stakeholders,
            updateStakeholders,
        }
    }, [ stakeholders, updateStakeholders ]);
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