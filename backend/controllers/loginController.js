const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
    const { email, password, tenantsSubdomain } = req.body;

    console.log(`\n🔹 LOGIN ATTEMPT:`);
    console.log(`   Email: ${email}`);
    console.log(`   Subdomain: ${tenantsSubdomain}`);

    if (!email || !password || !tenantsSubdomain) {
        return res.status(400).json({ error: "Missing fields" });
    }

    try {
        // 1. Check Tenant
        const tenantQuery = `SELECT id, status FROM tenants WHERE subdomain = $1`;
        const tenantRes = await pool.query(tenantQuery, [tenantsSubdomain]);

        if (tenantRes.rowCount === 0) {
            console.log("❌ FAILURE: Tenant (Organization) not found.");
            return res.status(404).json({ error: "Tenant/Organization not found" });
        }
        
        const tenant = tenantRes.rows[0];
        console.log(`✅ Tenant Found: ID ${tenant.id}`);

        if (tenant.status !== 'active') {
            console.log("❌ FAILURE: Tenant is not active.");
            return res.status(403).json({ error: "Organization inactive" });
        }

        // 2. Check User
        const userQuery = `SELECT * FROM users WHERE email = $1 AND tenant_id = $2`;
        const userRes = await pool.query(userQuery, [email, tenant.id]);

        if (userRes.rowCount === 0) {
            console.log("❌ FAILURE: User email not found in this tenant.");
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = userRes.rows[0];
        console.log(`✅ User Found: ${user.email}`);

        // 3. Check Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            console.log("❌ FAILURE: Password hash did not match.");
            return res.status(401).json({ error: "Invalid credentials" });
        }
        
        console.log("✅ SUCCESS: Password Matched! Logging in...");

        // 4. Generate Token
        const token = jwt.sign(
            { userId: user.id, tenantId: tenant.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 5. Send Response (MATCHING IMAGE FORMAT EXACTLY)
        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name, // Added this field
                    role: user.role,
                    tenantId: tenant.id       // Added this field
                },
                token: token,      // Moved inside 'data'
                expiresIn: 86400   // Added 'expiresIn'
            }
        });

    } catch (error) {
        console.error("🔥 SERVER ERROR:", error.message);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { loginUser };