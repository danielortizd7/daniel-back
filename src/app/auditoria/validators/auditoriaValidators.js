const { body, query } = require("express-validator");

const obtenerRegistros = [
  query("fechaInicio")
    .optional()
    .isISO8601()
    .withMessage("La fecha de inicio debe ser una fecha válida"),
  query("fechaFin")
    .optional()
    .isISO8601()
    .withMessage("La fecha de fin debe ser una fecha válida"),
  query("usuario")
    .optional()
    .isString()
    .withMessage("El usuario debe ser una cadena de texto"),
  query("rol")
    .optional()
    .isIn(["administrador", "laboratorista", "cliente"])
    .withMessage("El rol debe ser uno de: administrador, laboratorista, cliente"),
  query("accion")
    .optional()
    .isIn(["GET", "POST", "PUT", "DELETE"])
    .withMessage("La acción debe ser una de: GET, POST, PUT, DELETE"),
  query("estado")
    .optional()
    .isIn(["exitoso", "fallido"])
    .withMessage("El estado debe ser uno de: exitoso, fallido"),
  query("pagina")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número entero positivo"),
  query("limite")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe ser un número entero entre 1 y 100")
];

const exportarRegistros = [
  query("fechaInicio")
    .optional()
    .isISO8601()
    .withMessage("La fecha de inicio debe ser una fecha válida"),
  query("fechaFin")
    .optional()
    .isISO8601()
    .withMessage("La fecha de fin debe ser una fecha válida"),
  query("usuario")
    .optional()
    .isString()
    .withMessage("El usuario debe ser una cadena de texto"),
  query("rol")
    .optional()
    .isIn(["administrador", "laboratorista", "cliente"])
    .withMessage("El rol debe ser uno de: administrador, laboratorista, cliente"),
  query("accion")
    .optional()
    .isIn(["GET", "POST", "PUT", "DELETE"])
    .withMessage("La acción debe ser una de: GET, POST, PUT, DELETE"),
  query("estado")
    .optional()
    .isIn(["exitoso", "fallido"])
    .withMessage("El estado debe ser uno de: exitoso, fallido")
];

const filtrarRegistros = [
  query("fechaInicio")
    .optional()
    .isISO8601()
    .withMessage("La fecha de inicio debe ser una fecha válida"),
  query("fechaFin")
    .optional()
    .isISO8601()
    .withMessage("La fecha de fin debe ser una fecha válida"),
  query("usuario")
    .optional()
    .isString()
    .withMessage("El usuario debe ser una cadena de texto"),
  query("rol")
    .optional()
    .isIn(["administrador", "laboratorista", "cliente"])
    .withMessage("El rol debe ser uno de: administrador, laboratorista, cliente"),
  query("accion")
    .optional()
    .isIn(["GET", "POST", "PUT", "DELETE"])
    .withMessage("La acción debe ser una de: GET, POST, PUT, DELETE"),
  query("estado")
    .optional()
    .isIn(["exitoso", "fallido"])
    .withMessage("El estado debe ser uno de: exitoso, fallido"),
  query("idMuestra")
    .optional()
    .isString()
    .withMessage("El ID de la muestra debe ser una cadena de texto")
];

module.exports = {
  obtenerRegistros,
  exportarRegistros,
  filtrarRegistros
}; 