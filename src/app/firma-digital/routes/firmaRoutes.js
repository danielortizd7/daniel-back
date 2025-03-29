const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const { firmaValidators } = require("../../../shared/validators");
const ResponseHandler = require("../../../shared/utils/responseHandler");
const firmaController = require("../controllers/firmaController");
const { verificarDocumento, verificarLaboratorista } = require("../../../shared/middleware/authMiddleware");

const { guardarFirma, buscarMuestra, obtenerTodasLasFirmas } = require("../controllers/firmaController");
const { generarReportePDF } = require("../controllers/pdfController");

router.get("/todas", verificarDocumento, obtenerTodasLasFirmas);

router.get(
  "/buscar/:idMuestra", 
  verificarDocumento,
  firmaValidators.buscarMuestra, 
  firmaController.buscarMuestra
);

router.post(
  "/guardarFirma",
  verificarDocumento,
  verificarLaboratorista,
  firmaValidators.guardarFirma,
  guardarFirma
);

router.get(
  "/generar-pdf/:idMuestra",
  verificarDocumento,
  firmaValidators.buscarMuestra,
  generarReportePDF
);

// Modificar esta ruta para usar la carpeta public/pdfs
router.get("/pdfs/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const fileName = `muestra_${id.trim().toUpperCase()}.pdf`;
        const filePath = path.join(process.cwd(), "public", "pdfs", fileName);

        if (!fs.existsSync(filePath)) {
            console.warn(`Archivo PDF no encontrado: ${filePath}`);
            return ResponseHandler.error(res, new NotFoundError("PDF no encontrado"));
        }

        console.log("Enviando PDF:", filePath);
        res.setHeader("Content-Type", "application/pdf");
        res.sendFile(filePath);
    } catch (error) {
        console.error("Error al obtener el PDF:", error);
        return ResponseHandler.error(res, error);
    }
});

module.exports = router;
