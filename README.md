# ClaimGuardian AI

> **AI-powered medical billing analysis platform helping patients fight unfair medical bills**

---

## 🛠️ Technology Stack

| Technology | Purpose | Status |
|------------|---------|--------|
| **Kestra** | Workflow orchestration & AI Agent | ✅ Complete |
| **Cline** | CLI automation & MCP integration | ✅ Complete |
| **Oumi** | Model training & fine-tuning | ✅ Complete |
| **Vercel** | Frontend deployment | ⚠️ Pending |
| **CodeRabbit** | Code quality & reviews | ✅ Complete |

---

## 🎯 Problem & Solution

**Problem:** Medical billing errors cost Americans over **$100 billion annually**. Patients are overcharged, denied claims unfairly, and lack tools to fight back.

**Solution:** ClaimGuardian AI uses cutting-edge AI to:
- 🔍 **Detect billing errors** automatically (overcharges, upcoding, unbundling)
- 📊 **Analyze medical bills** against Medicare rates and fair market value
- 📝 **Generate appeal letters** with legal references automatically
- ⚡ **Process bills 30-60x faster** than manual methods

---

## 🚀 Quick Start

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Access at `http://localhost:3000`

### Kestra Workflows

```bash
# Start Kestra server
docker run --pull=always --rm -it -p 8080:8080 --user=root \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /tmp:/tmp kestra/kestra:latest server local

# Access UI at http://localhost:8080
# Upload workflow: kestra-flows/claimguardian-ai-agent-http.yaml
```

### Cline CLI Automation

```powershell
# Analyze a medical bill
.\scripts\cline-billing-analyzer.ps1 -BillPath "files\sample_medical_bill.json"

# Generate appeal letter
.\scripts\cline-appeal-generator.ps1 -BillPath "files\sample_medical_bill.json"

# Batch process multiple bills
.\scripts\cline-batch-process.ps1 -BillDirectory "files\"
```

---

## 📁 Project Structure

```
claimguardian-ai/
├── frontend/              # Next.js application (Vercel deployment)
├── kestra-flows/          # Kestra workflow definitions
│   ├── claimguardian-ai-agent-http.yaml    # AI Agent workflow ⭐
│   └── claimguradian-workflow.yaml         # Human-in-the-loop workflow
├── mcp-servers/           # Cline MCP server (7 medical billing tools)
├── oumi-training/         # Oumi GRPO training & evaluation
├── scripts/               # Cline CLI automation scripts ⭐
│   ├── cline-billing-analyzer.ps1
│   ├── cline-appeal-generator.ps1
│   └── cline-batch-process.ps1
├── docs/                  # Comprehensive documentation
│   ├── TECHNOLOGY_INTEGRATIONS.md  # Technology integrations
│   ├── CLINE_AUTOMATION.md        # Cline CLI automation
│   ├── OUMI_TRAINING.md           # Oumi training process
│   └── DEMO_VIDEO_SCRIPT.md       # 2-minute demo script
└── files/                 # Sample medical bills
```

---

## 🔌 Technology Integrations

### 1. Kestra - Workflow Orchestration ✅

**Purpose:** Workflow orchestration and AI-powered data processing for medical billing analysis.

**Implementation:**
- ✅ **AI Agent Workflow:** `kestra-flows/claimguardian-ai-agent-http.yaml`
- ✅ **Summarizes data from:** Medical bills (JSON), CPT codes, Medicare rates
- ✅ **Makes decisions:** Risk level (HIGH/MEDIUM/LOW), Action (APPEAL/NEGOTIATE/ACCEPT)
- ✅ **Conditional routing:** Workflow routes based on AI decisions

**Key Features:**
- Uses Kestra's HTTP plugin to call OpenAI API
- Processes medical billing data from multiple sources
- Makes intelligent decisions based on analysis
- Routes workflow conditionally based on decisions

**See:** `docs/TECHNOLOGY_INTEGRATIONS.md` for details

---

### 2. Cline - CLI Automation & MCP ✅

**Purpose:** CLI automation and MCP integration to improve development workflow.

**Implementation:**
- ✅ **MCP Server:** Custom ClaimGuardian MCP with 7 medical billing tools
- ✅ **CLI Automation Scripts:** 3 PowerShell scripts for billing analysis, appeal generation, batch processing
- ✅ **Frontend Integration:** React components, dashboard, API hooks

**Automation Scripts:**
1. `scripts/cline-billing-analyzer.ps1` - Automated billing analysis
2. `scripts/cline-appeal-generator.ps1` - Automated appeal generation
3. `scripts/cline-batch-process.ps1` - Batch processing

**See:** `docs/CLINE_AUTOMATION.md` for details

---

### 3. Oumi - Model Training ✅

**Purpose:** Reinforcement learning fine-tuning for medical billing analysis models.

