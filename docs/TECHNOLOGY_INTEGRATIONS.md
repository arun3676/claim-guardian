# Technology Integrations

Documentation for technology integrations and tools used in ClaimGuardian AI.

## Overview

This document outlines the technologies and tools integrated into ClaimGuardian AI for medical billing analysis and automation.

---

## 1. Kestra - Workflow Orchestration

### Purpose
Kestra is used for workflow orchestration and AI-powered data processing in medical billing analysis.

### Implementation

**Workflow Files:**
- `kestra-flows/claimguardian-ai-agent-summarizer.yaml` - AI Agent plugin version
- `kestra-flows/claimguardian-ai-agent-http.yaml` - HTTP-based AI Agent implementation

**How It Works:**

1. **Data Summarization:**
   - AI Agent loads medical bill data from `files/sample_medical_bill.json`
   - Summarizes data from multiple sources:
     - Medical bill details (procedures, costs, diagnoses)
     - CPT codes and descriptions
     - Medicare rate comparisons
     - Insurance claim information

2. **Decision Making:**
   - AI Agent analyzes summarized data
   - Makes decisions:
     - Risk level assessment (HIGH, MEDIUM, LOW)
     - Recommended action (APPEAL, NEGOTIATE, ACCEPT)
     - Priority level (URGENT, HIGH, MEDIUM, LOW)
   - Provides reasoning and next steps

3. **Conditional Routing:**
   - Workflow routes based on AI decisions
   - Different paths for APPEAL vs NEGOTIATE vs ACCEPT

### Key Features

✅ **Kestra's built-in AI Agent** - Uses `io.kestra.plugin.ai.agent.AIAgent` or HTTP plugin  
✅ **Summarizes data from other systems** - Processes medical bills, CPT codes, Medicare rates  
✅ **Makes decisions** - Risk assessment and action recommendations  
✅ **Conditional workflow** - Routes based on AI decisions  

### Running the Workflow

```bash
# Start Kestra server
docker run --pull=always --rm -it -p 8080:8080 --user=root \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /tmp:/tmp kestra/kestra:latest server local

# Access UI at http://localhost:8080
# Upload workflow: kestra-flows/claimguardian-ai-agent-http.yaml
# Set OPENAI_API_KEY secret in Kestra UI
# Run workflow with default inputs
```

---

## 2. Cline - CLI Automation & MCP Integration

### Purpose
Cline is used for CLI automation and MCP (Model Context Protocol) integration to improve development workflow and enable automated medical billing analysis.

### Implementation

**MCP Server:**
- `mcp-servers/` - Custom ClaimGuardian MCP server with 7 medical billing tools
- Integrated with Oumi fine-tuned model
- Tools: CPT lookup, ICD-10 lookup, billing error detection, appeal letter generation, Medicare rate calculator, bill report generator, claim validation

**CLI Automation Scripts:**
- `scripts/cline-billing-analyzer.ps1` - Automated billing analysis using CLI
- `scripts/cline-appeal-generator.ps1` - Automated appeal letter generation
- `scripts/cline-batch-process.ps1` - Batch processing multiple bills

**Frontend Integration:**
- React components using MCP tools
- Dashboard for billing analysis
- API hooks for MCP tool calls

### How Cline Improves Development Experience

1. **Automated Medical Billing Analysis:**
   - CLI scripts automate repetitive billing analysis tasks
   - Reduces manual work from hours to minutes
   - Consistent, accurate results

2. **Rapid Prototyping:**
   - CLI enables quick iteration on billing analysis features
   - MCP tools provide reusable components
   - Frontend components built faster with CLI assistance

3. **Code Generation:**
   - CLI generates React components, API routes, and utilities
   - Reduces boilerplate code
   - Ensures consistency across codebase

