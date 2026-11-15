Write-Host "========================================================" -ForegroundColor Green
Write-Host "  Launching AIP Full-Stack on Localhost" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; py -3.13 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"
