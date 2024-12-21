let farmaciasData = [];
let mapa;
let marcadores = L.layerGroup();

// Cargar datos al iniciar
async function cargarDatos() {
    try {
        const response = await fetch('https://midas.minsal.cl/farmacia_v2/WS/getLocales.php');
        farmaciasData = await response.json();
        inicializarSelects();
    } catch (error) {
        console.error('Error al cargar datos:', error);
        // Para pruebas, usar datos de ejemplo
        farmaciasData = [
            {
                "fecha": "02-06-22",
                "local_id": "1",
                "local_nombre": "CRUZ VERDE ",
                "comuna_nombre": "QUILLOTA",
                "localidad_nombre": "QUILLOTA",
                "local_direccion": "OHIGGINS 195, LOCAL 1",
                "funcionamiento_hora_apertura": "08:30:00",
                "funcionamiento_hora_cierre": "18:30:00",
                "local_telefono": "+5633332269467",
                "local_lat": "-32.8793428949969",
                "local_lng": "-71.2467871500868",
                "funcionamiento_dia": "jueves",
                "fk_region": "6",
                "fk_comuna": "69",
                "fk_localidad": "32"
            },
            {
                "fecha": "02-06-22",
                "local_id": "2",
                "local_nombre": "CRUZ VERDE",
                "comuna_nombre": "LA CALERA",
                "localidad_nombre": "LA CALERA",
                "local_direccion": "J.J. PEREZ 202",
                "funcionamiento_hora_apertura": "08:30:00",
                "funcionamiento_hora_cierre": "20:30:00",
                "local_telefono": "+56332724714",
                "local_lat": "-32.788066282624",
                "local_lng": "-71.1897310126255",
                "funcionamiento_dia": "jueves",
                "fk_region": "6",
                "fk_comuna": "56",
                "fk_localidad": "12"
            }
        ];
        inicializarSelects();
    }
}

// Inicializar selects con opciones únicas
function inicializarSelects() {
    // Obtener cadenas únicas
    const cadenas = [...new Set(farmaciasData.map(f => f.local_nombre.trim()))];
    const comunas = [...new Set(farmaciasData.map(f => f.comuna_nombre))];

    // Poblar select de cadenas
    const cadenaSelect = document.getElementById('cadenaSelect');
    cadenas.forEach(cadena => {
        const option = document.createElement('option');
        option.value = cadena;
        option.textContent = cadena;
        cadenaSelect.appendChild(option);
    });

    // Poblar select de comunas
    const comunaSelect = document.getElementById('comunaSelect');
    comunas.forEach(comuna => {
        const option = document.createElement('option');
        option.value = comuna;
        option.textContent = comuna;
        comunaSelect.appendChild(option);
    });
}

// Función para contar locales por cadena
function contarPorCadena() {
    const cadena = document.getElementById('cadenaSelect').value;
    if (!cadena) {
        mostrarResultado('Por favor seleccione una cadena');
        return;
    }

    const cantidad = farmaciasData.filter(f => f.local_nombre.trim() === cadena).length;
    mostrarResultado(`La cadena ${cadena} tiene ${cantidad} locales en total`);
}

// Función para contar locales por comuna
function contarPorComuna() {
    const comuna = document.getElementById('comunaSelect').value;
    if (!comuna) {
        mostrarResultado('Por favor seleccione una comuna');
        return;
    }

    const cantidad = farmaciasData.filter(f => f.comuna_nombre === comuna).length;
    mostrarResultado(`La comuna ${comuna} tiene ${cantidad} farmacias en total`);
}

// Función para filtrar por hora
function filtrarPorHora() {
    const hora = document.getElementById('horaInput').value;
    if (!hora) {
        mostrarResultado('Por favor ingrese una hora');
        return;
    }

    const farmaciasAbiertas = farmaciasData.filter(f => {
        return f.funcionamiento_hora_apertura <= hora && f.funcionamiento_hora_cierre >= hora;
    });

    mostrarResultado(`Hay ${farmaciasAbiertas.length} farmacias abiertas después de las ${hora}`);
}

