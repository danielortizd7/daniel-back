const mongoose = require('mongoose');
const Usuario = require('../shared/models/usuarioModel');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createAdminUser = async () => {
    try {
        // Conectar a la base de datos usando la URL correcta
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Conectado a la base de datos');

        // Verificar si ya existe un usuario administrador
        const adminExists = await Usuario.findOne({ email: 'danielortizd7@gmail.com' });
        if (adminExists) {
            console.log('Ya existe un usuario administrador');
            process.exit(0);
        }

        // Crear el usuario administrador con las credenciales específicas
        const adminUser = new Usuario({
            nombre: 'Daniel Ortiz',
            email: 'danielortizd7@gmail.com',
            documento: '1',
            rol: 'administrador',
            activo: true
        });

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        adminUser.password = await bcrypt.hash('Daniel123!', salt);

        // Guardar el usuario
        await adminUser.save();
        console.log('Usuario administrador creado exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('Error al crear usuario administrador:', error);
        process.exit(1);
    }
};

createAdminUser(); 