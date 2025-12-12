#!/usr/bin/env node

/**
 * Terminal-based MCP Server Test Script
 * Tests all ClaimGuardian MCP tools programmatically
 */

const { spawn } = require('child_process');
const path = require('path');

class MCPTester {
  constructor() {
    this.serverProcess = null;
    this.requestId = 1;
    this.pendingRequests = new Map();
  }

  startServer() {
    return new Promise((resolve, reject) => {
      console.log('🚀 Starting ClaimGuardian MCP Server...');

      this.serverProcess = spawn('node', ['server.mjs'], {
        cwd: path.join(process.cwd(), 'mcp-fixed'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let startupTimeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 10000);

      this.serverProcess.stderr.on('data', (data) => {
        const output = data.toString();
        if (output.includes('ClaimGuardian MCP Server running!')) {
          clearTimeout(startupTimeout);
          console.log('✅ MCP Server started successfully');
          setTimeout(resolve, 1000); // Give server time to initialize
        }
      });

      this.serverProcess.on('error', (error) => {
        clearTimeout(startupTimeout);
        reject(error);
      });

      // Handle stdout for responses
      this.serverProcess.stdout.on('data', (data) => {
        this.handleResponse(data);
      });
    });
  }

  handleResponse(data) {
    try {
      const response = JSON.parse(data.toString());
      if (response.id && this.pendingRequests.has(response.id)) {
        const { resolve, reject } = this.pendingRequests.get(response.id);
        this.pendingRequests.delete(response.id);

        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.result);
        }
      }
    } catch (error) {
      console.log('Raw response:', data.toString());
    }
  }

  sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: '2.0',
        id: this.requestId++,
        method,
        params
      };

      this.pendingRequests.set(request.id, { resolve, reject });

      const requestJson = JSON.stringify(request) + '\n';
      this.serverProcess.stdin.write(requestJson);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(request.id)) {
          this.pendingRequests.delete(request.id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 10000);
    });
  }

  async testTool(toolName, args, description) {
    console.log(`\n🔧 Testing ${toolName}...`);
    console.log(`Description: ${description}`);

    try {
      // First initialize the connection if needed
      await this.sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'mcp-test-client',
          version: '1.0.0'
        }
      });

      const result = await this.sendRequest('tools/call', {
        name: toolName,
        arguments: args
      });

      console.log('✅ SUCCESS');
      if (result.content && result.content[0]) {
        const content = result.content[0];
        if (content.type === 'text') {
          try {
            const parsed = JSON.parse(content.text);
            console.log('Response:', JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log('Response:', content.text);
          }
        }
      }
      return true;
    } catch (error) {
      console.log('❌ FAILED:', error.message);
      return false;
    }
  }

  async runTests() {
    console.log('🧪 Starting MCP Tool Tests...\n');

    const tests = [
      {
        name: 'lookup_cpt_code',
        args: { procedure: 'MRI brain' },
        description: 'Look up CPT codes for medical procedures'
      },
      {
        name: 'lookup_icd10_code',
        args: { diagnosis: 'diabetes' },
        description: 'Look up ICD-10 codes for medical conditions'
      },
      {
        name: 'calculate_medicare_rate',
        args: { procedure: 'colonoscopy' },
        description: 'Calculate Medicare reimbursement rates'
      },
      {
        name: 'detect_billing_errors',
        args: {
          procedures: ['MRI brain', 'colonoscopy', 'chest x-ray'],
          total_billed: 10000
        },
        description: 'Analyze medical bills for errors and overcharges'
      },
      {
        name: 'generate_appeal_letter',
        args: {
          patient_name: 'John Smith',
          claim_number: 'CLM-2024-001',
          denial_reason: 'Procedure not medically necessary',
          procedure: 'MRI brain',
          supporting_facts: 'Patient presented with severe headaches and neurological symptoms. Primary care physician ordered MRI to rule out serious conditions. Medicare guidelines support this diagnostic procedure.'
        },
        description: 'Generate formal insurance appeal letters'
      }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      const success = await this.testTool(test.name, test.args, test.description);
      if (success) {
        passed++;
      } else {
        failed++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${passed + failed}`);

    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED! MCP Server is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check server implementation.');
    }
  }

  stopServer() {
    if (this.serverProcess) {
      console.log('\n🛑 Stopping MCP Server...');
      this.serverProcess.kill();
    }
  }
}

// Run the tests
async function main() {
  const tester = new MCPTester();

  try {
    await tester.startServer();
    await tester.runTests();
  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  } finally {
    tester.stopServer();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = MCPTester;
