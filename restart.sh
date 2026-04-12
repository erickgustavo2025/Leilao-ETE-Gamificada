#!/bin/bash
echo "🔄 Reiniciando EteGamificada..."
cd ~/Leilao-ETE-Gamificada
sudo docker-compose down
sudo docker-compose build --no-cache frontend
sudo docker-compose up -d
sleep 15
echo "📊 Status:"
sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
sudo docker logs etegami_backend --tail 5
echo "✅ Reiniciado! https://etegamificada.online"
