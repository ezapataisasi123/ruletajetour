document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const canvas = document.getElementById('ruletaCanvas');
    const ruletaWrapper = document.querySelector('.ruleta-wrapper');
    const ctx = canvas.getContext('2d');
    // ... (el resto de los selectores de elementos no cambia)
    const spinBtn = document.getElementById('spinBtn');
    const loadBtn = document.getElementById('loadBtn');
    const participantesInput = document.getElementById('participantesInput');
    const ganadoresList = document.getElementById('ganadoresList');
    const colorFondoInput = document.getElementById('colorFondo');
    const imagenFondoInput = document.getElementById('imagenFondoInput');
    const removerImagenBtn = document.getElementById('removerImagenBtn');
    const modal = document.getElementById('modalGanador');
    const nombreGanadorEl = document.getElementById('nombreGanador');
    const closeModalBtn = document.querySelector('.close-button');

    // --- Estado de la aplicación ---
    let participantes = [];
    let rotacionActual = 0;
    let girando = false;
    const coloresSegmento = ['#1f2937', '#374151', '#4b5563', '#6b7280'];

    // --- Lógica para Responsividad del Canvas ---

    // Función Debounce para optimizar el rendimiento en resize
    function debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    const resizeCanvasAndDraw = () => {
        // Ajusta el tamaño del canvas al de su contenedor
        const containerSize = ruletaWrapper.clientWidth;
        canvas.width = containerSize;
        canvas.height = containerSize;
        // Vuelve a dibujar la ruleta con el nuevo tamaño
        dibujarRuleta();
    };

    // --- Lógica de Personalización (sin cambios) ---
    colorFondoInput.addEventListener('input', (e) => { document.body.style.backgroundColor = e.target.value; });
    imagenFondoInput.addEventListener('change', (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (event) => { document.body.style.backgroundImage = `url('${event.target.result}')`; }; reader.readAsDataURL(file); } });
    removerImagenBtn.addEventListener('click', () => { document.body.style.backgroundImage = 'none'; });
    
    // --- Lógica del Modal (sin cambios) ---
    const mostrarModal = (ganador) => { nombreGanadorEl.textContent = ganador; modal.style.display = 'flex'; };
    const cerrarModal = () => { modal.style.display = 'none'; };
    closeModalBtn.addEventListener('click', cerrarModal);
    window.addEventListener('click', (event) => { if (event.target === modal) { cerrarModal(); } });

    // --- Lógica del Confeti (sin cambios) ---
    const lanzarConfeti = () => { const options = { particleCount: 120, spread: 70, zIndex: 1001 }; confetti({ ...options, angle: 60, origin: { x: 0 } }); confetti({ ...options, angle: 120, origin: { x: 1 } }); };

    // --- Lógica de la Ruleta (MODIFICADA PARA SER RESPONSIVE) ---
    const dibujarRuleta = () => {
        const numParticipantes = participantes.length;
        // Usa el tamaño actual del canvas, que ahora es dinámico
        const centro = canvas.width / 2;
        const radio = centro - (canvas.width * 0.01); // Margen relativo

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (numParticipantes === 0) return;

        // Tamaño de fuente relativo al tamaño de la ruleta
        const fontSize = Math.max(10, canvas.width * 0.03);
        ctx.font = `bold ${fontSize}px Poppins`;

        const anguloPorSegmento = 2 * Math.PI / numParticipantes;

        participantes.forEach((participante, i) => {
            const anguloInicio = i * anguloPorSegmento;
            
            ctx.beginPath();
            ctx.moveTo(centro, centro);
            ctx.arc(centro, centro, radio, anguloInicio, anguloInicio + anguloPorSegmento);
            ctx.closePath();
            ctx.fillStyle = coloresSegmento[i % coloresSegmento.length];
            ctx.fill();
            
            ctx.save();
            ctx.strokeStyle = "#121826";
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.fillStyle = '#f9fafb';
            ctx.translate(centro, centro);
            ctx.rotate(anguloInicio + anguloPorSegmento / 2);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            // Posición del texto relativa al radio
            ctx.fillText(participante.substring(0, 20), radio * 0.95, 0);
            ctx.restore();
        });
    };

    const girar = () => {
        if (girando || participantes.length === 0) return;

        girando = true;
        spinBtn.disabled = true;
        
        const vueltasCompletas = 8 * 360;
        const extraRandom = Math.floor(Math.random() * 360);
        const nuevaRotacion = rotacionActual + vueltasCompletas + extraRandom;

        canvas.style.transform = `rotate(${nuevaRotacion}deg)`;
        rotacionActual = nuevaRotacion;

        setTimeout(determinarGanador, 7000);
    };

    const determinarGanador = () => {
        const numParticipantes = participantes.length;
        const anguloPorSegmento = 360 / numParticipantes;
        const anguloFinalNormalizado = rotacionActual % 360;
        const anguloPunteroInvertido = 360 - anguloFinalNormalizado;
        const indiceGanador = Math.floor(anguloPunteroInvertido / anguloPorSegmento);
        const ganador = participantes[indiceGanador];

        mostrarModal(ganador);
        lanzarConfeti();

        const li = document.createElement('li');
        li.textContent = ganador;
        ganadoresList.appendChild(li);
        ganadoresList.scrollTop = ganadoresList.scrollHeight;

        participantes.splice(indiceGanador, 1);
        
        setTimeout(() => {
            // No es necesario resetear la rotación para redibujar
            dibujarRuleta();
            if (participantes.length > 0) {
                girando = false;
                spinBtn.disabled = false;
            } else {
                alert("¡Todos los participantes han sido premiados!");
            }
        }, 1000);
    };

    const cargarParticipantes = () => {
        const nombres = participantesInput.value.split('\n').map(n => n.trim()).filter(n => n !== '');
        
        if (nombres.length < 2) {
            alert("Por favor, introduce al menos 2 participantes.");
            return;
        }
        participantes = nombres;
        alert(`${participantes.length} participantes cargados.`);
        
        rotacionActual = 0;
        canvas.style.transform = 'rotate(0deg)';
        dibujarRuleta(); // Dibuja la ruleta con los nuevos participantes
        spinBtn.disabled = false;
    };

    // --- Asignar Eventos e Inicio ---
    spinBtn.addEventListener('click', girar);
    loadBtn.addEventListener('click', cargarParticipantes);
    
    // Evento para redimensionar el canvas cuando cambia el tamaño de la ventana
    window.addEventListener('resize', debounce(resizeCanvasAndDraw, 100));
    
    // Llamada inicial para establecer el tamaño y dibujar la ruleta
    resizeCanvasAndDraw();
    spinBtn.disabled = true;