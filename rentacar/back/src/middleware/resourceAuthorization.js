/**
 * @module middleware/resourceAuthorization
 * @description Middleware para autorización basada en propiedad de recursos
 * Permite acceso si el usuario es propietario del recurso o es administrador
 */

/**
 * Verifica si un usuario tiene acceso a un recurso específico
 * Retorna true si el usuario es admin O es propietario del recurso
 * 
 * @param {string|ObjectId} userId - ID del usuario autenticado (req.user.id o req.user.idUser)
 * @param {string|ObjectId} resourceOwnerId - ID del propietario del recurso
 * @param {string} userRole - Rol del usuario (req.user.rol)
 * @returns {boolean} true si tiene acceso, false si no
 */
const canAccessResource = (userId, resourceOwnerId, userRole = null) => {
  // Admin tiene acceso a todo
  if (userRole === 'admin') {
    return true;
  }
  
  // Comparar IDs como strings para evitar problemas de tipos
  // MongoDB ObjectId vs idUser numérico vs string
  const normalizedUserId = String(userId).trim();
  const normalizedOwnerId = String(resourceOwnerId).trim();
  
  return normalizedUserId === normalizedOwnerId;
};

/**
 * Middleware factory: crea un middleware que verifica acceso a un recurso
 * Espera que el recurso esté disponible en req.resource y el ID del propietario 
 * esté en req.resource.ownerField
 * 
 * @param {string} ownerField - Nombre del campo en el recurso que contiene el ID del propietario
 *                               (ej: 'usuario' para reservas, '_id' para usuarios)
 * @returns {Function} Middleware que verifica acceso o retorna 403
 */
const requireResourceOwnershipOrAdmin = (ownerField = 'usuario') => {
  return (req, res, next) => {
    if (!req.resource) {
      return res.status(500).json({
        success: false,
        message: 'Recurso no cargado. El middleware debe ejecutarse después de cargar el recurso.'
      });
    }

    const ownerId = req.resource[ownerField];
    if (!ownerId) {
      return res.status(500).json({
        success: false,
        message: `Campo '${ownerField}' no encontrado en el recurso.`
      });
    }

    if (!canAccessResource(req.user.id, ownerId, req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a este recurso'
      });
    }

    next();
  };
};

/**
 * Helper para validar acceso directo en controlador
 * Llama a esta función dentro del controlador si prefieres validación inline
 * 
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object|string|ObjectId} resourceOwnerId - ID del propietario del recurso
 * @param {string} errorMessage - Mensaje de error personalizado (opcional)
 * @returns {Object|null} Respuesta JSON de error si no tiene acceso, null si tiene acceso
 */
const sendUnauthorizedIfNoAccess = (req, resourceOwnerId, errorMessage = null) => {
  if (!canAccessResource(req.user.id, resourceOwnerId, req.user.rol)) {
    return {
      success: false,
      message: errorMessage || 'No tienes permiso para acceder a este recurso',
      statusCode: 403
    };
  }
  return null;
};

module.exports = {
  canAccessResource,
  requireResourceOwnershipOrAdmin,
  sendUnauthorizedIfNoAccess
};
