// ===== ROLETA FUNCIONAL COM GIRO E PARADA PROFISSIONAL =====

// Estados da roleta
const ESTADOS_ROLETA = {
    IDLE: 'idle',
    SPINNING: 'spinning',
    STOPPING: 'stopping',
    STOPPED: 'stopped'
};

// Estado do jogo
let gameState = {
    estadoRoleta: ESTADOS_ROLETA.IDLE,
    girosRestantes: 3,
    saldoAtual: 0,
    tempoInicioGiro: null,
    tempoMinimoGiro: 2000, // Mínimo 2 segundos antes de poder parar
    animationId: null,
    velocidadeAtual: 0,
    anguloAtual: 0,
    roletaElement: null,
    autoStopTimeout: null,
    anguloFinal: 0, // Ângulo onde a roleta deve parar
    desacelerando: false
};

// Elementos DOM
const elements = {
    btnGirar: null,
    btnParar: null,
    roleta: null,
    roletaPointer: null,
    toastContainer: null,
    resultadoModal: null,
    btnContinuar: null,
    premioValor: null,
    novoSaldo: null,
    girosCount: null,
    saldoAtual: null
};

// Configuração de prêmios com setores da roleta
const premiosPossiveis = [
    { valor: 0, texto: 'Tente novamente!', peso: 50, setor: 'cinza' },
    { valor: 25, texto: 'R$ 25,00', peso: 25, setor: 'dourado' },
    { valor: 50, texto: 'R$ 50,00', peso: 15, setor: 'vermelho' },
    { valor: 75, texto: 'R$ 75,00', peso: 10, setor: 'azul' }
];

// Mapeamento dos setores da roleta (8 setores de 45 graus cada)
const setoresRoleta = [
    { inicio: 0, fim: 45, cor: 'dourado', premio: premiosPossiveis[1] },      // 0-45°
    { inicio: 45, fim: 90, cor: 'cinza', premio: premiosPossiveis[0] },       // 45-90°
    { inicio: 90, fim: 135, cor: 'vermelho', premio: premiosPossiveis[2] },   // 90-135°
    { inicio: 135, fim: 180, cor: 'cinza', premio: premiosPossiveis[0] },     // 135-180°
    { inicio: 180, fim: 225, cor: 'azul', premio: premiosPossiveis[3] },      // 180-225°
    { inicio: 225, fim: 270, cor: 'cinza', premio: premiosPossiveis[0] },     // 225-270°
    { inicio: 270, fim: 315, cor: 'dourado', premio: premiosPossiveis[1] },   // 270-315°
    { inicio: 315, fim: 360, cor: 'cinza', premio: premiosPossiveis[0] }      // 315-360°
];

// ===== FUNÇÕES PRINCIPAIS =====

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎰 RoletaWin - Iniciando sistema profissional...');
    inicializarElementos();
    inicializarEventListeners();
    atualizarInterface();
    console.log('✅ Sistema inicializado com sucesso!');
});

// Inicializar elementos DOM
function inicializarElementos() {
    elements.btnGirar = document.getElementById('btn-girar');
    elements.btnParar = document.getElementById('btn-parar');
    elements.roleta = document.getElementById('roleta');
    elements.roletaPointer = document.getElementById('roleta-pointer');
    elements.toastContainer = document.getElementById('toast-container');
    elements.resultadoModal = document.getElementById('resultado-modal');
    elements.btnContinuar = document.getElementById('btn-continuar');
    elements.premioValor = document.getElementById('premio-valor');
    elements.novoSaldo = document.getElementById('novo-saldo');
    elements.girosCount = document.getElementById('giros-count');
    elements.saldoAtual = document.getElementById('saldo-atual');
    
    // Verificar se elementos essenciais existem
    if (!elements.btnGirar || !elements.roleta) {
        console.error('❌ Elementos essenciais não encontrados!');
        return;
    }
    
    console.log('✅ Elementos DOM inicializados');
}

// Event listeners
function inicializarEventListeners() {
    if (elements.btnGirar) {
        elements.btnGirar.addEventListener('click', iniciarGiro);
        console.log('✅ Event listener do botão GIRAR adicionado');
    }
    
    if (elements.btnParar) {
        elements.btnParar.addEventListener('click', pararGiro);
        console.log('✅ Event listener do botão PARAR adicionado');
    }
    
    if (elements.btnContinuar) {
        elements.btnContinuar.addEventListener('click', fecharModal);
    }
    
    // Fechar modal clicando fora
    if (elements.resultadoModal) {
        elements.resultadoModal.addEventListener('click', function(e) {
            if (e.target === elements.resultadoModal) {
                fecharModal();
            }
        });
    }
}

