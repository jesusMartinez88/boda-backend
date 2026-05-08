/**
 * Utilidades de validación centralizadas
 */

import DOMPurify from 'isomorphic-dompurify';

// Límites de longitud de campos
export const FIELD_LIMITS = {
  // Contactos
  CONTACT_NAME: 100,
  
  // Invitados
  GUEST_NAME: 100,
  GUEST_EMAIL: 255,
  GUEST_PHONE: 20,
  GUEST_ALLERGIES: 500,
  GUEST_NOTES: 1000,
  
  // Mesas
  TABLE_NAME: 50,
  
  // Finanzas
  FINANCE_DESCRIPTION: 200,
  FINANCE_CATEGORY: 50,
  FINANCE_PAID_BY: 100,
  
  // Tareas
  TODO_NAME: 200,
  
  // Categorías
  CATEGORY_NAME: 50,
  CATEGORY_SLUG: 50,
};

/**
 * Valida la longitud de un campo
 * @param {string} value - Valor a validar
 * @param {number} maxLength - Longitud máxima permitida
 * @param {string} fieldName - Nombre del campo (para el mensaje de error)
 * @returns {object} - { valid: boolean, error?: string }
 */
export const validateLength = (value, maxLength, fieldName) => {
  if (!value) {
    return { valid: true };
  }
  
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} debe ser texto` };
  }
  
  if (value.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} debe tener máximo ${maxLength} caracteres (actual: ${value.length})`
    };
  }
  
  return { valid: true };
};

/**
 * Valida múltiples campos a la vez
 * @param {object} data - Objeto con los datos a validar
 * @param {object} rules - Objeto con las reglas { fieldName: maxLength }
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export const validateFields = (data, rules) => {
  const errors = [];
  
  for (const [fieldName, maxLength] of Object.entries(rules)) {
    const value = data[fieldName];
    const result = validateLength(value, maxLength, fieldName);
    
    if (!result.valid) {
      errors.push(result.error);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Sanitiza un string eliminando caracteres peligrosos
 * @param {string} value - Valor a sanitizar
 * @returns {string} - Valor sanitizado
 */
export const sanitizeString = (value) => {
  if (!value || typeof value !== 'string') return value;
  
  // Eliminar caracteres de control (excepto saltos de línea y tabs)
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
};

/**
 * Sanitiza HTML eliminando tags y scripts peligrosos
 * @param {string} html - HTML a sanitizar
 * @param {object} options - Opciones de sanitización
 * @returns {string} - HTML sanitizado
 */
export const sanitizeHTML = (html, options = {}) => {
  if (!html || typeof html !== 'string') return html;
  
  const defaultOptions = {
    ALLOWED_TAGS: [], // Por defecto, eliminar TODOS los tags HTML
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true, // Mantener el contenido de texto
    ...options
  };
  
  return DOMPurify.sanitize(html, defaultOptions);
};

/**
 * Sanitiza HTML permitiendo solo tags seguros (para rich text)
 * @param {string} html - HTML a sanitizar
 * @returns {string} - HTML sanitizado con tags seguros
 */
export const sanitizeRichText = (html) => {
  if (!html || typeof html !== 'string') return html;
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
};

/**
 * Sanitiza un objeto completo, aplicando sanitización a todos los strings
 * @param {object} data - Objeto a sanitizar
 * @param {array} htmlFields - Campos que deben sanitizarse como HTML
 * @param {array} richTextFields - Campos que permiten rich text
 * @returns {object} - Objeto sanitizado
 */
export const sanitizeObject = (data, htmlFields = [], richTextFields = []) => {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      if (richTextFields.includes(key)) {
        // Permitir rich text seguro
        sanitized[key] = sanitizeRichText(value);
      } else if (htmlFields.includes(key)) {
        // Eliminar TODO el HTML
        sanitized[key] = sanitizeHTML(value);
      } else {
        // Sanitización básica de strings
        sanitized[key] = sanitizeString(value);
      }
    }
  }
  
  return sanitized;
};

/**
 * Valida que un valor sea un número positivo
 * @param {any} value - Valor a validar
 * @param {string} fieldName - Nombre del campo
 * @returns {object} - { valid: boolean, error?: string }
 */
export const validatePositiveNumber = (value, fieldName) => {
  const num = Number(value);
  
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} debe ser un número` };
  }
  
  if (num < 0) {
    return { valid: false, error: `${fieldName} debe ser positivo` };
  }
  
  return { valid: true };
};

/**
 * Valida que un email tenga formato válido
 * @param {string} email - Email a validar
 * @returns {boolean} - true si es válido
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
