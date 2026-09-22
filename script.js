// ==========================================
// 1. GERADOR DE ÁUDIO SINTÉTICO (Sem MP3)
// ==========================================
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() { 
    if(!audioCtx) audioCtx = new AudioContext(); 
    if(audioCtx.state === 'suspended') audioCtx.resume(); 
}

function playTone(freq, type, duration, vol=0.1) {
    if(!audioCtx) return;
    const osc = audioCtx.createOscillator(); 
    const gain = audioCtx.createGain();
    osc.type = type; 
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain); 
    gain.connect(audioCtx.destination);
    osc.start(); 
    osc.stop(audioCtx.currentTime + duration);
}

function soundTick() { initAudio(); playTone(800, 'square', 0.05, 0.05); } 
function soundSuccess() { initAudio(); playTone(523.25, 'sine', 0.1, 0.2); setTimeout(()=>playTone(659.25, 'sine', 0.3, 0.2), 100); } 
function soundError() { initAudio(); playTone(150, 'sawtooth', 0.4, 0.2); } 
function soundMagic() { initAudio(); playTone(880, 'sine', 0.5, 0.1); setTimeout(()=>playTone(1760, 'sine', 0.5, 0.1), 150); }

// ==========================================
// 2. SISTEMA CENTRAL E BANCO DE DADOS
// ==========================================
let gameData = { teams: [], collections: {}, selectedCollectionKey: null, apiKey: "" };
let activeGame = { isRunning: false, remainingQuestions: [], currentQuestion: null, revealed: false, currentTeamIdx: -1 };
let timerInterval = null;
let timeLeft = 30;

// Dados de Exemplo Base
const defaultCollections = {
    "Pteridófitas (Nova Unidade)": [
        { text: "Qual é a fase dominante no ciclo de vida das Pteridófitas?", options: { A: "Gametófito (haploide)", B: "Esporófito (diploide)", C: "Prótalo" }, correct: "B" },
        { text: "O que são os soros encontrados na face inferior das samambaias?", options: { A: "Produtores de gametas", B: "Agrupamento de esporângios", C: "Nódulos de fixação" }, correct: "B" },
        { text: "Qual estrutura as Pteridófitas possuem que as Briófitas não têm?", options: { A: "Vasos condutores de seiva", B: "Sementes", C: "Flores e frutos" }, correct: "A" }
    ]
};

window.onload = function() {
    // Carrega dados salvos ou cria padrão
    if(localStorage.getItem('biomatch_v4')) {
        gameData = JSON.parse(localStorage.getItem('biomatch_v4'));
    } else { 
        gameData.collections = defaultCollections; 
        gameData.teams = [{name: "Equipe Alfa", score: 0}, {name: "Equipe Beta", score: 0}]; 
    }
    
    gameData.apiKey = ""; // O usuário deve inserir a chave pela aba de configurações na interface
    saveToStorage(); 
    
    // Atualiza a tela de configurações visualmente
    const keyInput = document.getElementById('api-key-input');
    if (keyInput) keyInput.value = gameData.apiKey;
    
    updateUI();
};

function saveToStorage() { 
    localStorage.setItem('biomatch_v4', JSON.stringify(gameData)); 
}

function switchTab(tabId) { 
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden')); 
    document.getElementById(tabId).classList.remove('hidden'); 
}

function saveApiKey() { 
    gameData.apiKey = document.getElementById('api-key-input').value.trim(); 
    saveToStorage(); 
    document.getElementById('api-status').classList.remove('hidden'); 
    setTimeout(()=>document.getElementById('api-status').classList.add('hidden'), 3000); 
}

// ==========================================
// 3. ATUALIZAÇÕES DE INTERFACE (UI)
// ==========================================
function updateUI() { 
    renderTeamsList(); 
    renderCollectionsList(); 
    renderGameSelects(); 
    renderScoreboard(); 
}

function renderTeamsList() { 
    document.getElementById('teams-list').innerHTML = gameData.teams.map((t, idx) => `<li class="flex justify-between items-center py-2"><span>${t.name}</span><button onclick="removeTeam(${idx})" class="text-xs text-red-400 bg-gray-800 px-2 py-1 rounded hover:bg-gray-700 transition-colors">Remover</button></li>`).join(''); 
}
function addTeam(e) { e.preventDefault(); gameData.teams.push({ name: document.getElementById('team-name-input').value, score: 0 }); document.getElementById('team-name-input').value = ""; saveToStorage(); updateUI(); }
function removeTeam(idx) { gameData.teams.splice(idx, 1); saveToStorage(); updateUI(); }

