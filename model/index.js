import 'dotenv/config';
import readlineSync from 'readline-sync';
import { GoogleGenAI } from '@google/genai';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const platform = os.platform();

const asyncExecute = promisify(exec);

if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing. Check your .env file.');
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const History = [];

async function executeCommand({ command }) {
    try {
        console.log(`\nExecuting: ${command}`);

        const { stdout, stderr } = await asyncExecute(command);

        return `
Command: ${command}

Output:
${stdout}

Error Output:
${stderr}

Task executed successfully.
`;
    } catch (error) {
        return `
Command failed:
${command}

Error:
${error.message}
`;
    }
}

const executeCommandDeclaration = {
    name: 'executeCommand',
    description:
        'Execute a single terminal/shell command. The command can create a folder, create a file, write to a file, edit a file, install packages, or delete a file.',
    parameters: {
        type: 'OBJECT',
        properties: {
            command: {
                type: 'STRING',
                description:
                    'A single terminal command. Example: "mkdir calculator"'
            }
        },
        required: ['command']
    }
};

const availableTools = {
    executeCommand
};

async function runAgent(userProblem) {
    History.push({
        role: 'user',
        parts: [{ text: userProblem }]
    });

    let iterations = 0;
    const MAX_ITERATIONS = 10;

    while (iterations < MAX_ITERATIONS) {
        iterations++;

        let response;

        try {
            response = await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: History,
                config: {
                
systemInstruction: `You are an expert web developer and coding agent.

Your job is to create the frontend website requested by the user.

The frontend should use React.js and Tailwind CSS.

You have access to a tool called executeCommand.
This tool can execute terminal commands on the user's computer.

Current operating system: ${platform}

IMPORTANT RULES:

1. Analyze the user's request carefully.
2. Create the requested website using React.js and Tailwind CSS.
3. Use the executeCommand tool to perform terminal operations.
4. Do not ask the user to manually execute commands.
5. The application will execute the commands automatically.
6. Work step by step.
7. Verify important operations when necessary.
8. Do not repeatedly execute the same command unless necessary.
9. When the website is completely created, stop using tools and explain what was created.
10. Use commands appropriate for the user's operating system.

Your goal is to actually create the requested website on the user's computer.
`,
                    tools: [
                        {
                            functionDeclarations: [
                                executeCommandDeclaration
                            ]
                        }
                    ]
                }
            });
        } catch (error) {
            console.log('\nGemini API Error:');
            console.log(error.message);
            break;
        }

        if (response.functionCalls && response.functionCalls.length > 0) {
            const { name, args } = response.functionCalls[0];

            console.log('\nTool call:');
            console.log({ name, args });

            const funCall = availableTools[name];

            if (!funCall) {
                console.log(`Unknown tool: ${name}`);
                break;
            }

            const result = await funCall(args);

            const functionResponsePart = {
                name,
                response: {
                    result
                }
            };

            History.push(response.candidates[0].content);

            History.push({
                role: 'user',
                parts: [
                    {
                        functionResponse: functionResponsePart
                    }
                ]
            });
        } else {
            const text = response.text;

            History.push({
                role: 'model',
                parts: [{ text }]
            });

            console.log('\n' + text);
            break;
        }
    }

    if (iterations >= MAX_ITERATIONS) {
        console.log('\nMaximum agent iterations reached.');
    }
}

async function main() {
    console.log(
        "I am your personal LLM assistant. Let's create a website."
    );

    const userProblem = readlineSync.question('Ask me anything: ');

    await runAgent(userProblem);
}

main();