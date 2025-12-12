# Git PR Strategy for CodeRabbit Reviews

## Strategy: Create 5 Separate PRs

1. **PR 1: MCP Server** - Core MCP server implementation
2. **PR 2: Frontend Components** - React components and API routes
3. **PR 3: Kestra Workflows** - Kestra workflow files
4. **PR 4: Oumi Training** - Oumi training code
5. **PR 5: Documentation & Config** - Docs, configs, and setup files

---

## Step-by-Step Commands

### Step 1: Stash Current Changes (if needed)
```powershell
git stash
```

### Step 2: Create and Push PR 1 - MCP Server

```powershell
# Create branch for MCP Server PR
git checkout -b pr/mcp-server

# Add MCP server files only
git add mcp-servers/src/index.ts
git add mcp-servers/package.json
git add mcp-servers/README.md
git add mcp-servers/tsconfig.json
git add mcp-servers/cline_mcp_settings.json

# Commit
git commit -m "feat: Add ClaimGuardian MCP server with 7 medical billing tools

- Implement lookup_cpt_code tool
- Implement lookup_icd10_code tool
- Implement calculate_medicare_rate tool
- Implement detect_billing_errors tool
- Implement generate_appeal_letter tool
- Add TypeScript configuration
- Add Cline MCP settings

Closes #1"

# Push branch
git push -u origin pr/mcp-server
```

**After pushing, create PR on GitHub:**
- Base: `main` (or your default branch)
- Compare: `pr/mcp-server`
- Title: "feat: Add ClaimGuardian MCP Server"
- Description: "Implements custom MCP server with 7 medical billing tools for Cline integration"

---

### Step 3: Create and Push PR 2 - Frontend Components

```powershell
# Switch back to main branch
git checkout fix/typescript-config

# Create branch for Frontend PR
git checkout -b pr/frontend-components

# Add frontend files (if they exist and are modified)
# Note: Adjust paths based on your actual frontend structure
git add frontend/src/components/
git add frontend/src/app/api/
git add frontend/src/hooks/
git add frontend/src/utils/
git add frontend/package.json
git add frontend/tsconfig.json
git add frontend/next.config.js

# Commit
git commit -m "feat: Add frontend components for medical billing analysis

- Add BillingDashboard component
- Add AppealLetterGenerator component
- Add BillingErrorCard component
- Add API routes for MCP tool calls
- Add custom hooks for billing analysis
- Add utility functions

Closes #2"

# Push branch
git push -u origin pr/frontend-components
```

**After pushing, create PR on GitHub:**
- Base: `main`
- Compare: `pr/frontend-components`
- Title: "feat: Add Frontend Components for Medical Billing"
- Description: "React components and API routes for medical billing analysis dashboard"

---

### Step 4: Create and Push PR 3 - Kestra Workflows

```powershell
# Switch back to main branch
git checkout fix/typescript-config

# Create branch for Kestra PR
git checkout -b pr/kestra-workflows

# Add Kestra workflow files
git add kestra-flows/claimguardian-ai-agent-http.yaml
git add kestra-flows/claimguardian-ai-agent-summarizer.yaml
git add kestra-flows/claimguradian-workflow.yaml
git add kestra-flows/appeal-generator.yaml
git add kestra-flows/medical-coding-agent.yaml

# Commit
git commit -m "feat: Add Kestra workflows for medical billing automation

- Add AI agent workflow with HTTP plugin
- Add data summarization workflow
- Add appeal generation workflow
- Add medical coding agent workflow
- Implement conditional routing based on AI decisions

Closes #3"

# Push branch
git push -u origin pr/kestra-workflows
```

**After pushing, create PR on GitHub:**
- Base: `main`
- Compare: `pr/kestra-workflows`
- Title: "feat: Add Kestra Workflows for Billing Automation"
- Description: "Kestra workflows using AI Agent for medical billing analysis and decision-making"

---

### Step 5: Create and Push PR 4 - Oumi Training

```powershell
# Switch back to main branch
git checkout fix/typescript-config

# Create branch for Oumi PR
git checkout -b pr/oumi-training

# Add Oumi training files
git add oumi-training/claimguardian_oumi_enhanced.py
git add oumi-training/grpo_config.yaml
git add oumi-training/evaluation/
git add oumi-training/training/

# Commit
git commit -m "feat: Add Oumi GRPO training for medical billing model

- Implement GRPO training script
- Add custom evaluation with LLM-as-a-Judge
- Add training configuration
- Add evaluation notebooks
- Fine-tune model for medical billing domain

Closes #4"

# Push branch
git push -u origin pr/oumi-training
```

**After pushing, create PR on GitHub:**
- Base: `main`
- Compare: `pr/oumi-training`
- Title: "feat: Add Oumi GRPO Training for Medical Billing"
- Description: "Oumi reinforcement learning fine-tuning for medical billing analysis model"

---

### Step 6: Create and Push PR 5 - Documentation & Config

```powershell
# Switch back to main branch
git checkout fix/typescript-config

# Create branch for Documentation PR
git checkout -b pr/documentation-config

# Add documentation files (excluding progress files)
git add README.md
git add docs/SPONSOR_INTEGRATIONS.md
git add docs/CLINE_AUTOMATION.md
git add docs/OUMI_TRAINING.md
git add docs/VERCEL_DEPLOYMENT.md
git add docs/WINNING_STRATEGY.md
git add docs/DEMO_VIDEO_SCRIPT.md

# Add config files
git add .coderabbit.yaml
git add vercel.json

# Add sample files
git add files/

# Commit
git commit -m "docs: Add comprehensive documentation and configuration

- Update README with all sponsor integrations
- Add sponsor integration guides
- Add Cline automation documentation
- Add Oumi training documentation
- Add Vercel deployment guide
- Add winning strategy guide
- Add CodeRabbit configuration
- Add sample medical bill files

Closes #5"

# Push branch
git push -u origin pr/documentation-config
```

