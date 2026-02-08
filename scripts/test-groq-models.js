
const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables manually
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf-8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    }
}

loadEnv();

const API_KEY = process.env.GROQ_API_KEY;

if (!API_KEY) {
    console.error("❌ GROQ_API_KEY not found in .env.local");
    process.exit(1);
}

const CANDIDATE_MODELS = [
    "canopylabs/orpheus-arabic-saudi",
    "canopylabs/orpheus-v1-english",
    "groq/compound",
    "groq/compound-mini",
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "moonshotai/kimi-k2-instruct",
    "moonshotai/kimi-k2-instruct-0905",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3-32b"
];

const IGNORED_MODELS = [
    "meta-llama/llama-guard-4-12b",
    "meta-llama/llama-prompt-guard-2-22m",
    "meta-llama/llama-prompt-guard-2-86m",
    "openai/gpt-oss-safeguard-20b",
    "whisper-large-v3",
    "whisper-large-v3-turbo"
];

console.log(`🔍 Testing ${CANDIDATE_MODELS.length} models for text generation compatibility...`);
console.log(`⏭️  Skipping ${IGNORED_MODELS.length} non-text/utility models.`);

async function testModel(modelId) {
    return new Promise((resolve) => {
        const data = JSON.stringify({
            model: modelId,
            messages: [{ role: "user", content: "Hello, just reply with 'OK'." }],
            max_tokens: 10
        });

        const options = {
            hostname: 'api.groq.com',
            path: '/openai/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    process.stdout.write(`✅ ${modelId}\n`);
                    resolve(true);
                } else {
                    try {
                        const err = JSON.parse(body);
                        const msg = err.error?.message || "Unknown error";
                        process.stdout.write(`❌ ${modelId}: ${msg}\n`);
                    } catch {
                        process.stdout.write(`❌ ${modelId}: Status ${res.statusCode}\n`);
                    }
                    resolve(false);
                }
            });
        });

        req.on('error', (e) => {
            process.stdout.write(`❌ ${modelId}: Connection Error\n`);
            resolve(false);
        });

        req.write(data);
        req.end();
    });
}

async function runTests() {
    const workingModels = [];

    // Run sequentially to avoid rate limits
    for (const model of CANDIDATE_MODELS) {
        process.stdout.write(`Testing ${model}... `);
        const isWorking = await testModel(model);
        if (isWorking) {
            workingModels.push(model);
        }
        // Small delay
        await new Promise(r => setTimeout(r, 500));
    }

    fs.writeFileSync('working_models.json', JSON.stringify(workingModels, null, 2));
    console.log("Results saved to working_models.json");
}

runTests();
