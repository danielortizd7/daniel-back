const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");


const generarPDF = async (muestra, cedulaCliente, firmaCliente, cedulaLaboratorista, firmaLaboratorista) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const nombreArchivo = `muestra_${muestra.id_muestra}.pdf`;
            const rutaArchivo = path.join(process.cwd(), "public", "pdfs", nombreArchivo);

            // Crear directorio si no existe
            if (!fs.existsSync(path.dirname(rutaArchivo))) {
                fs.mkdirSync(path.dirname(rutaArchivo), { recursive: true });
            }

            const stream = fs.createWriteStream(rutaArchivo);
            doc.pipe(stream);

            // Configurar fuente
            doc.font("Helvetica-Bold");

            // Título
            doc.fontSize(16).text("Reporte de Muestra", { align: "center" }).moveDown(2);

            // Información de la muestra
            doc.fontSize(12)
                .text(`ID Muestra: ${muestra.id_muestra}`)
                .text(`Fecha y Hora: ${muestra.fechaHora ? new Date(muestra.fechaHora).toLocaleString() : "No disponible"}`)
                .text(`Documento Cliente: ${muestra.documento}`)
                .text(`Tipo de Muestreo: ${muestra.tipoMuestreo}`)
                .moveDown(2);

            // Análisis
            doc.text("Análisis Seleccionados:").moveDown(0.5);
            if (Array.isArray(muestra.analisisSeleccionados)) {
                muestra.analisisSeleccionados.forEach((analisis, index) => {
                    doc.text(`   ${index + 1}. ${analisis}`);
                });
            }
            doc.moveDown(2);

            // Procesar firmas
            const firmaY = doc.y;
            const firmaLaboratoristaX = 50;
            const firmaClienteX = 350;

            // Firma Laboratorista
            if (firmaLaboratorista) {
                try {
                    const firmaBase64 = firmaLaboratorista.replace(/^data:image\/\w+;base64,/, "");
                    const firmaBuffer = Buffer.from(firmaBase64, "base64");
                    doc.image(firmaBuffer, firmaLaboratoristaX, firmaY, { width: 150 });
                    doc.text(`Cédula Laboratorista: ${cedulaLaboratorista}`, firmaLaboratoristaX, firmaY + 55);
                    doc.text("Firma Laboratorista", firmaLaboratoristaX, firmaY + 70);
                } catch (error) {
                    console.error("Error al procesar firma del laboratorista:", error);
                }
            }

            // Firma Cliente
            if (firmaCliente) {
                try {
                    const firmaBase64 = firmaCliente.replace(/^data:image\/\w+;base64,/, "");
                    const firmaBuffer = Buffer.from(firmaBase64, "base64");
                    doc.image(firmaBuffer, firmaClienteX, firmaY, { width: 150 });
                    doc.text(`Cédula Cliente: ${cedulaCliente}`, firmaClienteX, firmaY + 55);
                    doc.text("Firma Cliente", firmaClienteX, firmaY + 70);
                } catch (error) {
                    console.error("Error al procesar firma del cliente:", error);
                }
            }

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