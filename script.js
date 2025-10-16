// --- CONFIGURACIÓN ---
const GOOGLE_SHEET_ID = "AKfycbxkAZjc3kF7LMKdm0HeTrojprjL4Dw7YpOUetuQddMW82aaSxG7zWt9NeGfCkBLRDm3"; // EXTRAE ESTO DE LA URL DE TU HOJA
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxkAZjc3kF7LMKdm0HeTrojprjL4Dw7YpOUetuQddMW82aaSxG7zWt9NeGfCkBLRDm3/exec"; // PEGA LA URL DE TU SCRIPT AQUÍ

// La URL pública de la pestaña "Regalos" en formato CSV
const giftsCsvUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Regalos`;

// --- FUNCIONES PRINCIPALES ---

// Función para obtener y mostrar los regalos desde el CSV público
async function fetchAndDisplayGifts() {
    const container = document.getElementById('lista-regalos-container');
    container.innerHTML = '<p>Cargando regalos...</p>';

    try {
        const response = await fetch(giftsCsvUrl);
        if (!response.ok) throw new Error('Error al cargar la lista.');
        
        const csvText = await response.text();
        const gifts = parseCsv(csvText);

        container.innerHTML = ''; // Limpiar el mensaje de "cargando"
        
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
                document.getElementById(`btn-${gift.id}`).addEventListener('click', () => {
                    reserveGift(gift.id);
                });
            }
        });

    } catch (error) {
        container.innerHTML = `<p>No se pudieron cargar los regalos. Intenta de nuevo más tarde.</p>`;
        console.error('Error fetching gifts:', error);
    }
}

// Función para reservar un regalo enviando datos al Apps Script
async function reserveGift(giftId) {
    const button = document.getElementById(`btn-${giftId}`);
    button.disabled = true;
    button.textContent = 'Reservando...';

    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Importante para peticiones simples
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reserveGift', giftId: giftId })
        });
        
        // No podemos leer la respuesta con 'no-cors', pero si la petición llega, es suficiente.
        // Esperamos un momento y refrescamos la lista para mostrar el cambio.
        setTimeout(() => {
            alert('¡Gracias por tu regalo!');
            fetchAndDisplayGifts();
        }, 1500);

    } catch (error) {
        console.error('Error reserving gift:', error);
        alert('Hubo un error al reservar. Por favor, intenta de nuevo.');
        button.disabled = false;
        button.textContent = 'Reservar';
    }
}

// Función para manejar el envío del formulario de RSVP
async function handleRsvpSubmit(event) {
    event.preventDefault(); // Evitar que la página se recargue
    const form = event.target;
    const button = form.querySelector('button');
    const responseEl = document.getElementById('form-response');
    
    button.disabled = true;
    button.textContent = 'Enviando...';

    const data = {
        action: 'submitRsvp',
        nombre: document.getElementById('nombre-invitado').value,
        asistentes: document.getElementById('cantidad-asistentes').value,
        mensaje: document.getElementById('mensaje-invitado').value
    };

    try {
        await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        responseEl.textContent = '¡Confirmación recibida! Gracias.';
        responseEl.style.color = 'green';
        form.reset();

    } catch (error) {
        console.error('Error submitting RSVP:', error);
        responseEl.textContent = 'Hubo un error. Intenta de nuevo.';
        responseEl.style.color = 'red';
    } finally {
        setTimeout(() => {
            button.disabled = false;
            button.textContent = 'Confirmar Asistencia';
        }, 2000);
    }
}


// --- LÓGICA AUXILIAR ---

// Función simple para parsear texto CSV a un array de objetos
function parseCsv(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => JSON.parse(h));
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g).map(v => JSON.parse(v));
        let obj = {};
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = values[j];
        }
        data.push(obj);
    }
    return data;
}

// --- INICIAR LA APLICACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayGifts();
    document.getElementById('rsvp-form').addEventListener('submit', handleRsvpSubmit);
});