#!/bin/bash
echo "🚀 Iniciando EteGamificada..."
cd ~/Leilao-ETE-Gamificada
sudo docker-compose up -d --build
sleep 15
echo "📊 Status:"
sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
sudo docker logs etegami_backend --tail 5
echo "✅ Online em: https://etegamificada.online"
