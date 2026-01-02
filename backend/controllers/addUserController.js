const pool = require('../db');
const bcrypt = require('bcryptjs');

const addUserToTenant = async (req, res) => {
    const { tenantId } = req.params;
    const { email, password, fullName, role } = req.body;
    const requestingUser = req.user; // From Auth Middleware

    // 1. AUTHORIZATION CHECK
    // Allow SUPER_ADMIN to add users anywhere. 
    // Allow TENANT_ADMIN to add users only to their own organization.
    const isSuperAdmin = requestingUser.role === 'super_admin';
    const isTenantAdmin = requestingUser.role === 'tenant_admin' && requestingUser.tenantId === tenantId;

    if (!isSuperAdmin && !isTenantAdmin) {
        return res.status(403).json({ error: "Access denied. Insufficient permissions." });
    }

    if (!email || !password || !fullName) {
        return res.status(400).json({ error: "Email, Password, and Name are required" });
    }

    try {
        // 2. FETCH REAL LIMITS & CURRENT COUNT
        const limitQuery = `
            SELECT t.subscription_plan, 
                   t.max_users,
                   (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as current_user_count
            FROM tenants t 
            WHERE t.id = $1
        `;
        const limitRes = await pool.query(limitQuery, [tenantId]);
        
        if (limitRes.rowCount === 0) return res.status(404).json({ error: "Organization not found" });

        const { subscription_plan, max_users, current_user_count } = limitRes.rows[0];
        
        // Convert to Integers to ensure proper comparison
        const maxAllowed = parseInt(max_users);
        const currentCount = parseInt(current_user_count);

        // --- DEBUG CONSOLE LOGS ---
        console.log("\n--- USER CREATION ATTEMPT ---");
        console.log(`Organization: ${tenantId}`);
        console.log(`Plan: ${subscription_plan}`);
        console.log(`Max Users Allowed (from DB): ${maxAllowed}`);
        console.log(`Current Users Count: ${currentCount}`);
        console.log(`Blocking Access: ${currentCount >= maxAllowed}`);
        console.log("-----------------------------\n");

        // 3. STRICT LIMIT ENFORCEMENT
        // Even Super Admins must respect the organization's plan limits.
        if (currentCount >= maxAllowed) {
            return res.status(403).json({ 
                error: `Subscription Limit Reached: Your ${subscription_plan} plan only allows ${maxAllowed} members.`,
                currentUsage: currentCount,
                limit: maxAllowed
            });
        }

        // 4. DUPLICATE CHECK
        const dupCheck = await pool.query(
            "SELECT id FROM users WHERE email = $1 AND tenant_id = $2",
            [email, tenantId]
        );
        if (dupCheck.rowCount > 0) {
            return res.status(409).json({ error: "User already exists in this organization." });
        }

        // 5. HASH & INSERT
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userRole = role === 'tenant_admin' ? 'tenant_admin' : 'user';

        const insertQuery = `
            INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active, created_at)
            VALUES ($1, $2, $3, $4, $5, true, NOW())
            RETURNING id, email, full_name, role, created_at
        `;

        const newUserRes = await pool.query(insertQuery, [
            tenantId, email, hashedPassword, fullName, userRole
        ]);
        const newUser = newUserRes.rows[0];

        // 6. LOG TO AUDIT TABLE
        await pool.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) 
             VALUES ($1, $2, $3, $4, $5)`,
            [tenantId, requestingUser.id, 'ADD_USER', 'USER', newUser.id]
        );

        res.status(201).json({
            success: true,
            message: "User account created successfully",
            data: newUser
        });

    } catch (error) {
        console.error("Critical User Creation Error:", error.message);
        res.status(500).json({ error: "Server error during account provisioning." });
    }
};

module.exports = { addUserToTenant };