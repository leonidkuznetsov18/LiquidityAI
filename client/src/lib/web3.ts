import { toast } from "@/hooks/use-toast";

export async function connectWallet(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // Check if MetaMask is installed
  if (!window.ethereum) {
    toast({
      title: "MetaMask Not Found",
      description: "Please install MetaMask to use this feature",
      variant: "destructive",
    });
    return null;
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    return accounts[0];
  } catch (error) {
    console.error('Error connecting to wallet:', error);
    toast({
      title: "Connection Failed",
      description: "Failed to connect to your wallet",
      variant: "destructive",
    });
    return null;
  }
}

// Add type definition for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; }) => Promise<string[]>;
      selectedAddress?: string | null;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      removeListener: (event: string, callback: (accounts: string[]) => void) => void;
    };
  }
}