import { useState, useEffect } from "react";
import { ConnectWallet } from "./components/ConnectWallet";
import { IssueCertificate } from "./components/IssueCertificate";
import { VerifyCertificate } from "./components/VerifyCertificate";
import { useWallet } from "./hooks/useWallet";

type Tab = "issue" | "verify";

const PHRASES = [
  { prefix: "Autenticidade que você pode ", highlight: "confirmar." },
  { prefix: "Certificados que ninguém pode ", highlight: "falsificar." },
  { prefix: "Confiança registrada na ", highlight: "blockchain." },
];

function TypewriterHero() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const current = PHRASES[phraseIndex];
  const fullText = current.prefix + current.highlight;

  useEffect(() => {
    let timeout: number;

    if (!isDeleting && charIndex < fullText.length) {
      timeout = window.setTimeout(() => setCharIndex(c => c + 1), 65);
    } else if (!isDeleting && charIndex === fullText.length) {
      timeout = window.setTimeout(() => setIsDeleting(true), 1800);
    } else if (isDeleting && charIndex > 0) {
      timeout = window.setTimeout(() => setCharIndex(c => c - 1), 30);
    } else {
      timeout = window.setTimeout(() => {
        setIsDeleting(false);
        setPhraseIndex(i => (i + 1) % PHRASES.length);
      }, 400);
    }

    return () => window.clearTimeout(timeout);
  }, [charIndex, isDeleting, fullText.length]);

  const typed = fullText.slice(0, charIndex);
  const prefixPart = charIndex <= current.prefix.length ? typed : current.prefix;
  const highlightPart = charIndex > current.prefix.length ? typed.slice(current.prefix.length) : "";

  return (
    <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight min-h-[7rem] md:min-h-[8rem] flex items-center justify-center">
      <span>
        {prefixPart}
        <span className="neon-text text-indigo-200">{highlightPart}</span>
        <span className="type-cursor text-indigo-200">|</span>
      </span>
    </h2>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("verify");
  const { address, signer, isConnecting, error, connect, disconnect } = useWallet();

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <style>{`
        html, body { scrollbar-width: none; -ms-overflow-style: none; }
        html::-webkit-scrollbar, body::-webkit-scrollbar, *::-webkit-scrollbar { display: none; width: 0; height: 0; }
        .neon-text { animation: neonPulse 2s ease-in-out infinite; }
        @keyframes neonPulse {
          0%, 100% { text-shadow: 0 0 8px rgba(165,180,252,.75), 0 0 20px rgba(129,140,248,.55), 0 0 32px rgba(99,102,241,.35); }
          50%      { text-shadow: 0 0 14px rgba(165,180,252,.95), 0 0 30px rgba(129,140,248,.75), 0 0 48px rgba(99,102,241,.5); }
        }
        .type-cursor { animation: blink 1s step-end infinite; font-weight: 400; margin-left: 2px; }
        @keyframes blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
      `}</style>

      <div className="bg-gradient-to-b from-indigo-700 to-indigo-900">
        <header className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm p-2 rounded-xl border border-white/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">CertChain</h1>
              <p className="text-indigo-200 text-xs font-medium uppercase tracking-widest">Web3 Verification</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/20">
            <ConnectWallet address={address} isConnecting={isConnecting} error={error} connect={connect} disconnect={disconnect} />
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-6 pt-8 pb-20 text-center">
          <TypewriterHero />
          <p className="text-indigo-100 text-lg max-w-2xl mx-auto mt-4">
            A primeira plataforma descentralizada para emissão e verificação de
            certificados acadêmicos usando a imutabilidade da rede Ethereum.
          </p>
        </div>
      </div>

      <div className="flex-1 bg-slate-50">
        <main className="max-w-5xl mx-auto px-6 -mt-10 pb-16">
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-200/50 overflow-hidden border border-slate-100">
            <div className="p-3 bg-slate-50 border-b border-slate-100">
              <div className="relative flex rounded-2xl bg-slate-100/70 p-1">
                <div
                  className="absolute top-1 bottom-1 left-1 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-lg shadow-indigo-500/30 transition-transform duration-300 ease-out"
                  style={{
                    width: "calc(50% - 0.25rem)",
                    transform: activeTab === "issue" ? "translateX(100%)" : "translateX(0)",
                  }}
                />
                {[
                  { id: "verify" as Tab, label: "Verificar Certificado", icon: "🔍" },
                  { id: "issue" as Tab, label: "Emitir Novo", icon: "📝" },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-colors duration-300 ${activeTab === tab.id ? "text-white" : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-8 md:p-12">
              {address && activeTab === "issue" && (
                <div className="mb-8 flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <div className="bg-indigo-600 text-white p-1.5 rounded-lg shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-indigo-700 font-medium">
                    Você está conectado à <span className="font-bold">Sepolia Testnet</span>. Todas as emissões são gratuitas.
                  </p>
                </div>
              )}
              <div className="transition-all duration-500 ease-in-out">
                {activeTab === "issue"
                  ? <IssueCertificate address={address} signer={signer} />
                  : <VerifyCertificate />}
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Imutável", desc: "Registros que nunca podem ser alterados ou apagados.", icon: "🔒" },
              { title: "Público", desc: "Verificação instantânea sem necessidade de login.", icon: "🌍" },
              { title: "Seguro", desc: "Protegido pela criptografia de ponta da Ethereum.", icon: "🛡️" },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl mb-3">{item.icon}</div>
                <h4 className="font-bold text-slate-800 mb-1">{item.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </main>

        <footer className="text-center py-6 text-slate-400 text-xs font-medium border-t border-slate-200 bg-white">
          <p>© 2026 CertChain Protocol · HackWeb Web 3.0 · Built with Satoshi Squad for TIC 29</p>
        </footer>
      </div>
    </div>
  );
}