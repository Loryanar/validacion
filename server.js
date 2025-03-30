
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { compararBases } = require('./compararBases');

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(express.static('public'));

let archivoGenerado = null;

app.post('/comparar', upload.fields([{ name: 'gestion' }, { name: 'sherpa' }]), async (req, res) => {
  const gestionPath = req.files['gestion'][0].path;
  const sherpaPath = req.files['sherpa'][0].path;
  const salidaPath = path.join(__dirname, 'resultados', 'resultado.xlsx');

  try {
    await compararBases(gestionPath, sherpaPath, salidaPath);
    archivoGenerado = salidaPath;
    res.sendFile(path.join(__dirname, 'public', 'resultado.html'));
  } catch (e) {
    console.error('Error:', e);
    res.status(500).send(
      '<h3>Error durante la comparación</h3>' +
      '<p>' + e.message + '</p>' +
      '<a href="/">Volver al formulario</a>'
    );
  }
});

app.get('/descargar', (req, res) => {
  if (!archivoGenerado) {
    return res.redirect('/');
  }

  res.download(archivoGenerado, 'Resultado_Comparacion.xlsx', (err) => {
    if (err) {
      console.error('Error al descargar:', err);
    }
    archivoGenerado = null;
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