function renderCollectionsList() { document.getElementById('collections-list').innerHTML = Object.keys(gameData.collections).map(key => `<div onclick="selectCollection('${key}')" class="p-2 rounded bg-gray-800 hover:bg-gray-700 cursor-pointer flex justify-between text-sm mt-2 transition-colors"><span>${key}</span><button onclick="deleteCollection('${key}', event)" class="text-red-400 hover:text-red-300">🗑️</button></div>`).join(''); }
function addCollection(e) { e.preventDefault(); const name = document.getElementById('collection-name-input').value; gameData.collections[name] = []; document.getElementById('collection-name-input').value = ""; saveToStorage(); updateUI(); selectCollection(name); }
function deleteCollection(key, ev) { ev.stopPropagation(); delete gameData.collections[key]; saveToStorage(); updateUI(); selectCollection(null); }
function selectCollection(key) { gameData.selectedCollectionKey = key; document.getElementById('selected-collection-title').innerText = key || "Nenhuma"; if(key) { document.getElementById('form-add-question').classList.remove('hidden'); renderQuestionsPool(); } else document.getElementById('form-add-question').classList.add('hidden'); }

function renderQuestionsPool() { if(!gameData.selectedCollectionKey) return; document.getElementById('questions-pool-list').innerHTML = gameData.collections[gameData.selectedCollectionKey].map((q, i) => `<div class="bg-gray-800 p-3 text-xs flex justify-between mt-1 rounded border border-gray-700"><span>${q.text}</span><button onclick="deleteQuestion(${i})" class="text-red-400 font-bold ml-4 hover:text-red-300">X</button></div>`).join(''); }
function addQuestion(e) { e.preventDefault(); gameData.collections[gameData.selectedCollectionKey].push({ text: document.getElementById('q-text').value, options: { A: document.getElementById('q-optA').value, B: document.getElementById('q-optB').value, C: document.getElementById('q-optC').value }, correct: document.getElementById('q-correct').value }); 
    document.getElementById('q-text').value = ""; document.getElementById('q-optA').value = ""; document.getElementById('q-optB').value = ""; document.getElementById('q-optC').value = "";
    saveToStorage(); renderQuestionsPool(); 
}
function deleteQuestion(idx) { gameData.collections[gameData.selectedCollectionKey].splice(idx, 1); saveToStorage(); renderQuestionsPool(); }

function renderGameSelects() { 
    document.getElementById('game-collection-select').innerHTML = `<option value="">Selecione o Banco de Dados...</option>` + Object.keys(gameData.collections).map(k => `<option value="${k}">${k}</option>`).join(''); 
    document.getElementById('game-active-team').innerHTML = `<option value="">Selecione a Primeira Equipe...</option>` + gameData.teams.map((t, idx) => `<option value="${idx}">${t.name}</option>`).join('');
}

function renderScoreboard() {
    document.getElementById('game-scoreboard').innerHTML = gameData.teams.map((t, idx) => {
        return `
        <div class="bg-gray-800 p-3 rounded-xl flex justify-between items-center mt-2 border border-gray-700 shadow-md transition-all">
            <div>
                <span class="block font-bold">${t.name}</span>
                <span class="text-xl font-mono text-emerald-400">${t.score} pts</span>
            </div>
            <div class="flex flex-col gap-1 ml-2">
                <button onclick="updateManualScore(${idx}, 10)" class="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold transition-colors shadow">+10</button>
                <button onclick="updateManualScore(${idx}, -10)" class="bg-red-800 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors shadow">-10</button>
            </div>
        </div>`;
    }).join('');
}

function updateManualScore(teamIdx, amount) {
    gameData.teams[teamIdx].score = Math.max(0, gameData.teams[teamIdx].score + amount);
    saveToStorage();
    renderScoreboard();
}

// ==========================================
// 4. LÓGICA DE JOGO E ARENA
// ==========================================
function startGame() {
    const key = document.getElementById('game-collection-select').value;
    const teamIdx = document.getElementById('game-active-team').value;
    
    if(!key || teamIdx === "") { alert("Atenção: Selecione a coleção E a equipe inicial antes de começar!"); return; }
    
    initAudio(); 
    activeGame.isRunning = true; 
    activeGame.remainingQuestions = [...gameData.collections[key]];
    
    document.getElementById('game-setup-screen').classList.add('hidden');
    document.getElementById('game-arena-screen').classList.remove('hidden');
    
    drawQuestion(parseInt(teamIdx));
}

