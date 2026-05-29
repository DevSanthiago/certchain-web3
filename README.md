# CertChain

Plataforma de emissão e verificação pública de certificados acadêmicos e profissionais usando blockchain Ethereum.

**HackWeb Web 3.0 — Residência em TIC 29 — Desafio 1 (ProofChain / Trilha Blockchain)**

---

## O Problema

Certificados e diplomas são facilmente falsificados com editores de PDF. A verificação manual depende de contatar a instituição emissora — lenta, trabalhosa e impossível se a instituição deixar de existir.

## A Solução

O CertChain registra o hash SHA-256 de cada certificado diretamente na blockchain Ethereum (Sepolia Testnet), tornando o registro imutável, público e verificável por qualquer pessoa em segundos — sem intermediários.

## Fluxo Principal

1. Instituição preenche dados do certificado no frontend
2. Sistema gera hash SHA-256 dos dados
3. Hash + metadados são registrados on-chain via MetaMask
4. Verificador insere o hash → sistema consulta o contrato → retorna ✅ Válido ou ❌ Inválido

## Stack Tecnológica

- **Smart Contract:** Solidity ^0.8.20
- **Tooling:** Hardhat
- **Testnet:** Sepolia (Ethereum)
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Web3:** Ethers.js v6 + MetaMask

## Contrato Deployado

- **Endereço:** `0xeAeF9FD23D926c94AB9818a31b4B36b95CFAEF84`
- **Rede:** Sepolia Testnet
- **Etherscan:** https://sepolia.etherscan.io/address/0xeAeF9FD23D926c94AB9818a31b4B36b95CFAEF84

## Como Executar Localmente

### Pré-requisitos

- Node.js >= 18
- MetaMask instalado no browser
- ETH na Sepolia (use faucet: https://sepoliafaucet.com)

### Smart Contract

```bash
# Instalar dependências
npm install

# Rodar testes
npx hardhat test

# Deploy na Sepolia (configure .env primeiro)
npx hardhat run scripts/deploy.js --network sepolia
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Abra http://localhost:5173, conecte o MetaMask na Sepolia e use.

## Evidências de Funcionamento

- [Link do contrato no Etherscan](https://sepolia.etherscan.io/address/0xeAeF9FD23D926c94AB9818a31b4B36b95CFAEF84)
- [Deploy da aplicação na Vercel](https://certchain-web3.vercel.app/)
- [Vídeo pitch de apresentação](#) ← adicionar após gravação

## Estrutura do Repositório

```
certchain-web3/
├── contracts/       Smart contract Solidity
├── scripts/         Script de deploy
├── test/            Testes Hardhat
└── frontend/        App React + TypeScript
```

## Licença

MIT