// Iniciar giro
function iniciarGiro() {
    console.log('🎯 Iniciando giro profissional...');
    
    if (gameState.estadoRoleta !== ESTADOS_ROLETA.IDLE || gameState.girosRestantes <= 0) {
        console.log('❌ Não é possível girar agora. Estado:', gameState.estadoRoleta, 'Giros:', gameState.girosRestantes);
        return;
    }
    
    // Calcular ângulo final baseado no prêmio sorteado
    const premioSorteado = sortearPremio();
    const setorEscolhido = encontrarSetorPorPremio(premioSorteado);
    gameState.anguloFinal = calcularAnguloFinal(setorEscolhido);
    
    console.log('🎲 Prêmio sorteado:', premioSorteado);
    console.log('🎯 Setor escolhido:', setorEscolhido);
    console.log('📐 Ângulo final calculado:', gameState.anguloFinal);
    
    // Atualizar estado
    gameState.estadoRoleta = ESTADOS_ROLETA.SPINNING;
    gameState.girosRestantes--;
    gameState.tempoInicioGiro = Date.now();
    gameState.velocidadeAtual = 20; // Velocidade inicial mais alta
    gameState.anguloAtual = 0;
    gameState.desacelerando = false;
    
    console.log('✅ Estado atualizado para SPINNING');
    
    // Atualizar interface - trocar botões
    if (elements.btnGirar && elements.btnParar) {
        elements.btnGirar.classList.add('hidden');
        elements.btnParar.classList.remove('hidden');
        elements.btnParar.disabled = true; // Desabilitado inicialmente
        elements.btnParar.innerHTML = '<i class="fas fa-clock"></i><span>AGUARDE...</span>';
        console.log('✅ Botões trocados - GIRAR oculto, PARAR visível');
    }
    
    // Adicionar efeitos visuais à roleta
    if (elements.roleta) {
        elements.roleta.classList.remove('parada', 'desacelerando');
        elements.roleta.classList.add('girando');
        console.log('✅ Efeitos visuais aplicados à roleta');
    }
    
    mostrarToast('🎰 A roleta está girando! Aguarde para poder parar...', 'info');
    
    // Iniciar animação da roleta
    iniciarAnimacaoRoleta();
    
    // Habilitar botão parar após tempo mínimo
    setTimeout(() => {
        if (gameState.estadoRoleta === ESTADOS_ROLETA.SPINNING) {
            elements.btnParar.disabled = false;
            elements.btnParar.innerHTML = '<i class="fas fa-stop"></i><span>PARAR</span>';
            mostrarToast('✋ Agora você pode parar a roleta!', 'success');
            console.log('✅ Botão PARAR habilitado');
        }
    }, gameState.tempoMinimoGiro);
    
    // Auto-parar após 10 segundos se o usuário não parar
    gameState.autoStopTimeout = setTimeout(() => {
        if (gameState.estadoRoleta === ESTADOS_ROLETA.SPINNING) {
            console.log('⏰ Auto-parando após 10 segundos');
            pararGiro();
        }
    }, 10000);
}

// Sortear prêmio baseado nas probabilidades
function sortearPremio() {
    const totalPeso = premiosPossiveis.reduce((total, premio) => total + premio.peso, 0);
    const random = Math.random() * totalPeso;
    
    let acumulado = 0;
    for (let i = 0; i < premiosPossiveis.length; i++) {
        acumulado += premiosPossiveis[i].peso;
        if (random <= acumulado) {
            return premiosPossiveis[i];
        }
    }
    
    // Fallback
    return premiosPossiveis[0];
}

// Encontrar setor correspondente ao prêmio
function encontrarSetorPorPremio(premio) {
    // Filtrar setores que correspondem ao prêmio
    const setoresValidos = setoresRoleta.filter(setor => 
        setor.premio.valor === premio.valor
    );
    
    // Escolher um setor aleatório entre os válidos
    const indiceAleatorio = Math.floor(Math.random() * setoresValidos.length);
    return setoresValidos[indiceAleatorio];
}

