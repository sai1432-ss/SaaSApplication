const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    console.log(`\n🔒 MIDDLEWARE CHECK: ${req.path}`);
    
    // 1. Check Header
    const authHeader = req.headers['authorization'];
    console.log("   Header Received:", authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log("   ❌ REJECTED: No 'Bearer' token found.");
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 2. Verify Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("   ✅ TOKEN VALID. Payload:", decoded);

        req.user = decoded; 
        next();

    } catch (err) {
        console.log("   ❌ REJECTED: Token invalid or expired.");
        console.log("   Error Details:", err.message);
        return res.status(401).json({ error: "Invalid or expired token." });
    }
};

module.exports = authMiddleware;