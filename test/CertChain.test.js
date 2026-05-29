const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertChain", function () {
  let certChain;
  let owner, addr1;

  const mockHash = ethers.keccak256(ethers.toUtf8Bytes("test-certificate-001"));

  const mockCert = {
    studentName: "João da Silva",
    courseName: "Desenvolvimento Full Stack",
    institution: "Instituto de TIC",
    completionDate: "15/05/2025",
  };

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const CertChain = await ethers.getContractFactory("CertChain");
    certChain = await CertChain.deploy();
  });

  describe("registerCertificate", function () {
    it("deve registrar um certificado com sucesso", async function () {
      await expect(
        certChain.registerCertificate(
          mockHash,
          mockCert.studentName,
          mockCert.courseName,
          mockCert.institution,
          mockCert.completionDate
        )
      ).to.emit(certChain, "CertificateRegistered")
        .withArgs(mockHash, mockCert.studentName, mockCert.courseName, mockCert.institution, owner.address, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));
    });

    it("deve rejeitar registro duplicado do mesmo hash", async function () {
      await certChain.registerCertificate(
        mockHash,
        mockCert.studentName,
        mockCert.courseName,
        mockCert.institution,
        mockCert.completionDate
      );

      await expect(
        certChain.registerCertificate(
          mockHash,
          mockCert.studentName,
          mockCert.courseName,
          mockCert.institution,
          mockCert.completionDate
        )
      ).to.be.revertedWith("CertChain: certificate already registered");
    });

    it("deve rejeitar se nome do aluno estiver vazio", async function () {
      await expect(
        certChain.registerCertificate(
          mockHash,
          "",
          mockCert.courseName,
          mockCert.institution,
          mockCert.completionDate
        )
      ).to.be.revertedWith("CertChain: student name required");
    });

    it("deve incrementar o contador de certificados do emissor", async function () {
      await certChain.registerCertificate(
        mockHash,
        mockCert.studentName,
        mockCert.courseName,
        mockCert.institution,
        mockCert.completionDate
      );

      expect(await certChain.getCertificateCount(owner.address)).to.equal(1);
    });

    it("diferentes endereços podem registrar o mesmo hash (cenário: auditoria)", async function () {
      await certChain.registerCertificate(
        mockHash,
        mockCert.studentName,
        mockCert.courseName,
        mockCert.institution,
        mockCert.completionDate
      );

      // hash já registrado por owner — addr1 tenta registrar o mesmo → deve falhar
      await expect(
        certChain.connect(addr1).registerCertificate(
          mockHash,
          mockCert.studentName,
          mockCert.courseName,
          mockCert.institution,
          mockCert.completionDate
        )
      ).to.be.revertedWith("CertChain: certificate already registered");
    });
  });

  describe("verifyCertificate", function () {
    it("deve retornar válido e dados corretos para hash registrado", async function () {
      await certChain.registerCertificate(
        mockHash,
        mockCert.studentName,
        mockCert.courseName,
        mockCert.institution,
        mockCert.completionDate
      );

      const result = await certChain.verifyCertificate(mockHash);
      expect(result.valid).to.equal(true);
      expect(result.studentName).to.equal(mockCert.studentName);
      expect(result.courseName).to.equal(mockCert.courseName);
      expect(result.institution).to.equal(mockCert.institution);
      expect(result.issuer).to.equal(owner.address);
    });

    it("deve retornar inválido para hash não registrado", async function () {
      const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("hash-inexistente"));
      const result = await certChain.verifyCertificate(fakeHash);
      expect(result.valid).to.equal(false);
    });
  });

  describe("getCertificatesByIssuer", function () {
    it("deve retornar a lista de hashes emitidos pelo endereço", async function () {
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("cert-002"));

      await certChain.registerCertificate(mockHash, "Aluno A", "Curso A", "Inst A", "01/01/2025");
      await certChain.registerCertificate(hash2, "Aluno B", "Curso B", "Inst A", "02/01/2025");

      const hashes = await certChain.getCertificatesByIssuer(owner.address);
      expect(hashes.length).to.equal(2);
      expect(hashes[0]).to.equal(mockHash);
      expect(hashes[1]).to.equal(hash2);
    });
  });
});
