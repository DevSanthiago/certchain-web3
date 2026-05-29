interface Props {
  address: string | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

export function ConnectWallet({ address, isConnecting, error, connect, disconnect }: Props) {
  if (address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/90 border border-white rounded-xl px-4 py-2 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-sm text-slate-700 font-bold font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={disconnect}
          className="text-xs text-white/70 hover:text-white font-bold uppercase tracking-wider transition-colors"
        >
          Sair
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={connect}
        disabled={isConnecting}
        className="bg-white hover:bg-indigo-50 text-indigo-600 font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-900/20 transition-all active:scale-95 disabled:opacity-50"
      >
        {isConnecting ? "Aguardando..." : "Conectar Carteira"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}