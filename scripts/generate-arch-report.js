#!/usr/bin/env node

/**
 * Architecture Report Generator
 * 
 * Generates an HTML report for architecture validation results
 * by running tests and converting the output to a beautiful HTML page.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.join(process.cwd(), 'public');
const REPORT_FILE = path.join(OUTPUT_DIR, 'index.html');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Run tests and capture output
console.log('Running architecture validation tests...');
let testOutput = '';
let testStatus = 'passing';

try {
  testOutput = execSync('npm run arch:check 2>&1', { encoding: 'utf8' });
} catch (error) {
  testStatus = 'failing';
  testOutput = error.stdout || error.toString();
}

// Parse test results from Jest output
const testsMatch = testOutput.match(/Tests:\s+([\d\w\s,]+)/);
const passMatch = testOutput.match(/(\d+)\s+passed/);
const failMatch = testOutput.match(/(\d+)\s+failed/);

const passedTests = passMatch ? parseInt(passMatch[1]) : 0;
const failedTests = failMatch ? parseInt(failMatch[1]) : 0;
const totalTests = passedTests + failedTests;

console.log(`Tests results: ${passedTests} passed, ${failedTests} failed out of ${totalTests}`);

// Generate HTML report
const htmlContent = generateHTML(testStatus, passedTests, failedTests, totalTests, testOutput);

// Write HTML file
fs.writeFileSync(REPORT_FILE, htmlContent);
console.log(`✓ Report generated: ${REPORT_FILE}`);

/**
 * Generate HTML report content
 */
function generateHTML(status, passed, failed, total, testOutput) {
  const statusColor = failed === 0 ? '#10b981' : '#ef4444';
  const statusText = failed === 0 ? 'VALID' : 'FAILED';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Architecture Validation Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }
        
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        
        header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        header p {
            font-size: 1.1em;
            opacity: 0.95;
        }
        
        main {
            padding: 40px 20px;
        }
        
        section {
            margin-bottom: 40px;
        }
        
        section h2 {
            font-size: 1.8em;
            color: #667eea;
            margin-bottom: 20px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: bold;
            margin: 10px 10px 10px 0;
            background-color: ${statusColor};
            color: white;
        }
        
        .test-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .test-card {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid;
        }
        
        .test-card.passed {
            border-left-color: #10b981;
        }
        
        .test-card.failed {
            border-left-color: #ef4444;
        }
        
        .test-card .number {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        
        .test-card .label {
            color: #6b7280;
            font-size: 0.9em;
            margin-top: 5px;
        }
        
        .test-output {
            background: #1f2937;
            color: #10b981;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            line-height: 1.5;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        table th {
            background: #f3f4f6;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #374151;
        }
        
        table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        table tr:hover {
            background: #f9fafb;
        }
        
        .folder-table code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
        }
        
        footer {
            background: #f3f4f6;
            padding: 20px;
            text-align: center;
            color: #666;
            border-top: 1px solid #e5e7eb;
        }
        
        .cta-button {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 30px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            transition: background 0.3s ease;
        }
        
        .cta-button:hover {
            background: #764ba2;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📊 Architecture Validation Report</h1>
            <p>React Native Analytics Module - Folder Structure Validation</p>
        </header>
        
        <main>
            <section>
                <h2>✅ Validation Status</h2>
                <div>
                    <span class="status-badge">Folder Structure: ${statusText}</span>
                    <span class="status-badge" style="background: #3b82f6;">Last Updated: <script>document.write(new Date().toLocaleString())</script></span>
                </div>
            </section>
            
            <section>
                <h2>📈 Test Results</h2>
                <div class="test-summary">
                    <div class="test-card passed">
                        <div class="number">${passed}</div>
                        <div class="label">Passed</div>
                    </div>
                    <div class="test-card ${failed > 0 ? 'failed' : 'passed'}">
                        <div class="number">${failed}</div>
                        <div class="label">Failed</div>
                    </div>
                    <div class="test-card passed">
                        <div class="number">${total}</div>
                        <div class="label">Total</div>
                    </div>
                </div>
            </section>
            
            <section>
                <h2>🏗️ Required Layer Folders</h2>
                <p>This project enforces the following folder structure:</p>
                <table class="folder-table">
                    <thead>
                        <tr>
                            <th>Layer</th>
                            <th>Folder</th>
                            <th>Purpose</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td><code>src/contracts/</code></td>
                            <td>Interface definitions and contracts</td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td><code>src/presentation/</code></td>
                            <td>UI layer (ViewModels, Screens)</td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td><code>src/domain/</code></td>
                            <td>Business logic and use cases</td>
                        </tr>
                        <tr>
                            <td>4</td>
                            <td><code>src/data/</code></td>
                            <td>Data repositories and sources</td>
                        </tr>
                        <tr>
                            <td>5</td>
                            <td><code>src/di/</code></td>
                            <td>Dependency injection configuration</td>
                        </tr>
                    </tbody>
                </table>
            </section>
            
            <section>
                <h2>🔍 Test Output</h2>
                <div class="test-output">${escapeHtml(testOutput)}</div>
            </section>
            
            <section>
                <h2>📚 How to Run Locally</h2>
                <pre style="background: #f3f4f6; padding: 15px; border-radius: 8px; overflow-x: auto; color: #374151;"><code># Install dependencies
npm install

# Run all tests
npm test

# Run only architecture validation
npm run arch:check</code></pre>
            </section>
        </main>
        
        <footer>
            <p>Generated by GitHub Actions CI/CD Pipeline</p>
            <p style="font-size: 0.9em; margin-top: 10px;">Commit: <code><script>fetch('https://api.github.com/repos/' + location.pathname.split('/').slice(1, 3).join('/') + '/commits?per_page=1')
                .then(r => r.json())
                .then(d => document.write(d[0]?.sha?.substring(0, 7) || 'N/A'))
                .catch(() => {})</script></code></p>
        </footer>
    </div>
</body>
</html>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
