import apiClient from "./client";
import API_CONFIG from "../config/api";
import { getToken } from "../storage/tokenStorage";

/**
 * Evidencias API - Subida y consulta de evidencias
 *
 * POST /pasante/evidencias           → subir evidencia (multipart/form-data)
 * GET  /pasante/evidencias?idActividad=X → evidencias de una actividad
 *
 * NOTA IMPORTANTE: uploadEvidencia usa XMLHttpRequest en vez de fetch/axios
 * porque React Native tiene bugs conocidos con FormData en ambos.
 * XHR es la única forma confiable de subir archivos en RN.
 */

export const uploadEvidencia = (formData) => {
  return new Promise(async (resolve, reject) => {
    const token = await getToken();
    const url = `${API_CONFIG.BASE_URL}/pasante/evidencias`;

    const xhr = new XMLHttpRequest();

    xhr.open('POST', url);

    // Headers
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    // NO setear Content-Type — XHR lo genera automáticamente con boundary

    xhr.onload = () => {
      try {
        // Intentar parsear como JSON directo
        const data = JSON.parse(xhr.responseText);

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          const error = new Error(data.message || `Error ${xhr.status}`);
          error.response = { status: xhr.status, data };
          reject(error);
        }
      } catch (parseErr) {
        // El servidor devolvió HTML mezclado con JSON (ej: warning de PHP)
        // Intentar extraer la parte JSON de la respuesta corrupta
        const text = xhr.responseText || '';
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');

        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          try {
            const jsonPart = text.substring(jsonStart, jsonEnd + 1);
            const data = JSON.parse(jsonPart);

            // Si hay un warning de PHP, incluirlo en el mensaje
            const phpWarning = text.substring(0, jsonStart).replace(/<[^>]+>/g, '').trim();
            const fullMessage = phpWarning
              ? `⚠️ Error del servidor: ${phpWarning}\n\n${data.message || ''}`
              : data.message || `Error ${xhr.status}`;

            const error = new Error(fullMessage);
            error.response = { status: xhr.status, data };
            reject(error);
            return;
          } catch {
            // No se pudo extraer JSON, continuar con fallback
          }
        }

        // Fallback: no se pudo parsear nada
        console.error('[Upload] Respuesta no es JSON:', text?.substring(0, 300));
        const error = new Error(
          xhr.status === 404
            ? 'El servidor no encontró el endpoint. Verificá la URL.'
            : xhr.status === 500
            ? 'Error interno del servidor. Revisá los logs del backend.'
            : xhr.status === 422
            ? 'El servidor rechazó la subida. Verificá que el archivo sea válido (PNG, JPG, PDF) y no supere 2 MB.'
            : `Error del servidor (${xhr.status}).`
        );
        error.response = { status: xhr.status, data: null };
        reject(error);
      }
    };

    xhr.onerror = () => {
      reject(new Error('Error de conexión. Verificá tu internet.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('La subida tardó demasiado. Intentá de nuevo.'));
    };

    xhr.timeout = 30000; // 30 segundos para subir archivos
    xhr.send(formData);
  });
};

export const getEvidencias = async (actividadId) => {
  const response = await apiClient.get("/pasante/evidencias", {
    params: { idActividad: actividadId },
  });
  return response.data;
};