function encerrarPartida() {
    clearInterval(timerInterval);
    activeGame.isRunning = false;
    document.getElementById('game-arena-screen').classList.add('hidden');
    document.getElementById('game-setup-screen').classList.remove('hidden');
}

function drawQuestion(teamIdx) {
    clearInterval(timerInterval);
    document.getElementById('ai-feedback-box').classList.add('hidden');
    
    if(activeGame.remainingQuestions.length === 0) { 
        document.getElementById('game-question-text').innerText = "Fim do Banco de Questões! 🏆"; 
        document.getElementById('game-options-container').innerHTML = ''; 
        document.getElementById('game-timer').innerText = "00";
        document.getElementById('game-questions-counter').innerText = "Restam: 0";
        return; 
    }

    if(teamIdx !== undefined) {
        activeGame.currentTeamIdx = teamIdx;
    } else {
        activeGame.currentTeamIdx++;
        if(activeGame.currentTeamIdx >= gameData.teams.length) activeGame.currentTeamIdx = 0;
    }

    document.getElementById('game-current-team-display').innerText = `Vez da: ${gameData.teams[activeGame.currentTeamIdx].name}`;
    
    const r = Math.floor(Math.random() * activeGame.remainingQuestions.length);
    activeGame.currentQuestion = activeGame.remainingQuestions.splice(r, 1)[0];
    activeGame.revealed = false;
    
    document.getElementById('game-questions-counter').innerText = `Restam: ${activeGame.remainingQuestions.length}`;
    document.getElementById('game-question-text').innerText = activeGame.currentQuestion.text;
    
    const opts = activeGame.currentQuestion.options;
    document.getElementById('game-options-container').innerHTML = Object.keys(opts).map(l => `
        <button onclick="verificarResposta('${l}')" id="opt-btn-${l}" class="w-full text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 p-4 rounded-xl text-base md:text-lg font-medium transition-all shadow-md">
            <span class="bg-gray-950 text-emerald-400 font-bold px-3 py-1 rounded mr-3 border border-gray-700">${l}</span>${opts[l]}
        </button>
    `).join('');
    
    timeLeft = 30;
    updateTimerVisual();
}

function startCountdown() {
    if(activeGame.revealed || activeGame.remainingQuestions.length === 0 && !activeGame.currentQuestion) return;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerVisual();
        if(timeLeft <= 5 && timeLeft > 0) soundTick();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            document.getElementById('game-timer').innerText = "00";
            soundError();
            penalizarEquipe();
            revelarGabarito();
            document.getElementById('game-question-text').innerText = "TEMPO ESGOTADO!";
        }
    }, 1000);
}

function updateTimerVisual() {
    const t = document.getElementById('game-timer');
    t.innerText = timeLeft.toString().padStart(2, '0');
    if (timeLeft <= 5) t.className = "text-3xl font-mono font-black text-red-500 glow-red";
    else if (timeLeft <= 15) t.className = "text-3xl font-mono font-black text-amber-500";
    else t.className = "text-3xl font-mono font-black text-emerald-400";
}

// ==========================================
// 5. JULGAMENTO DE RESPOSTAS
// ==========================================
function verificarResposta(letraEscolhida) {
    if(activeGame.revealed) return;
    clearInterval(timerInterval);
    activeGame.revealed = true;
    
    const q = activeGame.currentQuestion;
    const team = gameData.teams[activeGame.currentTeamIdx];

    if(letraEscolhida === q.correct) {
        soundSuccess();
        team.score += 10; // Fixo em 10 pontos (sem multiplicador)
        document.getElementById(`opt-btn-${letraEscolhida}`).className = "w-full text-left bg-emerald-900 border-2 border-emerald-400 p-4 rounded-xl text-white font-bold transform scale-105 transition-all shadow-lg glow-green";
        revelarGabarito();
    } else {
        soundError();
        team.score = Math.max(0, team.score - 5);
        document.getElementById(`opt-btn-${letraEscolhida}`).className = "w-full text-left bg-red-950 border-2 border-red-500 p-4 rounded-xl text-white opacity-50";
        revelarGabarito();
        explicarErroComIA(letraEscolhida); 
    }
    saveToStorage();
    renderScoreboard();
}

