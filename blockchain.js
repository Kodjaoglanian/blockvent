import { Gateway, Wallets } from 'fabric-network';
import * as path from 'path';
import * as fs from 'fs';

// Configurações da rede
const CONNECTION_PROFILE_PATH = '/root/hyperledger-fabric/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json';
const WALLET_PATH = path.join(process.cwd(), 'wallet');
const IDENTITY_PATH = '/root/hyperledger-fabric/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp';
const CHANNEL_NAME = 'mychannel';
const CHAINCODE_NAME = 'patrimonio';

let gateway = null;
let network = null;
let contract = null;

/**
 * Conecta à rede Hyperledger Fabric
 */
export async function connect() {
    try {
        // Criar wallet se não existir
        const wallet = await Wallets.newFileSystemWallet(WALLET_PATH);
        console.log(`Wallet path: ${WALLET_PATH}`);

        // Verificar se a identidade já existe na wallet
        const identity = await wallet.get('admin');
        if (!identity) {
            console.log('Carregando identidade do admin...');
            
            // Ler certificado e chave privada
            const certPath = '/root/hyperledger-fabric/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem';
            const keyPath = '/root/hyperledger-fabric/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/priv_sk';
            
            const cert = fs.readFileSync(certPath).toString();
            const key = fs.readFileSync(keyPath).toString();
            
            // Criar identidade
            const x509Identity = {
                credentials: {
                    certificate: cert,
                    privateKey: key,
                },
                mspId: 'Org1MSP',
                type: 'X.509',
            };
            
            await wallet.put('admin', x509Identity);
            console.log('Identidade do admin carregada na wallet');
        }

        // Ler perfil de conexão
        const connectionProfile = JSON.parse(fs.readFileSync(CONNECTION_PROFILE_PATH, 'utf8'));
        
        // Configurar gateway
        gateway = new Gateway();
        const connectionOptions = {
            wallet,
            identity: 'admin',
            discovery: { enabled: false, asLocalhost: false },
        };

        await gateway.connect(connectionProfile, connectionOptions);
        console.log('Conectado à rede Hyperledger Fabric');

        // Obter rede e contrato
        network = await gateway.getNetwork(CHANNEL_NAME);
        contract = network.getContract(CHAINCODE_NAME);
        console.log(`Conectado ao canal ${CHANNEL_NAME} e chaincode ${CHAINCODE_NAME}`);

        return { gateway, network, contract };
    } catch (error) {
        console.error('Erro ao conectar à rede:', error);
        throw error;
    }
}

/**
 * Desconecta da rede
 */
export async function disconnect() {
    if (gateway) {
        await gateway.disconnect();
        gateway = null;
        network = null;
        contract = null;
        console.log('Desconectado da rede');
    }
}

/**
 * Garante que há uma conexão ativa
 */
async function ensureConnection() {
    if (!contract) {
        await connect();
    }
}

/**
 * Retorna todos os ativos
 */
export async function getAllAssets() {
    try {
        await ensureConnection();
        const result = await contract.evaluateTransaction('GetAllAssets');
        const resultString = result.toString();
        if (!resultString || resultString.trim() === '') {
            return [];
        }
        try {
            return JSON.parse(resultString);
        } catch (parseError) {
            // Se não for JSON válido, retorna como string ou array vazio
            console.warn('Resposta não é JSON válido:', resultString);
            return resultString ? [resultString] : [];
        }
    } catch (error) {
        console.error('Erro ao buscar todos os ativos:', error);
        console.error('Detalhes do erro:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        // Mensagem mais clara sobre o possível problema
        if (error.message && error.message.includes('Query failed')) {
            const enhancedError = new Error('Função GetAllAssets não encontrada no chaincode. Verifique se o chaincode "patrimonio" possui esta função ou se o nome está correto.');
            enhancedError.originalError = error;
            throw enhancedError;
        }
        
        throw error;
    }
}

/**
 * Retorna um ativo específico por ID
 */
export async function getAssetById(id) {
    try {
        await ensureConnection();
        const result = await contract.evaluateTransaction('GetAsset', id);
        const resultString = result.toString();
        if (!resultString || resultString.trim() === '') {
            throw new Error('Ativo não encontrado');
        }
        try {
            return JSON.parse(resultString);
        } catch (parseError) {
            // Se não for JSON, retorna como objeto simples
            return { id: id, data: resultString };
        }
    } catch (error) {
        console.error(`Erro ao buscar ativo ${id}:`, error);
        console.error('Detalhes do erro:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw error;
    }
}

/**
 * Cria um novo ativo
 */
export async function createAsset(asset) {
    try {
        await ensureConnection();
        const assetJson = JSON.stringify(asset);
        const result = await contract.submitTransaction('CreateAsset', assetJson);
        return JSON.parse(result.toString());
    } catch (error) {
        console.error('Erro ao criar ativo:', error);
        throw error;
    }
}

/**
 * Atualiza um ativo existente
 */
export async function updateAsset(asset) {
    try {
        await ensureConnection();
        const assetJson = JSON.stringify(asset);
        const result = await contract.submitTransaction('UpdateAsset', assetJson);
        return JSON.parse(result.toString());
    } catch (error) {
        console.error('Erro ao atualizar ativo:', error);
        throw error;
    }
}

/**
 * Transfere um ativo para outro responsável
 */
export async function transferAsset(id, novoResponsavel) {
    try {
        await ensureConnection();
        const result = await contract.submitTransaction('TransferAsset', id, novoResponsavel);
        return JSON.parse(result.toString());
    } catch (error) {
        console.error(`Erro ao transferir ativo ${id}:`, error);
        throw error;
    }
}

/**
 * Retorna o histórico completo de um ativo
 */
export async function getAssetHistory(id) {
    try {
        await ensureConnection();
        const result = await contract.evaluateTransaction('GetAssetHistory', id);
        return JSON.parse(result.toString());
    } catch (error) {
        console.error(`Erro ao buscar histórico do ativo ${id}:`, error);
        throw error;
    }
}

