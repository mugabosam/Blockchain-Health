import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { BrowserProvider, Contract } from "ethers";
import contractData from "../abi/MediChainCore.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const TARGET_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || "31337");

interface Web3ContextType {
  account: string | null;
  contract: Contract | null;
  provider: BrowserProvider | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  userRole: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  fmt: (address: string) => string;
}

const Web3Context = createContext<Web3ContextType>({} as Web3ContextType);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const detectRole = useCallback(async (c: Contract, addr: string) => {
    try {
      const [adminRole, doctorRole, nurseRole, pharmRole, labRole] = await Promise.all([
        c.DEFAULT_ADMIN_ROLE(), c.DOCTOR_ROLE(), c.NURSE_ROLE(), c.PHARMACIST_ROLE(), c.LAB_ROLE()
      ]);
      if (await c.hasRole(adminRole, addr)) return setUserRole("Admin");
      if (await c.hasRole(doctorRole, addr)) return setUserRole("Doctor");
      if (await c.hasRole(nurseRole, addr)) return setUserRole("Nurse");
      if (await c.hasRole(pharmRole, addr)) return setUserRole("Pharmacist");
      if (await c.hasRole(labRole, addr)) return setUserRole("Lab Technician");
      setUserRole("Patient");
    } catch { setUserRole("Patient"); }
  }, []);

  const setup = useCallback(async (bp: BrowserProvider, addr: string) => {
    const signer = await bp.getSigner();
    const c = new Contract(CONTRACT_ADDRESS, contractData.abi, signer);
    setContract(c); setAccount(addr); setProvider(bp);
    await detectRole(c, addr);
  }, [detectRole]);

  const connectWallet = async () => {
    if (!(window as any).ethereum) { setError("Please install MetaMask"); return; }
    setIsConnecting(true); setError(null);
    try {
      const bp = new BrowserProvider((window as any).ethereum);
      const net = await bp.getNetwork();
      if (Number(net.chainId) !== TARGET_CHAIN_ID) {
        try {
          await (window as any).ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: `0x${TARGET_CHAIN_ID.toString(16)}` }] });
        } catch (e: any) {
          if (e.code === 4902) {
            await (window as any).ethereum.request({ method: "wallet_addEthereumChain", params: [{ chainId: `0x${TARGET_CHAIN_ID.toString(16)}`, chainName: "Hardhat Local", nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 }, rpcUrls: [import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545"] }] });
          }
        }
      }
      const accts = await bp.send("eth_requestAccounts", []);
      await setup(bp, accts[0]);
    } catch (e: any) { setError(e.message || "Connection failed"); } finally { setIsConnecting(false); }
  };

  const disconnectWallet = () => { setAccount(null); setContract(null); setProvider(null); setUserRole(null); };
  const fmt = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

  useEffect(() => {
    if (!(window as any).ethereum) return;
    const onAccounts = (a: string[]) => { if (!a.length) disconnectWallet(); else if (provider) setup(provider, a[0]); };
    const onChain = () => window.location.reload();
    (window as any).ethereum.on("accountsChanged", onAccounts);
    (window as any).ethereum.on("chainChanged", onChain);
    return () => { (window as any).ethereum.removeListener("accountsChanged", onAccounts); (window as any).ethereum.removeListener("chainChanged", onChain); };
  }, [provider, setup]);

  return (
    <Web3Context.Provider value={{ account, contract, provider, isConnecting, isConnected: !!account, error, userRole, connectWallet, disconnectWallet, fmt }}>
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);
