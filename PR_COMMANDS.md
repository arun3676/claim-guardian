# Copy-Paste Commands for Creating PRs

## Quick Option: Run Script
```powershell
.\create-prs.ps1
```

---

## Manual Option: Copy-Paste Each Section

### Step 1: PR 1 - MCP Server

```powershell
git checkout fix/typescript-config
git checkout -b pr/mcp-server
git add mcp-servers/src/index.ts
git add mcp-servers/package.json
git add mcp-servers/README.md
git add mcp-servers/tsconfig.json
git add mcp-servers/cline_mcp_settings.json
git commit -m "feat: Add ClaimGuardian MCP server with 7 medical billing tools"
git push -u origin pr/mcp-server
git checkout fix/typescript-config
```

---

### Step 2: PR 2 - Frontend Components

```powershell
git checkout -b pr/frontend-components
git add frontend/src/components/
git add frontend/src/app/api/
git add frontend/src/hooks/
git add frontend/src/utils/
git add frontend/package.json
git add frontend/tsconfig.json
git add frontend/next.config.js
git commit -m "feat: Add frontend components for medical billing analysis"
git push -u origin pr/frontend-components
git checkout fix/typescript-config
```

---

### Step 3: PR 3 - Kestra Workflows

```powershell
git checkout -b pr/kestra-workflows
git add kestra-flows/claimguardian-ai-agent-http.yaml
git add kestra-flows/claimguardian-ai-agent-summarizer.yaml
git add kestra-flows/claimguradian-workflow.yaml
git add kestra-flows/appeal-generator.yaml
git add kestra-flows/medical-coding-agent.yaml
git commit -m "feat: Add Kestra workflows for medical billing automation"
git push -u origin pr/kestra-workflows
git checkout fix/typescript-config
```

---

### Step 4: PR 4 - Oumi Training

```powershell
git checkout -b pr/oumi-training
git add oumi-training/claimguardian_oumi_enhanced.py
git add oumi-training/grpo_config.yaml
git add oumi-training/evaluation/
git add oumi-training/training/
git commit -m "feat: Add Oumi GRPO training for medical billing model"
git push -u origin pr/oumi-training
git checkout fix/typescript-config
```

---

### Step 5: PR 5 - CLI Scripts

```powershell
git checkout -b pr/cli-scripts
git add scripts/cline-billing-analyzer.ps1
git add scripts/cline-appeal-generator.ps1
git add scripts/cline-batch-process.ps1
git commit -m "feat: Add Cline CLI automation scripts"
git push -u origin pr/cli-scripts
git checkout fix/typescript-config
```

---

### Step 6: PR 6 - Documentation & Config

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
git commit -m "docs: Add comprehensive documentation and configuration"
git push -u origin pr/documentation-config
git checkout fix/typescript-config
```

---

## After Running Commands

1. Go to your GitHub repository
2. You'll see 6 new branches ready for PRs
3. Create pull requests:
   - Click "Compare & pull request" for each branch
   - Base: `main` (or your default branch)
   - Compare: `pr/mcp-server`, `pr/frontend-components`, etc.
   - Add titles and descriptions
   - Create PR

4. CodeRabbit will automatically review each PR based on `.coderabbit.yaml`

---

## Files NOT Included (Excluded)

These files are NOT pushed (as requested):
- `CLINE_PROGRESS.md`
- `CLINE_FINAL_STEPS.md`
- `CLINE_SUBMISSION_STATUS.md`
- `GIT_PR_STRATEGY.md`
- `PR_COMMANDS.md` (this file)
- `docs-images/desktop.ini`
- Screenshot PNG files

---

## Troubleshooting

If you get errors:

1. **"Branch already exists"**: Delete the branch first
   ```powershell
   git branch -D pr/mcp-server
   git push origin --delete pr/mcp-server
   ```

2. **"No changes to commit"**: Check if files exist
   ```powershell
   git status
   ```

3. **"Remote branch exists"**: Force push (careful!)
   ```powershell
   git push -u origin pr/mcp-server --force
   ```

