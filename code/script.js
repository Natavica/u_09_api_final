var farmaciasData = [];
var mapa;
var marcadores = L.layerGroup();

async function cargarDatos() {
    try {
        const response = await fetch('https://midas.minsal.cl/farmacia_v2/WS/getLocales.php');
        farmaciasData = await response.json();
        inicializarSelects();
    } catch (error) {
        console.error('Error al cargar datos:', error);
        // Para pruebas
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

function inicializarSelects() {
    var cadenas = [];
    var comunas = [];
    
    for(var i = 0; i < farmaciasData.length; i++) {
        var cadena = farmaciasData[i].local_nombre.trim();
        var comuna = farmaciasData[i].comuna_nombre;
        
        if(cadenas.indexOf(cadena) === -1) {
            cadenas.push(cadena);
        }
        if(comunas.indexOf(comuna) === -1) {
            comunas.push(comuna);
        }
    }

    var cadenaSelect = document.getElementById('cadenaSelect');
    cadenaSelect.innerHTML = '<option value="">Seleccione una cadena</option>';
    for(var i = 0; i < cadenas.length; i++) {
        var option = document.createElement('option');
        option.value = cadenas[i];
        option.textContent = cadenas[i];
        cadenaSelect.appendChild(option);
    }

    var comunaSelect = document.getElementById('comunaSelect');
    comunaSelect.innerHTML = '<option value="">Seleccione una comuna</option>';
    for(var i = 0; i < comunas.length; i++) {
        var option = document.createElement('option');
        option.value = comunas[i];
        option.textContent = comunas[i];
        comunaSelect.appendChild(option);
    }
}

function contarPorCadena() {
    var cadena = document.getElementById('cadenaSelect').value;
    if (!cadena) {
        mostrarResultado('Por favor seleccione una cadena');
        return;
    }

    var cantidad = 0;
    var farmaciasFiltradas = [];
    
    for(var i = 0; i < farmaciasData.length; i++) {
        if(farmaciasData[i].local_nombre.trim() === cadena) {
            cantidad++;
            farmaciasFiltradas.push(farmaciasData[i]);
        }
    }
    
    mostrarResultado('La cadena ' + cadena + ' tiene ' + cantidad + ' locales en total');
    mostrarFarmaciasEnMapa(farmaciasFiltradas);
}

function contarPorComuna() {
    var comuna = document.getElementById('comunaSelect').value;
    if (!comuna) {
        mostrarResultado('Por favor seleccione una comuna');
        return;
    }

    var cantidad = 0;
    var farmaciasFiltradas = [];
    
    for(var i = 0; i < farmaciasData.length; i++) {
        if(farmaciasData[i].comuna_nombre === comuna) {
            cantidad++;
            farmaciasFiltradas.push(farmaciasData[i]);
        }
    }
    
    mostrarResultado('La comuna ' + comuna + ' tiene ' + cantidad + ' farmacias en total');
    mostrarFarmaciasEnMapa(farmaciasFiltradas);
}

function mostrarResultado(mensaje) {
    var resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<h2>Resultados del Análisis</h2><div class="estadistica"><div class="detalle">' + mensaje + '</div></div>';
}

// mapa
function inicializarMapa() {
    var coordenadasRM = [-33.4569, -70.6483];
    
    mapa = L.map('mapa').setView(coordenadasRM, 10);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapa);
    
    marcadores.addTo(mapa);
}

function mostrarFarmaciasEnMapa(farmacias) {
    if(!farmacias) {
        farmacias = farmaciasData;
    }
    
    marcadores.clearLayers();
    
    for(var i = 0; i < farmacias.length; i++) {
        var farmacia = farmacias[i];
        var lat = parseFloat(farmacia.local_lat);
        var lng = parseFloat(farmacia.local_lng);
        
        if (!isNaN(lat) && !isNaN(lng)) {
            var marcador = L.marker([lat, lng])
                .bindPopup(
                    '<strong>' + farmacia.local_nombre + '</strong><br>' +
                    'Dirección: ' + farmacia.local_direccion + '<br>' +
                    'Comuna: ' + farmacia.comuna_nombre
                );
            
            marcadores.addLayer(marcador);
        }
    }

    if (farmacias.length > 0) {
        var grupo = L.featureGroup(marcadores.getLayers());
        mapa.fitBounds(grupo.getBounds());
    }
}

window.onload = async function() {
    inicializarMapa();
    await cargarDatos();
    mostrarFarmaciasEnMapa();
};