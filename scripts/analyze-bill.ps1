# ClaimGuardian AI - Medical Bill Analysis Script
#
# Analyzes medical bills for errors and overcharges using MCP tools
# Automatically generates appeal letters for significant overcharges (> $500)
#
# Usage:
#   .\analyze-bill.ps1 -BillPath "files\sample_medical_bill.json" [-OutputPath "analysis-report.json"]

param(
    [Parameter(Mandatory=$true, HelpMessage="Path to the JSON medical bill file")]
    [string]$BillPath,

    [Parameter(Mandatory=$false, HelpMessage="Path to save the analysis report")]
    [string]$OutputPath = "analysis-report.json",

    [Parameter(Mandatory=$false, HelpMessage="Path to save appeal letters")]
    [string]$AppealPath = "appeal-letters",

    [Parameter(Mandatory=$false, HelpMessage="MCP server directory")]
    [string]$McpServerPath = "mcp-fixed",

    [Parameter(Mandatory=$false, HelpMessage="Overcharge threshold for automatic appeal generation")]
    [decimal]$OverchargeThreshold = 500.0
)

# Configuration
$ErrorActionPreference = "Stop"
$MCP_SERVER_SCRIPT = "server.mjs"
$OVERCHARGE_THRESHOLD = $OverchargeThreshold

# Global variables for MCP communication
$script:McpServerProcess = $null
$script:McpRequestId = 1
$script:McpServerPath = $McpServerPath

function Start-McpServer {
    Write-Host "Starting ClaimGuardian MCP Server..." -ForegroundColor Cyan

    $serverFullPath = Join-Path $PSScriptRoot $script:McpServerPath
    if (-not (Test-Path $serverFullPath)) {
        throw "MCP server directory not found: $serverFullPath"
    }

    $script:McpServerProcess = Start-Process -FilePath "node" -ArgumentList $MCP_SERVER_SCRIPT -WorkingDirectory $serverFullPath -NoNewWindow -PassThru -RedirectStandardInput ([System.IO.Path]::GetTempFileName()) -RedirectStandardOutput ([System.IO.Path]::GetTempFileName()) -RedirectStandardError ([System.IO.Path]::GetTempFileName())

    # Wait for server to start (look for startup message in stderr)
    $timeout = 10
    $started = $false

    for ($i = 0; $i -lt $timeout; $i++) {
        Start-Sleep 1
        $errorContent = Get-Content $script:McpServerProcess.StandardError.FileName -ErrorAction SilentlyContinue
        if ($errorContent -and $errorContent -match "ClaimGuardian MCP Server running!") {
            $started = $true
            break
        }
    }

    if (-not $started) {
        throw "MCP server failed to start within $timeout seconds"
    }

    Write-Host "✅ MCP Server started successfully (PID: $($script:McpServerProcess.Id))" -ForegroundColor Green
}

function Invoke-McpTool {
    param(
        [string]$ToolName,
        [hashtable]$Arguments = @{}
    )

    try {
        # Initialize connection first
        $initRequest = @{
            jsonrpc = "2.0"
            id = $script:McpRequestId++
            method = "initialize"
            params = @{
                protocolVersion = "2024-11-05"
                capabilities = @{}
                clientInfo = @{
                    name = "powershell-mcp-client"
                    version = "1.0.0"
                }
            }
        }

        $initJson = ($initRequest | ConvertTo-Json -Depth 10) + "`n"
        $initJson | Out-File -FilePath $script:McpServerProcess.StandardInput.FileName -Encoding UTF8 -Append

        # Call the tool
        $toolRequest = @{
            jsonrpc = "2.0"
            id = $script:McpRequestId++
            method = "tools/call"
            params = @{
                name = $ToolName
                arguments = $Arguments
            }
        }

        $toolJson = ($toolRequest | ConvertTo-Json -Depth 10) + "`n"
        $toolJson | Out-File -FilePath $script:McpServerProcess.StandardInput.FileName -Encoding UTF8 -Append

        # Wait for and read response (simplified synchronous approach)
        Start-Sleep 2  # Give server time to respond

        $outputContent = Get-Content $script:McpServerProcess.StandardOutput.FileName -Raw -ErrorAction SilentlyContinue
        if ($outputContent) {
            $lines = $outputContent -split "`n" | Where-Object { $_.Trim() }
            foreach ($line in $lines) {
                try {
                    $response = $line | ConvertFrom-Json
                    if ($response.id -eq $toolRequest.id) {
                        if ($response.error) {
                            throw "MCP Error: $($response.error.message)"
                        }

                        if ($response.result.content -and $response.result.content[0]) {
                            $content = $response.result.content[0]
                            if ($content.type -eq "text") {
                                try {
                                    return $content.text | ConvertFrom-Json
                                } catch {
                                    return $content.text
                                }
                            }
                        }
                        return $response.result
                    }
                } catch {
                    # Continue to next line if not valid JSON
                }
            }
        }

        throw "No response received from MCP server"
    } catch {
        throw "MCP tool call failed ($ToolName): $($_.Exception.Message)"
    }
}