### Screenshots Evidence
- `docs-images/Cline- MCP Creation.png` - MCP server creation
- `docs-images/Cline- MCP tool testing.png` - Tool testing
- `docs-images/Cline-MCP Execution.png` - Execution in action
- `docs-images/Cline- Full Workflow.png` - Complete workflow
- `docs-images/Cline-Dashboard.png` - Dashboard implementation
- `docs-images/Cline Frontend components.png` - Frontend components
- `docs-images/Cline-React Page.png` - React page

---

## 3. Oumi - Model Training & Fine-tuning

### Purpose
Oumi is used for reinforcement learning fine-tuning of medical billing analysis models.

### Implementation

**Training:**
- `oumi-training/claimguardian_oumi_enhanced.py` - GRPO training script
- `oumi-training/grpo_config.yaml` - GRPO configuration
- Model: `arungenailab/claimguardian-medical-billing-v2` (uploaded to HuggingFace)

**Evaluation:**
- `oumi-training/evaluation/OUMI_EVALUATION_REPORT.md` - Comprehensive evaluation report
- `oumi-training/evaluation/claimguardian_eval.yaml` - Evaluation configuration
- LLM-as-a-Judge implementation for medical billing evaluation
- HallOumi integration for claim verification

**Features Used:**
- ✅ Reinforcement Learning fine-tuning (GRPO)
- ✅ LLM-as-a-Judge evaluation
- ✅ Data synthesis documentation
- ✅ HallOumi integration

### Model Performance
- Token Accuracy: 95.8%
- Base Model: Qwen2-0.5B-Instruct
- Training Data: 95,138 synthetic medical records
- Overall Model Score: 8.75/10

---

## 4. Vercel - Deployment Platform

### Purpose
Vercel is used for deploying the frontend Next.js application.

### Implementation Status
- ✅ Frontend Next.js app ready (`frontend/`)
- ⚠️ Deployment in progress
- ⚠️ Live URL: [To be added after deployment]

### Deployment Steps
1. Connect GitHub repository to Vercel
2. Configure build settings (Next.js auto-detected)
3. Set environment variables if needed
4. Deploy and verify live site

---

## 5. CodeRabbit - Code Quality & Review

### Purpose
CodeRabbit is used for automated code reviews, quality improvements, and ensuring best practices.

### Implementation

**Configuration:**
- `.coderabbit.yaml` - Comprehensive CodeRabbit configuration
- Custom rules for medical billing domain
- Path-based instructions for different file types

**Activity:**
- CodeRabbit reviews active (see `code rabbit/` folder screenshots)
- PR reviews covering:
  - Code quality improvements
  - Documentation enhancements
  - Security best practices
  - HIPAA compliance checks
  - Medical billing accuracy

**Screenshots Evidence:**
- `code rabbit/Screenshot 2025-12-11 230457.png` - CodeRabbit review
- `code rabbit/Screenshot 2025-12-11 230512.png` - CodeRabbit activity

### CodeRabbit Focus Areas
- Python files: HIPAA compliance, security, medical billing accuracy
- TypeScript files: Type safety, API security, input validation
- React components: Accessibility, user data protection
- MCP servers: Tool registration, medical code accuracy
- Kestra workflows: Workflow correctness, error handling
- Oumi training: Training configuration, reward functions

---

## Summary

| Technology | Purpose | Status | Key Features |
|------------|---------|--------|--------------|
| Kestra | Workflow orchestration | ✅ Complete | AI Agent workflow with summarization and decision-making |
| Cline | CLI automation & MCP | ✅ Complete | MCP server + CLI automation scripts + screenshots |
| Oumi | Model training | ✅ Complete | GRPO training + LLM-as-a-Judge + evaluation report |
| Vercel | Deployment | ⚠️ Pending | Frontend ready, deployment in progress |
| CodeRabbit | Code quality | ✅ Complete | Configuration + active reviews + screenshots |

---

## Next Steps

1. ✅ Complete Kestra AI Agent integration
2. ✅ Create CLI automation scripts
3. ⚠️ Deploy to Vercel
4. ✅ Document CodeRabbit activity
5. ✅ Verify Oumi training artifacts

---

*Last Updated: December 11, 2025*

