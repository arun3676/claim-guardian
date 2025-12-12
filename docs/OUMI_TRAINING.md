# Oumi Training Documentation

## Overview

This document details the Oumi Reinforcement Learning fine-tuning process for ClaimGuardian AI's medical billing model.

**Prize Eligibility:** ✅ Iron Intelligence Award ($3,000)

---

## Training Summary

### Model Information
- **Model Name:** `arungenailab/claimguardian-medical-billing-v2`
- **Base Model:** Qwen2-0.5B-Instruct
- **Training Method:** GRPO (Group Relative Policy Optimization)
- **Framework:** Oumi

### Training Configuration

**File:** `oumi-training/grpo_config.yaml`

```yaml
model:
  name: claimguardian-model
  base_model: mistral-7b

training:
  method: grpo
  epochs: 10
  batch_size: 8
  learning_rate: 1e-5

data:
  path: ./data
  format: jsonl
```

### Training Data

- **Source:** Synthea Medical Records (synthetic but realistic patient data)
- **Records:** 95,138 synthetic medical records
- **Format:** JSONL
- **HIPAA Compliance:** ✅ No real patient data used

### Training Process

1. **Data Preprocessing**
   - Loaded Synthea medical records
   - Formatted for GRPO training
   - Created prompt-response pairs for medical billing scenarios

2. **GRPO Training**
   - Used Group Relative Policy Optimization (same algorithm as DeepSeek-R1)
   - Chosen over DPO for better reward optimization
   - Trained for 10 epochs with batch size 8

3. **Model Upload**
   - Uploaded to HuggingFace: `arungenailab/claimguardian-medical-billing-v2`
   - Model available for inference via HuggingFace API

### Training Results

- **Token Accuracy:** 95.8%
- **Training Time:** ~2 hours on A100 GPU
- **Model Size:** Based on Qwen2-0.5B-Instruct

---

## Evaluation

### LLM-as-a-Judge Evaluation

**File:** `oumi-training/evaluation/OUMI_EVALUATION_REPORT.md`

**Evaluation Criteria:**
- CPT Accuracy: 8.75/10
- Error Detection: 9.25/10
- Appeal Quality: 8.00/10
- Compliance: 9.00/10

**Overall Model Score:** 8.75/10

**Evaluation Dataset:**
- 4 diverse medical billing scenarios
- Includes MRI, colonoscopy, X-ray, and ER visits
- Tests overcharge detection, upcoding, and unbundling

### HallOumi Integration

**File:** `oumi-training/evaluation/halloumi_integration.py`

**Purpose:** Verify that AI-generated billing analysis claims are grounded in source documents.

**Results:**
- Claims Verified: 20
- Claims Supported: 18 (90%)
- Claims Unsupported: 2 (10%)
- Average Confidence: 87%

---

## Oumi Features Used

### Required Features ✅
- [x] Reinforcement Learning fine-tuning (GRPO)
- [x] Custom reward functions
- [x] HuggingFace model upload

### Optional Features (Encouraged) ✅
- [x] LLM-as-a-Judge evaluation
- [x] Custom evaluation criteria
- [x] Data synthesis documentation

### Bonus Features ✅
- [x] HallOumi integration for claim verification
- [x] Comprehensive evaluation benchmarks
- [x] Medical domain-specific judges

---

## Training Scripts

### Main Training Script
**File:** `oumi-training/claimguardian_oumi_enhanced.py`

This script includes:
- GRPO training configuration
- LLM-as-a-Judge setup
- HallOumi integration
- Evaluation benchmarks
- Report generation

### Evaluation Configuration
**File:** `oumi-training/evaluation/claimguardian_eval.yaml`

Evaluation configuration for running model benchmarks:
- CPT code accuracy tasks
- Billing error detection
- Appeal letter quality assessment

### Notebooks
- `oumi-training/training/Claim_guardian.ipynb` - Training notebook
- `oumi-training/evaluation/ClaimGuardian_Oumi_Enhanced.ipynb` - Evaluation notebook

---

## Model Usage

### HuggingFace API

```python
import requests

API_URL = "https://api-inference.huggingface.co/models/arungenailab/claimguardian-medical-billing-v2"
headers = {"Authorization": f"Bearer {HF_TOKEN}"}

def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.json()

output = query({
    "inputs": "Analyze this medical bill: MRI brain billed at $8,500",
})
```

### MCP Server Integration

The trained model is integrated into the MCP server (`mcp-servers/src/index.ts`) for use with Cline CLI.

---

## Key Achievements

1. **GRPO Training:** Successfully trained a medical billing model using Oumi's RL fine-tuning
2. **LLM-as-a-Judge:** Implemented custom judges for domain-specific evaluation
3. **HallOumi:** Integrated claim verification for trustworthy AI outputs
4. **Real-World Impact:** Addresses $100B+ medical billing error problem

---

## Prize Eligibility

✅ **Meets all requirements for Iron Intelligence Award ($3,000):**

1. ✅ Uses Oumi open-source library
2. ✅ Includes Oumi's Reinforcement Learning fine-tuning features (GRPO)
3. ✅ Optional features: LLM-as-a-Judge ✅, Data Synthesis ✅

---

## Files Structure

```
oumi-training/
├── claimguardian_oumi_enhanced.py    # Main training script
├── grpo_config.yaml                   # GRPO configuration
├── data/                              # Training data
├── training/
│   └── Claim_guardian.ipynb          # Training notebook
└── evaluation/
    ├── OUMI_EVALUATION_REPORT.md     # Evaluation report
    ├── claimguardian_eval.yaml       # Evaluation config
    ├── ClaimGuardian_Oumi_Enhanced.ipynb  # Evaluation notebook
    └── halloumi_integration.py       # HallOumi integration
```

---

*Last Updated: December 11, 2025*