function Stop-McpServer {
    if ($script:McpServerProcess -and -not $script:McpServerProcess.HasExited) {
        Write-Host "🛑 Stopping MCP Server..." -ForegroundColor Yellow
        $script:McpServerProcess.Kill()
        $script:McpServerProcess.WaitForExit(5000)
    }

    # Clean up temp files
    if ($script:McpServerProcess) {
        try { Remove-Item $script:McpServerProcess.StandardInput.FileName -ErrorAction SilentlyContinue } catch {}
        try { Remove-Item $script:McpServerProcess.StandardOutput.FileName -ErrorAction SilentlyContinue } catch {}
        try { Remove-Item $script:McpServerProcess.StandardError.FileName -ErrorAction SilentlyContinue } catch {}
    }
}

function Write-AnalysisReport {
    param(
        [object]$billData,
        [object]$errorAnalysis,
        [array]$procedures,
        [array]$overcharges,
        [string]$outputPath
    )

    $report = @{
        timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
        bill_analysis = @{
            file_path = $BillPath
            patient_name = $billData.patient_name
            claim_number = $billData.claim_number
            date_of_service = $billData.date_of_service
            provider_name = $billData.provider_name
            total_billed = $billData.total_billed
        }
        error_analysis = $errorAnalysis
        procedures = $procedures
        overcharges_found = $overcharges.Count
        overcharges = $overcharges
        appeal_letters_generated = $overcharges.Count
        generated_by = "ClaimGuardian AI - analyze-bill.ps1"
        overcharge_threshold = $OVERCHARGE_THRESHOLD
    }

    $report | ConvertTo-Json -Depth 10 | Out-File $outputPath -Encoding UTF8
    Write-Host "📄 Report saved to: $outputPath" -ForegroundColor Green
}

function New-AppealLetter {
    param(
        [object]$billData,
        [object]$overcharge,
        [string]$outputDir
    )

    if (-not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    }

    $fileName = "appeal_$($billData.claim_number)_$($overcharge.cpt_code).txt"
    $filePath = Join-Path $outputDir $fileName

    $appealContent = @"
APPEAL LETTER - CLAIMGUARDIAN AI GENERATED

Claim Number: $($billData.claim_number)
Patient: $($billData.patient_name)
Procedure: $($overcharge.procedure) (CPT: $($overcharge.cpt_code))
Date of Service: $($billData.date_of_service)

OVERCHARGE DETAILS:
- Billed Amount: $$($overcharge.billed_amount)
- Expected Amount: $$($overcharge.expected_amount)
- Overcharge: $$($overcharge.overcharge_amount)
- Overcharge Percentage: $($overcharge.overcharge_percent)%

APPEAL REQUEST:
This letter serves as a formal appeal of the above-referenced claim due to excessive billing charges that significantly exceed reasonable and customary rates for this procedure.

The billed amount of $$($overcharge.billed_amount) represents an overcharge of $($overcharge.overcharge_percent)% above the expected Medicare reimbursement rate of $$($overcharge.expected_amount) for CPT code $($overcharge.cpt_code).

We request that you:
1. Reconsider the charges for this procedure
2. Adjust the billed amount to reflect fair and reasonable pricing
3. Provide written notification of your decision within the timeframe required by law

Supporting Evidence:
- Medicare reimbursement rates for similar procedures
- Industry standard pricing data
- Comparison with regional provider rates

Please contact us if additional information is needed to process this appeal.

Generated by ClaimGuardian AI on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

"@

    $appealContent | Out-File $filePath -Encoding UTF8
    return $filePath
}

