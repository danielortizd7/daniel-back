const { TipoAgua } = require('../models/muestrasModel');

const tiposAguaPredeterminados = [
    {
        tipo: 'potable',
        descripcion: 'Agua tratada apta para consumo humano'
    },
    {
        tipo: 'natural',
        descripcion: 'Agua de fuentes naturales como ríos, lagos o manantiales'
    },
    {
        tipo: 'residual',
        descripcion: 'Agua que ha sido utilizada y contiene desechos'
    },
    {
        tipo: 'otra',
        descripcion: 'Otros tipos de agua no categorizados'
    }
];

const inicializarTiposAgua = async () => {
    try {
        for (const tipo of tiposAguaPredeterminados) {
            await TipoAgua.findOneAndUpdate(
                { tipo: tipo.tipo },
                tipo,
                { upsert: true, new: true }
            );
        }
        console.log('Tipos de agua predeterminados inicializados correctamente');
    } catch (error) {
        console.error('Error al inicializar tipos de agua:', error);
    }
};

module.exports = {
    inicializarTiposAgua
};
