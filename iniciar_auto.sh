
#!/bin/bash

# Ruta del proyecto (ajústalo si cambia de carpeta)
PROJECT_DIR=~/Downloads/comparador-v2

# Ir al proyecto
cd "$PROJECT_DIR" || { echo "No se encontró la carpeta del proyecto"; exit 1; }

# Iniciar servidor en nueva terminal
echo "Iniciando servidor local..."
osascript -e 'tell app "Terminal"
    do script "cd $PROJECT_DIR; node server.js"
end tell'

sleep 3

# Iniciar ngrok en segundo plano y capturar la URL
echo "Iniciando ngrok..."
NGROK_URL=$(ngrok http 3000 --log=stdout | grep -m 1 "https://" | sed -E "s/.*(https:[^ ]+).*/\1/") &

sleep 5

# Copiar URL al portapapeles
if [[ "$NGROK_URL" == https://* ]]; then
  echo "🔗 URL pública de Ngrok: $NGROK_URL"
  echo "$NGROK_URL" | pbcopy
  echo "✅ URL copiada al portapapeles."
else
  echo "⚠️ No se pudo obtener la URL pública. Asegúrate de tener ngrok instalado y configurado."
fi
