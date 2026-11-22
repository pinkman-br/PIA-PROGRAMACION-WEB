// Lógica del Panel de administración (responsable: Persona 4)
// Muestra cuántas unidades y cuentas hay, usando las APIs de administrador.

sesionAdmin.then(async (admin) => {
  document.getElementById('saludo').textContent = `Hola, ${admin.nombre_completo.split(' ')[0]}. Elige qué quieres administrar.`;

  try {
    const autos = await api.get('/api/admin/automoviles');
    document.getElementById('numDisponibles').textContent = autos.filter((a) => a.estatus === 'Disponible').length;
    document.getElementById('numVendidos').textContent = autos.filter((a) => a.estatus === 'Vendido').length;
  } catch (e) { /* si falla, se queda el guion */ }

  try {
    const usuarios = await api.get('/api/admin/usuarios');
    document.getElementById('numUsuarios').textContent = usuarios.length;
  } catch (e) { /* si falla, se queda el guion */ }
});