// Calcular ângulo final para parar no setor escolhido
function calcularAnguloFinal(setor) {
    // Escolher um ângulo aleatório dentro do setor
    const anguloNoSetor = setor.inicio + Math.random() * (setor.fim - setor.inicio);
    
    // Adicionar voltas completas para tornar o giro mais interessante
    const voltasCompletas = 3 + Math.random() * 2; // 3-5 voltas
    const anguloTotal = (voltasCompletas * 360) + anguloNoSetor;
    
    return anguloTotal;
}

// Animação contínua da roleta com efeito profissional
function iniciarAnimacaoRoleta() {
    console.log('🔄 Iniciando animação profissional da roleta');
    
    function animar() {
        if (gameState.estadoRoleta === ESTADOS_ROLETA.SPINNING || gameState.estadoRoleta === ESTADOS_ROLETA.STOPPING) {
            
            if (gameState.estadoRoleta === ESTADOS_ROLETA.STOPPING && !gameState.desacelerando) {
                // Iniciar desaceleração suave
                gameState.desacelerando = true;
                if (elements.roleta) {
                    elements.roleta.classList.remove('girando');
                    elements.roleta.classList.add('desacelerando');
                }
                console.log('🛑 Iniciando desaceleração suave');
            }
            
            // Calcular nova velocidade e ângulo
            if (gameState.desacelerando) {
                // Desaceleração suave até o ângulo final
                const distanciaRestante = gameState.anguloFinal - gameState.anguloAtual;
                
                if (Math.abs(distanciaRestante) < 5) {
                    // Muito próximo do final, parar
                    gameState.anguloAtual = gameState.anguloFinal;
                    finalizarGiro();
                    return;
                } else {
                    // Ajustar velocidade baseada na distância restante
                    gameState.velocidadeAtual = Math.max(0.5, distanciaRestante * 0.02);
                }
            }
            
            // Atualizar ângulo
            gameState.anguloAtual += gameState.velocidadeAtual;
            
            // Aplicar rotação
            if (elements.roleta) {
                elements.roleta.style.transform = `rotate(${gameState.anguloAtual}deg)`;
            }
            
            gameState.animationId = requestAnimationFrame(animar);
        }
    }
    
    gameState.animationId = requestAnimationFrame(animar);
}

// Parar giro (chamado pelo botão)
function pararGiro() {
    console.log('🛑 Parando giro...');
    
    if (gameState.estadoRoleta !== ESTADOS_ROLETA.SPINNING) {
        console.log('❌ Não é possível parar agora. Estado:', gameState.estadoRoleta);
        return;
    }
    
    // Limpar o timeout de auto-parada se o usuário parar manualmente
    if (gameState.autoStopTimeout) {
        clearTimeout(gameState.autoStopTimeout);
        gameState.autoStopTimeout = null;
    }

    gameState.estadoRoleta = ESTADOS_ROLETA.STOPPING;
    
    // Atualizar botão
    if (elements.btnParar) {
        elements.btnParar.disabled = true;
        elements.btnParar.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>PARANDO...</span>';
    }
    
    mostrarToast('⏳ Parando a roleta...', 'warning');
    console.log('✅ Estado alterado para STOPPING');
}

// Finalizar giro
function finalizarGiro() {
    console.log('🏁 Finalizando giro...');
    
    gameState.estadoRoleta = ESTADOS_ROLETA.STOPPED;
    
    // Parar animação
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
        gameState.animationId = null;
        console.log('✅ Animação parada');
    }
    
    // Remover efeitos visuais da roleta
    if (elements.roleta) {
        elements.roleta.classList.remove('girando', 'desacelerando');
        elements.roleta.classList.add('parada');
    }
    
    // Animar seta indicadora
    if (elements.roletaPointer) {
        elements.roletaPointer.classList.add('resultado');
        setTimeout(() => {
            elements.roletaPointer.classList.remove('resultado');
        }, 2000);
    }
    
    // Calcular resultado baseado no ângulo final
    const premio = calcularPremioFinal();
    console.log('🎁 Prêmio final calculado:', premio);
    
    // Atualizar saldo
    gameState.saldoAtual += premio.valor;
    
    // Mostrar resultado
    setTimeout(() => {
        mostrarResultado(premio);
        
        // Resetar botões após um tempo
        setTimeout(() => {
            resetarBotoes();
        }, 1000);
    }, 800);
}

