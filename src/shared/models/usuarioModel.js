const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    documento: {
        type: String,
        required: true,
        unique: true
    },
    rol: {
        type: String,
        enum: ['administrador', 'laboratorista', 'cliente'],
        default: 'laboratorista'
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
});

const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', usuarioSchema);

// Crear usuario temporal para pruebas si no existe
const crearUsuarioTemporal = async () => {
    try {
        const usuarioExistente = await Usuario.findOne({ email: 'danielortizd7@gmail.com' });
        if (!usuarioExistente) {
            const usuario = new Usuario({
                nombre: 'Daniel Ortiz',
                email: 'danielortizd7@gmail.com',
                documento: '12345678',
                rol: 'administrador'
            });
            await usuario.save();
            console.log('Usuario temporal creado:', usuario);
        }
    } catch (error) {
        console.error('Error al crear usuario temporal:', error);
    }
};

crearUsuarioTemporal();

module.exports = Usuario; 