**After pushing, create PR on GitHub:**
- Base: `main`
- Compare: `pr/documentation-config`
- Title: "docs: Add Comprehensive Documentation and Configuration"
- Description: "Complete documentation for all sponsor integrations and project setup"

---

### Step 7: Create and Push PR 6 - CLI Scripts (Optional)

```powershell
# Switch back to main branch
git checkout fix/typescript-config

# Create branch for Scripts PR
git checkout -b pr/cli-scripts

# Add script files
git add scripts/cline-billing-analyzer.ps1
git add scripts/cline-appeal-generator.ps1
git add scripts/cline-batch-process.ps1

# Commit
git commit -m "feat: Add Cline CLI automation scripts

- Add billing analyzer script
- Add appeal letter generator script
- Add batch processing script
- Demonstrate CLI automation capabilities
- Show 30-60x speedup improvements

Closes #6"

# Push branch
git push -u origin pr/cli-scripts
```

**After pushing, create PR on GitHub:**
- Base: `main`
- Compare: `pr/cli-scripts`
- Title: "feat: Add Cline CLI Automation Scripts"
- Description: "PowerShell scripts demonstrating Cline CLI automation for medical billing"

---

## Alternative: Single Command Script

If you want to run everything at once, save this as `create-prs.ps1`:

```powershell
# Git PR Creation Script for CodeRabbit Reviews

# Ensure we're on the base branch
git checkout fix/typescript-config

# PR 1: MCP Server
git checkout -b pr/mcp-server
git add mcp-servers/src/index.ts mcp-servers/package.json mcp-servers/README.md mcp-servers/tsconfig.json mcp-servers/cline_mcp_settings.json
git commit -m "feat: Add ClaimGuardian MCP server with 7 medical billing tools"
git push -u origin pr/mcp-server
git checkout fix/typescript-config

# PR 2: Frontend (if files exist)
git checkout -b pr/frontend-components
git add frontend/
git commit -m "feat: Add frontend components for medical billing analysis"
git push -u origin pr/frontend-components
git checkout fix/typescript-config

# PR 3: Kestra Workflows
git checkout -b pr/kestra-workflows
git add kestra-flows/*.yaml
git commit -m "feat: Add Kestra workflows for medical billing automation"
git push -u origin pr/kestra-workflows
git checkout fix/typescript-config

# PR 4: Oumi Training
git checkout -b pr/oumi-training
git add oumi-training/
git commit -m "feat: Add Oumi GRPO training for medical billing model"
git push -u origin pr/oumi-training
git checkout fix/typescript-config

# PR 5: Documentation & Config
git checkout -b pr/documentation-config
git add README.md docs/ .coderabbit.yaml vercel.json files/
git commit -m "docs: Add comprehensive documentation and configuration"
git push -u origin pr/documentation-config
git checkout fix/typescript-config

# PR 6: CLI Scripts
git checkout -b pr/cli-scripts
git add scripts/
git commit -m "feat: Add Cline CLI automation scripts"
git push -u origin pr/cli-scripts

Write-Host "All PRs created! Go to GitHub to create pull requests." -ForegroundColor Green
```

---

## Important Notes

1. **MD Files Excluded:** The progress/status MD files (CLINE_PROGRESS.md, CLINE_FINAL_STEPS.md, CLINE_SUBMISSION_STATUS.md) are NOT included in any PR - they're just for your reference.

2. **Screenshots:** Screenshot files are typically not needed in PRs, but if you want to include them, add them to the documentation PR.

3. **After Creating Branches:** Go to GitHub and create pull requests manually, or use GitHub CLI if installed:
   ```powershell
   gh pr create --base main --head pr/mcp-server --title "feat: Add ClaimGuardian MCP Server" --body "Description here"
   ```

4. **CodeRabbit:** Once PRs are created, CodeRabbit will automatically review them based on your `.coderabbit.yaml` configuration.

---

## Quick Reference: Files Per PR

### PR 1 - MCP Server
- `mcp-servers/src/index.ts`
- `mcp-servers/package.json`
- `mcp-servers/README.md`
- `mcp-servers/tsconfig.json`
- `mcp-servers/cline_mcp_settings.json`

### PR 2 - Frontend
- `frontend/src/components/`
- `frontend/src/app/api/`
- `frontend/src/hooks/`
- `frontend/src/utils/`
- `frontend/package.json`
- `frontend/tsconfig.json`

### PR 3 - Kestra
- `kestra-flows/*.yaml` files

### PR 4 - Oumi
- `oumi-training/` directory

### PR 5 - Documentation
- `README.md`
- `docs/` directory
- `.coderabbit.yaml`
- `vercel.json`
- `files/` directory

### PR 6 - Scripts
- `scripts/` directory

---

## Excluded Files (Not in PRs)
- `CLINE_PROGRESS.md` (your reference only)
- `CLINE_FINAL_STEPS.md` (your reference only)
- `CLINE_SUBMISSION_STATUS.md` (your reference only)
- `GIT_PR_STRATEGY.md` (this file)
- `docs-images/desktop.ini` (system file)
- Screenshot PNG files (optional)

