class AppError extends Error {
    constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Recurso no encontrado') {
        super(message, 404, 'NOT_FOUND');
    }
}

class ValidationError extends AppError {
    constructor(message = 'Datos inválidos', errors = null) {
        super(message, 400, 'VALIDATION_ERROR');
        this.errors = errors;
    }
}

class DatabaseError extends AppError {
    constructor(message = 'Error en la base de datos') {
        super(message, 500, 'DATABASE_ERROR');
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Error de autenticación') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

module.exports = {
    AppError,
    NotFoundError,
    ValidationError,
    DatabaseError,
    AuthenticationError
}; 