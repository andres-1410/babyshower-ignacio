// --- CONFIGURACIÓN ---
// El ID largo en la URL de tu Google Sheet (ej: .../spreadsheets/d/AQUI_VA_EL_ID/edit)
const GOOGLE_SHEET_ID = "14yEBkFmzQP9jSb867ylhNDI-eRFuGwHXBp6V5ZJ6w2k"; 
// La URL de tu aplicación web implementada desde Apps Script (LA NUEVA)
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwRgZqlgb5k5WXv_X0kTRNqzvsZ8x4B-9Irt4z3-VQP-Ne_QcjBik4HJMt6dbAfHtbp/exec"; 

const giftsCsvUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Regalos`;

// --- VARIABLES GLOBALES ---
let guestList = [];
let selectedGuest = null;

// --- FUNCIONES DE INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    fetchGuests();
    fetchAndDisplayGifts();
    
    document.getElementById('guest-search').addEventListener('keyup', handleSearch);
    document.getElementById('rsvp-form').addEventListener('submit', handleRsvpSubmit);
});

async function fetchGuests() {
    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL); 
        const result = await response.json();
        if (result.status === 'success') {
            guestList = result.data;
        } else {
            console.error("Error al cargar la lista de invitados:", result.message);
        }
    } catch (error) {
        console.error("Error de conexión al cargar invitados:", error);
    }
}

// --- LÓGICA DE CONFIRMACIÓN DE ASISTENCIA (RSVP) ---
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const resultsContainer = document.getElementById('search-results');
    
    if (searchTerm.length < 2) {
        resultsContainer.innerHTML = '';
        return;
    }

    const filteredGuests = guestList.filter(guest => 
        guest.nombre.toLowerCase().includes(searchTerm)
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

// --- FUNCIÓN ACTUALIZADA ---
// Ahora crea checkboxes dinámicamente
function selectGuest(guest) {
    selectedGuest = guest;
    
    document.getElementById('guest-search').value = guest.nombre;
    document.getElementById('search-results').innerHTML = '';

    const form = document.getElementById('rsvp-form');
    form.classList.remove('hidden');

    document.getElementById('guest-name-display').textContent = `Confirmación para: ${guest.nombre}`;
    document.getElementById('guest-id').value = guest.id;

    // --- LÓGICA NUEVA ---
    const checkboxContainer = document.getElementById('guest-checkbox-container');
    checkboxContainer.innerHTML = ''; // Limpiar checkboxes anteriores
    
    // Obtenemos los nombres del string "Andrés, Ysleidid" y los convertimos en un array
    const names = guest.nombres_asignados.split(',').map(name => name.trim());
    
    // Creamos un checkbox por cada nombre
    names.forEach((name, index) => {
        if(name) { // Evitar crear checkboxes vacíos si hay comas extra
            const wrapper = document.createElement('div');
            wrapper.className = 'checkbox-wrapper';
            wrapper.innerHTML = `
                <input type="checkbox" id="guest_${index}" value="${name}" checked>
                <label for="guest_${index}">${name}</label>
            `;
            checkboxContainer.appendChild(wrapper);
        }
    });
}

// --- FUNCIÓN ACTUALIZADA ---
// Ahora lee los checkboxes en lugar de un número
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

    // --- LÓGICA NUEVA ---
    // Recolectamos los nombres de los checkboxes que están marcados
    const confirmedNames = [];
    const checkboxes = document.querySelectorAll('#guest-checkbox-container input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        confirmedNames.push(checkbox.value);
    });

    const data = {
        action: 'submitRsvp',
        guestId: selectedGuest.id,
        confirmedNames: confirmedNames, // Enviamos el array de nombres
        mensaje: document.getElementById('mensaje-invitado').value
    };
    
    // --- LÓGICA RESTANTE (sin cambios) ---
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


// --- LÓGICA DE LISTA DE REGALOS (sin cambios) ---
async function fetchAndDisplayGifts() {
    const container = document.getElementById('lista-regalos-container');
    container.innerHTML = '<p>Cargando regalos...</p>';
    try {
        const response = await fetch(giftsCsvUrl);
        if (!response.ok) throw new Error('Error al cargar la lista.');
        const csvText = await response.text();
        const gifts = parseCsv(csvText);
        container.innerHTML = '';
        gifts.forEach(gift => {
            const disponible = gift.necesarios - gift.reservados;
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="${gift.foto}" alt="${gift.nombre}">
                <div class="card-content">
                    <h3>${gift.nombre}</h3>
                    <p>${gift.descripcion}</p>
                </div>
                <div class="card-footer">
                    <span>Disponibles: ${disponible}</span>
                    <button id="btn-${gift.id}" ${disponible <= 0 ? 'disabled' : ''}>
                        ${disponible <= 0 ? 'Reservado' : 'Reservar'}
                    </button>
                </div>
            `;
            container.appendChild(card);
            if (disponible > 0) {
                document.getElementById(`btn-${gift.id}`).addEventListener('click', () => reserveGift(gift.id));
            }
        });
    } catch (error) {
        container.innerHTML = `<p>No se pudieron cargar los regalos.</p>`;
        console.error('Error fetching gifts:', error);
    }
}

async function reserveGift(giftId) {
    const button = document.getElementById(`btn-${giftId}`);
    button.disabled = true;
    button.textContent = 'Reservando...';
    try {
        await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ action: 'reserveGift', giftId: giftId })
        });
        setTimeout(() => {
            alert('¡Gracias por tu regalo!');
            fetchAndDisplayGifts();
        }, 1500);
    } catch (error) {
        console.error('Error al reservar regalo:', error);
        alert('Hubo un error al reservar. Por favor, intenta de nuevo.');
        button.disabled = false;
        button.textContent = 'Reservar';
    }
}

function parseCsv(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => JSON.parse(h.trim()));
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => JSON.parse(v.trim()));
        let obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index];
        });
        data.push(obj);
    }
    return data;
}