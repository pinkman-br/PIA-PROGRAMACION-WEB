// Ayudante para llamar a la API desde cualquier pantalla (responsable: Persona 1)
//
// Inclúyanlo en el HTML antes de su propio script:
//   <script src="/js/api.js"></script>
//
// Ejemplos:
//   const autos = await api.get('/api/automoviles?marca=Geely');
//   await api.post('/api/favoritos/3');
//   await api.put('/api/perfil', { nombre_completo: 'Ana', telefono: '8112345678' });
//
// Si la API responde con error, se lanza una excepción con el mensaje del servidor:
//   try { await api.post('/api/auth/login', datos); }
//   catch (e) { alert(e.message); }

const api = (() => {
  async function solicitud(metodo, url, datos) {
    const opciones = {
      method: metodo,
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin' // envía la cookie de sesión
    };
    if (datos !== undefined) {
      opciones.headers['Content-Type'] = 'application/json';
      opciones.body = JSON.stringify(datos);
    }

    const respuesta = await fetch(url, opciones);
    const texto = await respuesta.text();
    const cuerpo = texto ? JSON.parse(texto) : null;

    if (!respuesta.ok) {
      const error = new Error((cuerpo && cuerpo.error) || 'Error ' + respuesta.status);
      error.status = respuesta.status;
      throw error;
    }
    return cuerpo;
  }

  return {
    get:    (url)        => solicitud('GET', url),
    post:   (url, datos) => solicitud('POST', url, datos),
    put:    (url, datos) => solicitud('PUT', url, datos),
    patch:  (url, datos) => solicitud('PATCH', url, datos),
    delete: (url)        => solicitud('DELETE', url)
  };
})();
