let farmaciasData = [];

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
function mostrarResultado(mensaje) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <h2>Resultados</h2>
        <p>${mensaje.replace(/\n/g, '<br>')}</p>
    `;
}

// Cargar datos al iniciar la página
window.onload = cargarDatos;