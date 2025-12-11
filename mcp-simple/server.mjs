import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const CPT_CODES = {
  "mri brain": { code: "70553", description: "MRI brain with and without contrast", avgCost: 3500, rvu: 2.78 },
  "colonoscopy": { code: "45378", description: "Colonoscopy, diagnostic", avgCost: 3000, rvu: 3.36 },
  "knee replacement": { code: "27447", description: "Total knee arthroplasty", avgCost: 50000, rvu: 20.72 },
  "ct scan chest": { code: "71250", description: "CT thorax without contrast", avgCost: 1500, rvu: 1.28 },
  "echocardiogram": { code: "93306", description: "Echocardiography, complete", avgCost: 2000, rvu: 1.50 },
  "ekg": { code: "93000", description: "Electrocardiogram", avgCost: 150, rvu: 0.17 },
  "chest xray": { code: "71046", description: "Chest X-ray, 2 views", avgCost: 300, rvu: 0.22 },
  "appendectomy": { code: "44970", description: "Laparoscopic appendectomy", avgCost: 12000, rvu: 8.47 },
};

const ICD10_CODES = {
  "diabetes": { code: "E11.9", description: "Type 2 diabetes mellitus" },
  "hypertension": { code: "I10", description: "Essential hypertension" },
  "copd": { code: "J44.9", description: "Chronic obstructive pulmonary disease" },
  "asthma": { code: "J45.909", description: "Unspecified asthma" },
  "chest pain": { code: "R07.9", description: "Chest pain, unspecified" },
  "back pain": { code: "M54.5", description: "Low back pain" },
};

const server = new McpServer({ name: "claimguardian", version: "1.0.0" });

server.tool("lookup_cpt_code", "Find CPT code for a procedure", { procedure: z.string() }, async ({ procedure }) => {
  const key = Object.keys(CPT_CODES).find(k => procedure.toLowerCase().includes(k));
  if (key) {
    const v = CPT_CODES[key];
    return { content: [{ type: "text", text: JSON.stringify({ cpt_code: v.code, description: v.description, avg_cost: "$" + v.avgCost, medicare_rate: "$" + (v.rvu * 33.89).toFixed(2) }, null, 2) }] };
  }
  return { content: [{ type: "text", text: "Code not found for: " + procedure }] };
});

server.tool("lookup_icd10_code", "Find ICD-10 diagnosis code", { diagnosis: z.string() }, async ({ diagnosis }) => {
  const key = Object.keys(ICD10_CODES).find(k => diagnosis.toLowerCase().includes(k));
  if (key) {
    const v = ICD10_CODES[key];
    return { content: [{ type: "text", text: JSON.stringify({ icd10_code: v.code, description: v.description }, null, 2) }] };
  }
  return { content: [{ type: "text", text: "Code not found for: " + diagnosis }] };
});

server.tool("calculate_medicare_rate", "Calculate Medicare rate", { procedure: z.string() }, async ({ procedure }) => {
  const key = Object.keys(CPT_CODES).find(k => procedure.toLowerCase().includes(k));
  if (key) {
    const v = CPT_CODES[key];
    const rate = v.rvu * 33.89;
    return { content: [{ type: "text", text: JSON.stringify({ procedure: v.description, medicare_rate: "$" + rate.toFixed(2), fair_range: "$" + rate.toFixed(0) + " - $" + (rate * 3).toFixed(0) }, null, 2) }] };
  }
  return { content: [{ type: "text", text: "Procedure not found" }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("ClaimGuardian MCP running");
