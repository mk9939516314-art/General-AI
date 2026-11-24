// Vercel Serverless Function: Enterprise Consultation API

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        const { companyName, contactName, email, phone, useCase, datasetSize } = req.body || {};

        if (!companyName || !email) {
            return res.status(400).json({ success: false, message: 'Company name and work email are required.' });
        }

        const consultationRef = 'ENT-' + Math.floor(10000 + Math.random() * 90000);

        return res.status(200).json({
            success: true,
            message: `Consultation request received for ${companyName}! Reference ID: ${consultationRef}. Our Enterprise AI Solutions Lead will contact you at ${email} within 2 business hours.`,
            consultationId: consultationRef
        });
    }

    return res.status(200).json({
        service: 'General AI Enterprise Solutions API',
        status: 'Active'
    });
}