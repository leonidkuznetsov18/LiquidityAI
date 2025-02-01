import { createContext, useContext, useState, ReactNode } from "react";
import { connectWallet, disconnectWallet } from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";

interface AccountProviderProps {
    children: ReactNode;
}
interface AccountContextType {
    isConnected: boolean;
    address: string | null;
    connect: () => Promise<void>;
    disconnect: () => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const useAccount = () => {
    const context = useContext(AccountContext);
    if (!context) {
        throw new Error("useAccount must be used within an AccountProvider");
    }
    return context;
};



export const AccountProvider = ({ children }: AccountProviderProps) => {
    const [isConnected, setIsConnected] = useState(false);
    const [address, setAddress] = useState<string | null>(null);
    const { toast } = useToast();

    const connect = async () => {
        try {
            const account = await connectWallet();
            if (account) {
                setAddress(account);
                setIsConnected(true);
                toast({
                    title: "Connection Successful",
                    description: "Wallet connected successfully",
                });
            }
        } catch (error) {
            console.error("Failed to connect wallet:", error);
            toast({
                title: "Connection Failed",
                description: "Could not connect to your wallet",
                variant: "destructive",
            });
        }
    };

    const disconnect = async () => {
        await disconnectWallet();
        setIsConnected(false);
        setAddress(null);
    };

    return (
        <AccountContext.Provider value={{ isConnected, address, connect, disconnect }}>
            {children}
        </AccountContext.Provider>
    );
};