function penalizarEquipe() {
    activeGame.revealed = true;
    let team = gameData.teams[activeGame.currentTeamIdx];
    team.score = Math.max(0, team.score - 10);
    saveToStorage(); 
    renderScoreboard();
}

function revelarGabarito() {
    Object.keys(activeGame.currentQuestion.options).forEach(l => {
        if(l === activeGame.currentQuestion.correct) {
            document.getElementById(`opt-btn-${l}`).classList.add("ring-2", "ring-emerald-400", "bg-emerald-950");
        }
    });
}

// ==========================================
// 6. INTEGRAÇÃO COM GOOGLE GEMINI API (v3.6-flash)
// ==========================================
// ==========================================
// 6. INTEGRAÇÃO COM GOOGLE GEMINI API (v3.6-flash)
// ==========================================
async function chamarGemini(prompt, elementId) {
    const box = document.getElementById('ai-feedback-box');
    const textBox = document.getElementById(elementId);
    
    // TRAVA DE SEGURANÇA: Verifica se o usuário colocou a chave na aba de configs
    if (!gameData.apiKey || gameData.apiKey.trim() === "") {
        box.classList.remove('hidden');
        textBox.innerText = "⚠️ Acesso Negado: O Oráculo está sem energia. Cole a sua chave da API na aba '⚙️ IA API' antes de jogar.";
        return; // Para a função aqui e não tenta chamar o Google
    }
    
    box.classList.remove('hidden');
    textBox.innerText = "Conectando ao núcleo neural do Gemini...";
    
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${gameData.apiKey}`;
        
        const payload = {
            contents: [{ parts: [{ text: prompt }] }]
        };

        const response = await fetch(url, {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        
        if(!response.ok) {
            const errorDetails = await response.text();
            throw new Error(`Erro ${response.status}: ${errorDetails}`);
        }

        const data = await response.json();
        
        if(data.candidates && data.candidates.length > 0) {
            const textoIA = data.candidates[0].content.parts[0].text;
            
            textBox.innerText = "";
            let i = 0;
            let interval = setInterval(() => {
                textBox.innerText += textoIA.charAt(i);
                i++;
                if(i >= textoIA.length) clearInterval(interval);
            }, 30); 
        } else {
            textBox.innerText = "⚠️ O Oráculo não conseguiu gerar uma resposta clara.";
        }
        
    } catch (error) {
        console.error("ERRO DETALHADO DA API:", error);
        textBox.innerText = "⚠️ Falha de Conexão com a IA. Confira se a chave que você colocou nas configurações está correta.";
    }
}

function usarOraculo() {
    if(activeGame.revealed || activeGame.remainingQuestions.length === 0 && !activeGame.currentQuestion) return;
    
    clearInterval(timerInterval);
    soundMagic();
    
    const team = gameData.teams[activeGame.currentTeamIdx];
    team.score = Math.max(0, team.score - 3); 
    saveToStorage(); 
    renderScoreboard();

    const q = activeGame.currentQuestion;
    const prompt = `Aja como um professor inteligente. A pergunta do jogo é: "${q.text}". As alternativas são: A) ${q.options.A} | B) ${q.options.B} | C) ${q.options.C}. A resposta certa é a letra ${q.correct}. Dê uma dica curta e criativa para ajudar os alunos a deduzirem, MAS ATENÇÃO: É ESTRITAMENTE PROIBIDO usar as palavras ou o texto exato da alternativa correta (${q.options[q.correct]}). Em vez disso, faça uma pergunta de raciocínio ou cite uma curiosidade paralela sobre o tema para eles chegarem lá sozinhos.`;
    
    chamarGemini(prompt, 'ai-feedback-text');
}

function explicarErroComIA(letraErrada) {
    const q = activeGame.currentQuestion;
    const prompt = `Haja como um professor de biologia rigoroso mas encorajador. A pergunta era: "${q.text}". A resposta certa era ${q.correct} (${q.options[q.correct]}). Os alunos escolheram errado a letra ${letraErrada} (${q.options[letraErrada]}). Explique em EXATAS DUAS FRASES curtas por que a escolha deles está errada e por que a resposta certa é a correta.`;
    
    chamarGemini(prompt, 'ai-feedback-text');
}