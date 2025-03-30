
#!/bin/bash

PROJECT_DIR=~/Downloads/comparador-v2

# Verificar que jq esté instalado
if ! command -v jq &> /dev/null
then
    echo "❌ jq no está instalado. Ejecuta: brew install jq"
    exit 1
fi

cd "$PROJECT_DIR" || { echo "No se encontró la carpeta del proyecto"; exit 1; }

# Abrir servidor en nueva ventana de Terminal
echo "🚀 Iniciando servidor..."
osascript -e 'tell app "Terminal"
    do script "cd $PROJECT_DIR; node server.js"
end tell'

sleep 2

# Abrir ngrok en nueva ventana de Terminal
echo "🌐 Iniciando Ngrok..."
osascript -e 'tell app "Terminal"
    do script "ngrok http 3000"
end tell'

# Esperar a que Ngrok se inicie y exponga la API local
echo "⌛ Esperando a que Ngrok genere la URL pública..."
sleep 5

# Intentar consultar la API de Ngrok hasta obtener respuesta
for i in {1..10}; do
    URL=$(curl -s http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[0].public_url')
    if [[ "$URL" == https://* ]]; then
        echo "🔗 URL pública de Ngrok: $URL"
        echo "$URL" | pbcopy
        echo "✅ URL copiada al portapapeles."
        open "$URL"
        exit 0
    else
        sleep 1
    fi
done

echo "⚠️ No se pudo obtener la URL de Ngrok. Asegúrate de que esté corriendo correctamente."
exit 1
