import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";

const SEPOLIA_CHAIN_ID = "0xaa36a7";

interface WalletState {
  address: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: string | null;
  isConnecting: boolean;
  error: string | null;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any;
  }
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    provider: null,
    signer: null,
    chainId: null,
    isConnecting: false,
    error: null,
  });

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState(s => ({ ...s, error: "MetaMask não encontrada. Instale a extensão." }));
      return;
    }

    setState(s => ({ ...s, isConnecting: true, error: null }));

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const chainId = await window.ethereum.request({ method: "eth_chainId" });

      if (chainId !== SEPOLIA_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          });
        } catch {
          setState(s => ({
            ...s,
            isConnecting: false,
            error: "Troque a rede para Sepolia Testnet no MetaMask.",
          }));
          return;
        }
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      setState({
        address,
        provider,
        signer,
        chainId: network.chainId.toString(),
        isConnecting: false,
        error: null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao conectar carteira";
      setState(s => ({ ...s, isConnecting: false, error: message }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      provider: null,
      signer: null,
      chainId: null,
      isConnecting: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    const handler = () => disconnect();
    window.ethereum.on("accountsChanged", handler);
    window.ethereum.on("chainChanged", handler);
    return () => {
      window.ethereum.removeListener("accountsChanged", handler);
      window.ethereum.removeListener("chainChanged", handler);
    };
  }, [disconnect]);

  return { ...state, connect, disconnect };
}
