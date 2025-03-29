class ResponseHandler {
    static success(res, data = {}, message = 'Operación exitosa') {
        return res.status(200).json({
            success: true,
            message,
            data
        });
    }

    static created(res, data = {}, message = 'Recurso creado exitosamente') {
        return res.status(201).json({
            success: true,
            message,
            data
        });
    }

    static error(res, error) {
        const statusCode = error.statusCode || 500;
        const errorResponse = {
            success: false,
            message: error.message || 'Error interno del servidor',
            errorCode: error.errorCode || 'INTERNAL_SERVER_ERROR'
        };

        if (error.errors) {
            errorResponse.errors = error.errors;
        }

        return res.status(statusCode).json(errorResponse);
    }

    static noContent(res) {
        return res.status(204).send();
    }
}

module.exports = {
    ResponseHandler
}; 