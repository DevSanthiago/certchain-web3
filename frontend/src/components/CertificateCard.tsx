interface CertificateCardProps {
    studentName: string;
    courseName: string;
    institution: string;
    completionDate: string;
    certHash: string;
    issuedAt?: string;
    issuer?: string;
    verified?: boolean;
}

export function CertificateCard({
    studentName,
    courseName,
    institution,
    completionDate,
    certHash,
    issuedAt,
    issuer,
    verified = false,
}: CertificateCardProps) {
    const shortHash = certHash.slice(0, 12) + "..." + certHash.slice(-6);

    const handleCopy = () => {
        navigator.clipboard.writeText(certHash);
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto mt-6">
            {verified && (
                <div className="absolute -top-4 -right-4 z-10 flex flex-col items-center">
                    <div className="bg-emerald-500 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg shadow-emerald-400/40 border-4 border-white">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <span className="text-xs font-black text-emerald-600 mt-1 tracking-wider uppercase">Válido</span>
                </div>
            )}

            <div
                className="relative rounded-2xl overflow-hidden border-2 shadow-2xl"
                style={{
                    borderColor: verified ? "#10b981" : "#6366f1",
                    background: "linear-gradient(135deg, #fdfbf7 0%, #faf7f0 50%, #fdfbf7 100%)",
                    boxShadow: verified
                        ? "0 20px 60px rgba(16,185,129,0.15), 0 4px 20px rgba(0,0,0,0.1)"
                        : "0 20px 60px rgba(99,102,241,0.15), 0 4px 20px rgba(0,0,0,0.1)",
                }}
            >
                <div
                    className="absolute inset-2 rounded-xl border pointer-events-none"
                    style={{ borderColor: verified ? "rgba(16,185,129,0.25)" : "rgba(99,102,241,0.25)" }}
                />

                {["top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"].map((pos, i) => (
                    <div
                        key={i}
                        className={`absolute ${pos} w-6 h-6 pointer-events-none`}
                        style={{
                            background: `radial-gradient(circle, ${verified ? "rgba(16,185,129,0.4)" : "rgba(99,102,241,0.4)"} 0%, transparent 70%)`,
                            borderRadius: "50%",
                        }}
                    />
                ))}

                <div className="relative px-10 py-8">
                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <div
                                className="w-7 h-7 rounded-full flex items-center justify-center"
                                style={{ background: verified ? "#10b981" : "#6366f1" }}
                            >
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <span
                                className="text-sm font-black tracking-[0.2em] uppercase"
                                style={{ color: verified ? "#10b981" : "#6366f1" }}
                            >
                                CertChain
                            </span>
                        </div>

                        <p className="text-xs text-slate-400 uppercase tracking-[0.15em] font-medium mb-1">
                            Certificado de Conclusão
                        </p>

                        <div className="w-24 h-px mx-auto my-3" style={{ background: verified ? "#10b981" : "#6366f1", opacity: 0.4 }} />

                        <p className="text-xs text-slate-400 mb-2">Este certificado confirma que</p>

                        <h3
                            className="text-3xl font-black mb-1"
                            style={{
                                color: "#1e293b",
                                fontFamily: "Georgia, serif",
                                letterSpacing: "-0.01em",
                            }}
                        >
                            {studentName}
                        </h3>

                        <p className="text-xs text-slate-400 mb-4">concluiu com êxito</p>

                        <div
                            className="inline-block px-6 py-2 rounded-full text-sm font-bold mb-4"
                            style={{
                                background: verified ? "rgba(16,185,129,0.1)" : "rgba(99,102,241,0.1)",
                                color: verified ? "#059669" : "#4f46e5",
                                border: `1px solid ${verified ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.2)"}`,
                            }}
                        >
                            {courseName}
                        </div>

                        <div className="w-24 h-px mx-auto my-3" style={{ background: verified ? "#10b981" : "#6366f1", opacity: 0.4 }} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center">
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Instituição</p>
                            <p className="text-sm font-semibold text-slate-700">{institution}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Conclusão</p>
                            <p className="text-sm font-semibold text-slate-700">{completionDate}</p>
                        </div>
                        {issuedAt && (
                            <div className="text-center">
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Registrado em</p>
                                <p className="text-sm font-semibold text-slate-700">{issuedAt}</p>
                            </div>
                        )}
                        {issuer && (
                            <div className="text-center">
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Emissor</p>
                                <p className="text-xs font-mono text-slate-600">{issuer.slice(0, 6)}...{issuer.slice(-4)}</p>
                            </div>
                        )}
                    </div>

                    <div
                        className="flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.08)" }}
                    >
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Hash blockchain</p>
                            <p className="text-xs font-mono text-slate-600">{shortHash}</p>
                        </div>
                        <button
                            onClick={handleCopy}
                            title="Copiar hash completo"
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                            style={{
                                background: verified ? "rgba(16,185,129,0.1)" : "rgba(99,102,241,0.1)",
                                color: verified ? "#059669" : "#4f46e5",
                            }}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copiar
                        </button>
                    </div>

                    <div className="mt-4 text-center">
                        <p className="text-xs text-slate-300 uppercase tracking-[0.15em]">
                            Verificado na rede Ethereum · Sepolia Testnet
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}