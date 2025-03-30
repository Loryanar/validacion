
const XLSX = require("xlsx");
const ExcelJS = require("exceljs");
const path = require("path");

function normalizar(texto) {
  return String(texto || "").trim().toUpperCase();
}

function reemplazarEstadoDoc(valor) {
  const map = {
    "action_needed": "Pendiente",
    "processing": "Procesando",
    "expired": "Expirado",
    "completed": "Completado"
  };
  return map[String(valor || 'completed').trim()] || valor;
}

async function compararBases(gestionPath, sherpaPath, salidaPath) {
  const gestionWB = XLSX.readFile(gestionPath);
  const sherpaWB = XLSX.readFile(sherpaPath);

  const gestion = XLSX.utils.sheet_to_json(gestionWB.Sheets[gestionWB.SheetNames[0]]);
  const sherpa = XLSX.utils.sheet_to_json(sherpaWB.Sheets[sherpaWB.SheetNames[0]]);

  const sherpaMap = {};
  for (const row of sherpa) {
    if (row.ffm_app_id) {
      const ffm = String(row.ffm_app_id).slice(0, 10);
      const aor = String(row.policy_aor || "").toLowerCase();

      let npn = "OP";
      if (aor.includes("yeritma ocando")) npn = "19422162";
      else if (aor.includes("jose horias")) npn = "19332397";
      else if (aor.includes("jesus oria")) npn = "20844963";
      else if (aor.includes("healthsherpa")) npn = "Referido";

      let estatus = "Other Party";
      const status = row.policy_status;
      if (!["Effectuated", "PendingEffectuation"].includes(status)) {
        estatus = "Cancelada";
      } else if (["yeritma ocando", "jose horias", "jesus oria", "healthsherpa"].some(n => aor.includes(n))) {
        estatus = "Activa";
      }

      const followup = reemplazarEstadoDoc(row.followup_docs || 'completed');

      sherpaMap[ffm] = {
        "Estatus poliza Sherpa": estatus,
        "EST DOCS SHERPA": followup,
        "MIEMBROS SHERPA": row.applicant_count,
        "PRIMA SHERPA": parseFloat(row.net_premium)?.toFixed(2),
        "COMPAÑÍA SHERPA": row.issuer,
        "NPN SHERPA": npn,
        "CORREO SHERPA": row.email
      };
    }
  }

  const campos = [
    ["Estatus poliza GESTION", "Estatus poliza Sherpa", "Estatus Comparacion"],
    ["EST DOCS GESTION", "EST DOCS SHERPA", "EST DOCS COMPARACION"],
    ["MIEMBROS GESTION", "MIEMBROS SHERPA", "MIEMBROS COMPARACION"],
    ["PRIMA GESTION", "PRIMA SHERPA", "PRIMA COMPARACION"],
    ["COMPAÑÍA GESTION", "COMPAÑÍA SHERPA", "COMPAÑÍA COMPARACION"],
    ["NPN GESTION", "NPN SHERPA", "NPN COMPARACION"],
    ["CORREO GESTION", "CORREO SHERPA", "CORREO COMPARACION"]
  ];

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Comparacion");
  const headers = ["first_name", "last_name", "state", ...campos.flat()];
  ws.addRow(headers);

  for (const row of gestion) {
    const ffm = String(row.ffm_app_id).slice(0, 10);
    const sdata = sherpaMap[ffm] || {};
    const gdata = {
      "Estatus poliza GESTION": row.policy_status,
      "EST DOCS GESTION": row.followup_docs,
      "MIEMBROS GESTION": row.applicant_count,
      "PRIMA GESTION": parseFloat(row.net_premium)?.toFixed(2),
      "COMPAÑÍA GESTION": row.issuer,
      "NPN GESTION": row.npn_used,
      "CORREO GESTION": row.email
    };
    const base = [row.first_name, row.last_name, row.state];
    const fila = [...base];

    for (const [gKey, sKey, cmpKey] of campos) {
      const gVal = gdata[gKey];
      const sVal = sdata[sKey];
      const igual = normalizar(gVal) === normalizar(sVal);
      fila.push(gVal, sVal, igual);
    }

    ws.addRow(fila);
  }

  const colOffset = headers.indexOf("Estatus Comparacion") + 1;
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    for (let i = 0; i < campos.length; i++) {
      const cell = row.getCell(colOffset + i * 3);
      if (cell.value === false) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF00' }
        };
      }
    }
  });

  await wb.xlsx.writeFile(salidaPath);
  console.log("Archivo generado:", salidaPath);
}

if (require.main === module) {
  const [,, gestionPath, sherpaPath, salidaPath] = process.argv;
  if (!gestionPath || !sherpaPath || !salidaPath) {
    console.error("Uso: node compararBases.js GESTION.xlsx SHERPA.xlsx SALIDA.xlsx");
    process.exit(1);
  }
  compararBases(gestionPath, sherpaPath, salidaPath);
}

module.exports = { compararBases };
