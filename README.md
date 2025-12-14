# ClaimGuardian AI

> **AI-powered medical billing analysis platform helping patients fight unfair medical bills**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project)
[![CodeRabbit](https://img.shields.io/badge/CodeRabbit-AI%20Reviews-blue?logo=github)](https://github.com/arun3676/claim-guardian)

---

## 🎯 Problem & Solution

**Problem:** Medical billing errors cost Americans over **$100 billion annually**. Patients are overcharged, denied claims unfairly, and lack tools to fight back.

**Solution:** ClaimGuardian AI uses cutting-edge AI to:
- 🔍 **Detect billing errors** automatically (overcharges, upcoding, unbundling)
- 📊 **Analyze medical bills** against Medicare rates and fair market value
- 📝 **Generate appeal letters** with legal references automatically
- ⚡ **Process bills 30-60x faster** than manual methods

---

## 🚀 Quick Deploy to Vercel

### 1. Clone & Deploy

```bash
# Clone the repository
git clone https://github.com/arun3676/claim-guardian.git
cd claim-guardian
```

### 2. Set Environment Variables

Create these environment variables in Vercel:

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for AI analysis |
| `HUGGINGFACE_API_KEY` | HuggingFace API key for Oumi model |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token |
| `KV_URL` | Vercel KV database URL |
| `KV_REST_API_URL` | Vercel KV REST API URL |
| `KV_REST_API_TOKEN` | Vercel KV REST API token |
| `KV_REST_API_READ_ONLY_TOKEN` | Vercel KV read-only token |

### 3. Deploy

1. Connect your GitHub repository to Vercel
2. Set the **Root Directory** to `frontend`
3. Add environment variables from the table above
4. Deploy!

---

## 🛠️ Technology Stack

| Technology | Purpose | Status |
|------------|---------|--------|
| **Vercel** | Frontend deployment & Generative UI | ✅ Complete |
| **Cline** | MCP Server with 7 medical billing tools | ✅ Complete |
| **Oumi** | GRPO model fine-tuning | ✅ Complete |
| **Kestra** | AI Agent workflow orchestration | ✅ Ready |
| **CodeRabbit** | Automated code reviews | ✅ Active |

---

## 📁 Project Structure

```
claimguardian-ai/
├── frontend/              # Next.js application (Vercel deployment)
│   ├── src/
│   │   ├── app/          # Pages and API routes
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility libraries
│   │   └── utils/        # Helper functions
│   ├── package.json
│   └── vercel.json
├── mcp-servers/           # Cline MCP server (7 medical billing tools)
│   ├── src/index.ts      # MCP server implementation
│   └── package.json
├── kestra-fixed new/      # Kestra workflow definitions
│   ├── claimguardian-ai-agent-complete.yaml
│   └── docker-compose.yml
├── .coderabbit.yaml       # CodeRabbit configuration
└── vercel.json            # Vercel deployment configuration
```

---

## 🔧 Local Development

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Access at `http://localhost:3000`

### MCP Server (for Cline)

```bash
cd mcp-servers
npm install
npm run build
```

Configure in Cline settings using `mcp-servers/cline_mcp_settings.json`

### Kestra (Optional)

```bash
cd "kestra-fixed new"
docker-compose up -d
```

Access Kestra UI at `http://localhost:8080`

---

## 🔌 MCP Tools (Cline Integration)

Our custom MCP server exposes 7 specialized medical billing tools:

| Tool | Purpose |
|------|---------|
| `lookup_cpt_code` | Validate procedure codes against CMS database |
| `lookup_icd10_code` | Find diagnosis codes for medical conditions |
| `calculate_medicare_rate` | Get Medicare reimbursement rates |
| `detect_billing_errors` | Identify overcharges, upcoding, billing errors |
| `generate_appeal_letter` | Create professional appeal letters |
| `check_coverage` | Verify insurance coverage |
| `summarize_bill` | Generate comprehensive bill summaries |

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
- ✅ PDF download support

### AI-Powered Analysis
- ✅ Oumi GRPO fine-tuned model for medical billing
- ✅ Real-time streaming analysis (Vercel Generative UI)
- ✅ Confidence scoring for error detection

---

## 🔒 Environment Variables Template

Copy `frontend/env.template` and fill in your values:

```env
OPENAI_API_KEY=your_openai_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
KV_URL=your_vercel_kv_url
KV_REST_API_URL=your_vercel_kv_rest_url
KV_REST_API_TOKEN=your_vercel_kv_token
KV_REST_API_READ_ONLY_TOKEN=your_vercel_kv_readonly_token
```

---

## 📝 License

MIT License

---

**Made with ❤️ for patients fighting unfair medical bills**
