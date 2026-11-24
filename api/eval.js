// Vercel Serverless Function: AI Evaluation Demo Tasks

const EVAL_TASKS = [
    {
        id: 'eval-1',
        title: 'Compare Reasoning Capability',
        prompt: 'Explain the concept of recursion using an analogy of a mirror.',
        responseA: "Recursion is like looking into two mirrors placed parallel to each other. When you look into one mirror, you see the reflection of the other mirror, which in turn reflects the first mirror, creating an infinite series of images that appear to go on forever. In programming, a recursive function calls itself to solve smaller instances of the same problem until it reaches a base case.",
        responseB: "Recursion is when a function calls itself. Imagine a staircase where each step you take makes you take another step until you reach the floor. Each step is a recursive call. It's useful for sorting things or finding things in a tree structure. It needs a stop condition so it doesn't loop forever.",
        criteria: ['Accuracy', 'Analogy Quality', 'Technical Correctness', 'Clarity']
    },
    {
        id: 'eval-2',
        title: 'Python Bug Fix Evaluation',
        prompt: 'Fix the bug in this function that should calculate the average of a list, but fails on empty lists: def avg(lst): return sum(lst)/len(lst)',
        responseA: "def avg(lst):\n    if not lst:\n        return 0\n    return sum(lst) / len(lst)",
        responseB: "def avg(lst):\n    try:\n        return sum(lst) / len(lst)\n    except ZeroDivisionError:\n        return None",
        criteria: ['Edge Case Handling', 'Performance', 'Code Style']
    }
];

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { method, url } = req;

    try {
        if (method === 'POST') {
            const { taskId, winner, feedback, rating } = req.body || {};

            return res.status(200).json({
                success: true,
                message: 'Evaluation submitted successfully! Your feedback helps improve frontier models.',
                creditAmount: 85.50,
                newBalance: 4935.50
            });
        }

        const randomTask = EVAL_TASKS[Math.floor(Math.random() * EVAL_TASKS.length)];

        return res.status(200).json({
            success: true,
            task: randomTask
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}