// Función para encontrar la cadena más presente por comuna
function encontrarCadenaDominante() {
    const resultado = farmaciasData.reduce((acc, farmacia) => {
        const comuna = farmacia.comuna_nombre;
        const cadena = farmacia.local_nombre.trim();
        
        if (!acc[comuna]) {
            acc[comuna] = {};
        }
        
        acc[comuna][cadena] = (acc[comuna][cadena] || 0) + 1;
        return acc;
    }, {});

    let resultadoTexto = 'Cadena dominante por comuna:\n';
    for (const comuna in resultado) {
        const cadenaDominante = Object.entries(resultado[comuna])
            .sort((a, b) => b[1] - a[1])[0];
        resultadoTexto += `${comuna}: ${cadenaDominante[0]} (${cadenaDominante[1]} locales)\n`;
    }
    
    mostrarResultado(resultadoTexto);
}

// Función para encontrar la comuna con más farmacias
function encontrarComunaMasFarmacias() {
    const conteoComuna = farmaciasData.reduce((acc, farmacia) => {
        acc[farmacia.comuna_nombre] = (acc[farmacia.comuna_nombre] || 0) + 1;
        return acc;
    }, {});

    const comunaMasFarmacias = Object.entries(conteoComuna)
        .sort((a, b) => b[1] - a[1])[0];

    mostrarResultado(`La comuna con más farmacias es ${comunaMasFarmacias[0]} con ${comunaMasFarmacias[1]} farmacias`);
}

// Función para encontrar la farmacia más aislada
function encontrarFarmaciaMasAislada() {
    let farmaciaMasAislada = null;
    let maxDistanciaPromedio = 0;

    farmaciasData.forEach(farmacia1 => {
        let sumaDistancias = 0;
        let cantidadFarmacias = 0;

        farmaciasData.forEach(farmacia2 => {
            if (farmacia1.local_id !== farmacia2.local_id) {
                const distancia = calcularDistancia(
                    parseFloat(farmacia1.local_lat),
                    parseFloat(farmacia1.local_lng),
                    parseFloat(farmacia2.local_lat),
                    parseFloat(farmacia2.local_lng)
                );
                sumaDistancias += distancia;
                cantidadFarmacias++;
            }
        });

        const distanciaPromedio = sumaDistancias / cantidadFarmacias;
        if (distanciaPromedio > maxDistanciaPromedio) {
            maxDistanciaPromedio = distanciaPromedio;
            farmaciaMasAislada = farmacia1;
        }
    });

    mostrarResultado(`La farmacia más aislada es ${farmaciaMasAislada.local_nombre} en ${farmaciaMasAislada.comuna_nombre}, ${farmaciaMasAislada.local_direccion}`);
}

