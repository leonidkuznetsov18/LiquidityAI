import { Button } from "@/components/ui/button";
import { Power } from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";

export default function ConnectButton() {
    const { isConnected, address, connect, disconnect } = useAccount();

    return (
        <Button
            onClick={isConnected ? disconnect : connect}
            variant={isConnected ? "outline" : "default"}
            className="flex items-center gap-2"
        >
            {isConnected ? (
                <>
                    <span>{`${address?.slice(0, 6)}...${address?.slice(-4)}`}</span>
                    <Power className="h-4 w-4" />
                </>
            ) : (
                "Connect Wallet"
            )}
        </Button>
    );
}
