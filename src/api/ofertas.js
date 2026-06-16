import apiClient from "./client";

/**
 * Ofertas API - Endpoints de ofertas de pasantía (rol pasante)
 *
 * GET  /pasante/ofertas          → listar ofertas disponibles
 * GET  /pasante/ofertas/:id      → detalle de una oferta
 * POST /pasante/ofertas/:id/postular → postularse a una oferta
 * GET  /inscripcion              → todas las inscripciones (filtrar por userId en cliente)
 */

export const getOfertas = async () => {
  const response = await apiClient.get("/pasante/ofertas");
  return response.data;
};

export const getOferta = async (id) => {
  const response = await apiClient.get(`/pasante/ofertas/${id}`);
  return response.data;
};

export const postularse = async (id) => {
  const response = await apiClient.post(`/pasante/ofertas/${id}/postular`);
  return response.data;
};

/**
 * Obtiene las inscripciones activas del pasante actual.
 *
 * Un pasante NO puede postularse a otra oferta si tiene
 * inscripción con estado "aceptado" o "completado".
 *
 * @param {number} userId - ID del usuario actual (user.id)
 * @returns {Promise<{bloqueado: boolean, inscription: object|null, empresa: string|null}>}
 */
export const getInscripcionActiva = async (userId) => {
  try {
    const response = await apiClient.get("/inscripcion");
    const inscripciones = response.data?.data || [];

    // Filtrar inscripciones del pasante actual
    const misInscripciones = inscripciones.filter(
      (insc) => insc.pasante?.user_id === userId
    );

    // Buscar si tiene aceptada o completada (bloquea postulación)
    const bloqueante = misInscripciones.find(
      (insc) => insc.estado === "aceptado" || insc.estado === "completado"
    );

    if (bloqueante) {
      return {
        bloqueado: true,
        inscripcion: bloqueante,
        empresa: bloqueante.oferta?.empresa?.nomEmpresa || null,
        estado: bloqueante.estado,
      };
    }

    return { bloqueado: false, inscripcion: null, empresa: null, estado: null };
  } catch (error) {
    // Si falla la consulta, permitir postular (fail open)
    console.warn("Error verificando inscripción activa:", error.message);
    return { bloqueado: false, inscripcion: null, empresa: null, estado: null };
  }
};
