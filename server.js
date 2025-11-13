import http from 'http';
import url from 'url';
import path from 'path';
import fs from 'fs';
import * as blockchain from './blockchain.js';

const PORT = 8080;
const PUBLIC_DIR = path.join(process.cwd(), 'public');

// MIME types para arquivos estáticos
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

/**
 * Servir arquivo estático
 */
function serveStaticFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Arquivo não encontrado');
            return;
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

/**
 * Parse do corpo da requisição
 */
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(e);
            }
        });
        req.on('error', reject);
    });
}

/**
 * Enviar resposta JSON
 */
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

/**
 * Tratar rotas da API
 */
async function handleAPI(req, res, pathname, query) {
    try {
        // GET /assets - Retorna todos os ativos
        if (pathname === '/assets' && req.method === 'GET') {
            const assets = await blockchain.getAllAssets();
            sendJSON(res, 200, { success: true, data: assets });
            return;
        }

        // GET /asset?id=id - Retorna um ativo específico
        if (pathname === '/asset' && req.method === 'GET') {
            const id = query.id;
            if (!id) {
                sendJSON(res, 400, { success: false, error: 'ID do ativo é obrigatório' });
                return;
            }
            const asset = await blockchain.getAssetById(id);
            sendJSON(res, 200, { success: true, data: asset });
            return;
        }

        // GET /history?id=id - Retorna histórico de um ativo
        if (pathname === '/history' && req.method === 'GET') {
            const id = query.id;
            if (!id) {
                sendJSON(res, 400, { success: false, error: 'ID do ativo é obrigatório' });
                return;
            }
            const history = await blockchain.getAssetHistory(id);
            sendJSON(res, 200, { success: true, data: history });
            return;
        }

        // POST /create - Cria um novo ativo
        if (pathname === '/create' && req.method === 'POST') {
            const body = await parseBody(req);
            const { id, nome, descricao, responsavel, local, valor, status } = body;

            if (!id || !nome || !descricao || !responsavel || !local || !valor || !status) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'Todos os campos são obrigatórios: id, nome, descricao, responsavel, local, valor, status' 
                });
                return;
            }

            const asset = {
                id,
                nome,
                descricao,
                responsavel,
                local,
                valor: parseFloat(valor),
                status
            };

            const result = await blockchain.createAsset(asset);
            sendJSON(res, 201, { success: true, data: result });
            return;
        }

        // POST /update - Atualiza um ativo existente
        if (pathname === '/update' && req.method === 'POST') {
            const body = await parseBody(req);
            const { id, nome, descricao, responsavel, local, valor, status } = body;

            if (!id) {
                sendJSON(res, 400, { success: false, error: 'ID do ativo é obrigatório' });
                return;
            }

            const asset = {};
            if (id) asset.id = id;
            if (nome) asset.nome = nome;
            if (descricao) asset.descricao = descricao;
            if (responsavel) asset.responsavel = responsavel;
            if (local) asset.local = local;
            if (valor) asset.valor = parseFloat(valor);
            if (status) asset.status = status;

            const result = await blockchain.updateAsset(asset);
            sendJSON(res, 200, { success: true, data: result });
            return;
        }

        // POST /transfer - Transfere um ativo
        if (pathname === '/transfer' && req.method === 'POST') {
            const body = await parseBody(req);
            const { id, novoresponsavel } = body;

            if (!id || !novoresponsavel) {
                sendJSON(res, 400, { 
                    success: false, 
                    error: 'ID do ativo e novo responsável são obrigatórios' 
                });
                return;
            }

            const result = await blockchain.transferAsset(id, novoresponsavel);
            sendJSON(res, 200, { success: true, data: result });
            return;
        }

        // Rota não encontrada
        sendJSON(res, 404, { success: false, error: 'Rota não encontrada' });
    } catch (error) {
        console.error('Erro ao processar requisição:', error);
        sendJSON(res, 500, { 
            success: false, 
            error: error.message || 'Erro interno do servidor' 
        });
    }
}

/**
 * Servidor HTTP
 */
const server = http.createServer(async (req, res) => {
    // Habilitar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Tratar OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    // Rotas da API
    if (pathname.startsWith('/assets') || 
        pathname.startsWith('/asset') || 
        pathname.startsWith('/create') || 
        pathname.startsWith('/update') || 
        pathname.startsWith('/transfer') || 
        pathname.startsWith('/history')) {
        await handleAPI(req, res, pathname, query);
        return;
    }

    // Servir arquivos estáticos
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
    
    // Verificar se o arquivo existe
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Se não for arquivo, tentar index.html
            filePath = path.join(PUBLIC_DIR, 'index.html');
        }
        serveStaticFile(filePath, res);
    });
});

// Inicializar conexão com blockchain ao iniciar servidor
async function startServer() {
    try {
        console.log('Conectando à rede Hyperledger Fabric...');
        await blockchain.connect();
        console.log('Conexão estabelecida com sucesso!');
    } catch (error) {
        console.error('Erro ao conectar à blockchain:', error);
        console.log('Servidor iniciará mesmo sem conexão. Tente conectar novamente mais tarde.');
    }

    server.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}

// Tratar encerramento gracioso
process.on('SIGINT', async () => {
    console.log('\nEncerrando servidor...');
    await blockchain.disconnect();
    server.close(() => {
        console.log('Servidor encerrado.');
        process.exit(0);
    });
});

// Iniciar servidor
startServer();


