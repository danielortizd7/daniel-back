const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generarPDF = async (muestra, cedulaCliente, firmaCliente, cedulaAdministrador, firmaAdministrador) => {
    return new Promise((resolve, reject) => {
        try {
            console.log("Iniciando generación de PDF para:", muestra.id_muestra);
            
            const doc = new PDFDocument({ margin: 50 });
            const nombreArchivo = `muestra_${muestra.id_muestra}.pdf`;
            const rutaArchivo = path.join(process.cwd(), "public", "pdfs", nombreArchivo);

            // Crear directorio si no existe
            if (!fs.existsSync(path.dirname(rutaArchivo))) {
                fs.mkdirSync(path.dirname(rutaArchivo), { recursive: true });
            }

            const stream = fs.createWriteStream(rutaArchivo);
            doc.pipe(stream);

            // Título
            doc.fontSize(16)
               .text("Reporte de Muestra", { align: "center" })
               .moveDown(2);

            // Información básica
            doc.fontSize(12)
               .text(`ID Muestra: ${muestra.id_muestra}`)
               .text(`Fecha y Hora: ${muestra.fechaHora ? new Date(muestra.fechaHora).toLocaleString() : "No disponible"}`)
               .text(`Documento Cliente: ${muestra.documento || "No disponible"}`)
               .text(`Tipo de Muestreo: ${muestra.tipoMuestreo || "No especificado"}`)
               .moveDown(2);

            // Análisis seleccionados
            doc.text("Análisis Seleccionados:", { underline: true }).moveDown(0.5);
            if (Array.isArray(muestra.analisisSeleccionados)) {
                muestra.analisisSeleccionados.forEach((analisis, index) => {
                    doc.text(`   ${index + 1}. ${analisis}`);
                });
            }
            doc.moveDown(2);

            // Espacio para firmas
            const firmaY = doc.y;
            const firmaAdminX = 50;
            const firmaClienteX = 350;

            // Siempre mostrar espacio para firma del administrador
            doc.text("Firma del Administrador", firmaAdminX, firmaY);
            doc.rect(firmaAdminX, firmaY + 20, 200, 60).stroke();
            doc.text(`Cédula: ${cedulaAdministrador || "Pendiente"}`, firmaAdminX, firmaY + 90);

            // Espacio para firma del cliente
            doc.text("Firma del Cliente", firmaClienteX, firmaY);
            doc.rect(firmaClienteX, firmaY + 20, 200, 60).stroke();
            doc.text(`Documento: ${cedulaCliente || "No disponible"}`, firmaClienteX, firmaY + 90);

            // Nota al pie
            doc.moveDown(4)
               .fontSize(10)
               .text("Este documento es un registro oficial de la muestra.", { align: "center" });

            doc.end();

            stream.on("finish", () => {
                console.log("PDF generado exitosamente:", rutaArchivo);
                resolve(`/pdfs/${nombreArchivo}`);
            });

            stream.on("error", (error) => {
                console.error("Error al escribir el PDF:", error);
                reject(error);
            });

        } catch (error) {
            console.error("Error al generar PDF:", error);
            reject(error);
        }
    });
};

module.exports = generarPDF;