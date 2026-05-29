import { useState } from "react";
import { ethers } from "ethers";
import { getContract } from "../utils/contract";
import { formatTimestamp } from "../utils/hash";
import { CertificateCard } from "./CertificateCard";

interface CertData {
  studentName: string;
  courseName: string;
  institution: string;
  completionDate: string;
  issuer: string;
  issuedAt: bigint;
}

export function VerifyCertificate() {
  const [hashInput, setHashInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "valid" | "invalid" | "error">("idle");
  const [certData, setCertData] = useState<CertData | null>(null);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    const trimmed = hashInput.trim();
    if (!trimmed) return;

    setStatus("loading");
    setError("");
    setCertData(null);

    try {
      const provider = window.ethereum
        ? new ethers.BrowserProvider(window.ethereum)
        : new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");

      const contract = getContract(provider);
      const certHash = trimmed.startsWith("0x") ? trimmed : "0x" + trimmed;
      const result = await contract.verifyCertificate(certHash);

      if (!result.valid) {
        setStatus("invalid");
        return;
      }

      setCertData({
        studentName: result.studentName,
        courseName: result.courseName,
        institution: result.institution,
        completionDate: result.completionDate,
        issuer: result.issuer,
        issuedAt: result.issuedAt,
      });
      setStatus("valid");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao verificar";
      setError(msg);
      setStatus("error");
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Verificar Certificado</h2>
      <p className="text-sm text-gray-500 mb-6">
        Insira o hash do certificado para verificar sua autenticidade na blockchain.
        Não é necessário conectar carteira.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={hashInput}
          onChange={e => setHashInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleVerify()}
          placeholder="0x1a2b3c... (hash SHA-256 do certificado)"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={handleVerify}
          disabled={status === "loading" || !hashInput.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          {status === "loading" ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Verificando
            </span>
          ) : "Verificar"}
        </button>
      </div>

      {status === "valid" && certData && (
        <CertificateCard
          studentName={certData.studentName}
          courseName={certData.courseName}
          institution={certData.institution}
          completionDate={certData.completionDate}
          certHash={hashInput.trim()}
          issuedAt={formatTimestamp(certData.issuedAt)}
          issuer={certData.issuer}
          verified={true}
        />
      )}

      {status === "invalid" && (
        <div className="mt-6 p-5 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-red-800">Certificado não encontrado</p>
              <p className="text-sm text-red-600">
                Este hash não foi registrado na blockchain. O certificado pode ser falso ou o hash incorreto.
              </p>
            </div>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}
    </div>
  );
}