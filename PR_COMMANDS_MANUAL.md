# Manual PR Creation Commands - Copy Paste One by One

## PR 1: MCP Server

```powershell
git checkout fix/typescript-config
git checkout -b pr/mcp-server
git add mcp-servers/src/index.ts
git add mcp-servers/package.json
git add mcp-servers/README.md
git add mcp-servers/tsconfig.json
git add mcp-servers/cline_mcp_settings.json
git commit -m "feat: Add ClaimGuardian MCP server with medical billing tools - Implement lookup_cpt_code, lookup_icd10_code, calculate_medicare_rate, detect_billing_errors, and generate_appeal_letter tools - Add TypeScript configuration and MCP server setup"
git push -u origin pr/mcp-server
git checkout fix/typescript-config
```

---

## PR 2: Frontend Components

```powershell
git checkout -b pr/frontend-components
git add frontend/src/components/
git add frontend/src/app/api/
git add frontend/src/hooks/
git add frontend/src/utils/
git add frontend/package.json
git add frontend/tsconfig.json
git add frontend/next.config.js
git commit -m "feat: Add frontend components for medical billing analysis - Add BillingDashboard, AppealLetterGenerator, and BillingErrorCard components - Add API routes for MCP tool integration - Add custom hooks and utility functions"
git push -u origin pr/frontend-components
git checkout fix/typescript-config
```

---

## PR 3: Kestra Workflows

```powershell
git checkout -b pr/kestra-workflows
git add kestra-flows/claimguardian-ai-agent-http.yaml
git add kestra-flows/claimguardian-ai-agent-summarizer.yaml
git add kestra-flows/claimguradian-workflow.yaml
git add kestra-flows/appeal-generator.yaml
git add kestra-flows/medical-coding-agent.yaml
git commit -m "feat: Add Kestra workflows for medical billing automation - Add AI agent workflow using HTTP plugin - Add data summarization and appeal generation workflows - Add medical coding agent workflow with conditional routing"
git push -u origin pr/kestra-workflows
git checkout fix/typescript-config
```

---

## PR 4: Oumi Training

```powershell
git checkout -b pr/oumi-training
git add oumi-training/claimguardian_oumi_enhanced.py
git add oumi-training/grpo_config.yaml
git add oumi-training/evaluation/
git add oumi-training/training/
git commit -m "feat: Add Oumi GRPO training for medical billing model - Implement Group Relative Policy Optimization training script - Add custom evaluation framework with LLM-based judging - Add training configuration and evaluation notebooks"
git push -u origin pr/oumi-training
git checkout fix/typescript-config
```

---

## PR 5: CLI Scripts

```powershell
git checkout -b pr/cli-scripts
git add scripts/cline-billing-analyzer.ps1
git add scripts/cline-appeal-generator.ps1
git add scripts/cline-batch-process.ps1
git commit -m "feat: Add CLI automation scripts for medical billing - Add billing analyzer, appeal generator, and batch processing scripts - Implement automation workflows with error handling"
git push -u origin pr/cli-scripts
git checkout fix/typescript-config
```

---

## PR 6: Documentation & Config

```powershell
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
git commit -m "docs: Add comprehensive documentation and configuration - Update README with project overview and setup - Add integration guides for MCP, Kestra, and Oumi - Add CLI automation and training documentation - Add deployment guide and CodeRabbit configuration"
git push -u origin pr/documentation-config
git checkout fix/typescript-config
```

---

## After Running All Commands

1. Go to your GitHub repository
2. You'll see 6 branches ready for PRs:
   - `pr/mcp-server`
   - `pr/frontend-components`
   - `pr/kestra-workflows`
   - `pr/oumi-training`
   - `pr/cli-scripts`
   - `pr/documentation-config`

3. Create pull requests on GitHub for each branch

---

## Quick Copy-Paste (All at Once)

If you want to copy all commands at once, here's the complete sequence:

```powershell
# PR 1: MCP Server
git checkout fix/typescript-config
git checkout -b pr/mcp-server
git add mcp-servers/src/index.ts mcp-servers/package.json mcp-servers/README.md mcp-servers/tsconfig.json mcp-servers/cline_mcp_settings.json
git commit -m "feat: Add ClaimGuardian MCP server with medical billing tools"
git push -u origin pr/mcp-server
git checkout fix/typescript-config

# PR 2: Frontend
git checkout -b pr/frontend-components
git add frontend/src/components/ frontend/src/app/api/ frontend/src/hooks/ frontend/src/utils/ frontend/package.json frontend/tsconfig.json frontend/next.config.js
git commit -m "feat: Add frontend components for medical billing analysis"
git push -u origin pr/frontend-components
git checkout fix/typescript-config

# PR 3: Kestra
git checkout -b pr/kestra-workflows
git add kestra-flows/claimguardian-ai-agent-http.yaml kestra-flows/claimguardian-ai-agent-summarizer.yaml kestra-flows/claimguradian-workflow.yaml kestra-flows/appeal-generator.yaml kestra-flows/medical-coding-agent.yaml
git commit -m "feat: Add Kestra workflows for medical billing automation"
git push -u origin pr/kestra-workflows
git checkout fix/typescript-config

# PR 4: Oumi
git checkout -b pr/oumi-training
git add oumi-training/claimguardian_oumi_enhanced.py oumi-training/grpo_config.yaml oumi-training/evaluation/ oumi-training/training/
git commit -m "feat: Add Oumi GRPO training for medical billing model"
git push -u origin pr/oumi-training
git checkout fix/typescript-config

# PR 5: Scripts
git checkout -b pr/cli-scripts
git add scripts/cline-billing-analyzer.ps1 scripts/cline-appeal-generator.ps1 scripts/cline-batch-process.ps1
git commit -m "feat: Add CLI automation scripts for medical billing"
git push -u origin pr/cli-scripts
git checkout fix/typescript-config

# PR 6: Documentation
git checkout -b pr/documentation-config
git add README.md docs/SPONSOR_INTEGRATIONS.md docs/CLINE_AUTOMATION.md docs/OUMI_TRAINING.md docs/VERCEL_DEPLOYMENT.md docs/WINNING_STRATEGY.md docs/DEMO_VIDEO_SCRIPT.md .coderabbit.yaml vercel.json files/
git commit -m "docs: Add comprehensive documentation and configuration"
git push -u origin pr/documentation-config
git checkout fix/typescript-config
```

