document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const canvas = document.getElementById('ruletaCanvas');
    const ruletaWrapper = document.querySelector('.ruleta-wrapper');
    const ctx = canvas.getContext('2d');
    const spinBtn = document.getElementById('spinBtn');
    const loadBtn = document.getElementById('loadBtn');
    const participantesInput = document.getElementById('participantesInput');
    const ganadoresList = document.getElementById('ganadoresList');
    const modal = document.getElementById('modalGanador');
    const nombreGanadorEl = document.getElementById('nombreGanador');
    const closeModalBtn = document.querySelector('.close-button');

    // --- Carga de Sonidos ---
    const sonidoGiro = new Audio('sonido-giro.mp3');
    const sonidoGanador = new Audio('sonido-ganador.mp3');
    sonidoGiro.loop = true;
    sonidoGiro.volume = 0.5;

    // --- Estado de la aplicación ---
    let participantes = [];
    let rotacionActual = 0;
    let girando = false;
    let audioInicializado = false;
    const coloresSegmento = ['#1f2937', '#374151', '#4b5563', '#6b7280'];

    // --- Lógica para Responsividad del Canvas ---
    function debounce(func, delay) { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); }; }
    const resizeCanvasAndDraw = () => { const containerSize = ruletaWrapper.clientWidth; canvas.width = containerSize; canvas.height = containerSize; dibujarRuleta(); };

    // --- Modal y Confeti ---
    const mostrarModal = (ganador) => { nombreGanadorEl.textContent = ganador; modal.style.display = 'flex'; };
    const cerrarModal = () => { modal.style.display = 'none'; };
    closeModalBtn.addEventListener('click', cerrarModal);
    window.addEventListener('click', (event) => { if (event.target === modal) { cerrarModal(); } });
    const lanzarConfeti = () => { const options = { particleCount: 120, spread: 70, zIndex: 1001 }; confetti({ ...options, angle: 60, origin: { x: 0 } }); confetti({ ...options, angle: 120, origin: { x: 1 } }); };

     // ===================================================================
    // FUNCIÓN DE DIBUJO DE RULETA - VERSIÓN FINAL CON SEPARACIONES
    // ===================================================================
    const dibujarRuleta = () => {
        const numParticipantes = participantes.length;
        const centro = canvas.width / 2;
        const radio = centro * 0.98;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (numParticipantes === 0) return;

        const anguloPorSegmento = 2 * Math.PI / numParticipantes;
        
        // --- Bucle principal de dibujo ---
        for (let i = 0; i < numParticipantes; i++) {
            const anguloInicio = i * anguloPorSegmento;
            const anguloFin = anguloInicio + anguloPorSegmento;
            const anguloMedio = anguloInicio + anguloPorSegmento / 2;
            const participante = participantes[i];

            // <<-- PASO 1: Volvemos a dibujar el fondo de cada segmento ("quesito")
            ctx.beginPath();
            ctx.moveTo(centro, centro);
            ctx.arc(centro, centro, radio, anguloInicio, anguloFin);
            ctx.closePath();
            ctx.fillStyle = coloresSegmento[i % coloresSegmento.length];
            ctx.fill();

            // <<-- PASO 2: Dibujamos un borde definido para la separación visual
            // Usamos el color de fondo principal para simular un "espacio"
            ctx.save();
            ctx.strokeStyle = '#121826';
            ctx.lineWidth = numParticipantes > 100 ? 3 : 2; // Líneas más gruesas si hay muchos
            ctx.stroke();
            ctx.restore();
            
            // <<-- PASO 3: Mantenemos el texto radial que funciona muy bien
            ctx.save();
            ctx.translate(centro, centro);
            ctx.rotate(anguloMedio);
            
            // Ajustes de fuente y alineación
            let fontSize = Math.max(8, canvas.width * 0.018);
            ctx.font = `600 ${fontSize}px Poppins`;
            ctx.fillStyle = '#f9fafb';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Dibujar el texto a lo largo del eje rotado
            ctx.fillText(participante, radio * 0.82, 0);
            
            ctx.restore();
        }
    };
    // ===================================================================
    // FIN DE LA FUNCIÓN DE DIBUJO
    // ===================================================================

    const girar = () => {
        if (girando || participantes.length === 0) return;
        if (!audioInicializado) {
            sonidoGiro.play().catch(() => {}); sonidoGiro.pause();
            sonidoGanador.play().catch(() => {}); sonidoGanador.pause();
            audioInicializado = true;
        }
        sonidoGiro.play().catch(e => console.error("Error giro:", e));
        girando = true;
        spinBtn.disabled = true;
        const vueltas = 8 * 360;
        const extra = Math.floor(Math.random() * 360);
        rotacionActual += vueltas + extra;
        canvas.style.transform = `rotate(${rotacionActual}deg)`;
        setTimeout(determinarGanador, 7000);
    };

    const determinarGanador = () => {
        sonidoGiro.pause();
        sonidoGiro.currentTime = 0;
        const anguloFinal = rotacionActual % 360;
        const anguloGanador = 360 - anguloFinal;
        const indiceGanador = Math.floor(anguloGanador / (360 / participantes.length));
        const ganador = participantes[indiceGanador];
        
        sonidoGanador.play().catch(e => console.error("Error ganador:", e));
        mostrarModal(ganador);
        lanzarConfeti();

        const li = document.createElement('li');
        li.textContent = ganador;
        ganadoresList.appendChild(li);
        ganadoresList.scrollTop = ganadoresList.scrollHeight;

        participantes.splice(indiceGanador, 1);
        
        setTimeout(() => {
            // Redibujar la ruleta con un participante menos
            const vueltasActuales = rotacionActual - (rotacionActual % 360);
            rotacionActual = vueltasActuales;
            canvas.style.transition = 'none';
            canvas.style.transform = `rotate(${rotacionActual}deg)`;
            setTimeout(() => { canvas.style.transition = 'transform 7s cubic-bezier(0.25, 1, 0.5, 1)'; }, 50);

            dibujarRuleta();

            if (participantes.length > 0) {
                girando = false;
                spinBtn.disabled = false;
            } else {
                alert("¡Todos los participantes han sido premiados!");
            }
        }, 1500);
    };

    const cargarParticipantes = () => {
        const nombres = participantesInput.value.split('\n').map(n => n.trim()).filter(n => n !== '');
        if (nombres.length < 2) { alert("Introduce al menos 2 participantes."); return; }
        participantes = nombres;
        alert(`${participantes.length} participantes cargados.`);
        rotacionActual = 0;
        canvas.style.transform = 'rotate(0deg)';
        dibujarRuleta();
        spinBtn.disabled = false;
    };

    // --- Asignar Eventos e Inicio ---
    spinBtn.addEventListener('click', girar);
    loadBtn.addEventListener('click', cargarParticipantes);
    window.addEventListener('resize', debounce(resizeCanvasAndDraw, 100));
    resizeCanvasAndDraw();
    spinBtn.disabled = true;
});