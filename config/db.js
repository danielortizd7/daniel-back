const mongoose = require("mongoose");
require("dotenv").config();

let connectionAttempts = 0;

const connectDB = async () => {
  try {
    connectionAttempts++;
    

    if (mongoose.connection.readyState === 1) {
      console.log("Ya conectado a MongoDB");
      return;
    }

    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error("ERROR: No se encontró la variable MONGO_URI");
      process.exit(1);
    }

    await mongoose.connect(uri, {
    
    });

    console.log("Conexión exitosa a MongoDB");
  } catch (error) {
    console.error("Error de conexión:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