# Main execution
try {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "ClaimGuardian AI - Bill Analyzer" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # Validate input file
    if (-not (Test-Path $BillPath)) {
        throw "Bill file not found: $BillPath"
    }

    Write-Host "📄 Loading medical bill: $BillPath" -ForegroundColor Green

    # Parse JSON bill file
    $billData = Get-Content $BillPath -Raw | ConvertFrom-Json

    # Validate bill structure
    if (-not $billData.procedures -or -not $billData.total_billed) {
        throw "Invalid bill format: missing procedures or total_billed fields"
    }

    Write-Host "✓ Patient: $($billData.patient_name)" -ForegroundColor White
    Write-Host "✓ Claim: $($billData.claim_number)" -ForegroundColor White
    Write-Host "✓ Provider: $($billData.provider_name)" -ForegroundColor White
    Write-Host "✓ Total Billed: $$($billData.total_billed)" -ForegroundColor White
    Write-Host "✓ Procedures: $($billData.procedures.Count)" -ForegroundColor White
    Write-Host ""

    # Extract procedures for MCP call
    $procedureDescriptions = $billData.procedures | ForEach-Object { $_.description }
    $totalBilled = $billData.total_billed

    # Initialize MCP server
    Start-McpServer

    Write-Host "🔍 Analyzing bill for errors..." -ForegroundColor Yellow

    # Call detect_billing_errors MCP tool
    $errorAnalysis = Invoke-McpTool -ToolName "detect_billing_errors" -Arguments @{
        procedures = $procedureDescriptions
        total_billed = $totalBilled
    }

    Write-Host "✅ Error analysis complete" -ForegroundColor Green
    Write-Host ""

    # Process results and check for overcharges
    $overcharges = @()
    $procedures = @()

    foreach ($proc in $billData.procedures) {
        # Get Medicare rate for this procedure
        try {
            $medicareRate = Invoke-McpTool -ToolName "calculate_medicare_rate" -Arguments @{
                procedure = $proc.description
            }

            $expectedAmount = if ($medicareRate -and $medicareRate.rate) {
                [decimal]$medicareRate.rate
            } else {
                # Fallback estimation
                [decimal]($proc.billed_amount * 0.7)
            }

            $overchargeAmount = [decimal]$proc.billed_amount - $expectedAmount
            $overchargePercent = if ($expectedAmount -gt 0) {
                [math]::Round(($overchargeAmount / $expectedAmount) * 100, 2)
            } else { 0 }

            $procedureInfo = @{
                description = $proc.description
                cpt_code = $proc.cpt_code
                billed_amount = [decimal]$proc.billed_amount
                expected_amount = [math]::Round($expectedAmount, 2)
                overcharge_amount = [math]::Round($overchargeAmount, 2)
                overcharge_percent = $overchargePercent
                risk_level = if ($overchargePercent -gt 100) { "HIGH" } elseif ($overchargePercent -gt 50) { "MEDIUM" } else { "LOW" }
            }

            $procedures += $procedureInfo

            # Check for significant overcharges
            if ($overchargeAmount -gt $OVERCHARGE_THRESHOLD) {
                $overcharges += $procedureInfo
                Write-Host "🚨 OVERCHARGE DETECTED: $($proc.description)" -ForegroundColor Red
                Write-Host "   Billed: $$($proc.billed_amount) | Expected: $$($procedureInfo.expected_amount) | Over: $$($procedureInfo.overcharge_amount) ($($procedureInfo.overcharge_percent)%)" -ForegroundColor Red
            } else {
                Write-Host "✓ $($proc.description): $$($proc.billed_amount) (within range)" -ForegroundColor Green
            }

        } catch {
            Write-Host "⚠️ Could not analyze $($proc.description): $($_.Exception.Message)" -ForegroundColor Yellow
            $procedures += @{
                description = $proc.description
                cpt_code = $proc.cpt_code
                billed_amount = [decimal]$proc.billed_amount
                error = $_.Exception.Message
            }
        }
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "ANALYSIS RESULTS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Total Procedures: $($procedures.Count)" -ForegroundColor White
    Write-Host "Overcharges Found: $($overcharges.Count)" -ForegroundColor $(if ($overcharges.Count -gt 0) { "Red" } else { "Green" })
    Write-Host ""

    # Generate appeal letters for significant overcharges
    if ($overcharges.Count -gt 0) {
        Write-Host "📝 Generating appeal letters..." -ForegroundColor Yellow

        foreach ($overcharge in $overcharges) {
            try {
                # Generate appeal letter using MCP tool
                $appealLetter = Invoke-McpTool -ToolName "generate_appeal_letter" -Arguments @{
                    patient_name = $billData.patient_name
                    claim_number = $billData.claim_number
                    denial_reason = "Excessive billing charges - overcharge of $($overcharge.overcharge_percent)% above reasonable rates"
                    procedure = $overcharge.description
                    supporting_facts = "Billed amount of $$($overcharge.billed_amount) exceeds expected Medicare reimbursement rate of $$($overcharge.expected_amount) for CPT code $($overcharge.cpt_code). This represents an overcharge of $$($overcharge.overcharge_amount)."
                }

                # Save appeal letter to file
                $appealPath = New-AppealLetter -billData $billData -overcharge $overcharge -outputDir $AppealPath
                Write-Host "✓ Appeal letter generated: $appealPath" -ForegroundColor Green

            } catch {
                Write-Host "⚠️ Failed to generate appeal letter for $($overcharge.description): $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    }

    # Generate analysis report
    Write-AnalysisReport -billData $billData -errorAnalysis $errorAnalysis -procedures $procedures -overcharges $overcharges -outputPath $OutputPath

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "ANALYSIS COMPLETE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green

    if ($overcharges.Count -gt 0) {
        Write-Host "⚠️  ACTION REQUIRED: Review appeal letters in '$AppealPath'" -ForegroundColor Yellow
        Write-Host "Potential Savings: $$($overcharges | Measure-Object -Property overcharge_amount -Sum | Select-Object -ExpandProperty Sum)" -ForegroundColor Yellow
    } else {
        Write-Host "✅ No significant overcharges detected" -ForegroundColor Green
    }

} catch {
    Write-Host ""
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "- Ensure the bill file exists and is valid JSON" -ForegroundColor White
    Write-Host "- Ensure Node.js and MCP server are properly installed" -ForegroundColor White
    Write-Host "- Check that the MCP server directory exists (default: mcp-fixed)" -ForegroundColor White
    exit 1
} finally {
    # Clean up
    Stop-McpServer
}
