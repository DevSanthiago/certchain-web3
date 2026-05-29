# CertChain — Documento de Arquitetura

> Referência técnica do MVP CertChain — HackWeb Web 3.0 · Residência em TIC 29 · Desafio 1

---

## Sumário

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura de Alto Nível](#2-arquitetura-de-alto-nível)
3. [Fluxo de Dados](#3-fluxo-de-dados)
4. [Design do Smart Contract](#4-design-do-smart-contract)
5. [Arquitetura do Frontend](#5-arquitetura-do-frontend)
6. [Estratégia de Hash](#6-estratégia-de-hash)
7. [Decisões On-Chain vs Off-Chain](#7-decisões-on-chain-vs-off-chain)
8. [Integração com Carteira](#8-integração-com-carteira)
9. [Estratégia de Testes](#9-estratégia-de-testes)
10. [Infraestrutura de Deploy](#10-infraestrutura-de-deploy)
11. [Mapa de Dependências](#11-mapa-de-dependências)
12. [Limitações Conhecidas e Trabalhos Futuros](#12-limitações-conhecidas-e-trabalhos-futuros)

---

## 1. Visão Geral do Sistema

O CertChain é uma plataforma descentralizada de emissão e verificação de certificados acadêmicos e profissionais construída sobre a blockchain Ethereum. Sua premissa central é direta: em vez de confiar que uma instituição confirme a autenticidade de um certificado, qualquer pessoa pode verificá-lo diretamente contra um registro imutável na blockchain.

O sistema é composto por duas camadas independentes:

- **Camada on-chain:** Um smart contract Solidity deployado na Sepolia Testnet do Ethereum que armazena permanentemente os hashes dos certificados e seus metadados associados.
- **Camada off-chain:** Uma aplicação de página única (SPA) em React/TypeScript que fornece a interface do usuário para interagir com o contrato, sem necessidade de servidor backend.

A arquitetura é intencionalmente minimalista. Não há banco de dados, servidor de autenticação ou API gateway. A confiança é derivada exclusivamente da rede Ethereum.

---

## 2. Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                        NAVEGADOR DO USUÁRIO                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              React SPA (Vite + TypeScript)              │   │
│  │                                                         │   │
│  │  ┌──────────────────┐    ┌──────────────────────────┐  │   │
│  │  │ IssueCertificate │    │   VerifyCertificate      │  │   │
│  │  │  (fluxo escrita) │    │   (fluxo leitura)        │  │   │
│  │  └────────┬─────────┘    └────────────┬─────────────┘  │   │
│  │           │                           │                  │   │
│  │  ┌────────▼───────────────────────────▼─────────────┐  │   │
│  │  │              utils/contract.ts                   │  │   │
│  │  │   CONTRACT_ABI + CONTRACT_ADDRESS + getContract  │  │   │
│  │  └────────────────────────┬─────────────────────────┘  │   │
│  │                           │  Ethers.js v6               │   │
│  └───────────────────────────┼─────────────────────────────┘   │
│                              │                                  │
│  ┌───────────────────────────▼─────────────────────────────┐   │
│  │                   Extensão MetaMask                     │   │
│  │              (BrowserProvider / Signer)                 │   │
│  └───────────────────────────┬─────────────────────────────┘   │
└──────────────────────────────┼──────────────────────────────────┘
                               │  JSON-RPC over HTTPS
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Ethereum Sepolia Testnet                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │         CertChain.sol                                  │     │
│  │         0xeAeF9FD23D926c94AB9818a31b4B36b95CFAEF84    │     │
│  │                                                        │     │
│  │  mapping(bytes32 => Certificate)  certificates         │     │
│  │  mapping(address => bytes32[])    issuedBy             │     │
│  │                                                        │     │
│  │  registerCertificate()   ← altera estado (consome gas) │     │
│  │  verifyCertificate()     ← somente leitura (gratuito)  │     │
│  │  getCertificatesByIssuer() ← somente leitura (gratuito)│     │
│  │  getCertificateCount()   ← somente leitura (gratuito)  │     │
│  └────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Fluxo de Dados

### 3.1 Emissão de Certificado (Escrita)

```
[Usuário preenche o formulário]
      │
      ▼
[hash.ts: generateCertHash()]
  ├─ Normaliza entradas (trim + lowercase)
  ├─ JSON.stringify do payload
  └─ SHA-256 via crypto-js → string hex bytes32 (0x...)
      │
      ▼
[contract.ts: getContract(signer)]
  └─ Instância do Contract Ethers.js com acesso de escrita
      │
      ▼
[Popup MetaMask: usuário assina a transação]
      │
      ▼
[contract.registerCertificate(certHash, studentName, courseName, institution, completionDate)]
      │
      ▼
[Rede Sepolia: transação minerada]
  └─ Evento emitido: CertificateRegistered(certHash, studentName, courseName, institution, issuedBy, issuedAt)
      │
      ▼
[UI: CertificateCard exibido com hash da transação + link para o Etherscan]
```

### 3.2 Verificação de Certificado (Leitura)

```
[Usuário cola o hash]
      │
      ▼
[VerifyCertificate: BrowserProvider via window.ethereum]
  └─ Acesso somente leitura — sem necessidade de assinatura, sem custo de gas
      │
      ▼
[contract.verifyCertificate(certHash)]
      │
      ├─ Hash não encontrado → retorna (valid: false, ...) → ❌ UI exibe "não encontrado"
      │
      └─ Hash encontrado → retorna (valid: true, studentName, courseName, institution,
                                     completionDate, issuer, issuedAt)
                                │
                                ▼
                    [CertificateCard: verified=true, selo verde exibido]
```

---

## 4. Design do Smart Contract

### 4.1 Modelo de Dados

```solidity
struct Certificate {
    string  studentName;
    string  courseName;
    string  institution;
    string  completionDate;
    address issuedBy;      // carteira que registrou o certificado
    uint256 issuedAt;      // block.timestamp no momento do registro
    bool    exists;        // flag de guarda para verificação de existência
}

mapping(bytes32 => Certificate)  private certificates;  // hash → dados
mapping(address => bytes32[])    private issuedBy;      // emissor → todos os hashes
```

**Decisão de design — flag `exists`:** Em vez de verificar structs com valor zero (o que exigiria comparar múltiplos campos), uma flag booleana dedicada fornece uma verificação de existência em O(1) com um único opcode `SLOAD`. Este é o padrão idiomático em Solidity para verificação de existência em mappings.

**Decisão de design — mapeamento duplo:** O mapping `certificates` permite busca em O(1) por hash (o caminho principal de verificação). O mapping `issuedBy` permite consultar todos os certificados de uma determinada instituição, suportando casos de uso de auditoria sem necessidade de varredura dos logs de eventos.

### 4.2 Controle de Acesso

O contrato é intencionalmente sem permissões: qualquer endereço Ethereum pode registrar um certificado. Esta é uma decisão deliberada de MVP — a identidade do emissor é registrada imutavelmente como `msg.sender`, de modo que a autenticidade da entidade emissora é uma responsabilidade social de camada 0 (a comunidade confia naquele endereço?), e não uma responsabilidade do smart contract.

**Prevenção de duplicatas:** O `require(!certificates[certHash].exists)` garante que, uma vez que um hash é registrado, ele não pode ser sobrescrito. Esta é a garantia central de imutabilidade.

### 4.3 Eventos

```solidity
event CertificateRegistered(
    bytes32 indexed certHash,    // indexado para filtragem eficiente de logs
    string  studentName,
    string  courseName,
    string  institution,
    address indexed issuedBy,    // indexado para consultas por emissor
    uint256 issuedAt
);
```

Tanto `certHash` quanto `issuedBy` são indexados, permitindo filtragem off-chain eficiente via `eth_getLogs` — uma escolha de design importante para futuros dashboards analíticos ou sistemas de notificação.

### 4.4 Considerações de Gas

- `registerCertificate` armazena 4 strings + 1 address + 1 uint256 + 1 bool. O custo de gas é variável dependendo do tamanho das strings.
- Todas as funções de leitura (`verifyCertificate`, `getCertificatesByIssuer`, `getCertificateCount`) são `view`, o que significa custo zero de gas quando chamadas externamente.
- Não há loops em nenhuma função de escrita, eliminando vetores de ataque de DoS via limite de gas do bloco.

### 4.5 O que o Contrato NÃO Faz

- **Sem revogação:** Certificados registrados não podem ser deletados ou invalidados. Isso é intencional para o escopo do MVP — a revogação exigiria um mapping adicional `revokedCertificates` com lógica de controle de acesso.
- **Sem gerenciamento de papéis:** Não existe o conceito de "admin", "instituição" ou "aluno" no nível do contrato.
- **Sem atualizabilidade:** O contrato não usa proxy. Uma vez deployado, a lógica é imutável.

---

## 5. Arquitetura do Frontend

### 5.1 Árvore de Componentes

```
App.tsx
├── [estado] activeTab: "verify" | "issue"
├── [hook]   useWallet() → { address, signer, isConnecting, error, connect, disconnect }
│
├── ConnectWallet          (props: address, isConnecting, error, connect, disconnect)
├── TypewriterHero         (componente interno, sem props)
│
└── [activeTab === "issue"]
│       IssueCertificate   (props: address, signer, onSuccess)
│       └── CertificateCard (props: dados do cert, verified=false)
│
└── [activeTab === "verify"]
        VerifyCertificate  (sem props — usa window.ethereum diretamente)
        └── CertificateCard (props: dados do cert, verified=true)
```

**Decisão de design — fonte única de verdade para o estado da carteira:** `useWallet()` é chamado uma única vez em `App.tsx`. O `address`, `signer` e funções de controle resultantes são passados como props. Isso evita o problema de múltiplas instâncias, onde cada componente chamando o hook manteria estado independente, impedindo que a conexão da carteira se propagasse entre os componentes.

### 5.2 Gerenciamento de Estado

O CertChain não utiliza nenhuma biblioteca de estado global (sem Redux, sem Zustand, sem Context API). O estado da carteira reside em `App.tsx` e é distribuído via props. Isso é suficiente para a profundidade atual dos componentes e evita complexidade desnecessária para um MVP.

### 5.3 Roteamento

Não há roteador client-side. A navegação entre "emitir" e "verificar" é gerenciada por uma variável de estado local `activeTab` em `App.tsx`. Isso é adequado para uma aplicação de duas telas e evita a sobrecarga do React Router.

---

## 6. Estratégia de Hash

### 6.1 Algoritmo de Geração

```typescript
// frontend/src/utils/hash.ts
function generateCertHash(data): string {
  const payload = JSON.stringify({
    studentName:    data.studentName.trim().toLowerCase(),
    courseName:     data.courseName.trim().toLowerCase(),
    institution:    data.institution.trim().toLowerCase(),
    completionDate: data.completionDate.trim(),   // data NÃO é convertida para minúsculas
  });
  const hash = CryptoJS.SHA256(payload).toString(CryptoJS.enc.Hex);
  return "0x" + hash;
}
```

### 6.2 Regras de Normalização

| Campo | Regra | Motivo |
|---|---|---|
| studentName | trim + lowercase | Evita divergência de hash por espaços ou diferenças de capitalização |
| courseName | trim + lowercase | Mesmo motivo |
| institution | trim + lowercase | Mesmo motivo |
| completionDate | somente trim | Strings de data têm formato fixo (DD/MM/AAAA); lowercase é irrelevante |

### 6.3 Por que SHA-256 Off-Chain

O SHA-256 é calculado no navegador antes que a transação seja enviada. O digest resultante de 32 bytes (`bytes32`) é o que fica armazenado on-chain. Essa abordagem:

- Mantém os custos de gas baixos (armazenar 32 bytes vs. armazenar strings completas duas vezes)
- Permite que o hash funcione como mecanismo de detecção de adulteração: qualquer alteração nos dados originais produz um hash completamente diferente
- Aproveita o padrão SHA-256 amplamente estabelecido (Bitcoin, TLS, etc.)

**Importante:** O hash é um compromisso com os dados, não uma chave de busca para recuperar os dados. Os metadados (nome, curso, instituição, data) são armazenados separadamente na struct do contrato para fins de recuperação.

---

## 7. Decisões On-Chain vs Off-Chain

| Dado | Localização | Motivo |
|---|---|---|
| Hash do certificado (bytes32) | On-chain | Âncora central de imutabilidade |
| Nome do aluno | On-chain | Necessário para verificação pública sem consulta off-chain |
| Nome do curso | On-chain | Mesmo motivo |
| Instituição | On-chain | Mesmo motivo |
| Data de conclusão | On-chain | Mesmo motivo |
| Endereço do emissor | On-chain | Prova criptográfica de quem registrou |
| Timestamp do bloco | On-chain | Prova imutável de quando o registro ocorreu |
| Arquivo PDF/documento | Off-chain (não implementado) | Hash de 32 bytes é suficiente para integridade; armazenar arquivos brutos on-chain seria proibitivamente caro |
| Autenticação do usuário | Off-chain (MetaMask) | Assinatura da carteira substitui autenticação tradicional |

---

## 8. Integração com Carteira

### 8.1 Fluxo de Conexão

```
window.ethereum detectado?
        │
        ├── NÃO → erro: "MetaMask não encontrada"
        │
        └── SIM → eth_requestAccounts
                        │
                        ▼
                  verificação eth_chainId
                        │
                        ├── chainId === 0xaa36a7 (Sepolia) → prossegue
                        │
                        └── chainId !== Sepolia
                                │
                                ▼
                          wallet_switchEthereumChain
                                │
                                ├── sucesso → prossegue
                                └── rejeitado → erro: "Troque a rede para Sepolia"
                                        │
                                        ▼
                              BrowserProvider → getSigner → getAddress
```

### 8.2 Listeners de Eventos

O hook `useWallet` se inscreve em dois eventos do MetaMask:

- `accountsChanged` — aciona desconexão completa, forçando o usuário a reconectar explicitamente
- `chainChanged` — aciona desconexão completa, impedindo que a aplicação opere na rede incorreta

Ambos os listeners são removidos na função de retorno do `useEffect`, evitando vazamentos de memória.

### 8.3 Verificação sem Carteira

O fluxo de verificação usa `window.ethereum` como provider somente leitura quando disponível, com fallback para um endpoint RPC público. Isso significa que:

- Usuários com MetaMask podem verificar certificados sem conectar a carteira
- Usuários sem MetaMask ainda conseguem verificar usando o fallback RPC público

---

## 9. Estratégia de Testes

A suíte de testes cobre a camada do smart contract usando Hardhat + Chai. 8 testes distribuídos em 3 blocos `describe`:

| Teste | O que valida |
|---|---|
| deve registrar um certificado com sucesso | Fluxo feliz + emissão do evento |
| deve rejeitar registro duplicado do mesmo hash | Guarda de idempotência |
| deve rejeitar se nome do aluno estiver vazio | Validação de entradas |
| deve incrementar o contador de certificados do emissor | Integridade do mapping issuedBy |
| diferentes endereços não podem registrar o mesmo hash | Unicidade global dos hashes |
| deve retornar válido e dados corretos para hash registrado | Integridade completa dos dados na leitura |
| deve retornar inválido para hash não registrado | Caminho negativo no verifyCertificate |
| deve retornar a lista de hashes emitidos pelo endereço | Integridade do getCertificatesByIssuer |

**Resultado:** 8/8 testes passando.

Os componentes do frontend não possuem cobertura por testes automatizados neste MVP. Testes manuais foram realizados end-to-end na Sepolia Testnet.

---

## 10. Infraestrutura de Deploy

### 10.1 Smart Contract

| Propriedade | Valor |
|---|---|
| Rede | Ethereum Sepolia Testnet (chain ID 11155111) |
| Endereço do Contrato | `0xeAeF9FD23D926c94AB9818a31b4B36b95CFAEF84` |
| Compilador | solc 0.8.20 (EVM target: paris) |
| Ferramental | Hardhat 2.28.6 |
| Provedor RPC | Alchemy (Sepolia) |
| Explorador de Blocos | https://sepolia.etherscan.io/address/0xeAeF9FD23D926c94AB9818a31b4B36b95CFAEF84 |

### 10.2 Frontend

| Propriedade | Valor |
|---|---|
| Hospedagem | Vercel (plano Hobby) |
| URL de Produção | https://certchain-web3.vercel.app |
| Ferramenta de build | Vite 8.x |
| CI/CD | Automático — cada push para `main` aciona um novo deploy na Vercel |
| Diretório raiz | `frontend/` |

### 10.3 Variáveis de Ambiente

| Variável | Usada em | Propósito |
|---|---|---|
| `SEPOLIA_RPC_URL` | Hardhat (somente deploy) | Endpoint RPC para deploy do contrato |
| `PRIVATE_KEY` | Hardhat (somente deploy) | Carteira do deployer — nunca exposta ao frontend |
| `ETHERSCAN_API_KEY` | Hardhat (somente verificação) | Verificação do código-fonte no Etherscan |
| `VITE_SEPOLIA_RPC_URL` | Frontend (env Vercel) | RPC Alchemy para operações de leitura no frontend |

**Nota de segurança:** `PRIVATE_KEY` e `SEPOLIA_RPC_URL` existem apenas no arquivo `.env` local e são excluídos do controle de versão via `.gitignore`. Eles nunca são empacotados no build do frontend.

---

## 11. Mapa de Dependências

### Smart Contract (raiz)

| Pacote | Versão | Propósito |
|---|---|---|
| hardhat | ^2.28.6 | Ambiente de desenvolvimento, testes, deploy |
| @nomicfoundation/hardhat-toolbox | ^4.0.0 | Chai, ethers, cobertura de código, relatório de gas |
| dotenv | ^17.4.2 | Carregamento de variáveis de ambiente |

### Frontend

| Pacote | Versão | Propósito |
|---|---|---|
| react | ^19.2.6 | Framework de UI |
| react-dom | ^19.2.6 | Renderização no DOM |
| ethers | ^6.16.0 | Interação com Ethereum (chamadas de contrato, providers, signers) |
| crypto-js | ^4.2.0 | Geração de hash SHA-256 |
| typescript | ~6.0.2 | Tipagem estática |
| vite | ^8.0.12 | Ferramenta de build e servidor de desenvolvimento |
| tailwindcss | ^3.4.19 | CSS utilitário |

---

## 12. Limitações Conhecidas e Trabalhos Futuros

### Limitações Atuais

**Sem revogação de certificados**
Uma vez registrado, um hash de certificado não pode ser invalidado. Uma versão futura poderia adicionar um mapping `revokedCertificates` com controle de acesso restrito ao emissor original.

**Sem verificação de identidade do emissor**
Qualquer endereço Ethereum pode registrar certificados sob qualquer nome de instituição. O contrato registra quem o chamou (via `msg.sender`), mas não há verificação on-chain de que `0xABC...` é de fato a "Universidade Federal X". Uma versão futura poderia implementar um sistema de identidade institucional baseado em ENS ou assinaturas.

**Determinismo do hash exige entradas exatas**
A função `generateCertHash` normaliza as entradas (trim + lowercase), mas o campo de data não é reformatado. Se um usuário digitar "01/01/2025" e depois "1/1/2025", os hashes serão diferentes. Uma normalização de data mais rigorosa ou um seletor de data com saída de formato fixo evitaria isso.

**Sem integração com IPFS**
O documento original (PDF, imagem) não é armazenado em nenhum lugar na implementação atual. Adicionar armazenamento IPFS para o documento original e referenciar seu CID no contrato permitiria a recuperação completa do documento juntamente com a verificação do hash.

**Confiabilidade do fallback RPC público**
O fluxo de verificação recorre a um endpoint RPC público quando o MetaMask não está disponível. Nós RPC públicos podem ter limites de taxa ou instabilidade. Uma chave dedicada Infura/Alchemy exposta como variável de ambiente Vite proporcionaria mais confiabilidade.

### Melhorias Potenciais

- Emissão com múltiplas assinaturas (exigir N de M assinantes da instituição)
- Templates de certificado com padrões de metadados on-chain (similar ao esquema URI do ERC-1155)
- Resolução de domínio ENS para identidade institucional
- Armazenamento de documentos fixados no IPFS com CID armazenado on-chain
- Emissão em lote de certificados para eficiência de gas
- Feed de certificados baseado em eventos no frontend