// Reglas de horario para las pruebas de manejo (responsable: Persona 5)
// Las usan citas.js (usuario) y adminCitas.js (administrador).
//
//   Lunes a viernes: 9:00 a 18:30 (cada 30 minutos)
//   Sábado:          9:00 a 13:30
//   Domingo:         cerrado
//   Se puede agendar desde hoy (horas que aún no pasan) hasta 60 días después.

const DIAS_MAXIMOS = 60;

function horasDelDia(fecha) {
  const dia = new Date(fecha + 'T12:00:00').getDay(); // 0 = domingo, 6 = sábado
  if (dia === 0) return [];
  const ultima = dia === 6 ? 13.5 : 18.5;
  const horas = [];
  for (let h = 9; h <= ultima; h += 0.5) {
    horas.push(String(Math.floor(h)).padStart(2, '0') + ':' + (h % 1 ? '30' : '00'));
  }
  return horas;
}

// Fecha de hoy en la hora local del servidor, como "AAAA-MM-DD"
function hoyTexto() {
  const ahora = new Date();
  return [ahora.getFullYear(), String(ahora.getMonth() + 1).padStart(2, '0'), String(ahora.getDate()).padStart(2, '0')].join('-');
}

function sumarDias(fecha, dias) {
  const d = new Date(fecha + 'T12:00:00');
  d.setDate(d.getDate() + dias);
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

// ¿Esa fecha y hora ya pasaron?
function yaPaso(fecha, hora) {
  return new Date(`${fecha}T${hora.slice(0, 5)}:00`) <= new Date();
}

// Revisa fecha y hora; si algo está mal regresa el mensaje para el usuario, si todo bien regresa null
function revisarFechaHora(fecha, hora) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(new Date(fecha + 'T12:00:00').getTime())) {
    return 'Elige una fecha válida.';
  }
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(hora)) return 'Elige una hora válida.';
  if (fecha > sumarDias(hoyTexto(), DIAS_MAXIMOS)) return `Solo se puede agendar hasta ${DIAS_MAXIMOS} días adelante.`;

  const horas = horasDelDia(fecha);
  if (horas.length === 0) return 'Los domingos la agencia está cerrada.';
  if (!horas.includes(hora.slice(0, 5))) return 'Esa hora está fuera del horario de atención.';
  if (yaPaso(fecha, hora)) return 'Esa fecha y hora ya pasaron.';
  return null;
}

module.exports = { horasDelDia, hoyTexto, sumarDias, yaPaso, revisarFechaHora, DIAS_MAXIMOS };
