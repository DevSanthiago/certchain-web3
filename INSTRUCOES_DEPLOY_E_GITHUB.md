# 🚀 Instruções Finais: Deploy na Sepolia e Envio para o GitHub

O projeto **CertChain** foi completamente configurado, os smart contracts foram compilados, testados (8/8 testes passando) e o frontend está pronto.

Para finalizar o projeto para o hackathon, você precisa realizar algumas etapas manuais, já que elas exigem sua carteira (MetaMask) e sua conta do GitHub. Siga este passo a passo:

---

## Passo 1: Configurar Variáveis de Ambiente (.env)

O projeto precisa de acesso à rede Sepolia e à sua carteira para fazer o deploy do contrato.

1. No seu computador, abra o arquivo `certchain/.env` (renomeie de `.env.example` para `.env` se não existir).
2. Preencha as variáveis:
   - `SEPOLIA_RPC_URL`: Crie uma conta no [Infura](https://infura.io/) ou [Alchemy](https://www.alchemy.com/), crie um app e pegue a URL RPC da Sepolia.
   - `PRIVATE_KEY`: A chave privada da sua carteira MetaMask que tem fundos na Sepolia (NÃO use a chave de uma carteira com dinheiro real).
   - `ETHERSCAN_API_KEY`: Crie uma conta no [Etherscan](https://etherscan.io/) e gere uma API Key (para verificar o contrato).

*(Dica: Se precisar de Sepolia ETH, use o faucet https://sepoliafaucet.com)*

---

## Passo 2: Deploy do Smart Contract na Sepolia

Com o `.env` configurado, abra o terminal na pasta `certchain` e execute:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

O terminal exibirá algo como:
```
Deploying CertChain to Sepolia...
Deploying with account: 0xSuaCarteira...
CertChain deployed to: 0x1234567890abcdef...
```

**⚠️ MUITO IMPORTANTE:** Copie o endereço do contrato retornado (`0x123...`).

---

## Passo 3: Atualizar o Frontend e README com o Endereço

Agora você precisa conectar o frontend ao contrato recém-deployado.

1. Abra o arquivo `certchain/frontend/src/utils/contract.ts`
2. Substitua o valor da constante `CONTRACT_ADDRESS` pelo endereço que você copiou:
   ```typescript
   export const CONTRACT_ADDRESS = "0x1234567890abcdef...";
   ```

3. Abra o arquivo `certchain/README.md`
4. Substitua `0xSEU_ENDEREÇO_AQUI` pelo endereço do seu contrato nas seções "Contrato Deployado" e "Evidências de Funcionamento".

---

## Passo 4: Verificar o Contrato no Etherscan (Opcional, mas diferencial)

Para tornar o código do seu contrato público e verificável no Etherscan, execute:

```bash
npx hardhat verify --network sepolia ENDEREÇO_DO_SEU_CONTRATO
```
*(Substitua `ENDEREÇO_DO_SEU_CONTRATO` pelo endereço real).*

---

## Passo 5: Testar o Frontend Localmente

Para garantir que tudo está funcionando:

```bash
cd frontend
npm run dev
```

Acesse `http://localhost:5173` no navegador, conecte sua MetaMask, emita um certificado e tente verificá-lo.

---

## Passo 6: Enviar para o GitHub

O edital exige um repositório **público**.

1. Crie um novo repositório vazio no GitHub chamado `certchain` (público).
2. No terminal, na pasta raiz `certchain`, execute:

```bash
git init
git add .
git commit -m "feat: projeto CertChain completo (smart contract + frontend)"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/certchain.git
git push -u origin main
```

*(O arquivo `.gitignore` já está configurado para não enviar a pasta `node_modules` nem o arquivo `.env` com sua chave privada).*

---

## Passo 7: Gravar o Vídeo-pitch

Siga o roteiro sugerido no final do arquivo original:
- Apresente o problema e a solução (1 min)
- Faça a demo ao vivo: emita um certificado, copie o hash e verifique (2:30 min)
- Mostre a transação no Etherscan (1 min)
- Conclusão (30s)

Boa sorte no HackWeb Web 3.0! 🚀
