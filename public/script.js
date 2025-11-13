// Função para alternar entre tabs
function showTab(tabName) {
    // Esconder todas as tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Remover active de todos os botões
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Mostrar tab selecionada
    document.getElementById(tabName).classList.add('active');
    
    // Ativar botão correspondente
    event.target.classList.add('active');
}

// Função auxiliar para fazer requisições
async function fazerRequisicao(url, method = 'GET', body = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro na requisição:', error);
        return { success: false, error: error.message };
    }
}

// Carregar todos os ativos
async function carregarTodosAtivos() {
    const resultado = document.getElementById('listaAtivos');
    resultado.innerHTML = '<p class="info">Carregando ativos...</p>';

    const response = await fazerRequisicao('/assets');
    
    if (response.success && response.data) {
        if (Array.isArray(response.data) && response.data.length > 0) {
            let html = '<div class="assets-grid">';
            response.data.forEach(asset => {
                html += `
                    <div class="asset-card">
                        <h3>${asset.nome || asset.ID || 'Sem nome'}</h3>
                        <p><strong>ID:</strong> ${asset.id || asset.ID}</p>
                        <p><strong>Descrição:</strong> ${asset.descricao || 'N/A'}</p>
                        <p><strong>Responsável:</strong> ${asset.responsavel || 'N/A'}</p>
                        <p><strong>Local:</strong> ${asset.local || 'N/A'}</p>
                        <p><strong>Valor:</strong> R$ ${parseFloat(asset.valor || 0).toFixed(2)}</p>
                        <p><strong>Status:</strong> ${asset.status || 'N/A'}</p>
                    </div>
                `;
            });
            html += '</div>';
            resultado.innerHTML = html;
        } else {
            resultado.innerHTML = '<p class="info">Nenhum ativo encontrado.</p>';
        }
    } else {
        resultado.innerHTML = `<p class="error">Erro: ${response.error || 'Erro desconhecido'}</p>`;
    }
}

// Criar novo ativo
async function criarAtivo(event) {
    event.preventDefault();
    const resultado = document.getElementById('resultadoCriar');
    resultado.innerHTML = '<p class="info">Processando transação...</p>';

    const asset = {
        id: document.getElementById('criarId').value,
        nome: document.getElementById('criarNome').value,
        descricao: document.getElementById('criarDescricao').value,
        responsavel: document.getElementById('criarResponsavel').value,
        local: document.getElementById('criarLocal').value,
        valor: document.getElementById('criarValor').value,
        status: document.getElementById('criarStatus').value
    };

    const response = await fazerRequisicao('/create', 'POST', asset);

    if (response.success) {
        resultado.innerHTML = '<p class="success">Ativo criado com sucesso! Transação registrada na blockchain.</p>';
        document.getElementById('formCriar').reset();
    } else {
        resultado.innerHTML = `<p class="error">Erro: ${response.error || 'Erro desconhecido'}</p>`;
    }
}

// Buscar ativo por ID
async function buscarAtivo() {
    const id = document.getElementById('buscarId').value;
    const resultado = document.getElementById('resultadoBuscar');

    if (!id) {
        resultado.innerHTML = '<p class="error">Por favor, digite um ID.</p>';
        return;
    }

    resultado.innerHTML = '<p class="info">Buscando ativo...</p>';

    const response = await fazerRequisicao(`/asset?id=${encodeURIComponent(id)}`);

    if (response.success && response.data) {
        const asset = response.data;
        resultado.innerHTML = `
            <div class="asset-detail">
                <h3>${asset.nome || 'Sem nome'}</h3>
                <p><strong>ID:</strong> ${asset.id || asset.ID}</p>
                <p><strong>Descrição:</strong> ${asset.descricao || 'N/A'}</p>
                <p><strong>Responsável:</strong> ${asset.responsavel || 'N/A'}</p>
                <p><strong>Local:</strong> ${asset.local || 'N/A'}</p>
                <p><strong>Valor:</strong> R$ ${parseFloat(asset.valor || 0).toFixed(2)}</p>
                <p><strong>Status:</strong> ${asset.status || 'N/A'}</p>
            </div>
        `;
    } else {
        resultado.innerHTML = `<p class="error">Erro: ${response.error || 'Ativo não encontrado'}</p>`;
    }
}

// Atualizar ativo
async function atualizarAtivo(event) {
    event.preventDefault();
    const resultado = document.getElementById('resultadoAtualizar');
    resultado.innerHTML = '<p class="info">Processando atualização...</p>';

    const asset = {
        id: document.getElementById('atualizarId').value
    };

    const nome = document.getElementById('atualizarNome').value;
    const descricao = document.getElementById('atualizarDescricao').value;
    const responsavel = document.getElementById('atualizarResponsavel').value;
    const local = document.getElementById('atualizarLocal').value;
    const valor = document.getElementById('atualizarValor').value;
    const status = document.getElementById('atualizarStatus').value;

    if (nome) asset.nome = nome;
    if (descricao) asset.descricao = descricao;
    if (responsavel) asset.responsavel = responsavel;
    if (local) asset.local = local;
    if (valor) asset.valor = valor;
    if (status) asset.status = status;

    const response = await fazerRequisicao('/update', 'POST', asset);

    if (response.success) {
        resultado.innerHTML = '<p class="success">Ativo atualizado com sucesso! Transação registrada na blockchain.</p>';
        document.getElementById('formAtualizar').reset();
    } else {
        resultado.innerHTML = `<p class="error">Erro: ${response.error || 'Erro desconhecido'}</p>`;
    }
}

// Transferir ativo
async function transferirAtivo(event) {
    event.preventDefault();
    const resultado = document.getElementById('resultadoTransferir');
    resultado.innerHTML = '<p class="info">Processando transferência...</p>';

    const id = document.getElementById('transferirId').value;
    const novoresponsavel = document.getElementById('transferirResponsavel').value;

    const response = await fazerRequisicao('/transfer', 'POST', { id, novoresponsavel });

    if (response.success) {
        resultado.innerHTML = '<p class="success">Ativo transferido com sucesso! Propriedade atualizada na blockchain.</p>';
        document.getElementById('formTransferir').reset();
    } else {
        resultado.innerHTML = `<p class="error">Erro: ${response.error || 'Erro desconhecido'}</p>`;
    }
}

// Buscar histórico
async function buscarHistorico() {
    const id = document.getElementById('historicoId').value;
    const resultado = document.getElementById('resultadoHistorico');

    if (!id) {
        resultado.innerHTML = '<p class="error">Por favor, digite um ID.</p>';
        return;
    }

    resultado.innerHTML = '<p class="info">Carregando histórico...</p>';

    const response = await fazerRequisicao(`/history?id=${encodeURIComponent(id)}`);

    if (response.success && response.data) {
        const history = Array.isArray(response.data) ? response.data : [response.data];
        
        if (history.length > 0) {
            let html = '<div class="history-list">';
            history.forEach((item, index) => {
                html += `
                    <div class="history-item">
                        <h4>Transação ${index + 1}</h4>
                        <pre>${JSON.stringify(item, null, 2)}</pre>
                    </div>
                `;
            });
            html += '</div>';
            resultado.innerHTML = html;
        } else {
            resultado.innerHTML = '<p class="info">Nenhum histórico encontrado.</p>';
        }
    } else {
        resultado.innerHTML = `<p class="error">Erro: ${response.error || 'Histórico não encontrado'}</p>`;
    }
}


