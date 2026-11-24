// Vercel Serverless Function: Wallet & Payout API

const transactions = [
    { id: 'TXN-9021', date: '2026-11-20', description: 'Weekly Payout - Python Evaluation', amount: '₹4,800', status: 'Completed', method: 'UPI (gpay@upi)' },
    { id: 'TXN-8840', date: '2026-11-13', description: 'Weekly Payout - Code Quality Review', amount: '₹3,600', status: 'Completed', method: 'Bank Transfer' },
    { id: 'TXN-8102', date: '2026-11-06', description: 'Welcome Bonus Credit', amount: '₹2,500', status: 'Completed', method: 'Wallet Balance' }
];

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { method, url } = req;
    const path = url.split('?')[0];

    try {
        if (method === 'POST' && path.endsWith('/withdraw')) {
            const { amount, method: payoutMethod, details } = req.body || {};

            if (!amount || amount < 500) {
                return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is ₹500.' });
            }

            if (!details) {
                return res.status(400).json({ success: false, message: 'Please provide UPI ID or Bank Account details.' });
            }

            const newTxn = {
                id: 'TXN-' + Math.floor(1000 + Math.random() * 9000),
                date: new Date().toISOString().split('T')[0],
                description: `Payout Withdrawal (${payoutMethod.toUpperCase()})`,
                amount: `₹${parseFloat(amount).toLocaleString('en-IN')}`,
                status: 'Processing (24h)',
                method: `${payoutMethod.toUpperCase()} (${details})`
            };

            transactions.unshift(newTxn);

            return res.status(200).json({
                success: true,
                message: `Withdrawal request of ₹${amount} initiated successfully. Funds will reflect within 24 hours.`,
                transaction: newTxn
            });
        }

        return res.status(200).json({
            success: true,
            balance: 4850,
            pendingPayout: 1200,
            currency: 'INR (₹)',
            transactions
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}