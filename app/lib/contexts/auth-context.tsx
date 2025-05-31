import React, { useContext, useMemo, useState } from "react";
import { Account } from "../types/account/account";
import { loader } from "~/root";
import { useRouteLoaderData } from "@remix-run/react";
import { QueryObserverResult, RefetchOptions, useQuery } from "@tanstack/react-query";
import { fetchCurrentAccountInfo } from "../services/auth";

type AuthProviderProps = {
    children: React.ReactNode;
};

type AuthContextType = {
    currentAccount: Account | null;
    refetchAccountInfo: (options?: RefetchOptions) => Promise<QueryObserverResult<Account | null, Error>>;
};

export const AuthContext = React.createContext<AuthContextType | null>(null);

const AuthProvider = ({ children }: AuthProviderProps) => {

    const authData = useRouteLoaderData<typeof loader>("root");

    const [currentAccount, setCurrentAccount] = useState<Account | null>(null);

    const { refetch: refetchAccountInfo } = useQuery({

        queryKey: ['account', authData?.idToken],
        queryFn: async () => {

            if (!authData || !authData.idToken) {
                setCurrentAccount(null);
                return null;
            }

            const response = await fetchCurrentAccountInfo({ idToken: authData?.idToken });

            const account: Account = await response.data;

            setCurrentAccount((prev) => account);

            return account;
        },
        enabled: !!authData?.idToken,
        refetchOnWindowFocus: false
    })

    // useEffect(() => {

    //     console.log('Trigger auth context');

    //     return () => {

    //     }

    // }, [authData]);


    const contextValue = useMemo(() => ({ currentAccount, refetchAccountInfo }), [currentAccount]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;

export const useAuth = () => {

    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within a AuthProvider");
    }

    return context;
};