// Calcular prêmio baseado no ângulo final da roleta
function calcularPremioFinal() {
    // Normalizar ângulo para 0-360
    const anguloNormalizado = gameState.anguloAtual % 360;
    console.log('📐 Ângulo final normalizado:', anguloNormalizado);
    
    // Encontrar o setor correspondente
    for (let setor of setoresRoleta) {
        if (anguloNormalizado >= setor.inicio && anguloNormalizado < setor.fim) {
            console.log('🎯 Setor encontrado:', setor);
            return setor.premio;
        }
    }
    
    // Fallback para o último setor (360°)
    return setoresRoleta[setoresRoleta.length - 1].premio;
}

// Mostrar resultado
function mostrarResultado(premio) {
    console.log('🎉 Mostrando resultado:', premio);
    
    if (!elements.resultadoModal) {
        console.error('❌ Modal de resultado não encontrado');
        return;
    }
    
    // Atualizar conteúdo do modal
    if (elements.premioValor) {
        elements.premioValor.textContent = premio.texto;
    }
    
    if (elements.novoSaldo) {
        elements.novoSaldo.textContent = gameState.saldoAtual.toFixed(2);
    }
    
    // Atualizar título e descrição baseado no prêmio
    const titulo = document.getElementById('resultado-titulo');
    const descricao = document.getElementById('resultado-descricao');
    const icon = document.getElementById('resultado-icon');
    
    if (premio.valor > 0) {
        if (titulo) titulo.textContent = 'Parabéns! 🎉';
        if (descricao) descricao.textContent = 'Você ganhou um prêmio!';
        if (icon) icon.innerHTML = '<i class="fas fa-trophy"></i>';
        
        // Efeitos de vitória
        criarConfetes();
        mostrarToast(`🏆 Parabéns! Você ganhou ${premio.texto}!`, 'success');
    } else {
        if (titulo) titulo.textContent = 'Que pena! 😔';
        if (descricao) descricao.textContent = 'Não foi desta vez, mas continue tentando!';
        if (icon) icon.innerHTML = '<i class="fas fa-heart-broken"></i>';
        
        mostrarToast('😔 Não foi desta vez! Tente novamente.', 'warning');
    }
    
    // Mostrar modal
    elements.resultadoModal.classList.remove('hidden');
    
    // Atualizar interface
    atualizarInterface();
    console.log('✅ Modal de resultado exibido');
}

// Fechar modal
function fecharModal() {
    console.log('❌ Fechando modal');
    
    if (elements.resultadoModal) {
        elements.resultadoModal.classList.add('hidden');
    }
    
    // Verificar se ainda há giros
    if (gameState.girosRestantes <= 0) {
        mostrarMensagemSemGiros();
    } else {
        gameState.estadoRoleta = ESTADOS_ROLETA.IDLE;
        console.log('✅ Estado resetado para IDLE');
    }
}

// Resetar botões
function resetarBotoes() {
    console.log('🔄 Resetando botões');
    
    if (elements.btnGirar && elements.btnParar) {
        elements.btnGirar.classList.remove('hidden');
        elements.btnParar.classList.add('hidden');
        elements.btnGirar.disabled = false;
        elements.btnGirar.innerHTML = '<i class="fas fa-play"></i><span>GIRAR</span><div class="btn-bg"></div>';
        elements.btnParar.disabled = false;
        elements.btnParar.innerHTML = '<i class="fas fa-stop"></i><span>PARAR</span><div class="btn-bg"></div>';
        console.log('✅ Botões resetados');
    }
}