**Implementation:**
- ✅ **GRPO Training:** Fine-tuned model using Group Relative Policy Optimization
- ✅ **Model:** `arungenailab/claimguardian-medical-billing-v2` (HuggingFace)
- ✅ **LLM-as-a-Judge:** Custom evaluation for medical billing
- ✅ **Training Data:** 95,138 synthetic medical records

**Results:**
- Token Accuracy: 95.8%
- Overall Model Score: 8.75/10

**See:** `docs/OUMI_TRAINING.md` for details

---

### 4. Vercel - Deployment ⚠️

**Purpose:** Frontend deployment platform.

**Status:**
- ✅ Frontend Next.js app ready
- ✅ `vercel.json` configuration prepared
- ⚠️ Deployment in progress

**See:** `docs/VERCEL_DEPLOYMENT.md` for details

---

### 5. CodeRabbit - Code Quality ✅

**Purpose:** Automated code reviews and quality improvements.

**Implementation:**
- ✅ **Configuration:** `.coderabbit.yaml` with comprehensive rules
- ✅ **Active Reviews:** CodeRabbit reviews visible in PRs
- ✅ **Focus Areas:** HIPAA compliance, security, medical billing accuracy

**See:** `docs/TECHNOLOGY_INTEGRATIONS.md` for details

---

## 📊 Features

### Medical Billing Analysis
- ✅ CPT code lookup and validation
- ✅ ICD-10 diagnosis code lookup
- ✅ Billing error detection (NCCI edits, upcoding, unbundling, duplicates)
- ✅ Medicare rate comparison
- ✅ Overcharge detection and risk assessment

### Appeal Letter Generation
- ✅ Automated appeal letter generation
- ✅ Legal references (ERISA, ACA)
- ✅ Professional formatting
- ✅ Submission tips and checklists

### Automation
- ✅ Cline CLI automation scripts
- ✅ Kestra workflow orchestration
- ✅ Batch processing capabilities
- ✅ API integration

---

## 🛠️ Technology Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Node.js, TypeScript
- **AI/ML:** Oumi (GRPO training), OpenAI API, HuggingFace
- **Orchestration:** Kestra
- **CLI:** Cline CLI with MCP
- **Deployment:** Vercel
- **Code Quality:** CodeRabbit

---

## 📚 Documentation

- **[Technology Integrations](docs/TECHNOLOGY_INTEGRATIONS.md)** - Complete documentation of technology integrations
- **[Cline Automation](docs/CLINE_AUTOMATION.md)** - Cline CLI automation scripts and usage
- **[Oumi Training](docs/OUMI_TRAINING.md)** - Model training process and evaluation
- **[Demo Video Script](docs/DEMO_VIDEO_SCRIPT.md)** - 2-minute demo script for submission

---

## 🎬 Demo Video

See `docs/DEMO_VIDEO_SCRIPT.md` for the complete demo script covering all technology integrations.

---

## 📸 Screenshots

### Cline Integration
- `docs-images/Cline- MCP Creation.png` - MCP server setup
- `docs-images/Cline- MCP tool testing.png` - Tool testing
- `docs-images/Cline-MCP Execution.png` - Execution in action
- `docs-images/Cline- Full Workflow.png` - Complete workflow
- `docs-images/Cline-Dashboard.png` - Dashboard
- `docs-images/Cline Frontend components.png` - Frontend components

### CodeRabbit
- `code rabbit/Screenshot 2025-12-11 230457.png` - CodeRabbit review
- `code rabbit/Screenshot 2025-12-11 230512.png` - CodeRabbit activity

### Kestra
- `kestra-flows/Screenshot 2025-12-10 213152.png` - Workflow execution
- `kestra-flows/Screenshot 2025-12-10 213107.png` - Workflow UI

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Docker (for Kestra)
- PowerShell (for CLI scripts on Windows)
- OpenAI API key (for Kestra AI Agent)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd claimguardian-ai

# Install frontend dependencies
cd frontend
npm install

# Install MCP server dependencies
cd ../mcp-servers
npm install
npm run build
```

### Configuration

1. Set up environment variables (see `.env.example`)
2. Configure Cline MCP server (see `mcp-servers/README.md`)
3. Set up Kestra server (see `kestra-flows/`)

---

## 📝 License

MIT License

---

## 🙏 Acknowledgments

- **Kestra** - Workflow orchestration and AI Agent capabilities
- **Cline** - CLI automation and MCP integration
- **Oumi** - Reinforcement Learning fine-tuning framework
- **Vercel** - Deployment platform
- **CodeRabbit** - Code quality and PR reviews

---

## 📧 Contact

For questions about this submission, please refer to the documentation in the `docs/` folder.

---

**Made with ❤️ for patients fighting unfair medical bills**

*Last Updated: December 11, 2025*
