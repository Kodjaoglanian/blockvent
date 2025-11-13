# Sistema de Gestão de Patrimônio - Hyperledger Fabric

Aplicação Node.js completa para gerenciamento de patrimônio utilizando Hyperledger Fabric como blockchain subjacente.

## Características

- Servidor HTTP nativo do Node.js (sem Express)
- Integração completa com Hyperledger Fabric
- Interface web responsiva
- API REST para todas as operações de patrimônio
- Histórico completo de transações na blockchain

## Requisitos

- Node.js 14+ (com suporte a ES modules)
- Acesso à rede Hyperledger Fabric configurada
- Credenciais e arquivos de conexão da rede

## Instalação

1. Instale as dependências:
```bash
npm install
```

2. Certifique-se de que os caminhos dos arquivos de conexão estão corretos no arquivo `blockchain.js`:
   - Arquivo de conexão: `/root/hyperledger-fabric/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json`
   - Identidade do admin: `/root/hyperledger-fabric/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp`

## Execução

Inicie o servidor:
```bash
npm start
```

O servidor estará disponível em `http://localhost:8586`

## Endpoints da API

### GET /assets
Retorna todos os ativos registrados na blockchain.

### GET /asset?id={id}
Retorna um ativo específico pelo ID.

### POST /create
Cria um novo ativo. Body JSON:
```json
{
  "id": "string",
  "nome": "string",
  "descricao": "string",
  "responsavel": "string",
  "local": "string",
  "valor": number,
  "status": "string"
}
```

### POST /update
Atualiza um ativo existente. Body JSON (todos os campos são opcionais exceto id):
```json
{
  "id": "string",
  "nome": "string",
  "descricao": "string",
  "responsavel": "string",
  "local": "string",
  "valor": number,
  "status": "string"
}
```

### POST /transfer
Transfere um ativo para outro responsável. Body JSON:
```json
{
  "id": "string",
  "novoresponsavel": "string"
}
```

### GET /history?id={id}
Retorna o histórico completo de transações de um ativo.

## Estrutura do Projeto

```
blockvent/
├── server.js          # Servidor HTTP principal
├── blockchain.js      # Módulo de conexão com Fabric
├── package.json       # Dependências do projeto
├── public/           # Arquivos estáticos
│   ├── index.html    # Interface web principal
│   ├── script.js     # Lógica JavaScript do frontend
│   └── style.css     # Estilos CSS
└── wallet/           # Wallet local (criado automaticamente)
```

## Funcionalidades da Interface Web

- **Listar Ativos**: Visualiza todos os ativos registrados
- **Criar Ativo**: Adiciona novos ativos ao sistema
- **Buscar Ativo**: Localiza um ativo específico por ID
- **Atualizar Ativo**: Modifica informações de um ativo existente
- **Transferir Ativo**: Transfere a posse de um ativo
- **Histórico**: Visualiza todas as transações de um ativo

## Notas Importantes

- A aplicação cria automaticamente uma wallet local na primeira execução
- Todas as transações são registradas permanentemente na blockchain
- O servidor tenta conectar à blockchain na inicialização
- Em caso de erro de conexão, o servidor ainda inicia mas as operações falharão até a conexão ser estabelecida


