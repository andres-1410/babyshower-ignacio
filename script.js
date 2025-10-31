// --- CONFIGURACIÓN ---
// El ID largo en la URL de tu Google Sheet (ej: .../spreadsheets/d/AQUI_VA_EL_ID/edit)
const GOOGLE_SHEET_ID = "14yEBkFmzQP9jSb867ylhNDI-eRFuGwHXBp6V5ZJ6w2k"; 
// La URL de tu aplicación web implementada desde Apps Script (LA NUEVA)
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxHVbHnqGaOBUX0Rka34C30C2IZZ5xZmZyQ2VmnAa8A13lsJQFAy_ge0OB6Xg0z1qjD/exec"; 


// --- VARIABLES GLOBALES ---
let guestList = [];
let selectedGuest = null;

// --- FUNCIONES DE INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    fetchInitialData(); // <-- Única función de carga

    document.getElementById('guest-search').addEventListener('keyup', handleSearch);
    document.getElementById('rsvp-form').addEventListener('submit', handleRsvpSubmit);

    // Lógica para mostrar el mapa
    const showMapBtn = document.getElementById('show-map-button');
    const mapWrapper = document.getElementById('map-iframe-wrapper');

    showMapBtn.addEventListener('click', () => {
        mapWrapper.classList.remove('hidden'); 
        showMapBtn.classList.add('hidden'); 
    });
});

// --- FUNCIÓN MODIFICADA: AHORA CARGA TODO ---
async function fetchInitialData() {
    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL); 
        const result = await response.json();
        
        if (result.status === 'success') {
            // Surtimos ambas listas con los datos recibidos
            guestList = result.data.guests;
            populateAlreadyHaveGifts(result.data.gifts); // <-- Nueva llamada
        } else {
            console.error("Error al cargar datos iniciales:", result.message);
        }
    } catch (error) {
        console.error("Error de conexión al cargar datos:", error);
    }
}

// --- LÓGICA DE CONFIRMACIÓN DE ASISTENCIA (RSVP) ---

// ######################################################
// ## FUNCIÓN MODIFICADA ##
// ######################################################
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const resultsContainer = document.getElementById('search-results');
    
    // CAMBIADO A < 1: Permite buscar desde la primera letra
    if (searchTerm.length < 3) { 
        resultsContainer.innerHTML = '';
        return;
    }

    // CAMBIADO A startsWith(): Solo busca al principio del nombre
    const filteredGuests = guestList.filter(guest => 
        guest.nombre.toLowerCase().startsWith(searchTerm)
    );

    resultsContainer.innerHTML = '';
    filteredGuests.forEach(guest => {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.textContent = guest.nombre;
        item.onclick = () => selectGuest(guest);
        resultsContainer.appendChild(item);
    });
}
// ######################################################
// ## FIN DE LA MODIFICACIÓN ##
// ######################################################


function selectGuest(guest) {
    selectedGuest = guest;
    
    document.getElementById('guest-search').value = guest.nombre;
    document.getElementById('search-results').innerHTML = '';

    const form = document.getElementById('rsvp-form');
    form.classList.remove('hidden');

    document.getElementById('guest-name-display').textContent = `Confirmación para: ${guest.nombre}`;
    document.getElementById('guest-id').value = guest.id;

    const checkboxContainer = document.getElementById('guest-checkbox-container');
    checkboxContainer.innerHTML = ''; 
    
    const names = guest.nombres_asignados.split(',').map(name => name.trim());
    
    names.forEach((name, index) => {
        if(name) { 
            const wrapper = document.createElement('div');
            wrapper.className = 'checkbox-wrapper';
            // ORDEN CAMBIADO: Label primero, Input después
            wrapper.innerHTML = `
                <label for="guest_${index}">${name}</label>
                <input type="checkbox" id="guest_${index}" value="${name}" checked>
            `;
            checkboxContainer.appendChild(wrapper);
        }
    });
}

async function handleRsvpSubmit(event) {
    event.preventDefault();
    if (!selectedGuest) {
        alert("Por favor, selecciona tu nombre de la lista primero.");
        return;
    }
    
    const button = event.target.querySelector('button');
    const responseEl = document.getElementById('form-response');
    button.disabled = true;
    button.textContent = 'Enviando...';

    const confirmedNames = [];
    const checkboxes = document.querySelectorAll('#guest-checkbox-container input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        confirmedNames.push(checkbox.value);
    });

    const data = {
        action: 'submitRsvp',
        guestId: selectedGuest.id,
        confirmedNames: confirmedNames, 
        mensaje: document.getElementById('mensaje-invitado').value
    };
    
    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(data)
        });
        
        responseEl.textContent = '¡Confirmación recibida! Gracias por acompañarnos.';
        responseEl.style.color = 'green';
        setTimeout(() => {
            const rsvpContainer = document.getElementById('rsvp-container');
            rsvpContainer.innerHTML = '<h2>¡Gracias! Hemos recibido tu confirmación.</h2>';
        }, 2000);

    } catch (error) {
        console.error('Error al enviar RSVP:', error);
        responseEl.textContent = 'Hubo un error. Intenta de nuevo.';
        responseEl.style.color = 'red';
    } finally {
        button.disabled = false;
        button.textContent = 'Confirmar Mi Asistencia';
    }
}


// --- LÓGICA MODIFICADA PARA LISTA "YA TENEMOS" ---
function populateAlreadyHaveGifts(gifts) {
    const container = document.getElementById('ya-tenemos-container');
    try {
        container.innerHTML = ''; // Limpiamos el mensaje "Cargando..."
        
        const list = document.createElement('ul');
        list.className = 'no-gift-list'; // Usamos la misma clase de CSS
        
        gifts.forEach(gift => {
            if(gift.nombre) { 
                const item = document.createElement('li');
                item.textContent = gift.nombre; // Solo mostramos el nombre
                list.appendChild(item);
            }
        });
        
        container.appendChild(list);

    } catch (error) {
        container.innerHTML = `<p>Error al mostrar la lista de regalos que ya tenemos.</p>`;
        console.error('Error populating gifts:', error);
    }
}