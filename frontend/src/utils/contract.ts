import { ethers } from "ethers";

export const CONTRACT_ADDRESS = "0xeAeF9FD23D926c94AB9818a31b4B36b95CFAEF84";

export const CONTRACT_ABI = [
  "function registerCertificate(bytes32 certHash, string studentName, string courseName, string institution, string completionDate) external",
  "function verifyCertificate(bytes32 certHash) external view returns (bool valid, string studentName, string courseName, string institution, string completionDate, address issuer, uint256 issuedAt)",
  "function getCertificatesByIssuer(address issuer) external view returns (bytes32[])",
  "function getCertificateCount(address issuer) external view returns (uint256)",
  "event CertificateRegistered(bytes32 indexed certHash, string studentName, string courseName, string institution, address indexed issuedBy, uint256 issuedAt)"
];

export function getContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
}
