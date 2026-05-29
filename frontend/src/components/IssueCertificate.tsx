import { useState } from "react";
import { ethers } from "ethers";
import { getContract } from "../utils/contract";
import { generateCertHash } from "../utils/hash";
import { CertificateCard } from "./CertificateCard";

interface FormData {
  studentName: string;
  courseName: string;
  institution: string;
  completionDate: string;
}

interface TxResult {
  hash: string;
  certHash: string;
  formData: FormData;
}

interface Props {
  address: string | null;
  signer: ethers.JsonRpcSigner | null;
  onSuccess?: () => void;
}

export function IssueCertificate({ address, signer, onSuccess }: Props) {
  const [form, setForm] = useState<FormData>({
    studentName: "",
    courseName: "",
    institution: "",
    completionDate: "",
  });
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer) return;

    setStatus("pending");
    setError("");

    try {
      const certHash = generateCertHash(form);
      const contract = getContract(signer);

      const tx = await contract.registerCertificate(
        certHash,
        form.studentName,
        form.courseName,
        form.institution,
        form.completionDate
      );

      await tx.wait();

      setResult({ hash: tx.hash, certHash, formData: { ...form } });
      setStatus("success");
      setForm({ studentName: "", courseName: "", institution: "", completionDate: "" });
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao registrar certificado";
      setError(msg.includes("already registered") ? "Este certificado já foi registrado." : msg);
      setStatus("error");
    }
  };

  if (!address) {
    return (
      <div className="text-center py-10 text-gray-500">
        Conecte sua carteira MetaMask para emitir certificados.
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Emitir Certificado</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { name: "studentName", label: "Nome completo do aluno", placeholder: "Ex: Agatha Silva" },
          { name: "courseName", label: "Nome do curso", placeholder: "Ex: Desenvolvimento Web Full Stack" },
          { name: "institution", label: "Instituição emissora", placeholder: "Ex: Instituto de Federal de Tecnologia de São Paulo" },
          { name: "completionDate", label: "Data de conclusão", placeholder: "DD/MM/AAAA" },
        ].map(field => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type="text"
              name={field.name}
              value={form[field.name as keyof FormData]}
              onChange={handleChange}
              placeholder={field.placeholder}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={status === "pending"}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {status === "pending" ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Registrando na blockchain...
            </span>
          ) : "Emitir Certificado"}
        </button>
      </form>

      {status === "success" && result && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-emerald-600 font-bold text-sm">✅ Certificado registrado na blockchain!</span>
          </div>
          <p className="text-xs text-slate-400 mb-1">
            Transação:{" "}
            <a
              href={`https://sepolia.etherscan.io/tx/${result.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 hover:underline font-mono"
            >
              {result.hash.slice(0, 14)}...
            </a>
          </p>

          <CertificateCard
            studentName={result.formData.studentName}
            courseName={result.formData.courseName}
            institution={result.formData.institution}
            completionDate={result.formData.completionDate}
            certHash={result.certHash}
            issuer={address ?? undefined}
            verified={false}
          />
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}