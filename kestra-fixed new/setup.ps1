# setup.ps1 - ClaimGuardian Kestra Complete Setup
# Run: .\setup.ps1 in PowerShell

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  ClaimGuardian AI - Kestra Setup" -ForegroundColor Cyan
Write-Host "  AssembleHack25 Hackathon" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Docker
Write-Host "[1/5] Checking Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first!" -ForegroundColor Red
    exit 1
}

# Step 2: Get API Keys
Write-Host ""
Write-Host "[2/5] Enter your API Keys" -ForegroundColor Yellow
Write-Host "(Get OpenAI key from: https://platform.openai.com/api-keys)" -ForegroundColor Gray
Write-Host "(Get HuggingFace key from: https://huggingface.co/settings/tokens)" -ForegroundColor Gray
Write-Host ""

$openaiKey = Read-Host "Enter OpenAI API Key (starts with sk-)"
$hfKey = Read-Host "Enter HuggingFace API Key (starts with hf_)"

# Validate keys
if (-not $openaiKey.StartsWith("sk-")) {
    Write-Host "⚠️ Warning: OpenAI key should start with 'sk-'" -ForegroundColor Yellow
}

# Encode to base64
$openaiEncoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($openaiKey))
$hfEncoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($hfKey))

Write-Host "✅ API keys encoded to base64" -ForegroundColor Green

# Step 3: Create .env file
Write-Host ""
Write-Host "[3/5] Creating .env file..." -ForegroundColor Yellow

$envContent = @"
# ClaimGuardian Kestra - API Keys (Base64 Encoded)
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

OPENAI_API_KEY_BASE64=$openaiEncoded
HUGGINGFACE_API_KEY_BASE64=$hfEncoded
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✅ .env file created" -ForegroundColor Green

# Step 4: Stop existing containers and start fresh
Write-Host ""
Write-Host "[4/5] Starting Kestra..." -ForegroundColor Yellow
docker-compose down -v 2>$null
docker-compose up -d

Write-Host "Waiting for Kestra to start (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check if Kestra is running
$kestraRunning = docker ps --filter "name=claimguardian-kestra" --filter "status=running" -q
if ($kestraRunning) {
    Write-Host "✅ Kestra is running!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Kestra may still be starting. Check: docker logs claimguardian-kestra" -ForegroundColor Yellow
}

# Step 5: Print instructions
Write-Host ""
Write-Host "[5/5] Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  ACCESS KESTRA UI" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  URL:      http://localhost:8080" -ForegroundColor Yellow
Write-Host "  Username: admin@kestra.io" -ForegroundColor Yellow
Write-Host "  Password: Kestra2025!" -ForegroundColor Yellow
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  UPLOAD WORKFLOWS" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:8080" -ForegroundColor Gray
Write-Host "2. Log in with credentials above" -ForegroundColor Gray
Write-Host "3. Click 'Flows' -> 'Create'" -ForegroundColor Gray
Write-Host "4. Click 'Source' tab" -ForegroundColor Gray
Write-Host "5. Copy content from these files and paste:" -ForegroundColor Gray
Write-Host "   - claimguardian-ai-agent-complete.yaml (MAIN)" -ForegroundColor White
Write-Host "   - claimguardian-ai-summarizer.yaml" -ForegroundColor White
Write-Host "   - claimguardian-oumi-integration.yaml" -ForegroundColor White
Write-Host "6. Click 'Save' for each" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  TEST WORKFLOW" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "1. Go to Flows -> hackathon namespace" -ForegroundColor Gray
Write-Host "2. Click on a workflow" -ForegroundColor Gray
Write-Host "3. Click 'Execute' button" -ForegroundColor Gray
Write-Host "4. Use default values or modify inputs" -ForegroundColor Gray
Write-Host "5. Click 'Execute'" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  TROUBLESHOOTING" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "View logs:    docker logs claimguardian-kestra --tail 50" -ForegroundColor Gray
Write-Host "Restart:      docker-compose restart kestra" -ForegroundColor Gray
Write-Host "Full reset:   docker-compose down -v && docker-compose up -d" -ForegroundColor Gray
Write-Host ""