// Mostrar mensagem quando não há mais giros
function mostrarMensagemSemGiros() {
    console.log('🚫 Giros esgotados');
    
    const girosSection = document.getElementById('giros-gratis-info');
    if (!girosSection) return;
    
    girosSection.innerHTML = `
        <div class="mensagem-sem-giros" style="text-align: center; padding: 2rem;">
            <div class="sem-giros-icon" style="font-size: 3rem; color: #ff6b6b; margin-bottom: 1rem;">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3 class="sem-giros-titulo" style="color: #ffffff; margin-bottom: 1rem;">Giros Grátis Esgotados</h3>
            <p class="sem-giros-descricao" style="color: #cccccc; margin-bottom: 2rem;">
                Você utilizou todos os seus giros grátis! 
                Faça um depósito para continuar jogando nas mesas premium.
            </p>
            <button class="btn-depositar" onclick="window.location.href='#depositar'" style="
                background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
                color: #0a0e27;
                border: none;
                padding: 1rem 2rem;
                border-radius: 12px;
                font-weight: 700;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin: 0 auto;
                box-shadow: 0 8px 32px rgba(255, 215, 0, 0.3);
            ">
                <i class="fas fa-credit-card"></i>
                <span>Fazer Depósito</span>
            </button>
        </div>
    `;
    
    mostrarToast('🚫 Giros grátis esgotados! Faça um depósito para continuar.', 'warning');
}

// Atualizar interface
function atualizarInterface() {
    // Atualizar saldo
    if (elements.saldoAtual) {
        elements.saldoAtual.textContent = gameState.saldoAtual.toFixed(2);
    }
    
    // Atualizar contador de giros
    if (elements.girosCount) {
        elements.girosCount.textContent = gameState.girosRestantes;
    }
    
    // Atualizar contador no modal
    const girosRestantesModal = document.getElementById('giros-restantes-count');
    if (girosRestantesModal) {
        girosRestantesModal.textContent = gameState.girosRestantes;
    }
    
    // Mostrar/ocultar informações de giros
    const girosInfo = document.getElementById('giros-info');
    if (girosInfo) {
        if (gameState.girosRestantes > 0) {
            girosInfo.style.display = 'block';
        } else {
            girosInfo.style.display = 'none';
        }
    }
}

// ===== FUNÇÕES DE EFEITOS VISUAIS =====

// Criar confetes
function criarConfetes() {
    console.log('🎊 Criando confetes');
    
    const particlesBg = document.getElementById('particles-bg');
    if (!particlesBg) return;
    
    for (let i = 0; i < 50; i++) {
        const confete = document.createElement('div');
        const cores = ['#ffd700', '#ff6b6b', '#4ecdc4', '#9b59b6', '#ff9f43', '#00ff88'];
        
        confete.style.cssText = `
            position: absolute;
            width: ${Math.random() * 10 + 6}px;
            height: ${Math.random() * 10 + 6}px;
            background: ${cores[Math.floor(Math.random() * cores.length)]};
            left: ${Math.random() * 100}%;
            top: -10px;
            pointer-events: none;
            animation: confeteFall ${3 + Math.random() * 4}s ease-out forwards;
            animation-delay: ${Math.random() * 2}s;
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            z-index: 1500;
        `;
        
        particlesBg.appendChild(confete);
    }
    
    // Limpar confetes após animação
    setTimeout(() => {
        const confetes = particlesBg.querySelectorAll('div');
        confetes.forEach(confete => {
            if (confete.style.animation.includes('confeteFall')) {
                confete.remove();
            }
        });
    }, 8000);
}

// Toast notifications
function mostrarToast(mensagem, tipo = 'info') {
    if (!elements.toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = mensagem;
    
    const estilos = {
        success: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
        error: 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)',
        warning: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
        info: 'linear-gradient(135deg, #4ecdc4 0%, #26a69a 100%)'
    };
    
    toast.style.background = estilos[tipo] || estilos.info;
    toast.style.color = tipo === 'warning' ? '#0a0e27' : '#ffffff';
    
    elements.toastContainer.appendChild(toast);
    
    // Animar entrada
    setTimeout(() => toast.style.transform = 'translateX(0)', 100);
    
    // Remover após 4 segundos
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ===== FUNÇÕES DE DEBUG =====

// Função para debug (pode ser chamada no console)
window.debugRoleta = function() {
    console.log('🔍 Estado atual da roleta:', {
        estado: gameState.estadoRoleta,
        giros: gameState.girosRestantes,
        saldo: gameState.saldoAtual,
        angulo: gameState.anguloAtual,
        anguloFinal: gameState.anguloFinal,
        velocidade: gameState.velocidadeAtual,
        desacelerando: gameState.desacelerando
    });
    
    console.log('🎯 Setores da roleta:', setoresRoleta);
};

// Log de inicialização
console.log('🎰 RoletaWin - Script profissional carregado com sucesso!');
console.log('💡 Use debugRoleta() no console para ver o estado atual');

