/**
 * Base de la API. Es relativa a propósito: en desarrollo `ng serve` la redirige al backend con
 * `proxy.conf.json` (sin CORS), y en producción debe servirse desde el mismo origen (reverse proxy).
 */
export const API_BASE = '/api';