// Función auxiliar para calcular distancia entre dos puntos usando la fórmula de Haversine
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Función auxiliar para mostrar resultados
function mostrarResultado(mensaje, tipo = 'normal') {
    const resultsDiv = document.getElementById('results');
    
    // Si el mensaje contiene información numérica
    if (mensaje.includes('tiene') || mensaje.includes('Hay')) {
        const [texto, numero] = mensaje.split('tiene').length > 1 ? 
            mensaje.split('tiene') : mensaje.split('Hay');
        
        resultsDiv.innerHTML = `
            <h2>Resultados del Análisis</h2>
            <div class="estadistica">
                <div class="cantidad">${numero.trim()}</div>
                <div class="detalle">${texto.trim()}</div>
            </div>
        `;
    } 
    // Para la cadena dominante por comuna (formato especial)
    else if (mensaje.includes('Cadena dominante')) {
        const lineas = mensaje.split('\n');
        const titulo = lineas[0];
        const detalles = lineas.slice(1);
        
        resultsDiv.innerHTML = `
            <h2>Resultados del Análisis</h2>
            <div class="estadistica">
                <div class="detalle">${titulo}</div>
                ${detalles.map(detalle => `
                    <div class="cantidad">${detalle.split(':')[1].split('(')[0].trim()}</div>
                    <div class="detalle">Comuna: ${detalle.split(':')[0].trim()}</div>
                    <div class="detalle">${detalle.split('(')[1].replace(')', '')}</div>
                `).join('<hr style="margin: 1rem 0; border: 0; border-top: 1px solid #eee;">')}
            </div>
        `;
    }
    // Para la farmacia más aislada
    else if (mensaje.includes('farmacia más aislada')) {
        resultsDiv.innerHTML = `
            <h2>Farmacia más Aislada</h2>
            <div class="estadistica">
                <div class="detalle">Ubicación</div>
                <div class="cantidad">${mensaje.split('es')[1].split('en')[0].trim()}</div>
                <div class="detalle">Comuna: ${mensaje.split('en')[1].split(',')[0].trim()}</div>
                <div class="detalle">Dirección: ${mensaje.split(',')[1].trim()}</div>
            </div>
        `;
    }
    // Para otros tipos de mensajes
    else {
        resultsDiv.innerHTML = `
            <h2>Resultados del Análisis</h2>
            <div class="estadistica">
                <div class="detalle">${mensaje}</div>
            </div>
        `;
    }
}

// Inicializar mapa
function inicializarMapa() {
    // Coordenadas aproximadas de la Región Metropolitana
    const coordenadasRM = [-33.4569, -70.6483];
    
    mapa = L.map('mapa').setView(coordenadasRM, 10);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapa);
    
    marcadores.addTo(mapa);
}

// Función para mostrar farmacias en el mapa
function mostrarFarmaciasEnMapa(farmacias = farmaciasData) {
    // Limpiar marcadores existentes
    marcadores.clearLayers();
    
    // Agregar nuevos marcadores
    farmacias.forEach(farmacia => {
        const lat = parseFloat(farmacia.local_lat);
        const lng = parseFloat(farmacia.local_lng);
        
        if (!isNaN(lat) && !isNaN(lng)) {
            const marcador = L.marker([lat, lng])
                .bindPopup(`
                    <strong>${farmacia.local_nombre}</strong><br>
                    Dirección: ${farmacia.local_direccion}<br>
                    Comuna: ${farmacia.comuna_nombre}<br>
                `);
            
            marcadores.addLayer(marcador);
        }
    });

    // Ajustar la vista del mapa para mostrar todos los marcadores
    if (farmacias.length > 0) {
        const grupo = L.featureGroup(marcadores.getLayers());
        mapa.fitBounds(grupo.getBounds().pad(0.1));
    }
}

// Modificar las funciones existentes para actualizar el mapa

function contarPorCadena() {
    const cadena = document.getElementById('cadenaSelect').value;
    if (!cadena) {
        mostrarResultado('Por favor seleccione una cadena');
        return;
    }

    const farmaciasFiltradas = farmaciasData.filter(f => f.local_nombre.trim() === cadena);
    const cantidad = farmaciasFiltradas.length;
    mostrarResultado(`La cadena ${cadena} tiene ${cantidad} locales en total`);
    mostrarFarmaciasEnMapa(farmaciasFiltradas);
}

function contarPorComuna() {
    const comuna = document.getElementById('comunaSelect').value;
    if (!comuna) {
        mostrarResultado('Por favor seleccione una comuna');
        return;
    }

    const farmaciasFiltradas = farmaciasData.filter(f => f.comuna_nombre === comuna);
    const cantidad = farmaciasFiltradas.length;
    mostrarResultado(`La comuna ${comuna} tiene ${cantidad} farmacias en total`);
    mostrarFarmaciasEnMapa(farmaciasFiltradas);
}

// Inicialización al cargar la página
window.onload = async () => {
    inicializarMapa();
    await cargarDatos();
    mostrarFarmaciasEnMapa();
};