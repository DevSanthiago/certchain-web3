# CertChain — Documento de Segurança

> Análise de segurança do MVP CertChain — HackWeb Web 3.0 · Residência em TIC 29 · Desafio 1

---

## Sumário

1. [Modelo de Ameaças](#1-modelo-de-ameaças)
2. [Segurança do Smart Contract](#2-segurança-do-smart-contract)
3. [Segurança do Frontend](#3-segurança-do-frontend)
4. [Segurança da Integração com Carteira](#4-segurança-da-integração-com-carteira)
5. [Gestão de Chaves e Segredos](#5-gestão-de-chaves-e-segredos)
6. [Integridade dos Dados](#6-integridade-dos-dados)
7. [Superfície de Ataque e Mitigações](#7-superfície-de-ataque-e-mitigações)
8. [Limitações de Segurança do MVP](#8-limitações-de-segurança-do-mvp)
9. [Recomendações para Produção](#9-recomendações-para-produção)

---

## 1. Modelo de Ameaças

### 1.1 Atores

| Ator | Descrição | Nível de Confiança |
|---|---|---|
| Emissor legítimo | Instituição ou pessoa que registra certificados via MetaMask | Médio — identidade não verificada on-chain |
| Verificador | Qualquer pessoa que consulta a autenticidade de um certificado | Nenhum — acesso público de leitura |
| Atacante externo | Tenta falsificar certificados, adulterar registros ou explorar o contrato | Zero |
| Atacante interno | Emissor legítimo tentando sobrescrever ou apagar registros de terceiros | Mitigado por design |

### 1.2 Ativos a Proteger

- Imutabilidade dos registros on-chain
- Confidencialidade da chave privada do deployer
- Integridade do hash SHA-256 gerado no frontend
- Confiabilidade do fluxo de verificação pública

### 1.3 Fora do Escopo deste Documento

- Segurança da rede Ethereum em si (protocolo de consenso, validadores)
- Segurança da extensão MetaMask
- Segurança da infraestrutura da Vercel e Alchemy

---

## 2. Segurança do Smart Contract

### 2.1 Proteção contra Reentrada

O contrato `CertChain.sol` **não é vulnerável a ataques de reentrada** pelos seguintes motivos:

- Não há transferências de ETH em nenhuma função
- Não há chamadas externas para outros contratos
- O padrão checks-effects-interactions é seguido naturalmente: a validação via `require` ocorre antes de qualquer alteração de estado

```solidity
// Verificação ANTES de qualquer escrita de estado
require(!certificates[certHash].exists, "CertChain: certificate already registered");
require(bytes(studentName).length > 0, "CertChain: student name required");

// Escrita de estado APÓS todas as verificações
certificates[certHash] = Certificate({ ... });
issuedBy[msg.sender].push(certHash);
```

### 2.2 Proteção contra Sobrescrita de Dados

A guarda `exists` impede que qualquer endereço sobrescreva um certificado já registrado:

```solidity
require(!certificates[certHash].exists, "CertChain: certificate already registered");
```

Uma vez que um hash é registrado, seus dados associados são permanentes. Nem o deployer, nem o emissor original, nem nenhum outro endereço pode modificar ou deletar o registro.

### 2.3 Ausência de Funções Destrutivas

O contrato não implementa:

- `selfdestruct` — o contrato não pode ser destruído
- Funções de deleção de dados — registros não podem ser removidos
- Funções de atualização de dados — metadados registrados são imutáveis
- Padrão de proxy — não há mecanismo de atualização da lógica do contrato

### 2.4 Ausência de Overflow/Underflow

O contrato usa Solidity `^0.8.20`, que inclui verificações aritméticas nativas contra overflow e underflow desde a versão 0.8.0. Não há operações matemáticas críticas no contrato além do `push` no array de hashes.

### 2.5 Ausência de Loops com Gas Ilimitado

Nenhuma função do contrato itera sobre arrays de tamanho indefinido em operações de escrita. O `push` no array `issuedBy` é O(1). As funções de leitura (`getCertificatesByIssuer`) retornam o array completo, mas como são `view`, não há risco de DoS por limite de gas em operações de escrita.

### 2.6 Visibilidade dos Mappings

Ambos os mappings são declarados como `private`:

```solidity
mapping(bytes32 => Certificate) private certificates;
mapping(address => bytes32[])   private issuedBy;
```

`private` em Solidity impede que outros contratos acessem os dados diretamente. Os dados ainda são tecnicamente legíveis na blockchain por qualquer nó, mas não podem ser manipulados por contratos externos.

### 2.7 Validação de Entradas

O contrato valida três campos obrigatórios na função `registerCertificate`:

```solidity
require(bytes(studentName).length > 0, "CertChain: student name required");
require(bytes(courseName).length > 0,  "CertChain: course name required");
require(bytes(institution).length > 0, "CertChain: institution required");
```

`completionDate` não é validado no contrato — a validação de formato é responsabilidade do frontend, o que é uma limitação conhecida documentada na seção 8.

---

## 3. Segurança do Frontend

### 3.1 Sem Armazenamento de Dados Sensíveis

O frontend não armazena nenhum dado sensível:

- Nenhuma chave privada é manipulada pelo código da aplicação
- Nenhum dado de certificado é persistido em `localStorage` ou `sessionStorage`
- O estado da carteira (`address`, `signer`) existe apenas em memória durante a sessão React

### 3.2 ABI Mínima

O `CONTRACT_ABI` em `contract.ts` declara apenas as funções e eventos necessários para o funcionamento da aplicação:

```typescript
export const CONTRACT_ABI = [
  "function registerCertificate(...) external",
  "function verifyCertificate(...) external view returns (...)",
  "function getCertificatesByIssuer(...) external view returns (bytes32[])",
  "function getCertificateCount(...) external view returns (uint256)",
  "event CertificateRegistered(...)"
];
```

Expor uma ABI mínima reduz a superfície de ataque e impede que o frontend invoque funções não intencionais caso o contrato fosse atualizado com funções adicionais.

### 3.3 Normalização de Entradas no Hash

A função `generateCertHash` normaliza todas as entradas antes de gerar o hash:

```typescript
const payload = JSON.stringify({
  studentName:    data.studentName.trim().toLowerCase(),
  courseName:     data.courseName.trim().toLowerCase(),
  institution:    data.institution.trim().toLowerCase(),
  completionDate: data.completionDate.trim(),
});
```

Isso previne ataques de manipulação de hash por espaços em branco ou variações de capitalização, garantindo que o mesmo certificado sempre produza o mesmo hash independentemente de pequenas variações de digitação.

### 3.4 Sem Backend Próprio

A ausência de um servidor backend elimina toda uma classe de vetores de ataque: injeção de SQL, vulnerabilidades de autenticação de API, exposição de credenciais de banco de dados, e ataques SSRF. A lógica de negócio reside inteiramente no smart contract.

---

## 4. Segurança da Integração com Carteira

### 4.1 Verificação de Rede

O hook `useWallet` verifica e força a troca para a rede Sepolia antes de qualquer operação:

```typescript
const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111

if (chainId !== SEPOLIA_CHAIN_ID) {
  await window.ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: SEPOLIA_CHAIN_ID }],
  });
}
```

Isso impede que o usuário assine transações acidentalmente na mainnet Ethereum ou em outras redes, o que poderia resultar em perda de fundos reais.

### 4.2 Listeners de Mudança de Conta e Rede

```typescript
window.ethereum.on("accountsChanged", handler);
window.ethereum.on("chainChanged", handler);
```

Ambos os eventos acionam uma desconexão completa da aplicação. Isso garante que, se o usuário trocar de conta ou rede no MetaMask enquanto a aplicação está aberta, ela não continuará operando com credenciais desatualizadas ou na rede errada.

### 4.3 Limpeza de Listeners

```typescript
return () => {
  window.ethereum.removeListener("accountsChanged", handler);
  window.ethereum.removeListener("chainChanged", handler);
};
```

Os listeners são removidos quando o componente desmonta, prevenindo vazamentos de memória e comportamentos inesperados após o usuário navegar para fora da aplicação.

### 4.4 Verificação sem Carteira

O fluxo de verificação usa `window.ethereum` como provider somente leitura quando disponível:

```typescript
const provider = window.ethereum
  ? new ethers.BrowserProvider(window.ethereum)
  : new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
```

Isso elimina a necessidade de o verificador conectar sua carteira ou assinar qualquer coisa para consultar a blockchain — reduzindo a superfície de ataque para o caso de uso de verificação.

---

## 5. Gestão de Chaves e Segredos

### 5.1 Chave Privada do Deployer

A chave privada usada para o deploy do contrato é carregada exclusivamente via variável de ambiente:

```javascript
// hardhat.config.js
accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
```

**Nunca é:**
- Commitada no repositório
- Exposta no código-fonte do frontend
- Incluída no build de produção

O arquivo `.env` contendo a chave está listado no `.gitignore` da raiz do projeto.

### 5.2 Variáveis de Ambiente por Camada

| Segredo | Camada | Exposto no build? |
|---|---|---|
| `PRIVATE_KEY` | Hardhat (local) | Não |
| `SEPOLIA_RPC_URL` | Hardhat (local) | Não |
| `ETHERSCAN_API_KEY` | Hardhat (local) | Não |
| `VITE_SEPOLIA_RPC_URL` | Frontend (Vercel env) | Sim* |

*Variáveis prefixadas com `VITE_` são intencionalmente expostas no bundle do frontend pelo Vite. A chave Alchemy para leitura de dados públicos da blockchain não é um segredo crítico — não permite transações, apenas consultas.

### 5.3 .gitignore

```
.env
.env.local
frontend/.env
frontend/.env.local
```

Quatro variações de arquivos de ambiente são explicitamente ignoradas, cobrindo os padrões mais comuns de nomenclatura.

---

## 6. Integridade dos Dados

### 6.1 Garantia de Integridade On-Chain

Uma vez que um certificado é registrado, sua integridade é garantida pelo protocolo Ethereum:

- Nenhum nó pode alterar um bloco já confirmado sem invalidar toda a cadeia subsequente
- O `block.timestamp` registrado com cada certificado é imutável
- O endereço `issuedBy` (msg.sender) não pode ser falsificado — é derivado criptograficamente da assinatura da transação

### 6.2 Detecção de Adulteração

Se o documento original for adulterado após o registro, o hash gerado na verificação será diferente do hash on-chain:

```
Documento original → SHA-256 → 0xABC123... (registrado on-chain)
Documento adulterado → SHA-256 → 0xDEF456... (não encontrado on-chain → ❌ Inválido)
```

Qualquer alteração de 1 bit no documento original resulta em um hash completamente diferente (efeito avalanche do SHA-256), tornando a detecção de adulteração matematicamente garantida.

### 6.3 Transparência e Auditabilidade

Todos os registros de certificados emitem o evento `CertificateRegistered` com dois campos indexados (`certHash` e `issuedBy`). Isso significa que:

- Qualquer explorador de blocos (como o Etherscan) pode listar todos os certificados registrados
- Auditores externos podem verificar o histórico completo sem depender da aplicação CertChain
- É impossível registrar um certificado sem que o evento seja emitido e gravado permanentemente

---

## 7. Superfície de Ataque e Mitigações

| Vetor de Ataque | Descrição | Mitigação |
|---|---|---|
| Falsificação de certificado | Atacante cria PDF falso com dados modificados | Hash SHA-256 diferente → verificação falha |
| Sobrescrita de registro | Atacante tenta sobrescrever um hash existente | `require(!certificates[certHash].exists)` reverte a transação |
| Registro com identidade falsa | Atacante registra certificado se passando por uma instituição | `msg.sender` é registrado — identidade da carteira é rastreável no Etherscan |
| Manipulação de hash por espaços | Certificado emitido com "João " ≠ verificado com "João" | Normalização `trim()` no `generateCertHash` |
| Transação na rede errada | Usuário acidentalmente opera na mainnet | Verificação de `chainId` + switch automático para Sepolia |
| Exposição de chave privada | Chave privada do deployer comprometida via repositório | `.gitignore` + variável de ambiente local apenas |
| Ataque de reentrada | Contrato externo tenta reentrar durante execução | Sem chamadas externas + sem transferências ETH |
| DoS por gas | Loop infinito em função de escrita | Sem loops em funções de escrita |

---

## 8. Limitações de Segurança do MVP

As seguintes limitações são conhecidas e intencionais para o escopo do MVP:

**Sem verificação de identidade institucional on-chain**
Qualquer endereço Ethereum pode registrar certificados como qualquer instituição. O contrato registra o endereço (`msg.sender`), mas não verifica se aquele endereço realmente representa a instituição declarada no campo `institution`. Em produção, isso exigiria um registro de instituições autorizadas com controle de acesso.

**Sem revogação de certificados**
Uma vez emitido, um certificado não pode ser revogado ou marcado como inválido. Casos como cancelamento por plagiarismo ou erro no registro não têm solução na versão atual.

**Validação de data apenas no frontend**
O campo `completionDate` não é validado no contrato — apenas `trim()` é aplicado. Um valor inválido como "abc" seria aceito on-chain. A validação de formato está no frontend, que pode ser contornado por chamadas diretas ao contrato.

**Hash determinístico exige entradas idênticas**
Se o usuário emitir um certificado com "01/01/2025" e tentar verificar com "1/1/2025", os hashes serão diferentes. Não há normalização de data no algoritmo atual.

---

## 9. Recomendações para Produção

Caso o CertChain evolua para um ambiente de produção real, as seguintes medidas de segurança são recomendadas:

**Smart Contract**
- Implementar auditoria de segurança por empresa especializada antes do deploy em mainnet
- Adicionar controle de acesso baseado em roles (OpenZeppelin `AccessControl`) para restringir quem pode emitir certificados
- Implementar mecanismo de revogação com mapping `revokedCertificates`
- Adicionar validação de comprimento máximo para campos de string, prevenindo entradas excessivamente longas
- Considerar padrão de proxy transparente (OpenZeppelin `TransparentUpgradeableProxy`) para permitir correções de bugs

**Frontend**
- Implementar Content Security Policy (CSP) rigorosa no servidor de hospedagem
- Adicionar validação de formato de data no formulário de emissão
- Implementar rate limiting no lado do cliente para evitar spam de transações
- Adicionar confirmação explícita antes de enviar transações, exibindo os dados que serão registrados

**Infraestrutura**
- Rotacionar periodicamente as chaves de API do provedor RPC
- Utilizar múltiplos provedores RPC com fallback automático
- Configurar monitoramento de eventos do contrato para detectar atividade anômala
- Manter a carteira do deployer em hardware wallet (Ledger, Trezor) para operações de manutenção

---

*Este documento reflete o estado de segurança do MVP CertChain deployado na Sepolia Testnet para fins do HackWeb Web 3.0.*