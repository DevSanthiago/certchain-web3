import CryptoJS from "crypto-js";

export function generateCertHash(data: {
  studentName: string;
  courseName: string;
  institution: string;
  completionDate: string;
}): string {
  const payload = JSON.stringify({
    studentName: data.studentName.trim().toLowerCase(),
    courseName: data.courseName.trim().toLowerCase(),
    institution: data.institution.trim().toLowerCase(),
    completionDate: data.completionDate.trim(),
  });

  const hash = CryptoJS.SHA256(payload).toString(CryptoJS.enc.Hex);
  return "0x" + hash;
}

export function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
