// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertChain {

    struct Certificate {
        string studentName;
        string courseName;
        string institution;
        string completionDate;
        address issuedBy;
        uint256 issuedAt;
        bool exists;
    }

    // hash do certificado => dados do certificado
    mapping(bytes32 => Certificate) private certificates;

    // endereço da instituição => lista de hashes emitidos
    mapping(address => bytes32[]) private issuedBy;

    event CertificateRegistered(
        bytes32 indexed certHash,
        string studentName,
        string courseName,
        string institution,
        address indexed issuedBy,
        uint256 issuedAt
    );

    /**
     * @notice Registra um novo certificado na blockchain
     * @param certHash Hash SHA-256 do certificado (como bytes32)
     * @param studentName Nome completo do aluno
     * @param courseName Nome do curso ou formação
     * @param institution Nome da instituição emissora
     * @param completionDate Data de conclusão (string formato "DD/MM/AAAA")
     */
    function registerCertificate(
        bytes32 certHash,
        string memory studentName,
        string memory courseName,
        string memory institution,
        string memory completionDate
    ) external {
        require(!certificates[certHash].exists, "CertChain: certificate already registered");
        require(bytes(studentName).length > 0, "CertChain: student name required");
        require(bytes(courseName).length > 0, "CertChain: course name required");
        require(bytes(institution).length > 0, "CertChain: institution required");

        certificates[certHash] = Certificate({
            studentName: studentName,
            courseName: courseName,
            institution: institution,
            completionDate: completionDate,
            issuedBy: msg.sender,
            issuedAt: block.timestamp,
            exists: true
        });

        issuedBy[msg.sender].push(certHash);

        emit CertificateRegistered(
            certHash,
            studentName,
            courseName,
            institution,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Verifica se um certificado existe e retorna seus dados
     * @param certHash Hash do certificado a verificar
     */
    function verifyCertificate(bytes32 certHash)
        external
        view
        returns (
            bool valid,
            string memory studentName,
            string memory courseName,
            string memory institution,
            string memory completionDate,
            address issuer,
            uint256 issuedAt
        )
    {
        Certificate memory cert = certificates[certHash];
        if (!cert.exists) {
            return (false, "", "", "", "", address(0), 0);
        }
        return (
            true,
            cert.studentName,
            cert.courseName,
            cert.institution,
            cert.completionDate,
            cert.issuedBy,
            cert.issuedAt
        );
    }

    /**
     * @notice Retorna todos os hashes emitidos por um endereço
     * @param issuer Endereço da carteira da instituição
     */
    function getCertificatesByIssuer(address issuer)
        external
        view
        returns (bytes32[] memory)
    {
        return issuedBy[issuer];
    }

    /**
     * @notice Retorna o total de certificados emitidos por um endereço
     */
    function getCertificateCount(address issuer) external view returns (uint256) {
        return issuedBy[issuer].length;
    }
}
