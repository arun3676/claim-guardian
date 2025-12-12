# Git PR Creation Script
# Creates multiple pull requests for code review
# Copy and paste this entire script into PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creating Multiple Pull Requests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ensure we're on the base branch
Write-Host "Switching to base branch..." -ForegroundColor Yellow
git checkout fix/typescript-config

# PR 1: MCP Server
Write-Host ""
Write-Host "Creating PR 1: MCP Server..." -ForegroundColor Green
git checkout -b pr/mcp-server
git add mcp-servers/src/index.ts
git add mcp-servers/package.json
git add mcp-servers/README.md
git add mcp-servers/tsconfig.json
git add mcp-servers/cline_mcp_settings.json
git commit -m @"feat: Add ClaimGuardian MCP server with medical billing tools

- Implement lookup_cpt_code tool for procedure code lookup
- Implement lookup_icd10_code tool for diagnosis code lookup
- Implement calculate_medicare_rate tool for rate calculation
- Implement detect_billing_errors tool for error detection
- Implement generate_appeal_letter tool for appeal generation
- Add TypeScript configuration and build setup
- Add MCP server configuration for Cline integration"@
git push -u origin pr/mcp-server
Write-Host "✓ PR 1 created: pr/mcp-server" -ForegroundColor Green
git checkout fix/typescript-config

# PR 2: Frontend Components
Write-Host ""
Write-Host "Creating PR 2: Frontend Components..." -ForegroundColor Green
git checkout -b pr/frontend-components
git add frontend/src/components/
git add frontend/src/app/api/
git add frontend/src/hooks/
git add frontend/src/utils/
git add frontend/package.json
git add frontend/tsconfig.json
git add frontend/next.config.js
git commit -m @"feat: Add frontend components for medical billing analysis

- Add BillingDashboard component for bill overview
- Add AppealLetterGenerator component for appeal creation
- Add BillingErrorCard component for error display
- Add API routes for MCP tool integration
- Add custom hooks for billing data management
- Add utility functions for bill processing"@
git push -u origin pr/frontend-components
Write-Host "✓ PR 2 created: pr/frontend-components" -ForegroundColor Green
git checkout fix/typescript-config

# PR 3: Kestra Workflows
Write-Host ""
Write-Host "Creating PR 3: Kestra Workflows..." -ForegroundColor Green
git checkout -b pr/kestra-workflows
git add kestra-flows/claimguardian-ai-agent-http.yaml
git add kestra-flows/claimguardian-ai-agent-summarizer.yaml
git add kestra-flows/claimguradian-workflow.yaml
git add kestra-flows/appeal-generator.yaml
git add kestra-flows/medical-coding-agent.yaml
git commit -m @"feat: Add Kestra workflows for medical billing automation

- Add AI agent workflow using HTTP plugin for external API calls
- Add data summarization workflow for bill analysis
- Add appeal generation workflow for automated appeals
- Add medical coding agent workflow for code validation
- Implement conditional routing based on analysis results"@
git push -u origin pr/kestra-workflows
Write-Host "✓ PR 3 created: pr/kestra-workflows" -ForegroundColor Green
git checkout fix/typescript-config

# PR 4: Oumi Training
Write-Host ""
Write-Host "Creating PR 4: Oumi Training..." -ForegroundColor Green
git checkout -b pr/oumi-training
git add oumi-training/claimguardian_oumi_enhanced.py
git add oumi-training/grpo_config.yaml
git add oumi-training/evaluation/
git add oumi-training/training/
git commit -m @"feat: Add Oumi GRPO training for medical billing model

- Implement Group Relative Policy Optimization training script
- Add custom evaluation framework with LLM-based judging
- Add training configuration and hyperparameters
- Add evaluation notebooks and metrics
- Fine-tune model for medical billing analysis domain"@
git push -u origin pr/oumi-training
Write-Host "✓ PR 4 created: pr/oumi-training" -ForegroundColor Green
git checkout fix/typescript-config

# PR 5: CLI Scripts
Write-Host ""
Write-Host "Creating PR 5: CLI Scripts..." -ForegroundColor Green
git checkout -b pr/cli-scripts
git add scripts/cline-billing-analyzer.ps1
git add scripts/cline-appeal-generator.ps1
git add scripts/cline-batch-process.ps1
git commit -m @"feat: Add CLI automation scripts for medical billing

- Add billing analyzer script for automated bill analysis
- Add appeal letter generator script for appeal creation
- Add batch processing script for bulk operations
- Implement automation workflows for efficiency
- Add error handling and logging"@
git push -u origin pr/cli-scripts
Write-Host "✓ PR 5 created: pr/cli-scripts" -ForegroundColor Green
git checkout fix/typescript-config

# PR 6: Documentation & Config
Write-Host ""
Write-Host "Creating PR 6: Documentation & Config..." -ForegroundColor Green
git checkout -b pr/documentation-config
git add README.md
git add docs/SPONSOR_INTEGRATIONS.md
git add docs/CLINE_AUTOMATION.md
git add docs/OUMI_TRAINING.md
git add docs/VERCEL_DEPLOYMENT.md
git add docs/WINNING_STRATEGY.md
git add docs/DEMO_VIDEO_SCRIPT.md
git add .coderabbit.yaml
git add vercel.json
git add files/
git commit -m @"docs: Add comprehensive documentation and configuration

- Update README with project overview and setup instructions
- Add integration guides for MCP, Kestra, and Oumi
- Add CLI automation documentation
- Add model training documentation
- Add deployment guide for Vercel
- Add project strategy and architecture documentation
- Add CodeRabbit configuration for code quality
- Add sample medical bill files for testing"@
git push -u origin pr/documentation-config
Write-Host "✓ PR 6 created: pr/documentation-config" -ForegroundColor Green
git checkout fix/typescript-config

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All PRs Created Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Go to GitHub and create pull requests:" -ForegroundColor White
Write-Host "   - pr/mcp-server -> main" -ForegroundColor Gray
Write-Host "   - pr/frontend-components -> main" -ForegroundColor Gray
Write-Host "   - pr/kestra-workflows -> main" -ForegroundColor Gray
Write-Host "   - pr/oumi-training -> main" -ForegroundColor Gray
Write-Host "   - pr/cli-scripts -> main" -ForegroundColor Gray
Write-Host "   - pr/documentation-config -> main" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Automated code review will run on each PR" -ForegroundColor White
Write-Host ""
Write-Host "Note: Internal progress tracking files were excluded from PRs" -ForegroundColor Cyan

