# ClaimGuardian MCP Server

> **Custom Model Context Protocol Server for Medical Billing AI**  
> Built for AssembleHack25 - Cline Prize Submission ($5,000)

## 🎯 What This Does

This MCP server provides **6 specialized medical billing tools** that Cline can use to help patients understand and dispute medical bills:

| Tool | Description |
|------|-------------|
| `lookup_cpt_code` | Look up CPT procedure codes for medical services |
| `lookup_icd10_code` | Look up ICD-10 diagnosis codes |
| `detect_billing_errors` | Analyze bills for common billing errors |
| `generate_appeal_letter` | Create formal insurance appeal letters |
| `check_coverage` | Check typical insurance coverage requirements |
| `summarize_bill` | Generate plain-English bill summaries |

## 🚀 Quick Setup (Windows + Cline)

### Step 1: Install Dependencies
```powershell
cd mcp-servers
npm install
```

### Step 2: Build the Server
```powershell
npm run build
```

### Step 3: Configure Cline

1. Open Cline in Cursor/VS Code
2. Click the **MCP Servers** icon (🔌) in the top navigation
3. Click **Configure MCP Servers**
4. Add this configuration:

```json
{
  "mcpServers": {
    "claimguardian": {
      "command": "cmd",
      "args": [
        "/c",
        "node",
        "C:\\Users\\arunk\\hackathon\\Bill optimizer\\mcp-servers\\build\\index.js"
      ],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

> ⚠️ **Important**: Update the path to match your actual project location!

### Step 4: Restart Cline

After saving the configuration, restart the Cline extension to load the new MCP server.

## 🧪 Testing the Server

### Using MCP Inspector
```powershell
npm run inspector
```

This opens a visual inspector where you can test each tool.

### Example Prompts for Cline

Once configured, try these prompts in Cline:

```
"What's the CPT code for a colonoscopy?"

"Check this bill for errors: MRI brain billed at $8,000 with code 70553"

"Generate an appeal letter for claim #12345, denied for medical necessity, 
for patient John Smith's knee replacement surgery"

"What's the ICD-10 code for type 2 diabetes?"

"Summarize a bill with procedures: MRI brain, blood panel, office visit - 
total $5000, insurance paid $3500, I owe $1500"
```

## 📁 Project Structure

```
mcp-servers/
├── src/
│   └── index.ts          # Main MCP server code
├── build/
│   └── index.js          # Compiled JavaScript
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── cline_mcp_settings.json  # Cline configuration template
└── README.md             # This file
```

## 🏆 Why This Wins the Cline Prize

1. **Custom Domain-Specific Tools** - Not using existing MCP servers, built from scratch
2. **Real-World Problem** - Medical billing affects millions of Americans
3. **6 Useful Tools** - Comprehensive toolkit for billing disputes
4. **Production-Ready** - TypeScript, proper error handling, structured responses
5. **Deep Cline Integration** - Tools designed for conversational AI interaction

## 🔧 Development

### Watch Mode (Auto-rebuild)
```powershell
npm run watch
```

### Manual Build
```powershell
npm run build
```

### Run Directly
```powershell
npm start
```

## 📚 MCP Server Tools Reference

### 1. lookup_cpt_code
```typescript
Input: { procedure: string }
Output: { cpt_code, description, average_cost, category }
```

### 2. lookup_icd10_code
```typescript
Input: { diagnosis: string }
Output: { icd10_code, description }
```

### 3. detect_billing_errors
```typescript
Input: { 
  bill_details: string, 
  billed_amount?: number, 
  procedure_code?: string 
}
Output: { errors_found, potential_issues[], overall_risk }
```

### 4. generate_appeal_letter
```typescript
Input: { 
  patient_name: string,
  claim_number: string,
  denial_reason: string,
  procedure_description: string,
  supporting_facts: string
}
Output: { appeal_letter: string, tips: string[] }
```

### 5. check_coverage
```typescript
Input: { 
  procedure: string,
  insurance_type?: "medicare" | "medicaid" | "private" | "unknown"
}
Output: { coverage_analysis, common_requirements[] }
```

### 6. summarize_bill
```typescript
Input: {
  procedures: string[],
  total_charged: number,
  insurance_paid?: number,
  patient_responsibility?: number
}
Output: { bill_overview, procedures_breakdown, plain_english_summary }
```

## 🔗 Integration with ClaimGuardian

This MCP server is part of the larger ClaimGuardian AI system:

- **Oumi Model**: Fine-tuned on medical billing data (✅ Complete)
- **Kestra Workflow**: Orchestrates the billing analysis pipeline
- **Vercel Frontend**: User interface for uploading bills
- **Cline MCP**: Provides tools for AI-assisted billing help (This component)
- **CodeRabbit**: Ensures code quality through PR reviews

## 📄 License

MIT License - Built for AssembleHack25

---

**Made with ❤️ for patients fighting unfair medical bills**
