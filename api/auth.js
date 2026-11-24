// Vercel Serverless Function: Authentication API
// Handles registration, OTP generation/verification, 6-digit Account ID assignment, and login

// In-memory store for serverless instance state (persistent simulated DB)
const usersDB = new Map();
const otpStore = new Map();

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { url, method } = req;
    const path = url.split('?')[0];

    try {
        // 1. Send OTP
        if (method === 'POST' && (path.endsWith('/send-otp') || path.endsWith('/auth'))) {
            const { email, phone, name, domain } = req.body || {};

            if (!email || !phone) {
                return res.status(400).json({ success: false, message: 'Email and phone number are required.' });
            }

            // Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            // Generate 6-digit Account ID
            const accountId = 'GAI-' + Math.floor(100000 + Math.random() * 900000);

            otpStore.set(email.toLowerCase(), {
                otp,
                name: name || 'Freelance Expert',
                phone,
                domain: domain || 'General AI',
                accountId,
                createdAt: Date.now()
            });

            return res.status(200).json({
                success: true,
                message: `OTP sent successfully to ${email}.`,
                // Demo helper: returning OTP in response for instant testing
                demoOtp: otp,
                email
            });
        }

        // 2. Verify OTP & Complete Signup
        if (method === 'POST' && path.endsWith('/verify-otp')) {
            const { email, otp } = req.body || {};

            if (!email || !otp) {
                return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
            }

            const record = otpStore.get(email.toLowerCase());

            if (!record) {
                return res.status(400).json({ success: false, message: 'No OTP request found for this email. Please request a new OTP.' });
            }

            if (record.otp !== otp.trim() && otp !== '123456') { // Allow 123456 as universal demo code
                return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
            }

            // Create User Record
            const user = {
                accountId: record.accountId,
                name: record.name,
                email: email.toLowerCase(),
                phone: record.phone,
                domain: record.domain,
                verified: true,
                walletBalance: 2500, // Sign-up bonus ₹2,500
                completedTasks: 0,
                rating: 5.0,
                createdAt: new Date().toISOString()
            };

            usersDB.set(email.toLowerCase(), user);
            otpStore.delete(email.toLowerCase());

            return res.status(200).json({
                success: true,
                message: 'Account verified successfully!',
                user,
                token: 'jwt_mock_token_' + Buffer.from(email).toString('base64')
            });
        }

        // 3. User Login
        if (method === 'POST' && path.endsWith('/login')) {
            const { email, accountId } = req.body || {};

            if (!email && !accountId) {
                return res.status(400).json({ success: false, message: 'Provide Email or Account ID.' });
            }

            let foundUser = null;
            if (email) {
                foundUser = usersDB.get(email.toLowerCase());
            }

            if (!foundUser) {
                // Return demo session user for quick testing
                foundUser = {
                    accountId: accountId || 'GAI-884920',
                    name: 'Expert Contributor',
                    email: email || 'expert@generalai.in',
                    phone: '+91 98765 43210',
                    domain: 'Software Engineering & AI',
                    verified: true,
                    walletBalance: 4850,
                    completedTasks: 14,
                    rating: 4.9,
                    createdAt: new Date().toISOString()
                };
            }

            return res.status(200).json({
                success: true,
                message: 'Login successful.',
                user: foundUser,
                token: 'jwt_mock_token_' + Buffer.from(foundUser.email).toString('base64')
            });
        }

        // Default route
        return res.status(200).json({
            service: 'General AI Auth Service',
            status: 'Online',
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}