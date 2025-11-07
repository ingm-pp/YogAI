@echo off
echo 🚀 Démarrage du Yoga AI Coach...

echo Starting Python backend...
cd backend
start python app.py

echo Starting React frontend...
cd ../frontend-react
npm run dev

echo ✅ Applications démarrées!
echo Backend: http://localhost:5000
echo Frontend:  http://localhost:5173
pause