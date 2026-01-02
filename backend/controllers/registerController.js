const bcrypt = require('bcryptjs');
const pool = require('../db');

const registerTenant = async (req, res) => {
    // 1. Extract data from Frontend Request
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

    // Basic Validation
    if (!tenantName || !subdomain || !adminEmail || !adminPassword || !adminFullName) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const client = await pool.connect();

    try {
        // 2. Start Transaction (All or Nothing)
        await client.query('BEGIN');

        // 3. Hash the Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        // 4. Insert Tenant (Organization)
        const tenantQuery = `
            INSERT INTO tenants (name, subdomain, status, subscription_plan)
            VALUES ($1, $2, 'active', 'free')
            RETURNING id, name, subdomain;
        `;
        const tenantRes = await client.query(tenantQuery, [tenantName, subdomain]);
        const newTenant = tenantRes.rows[0];

        // 5. Insert Admin User (Linked to Tenant)
        const userQuery = `
            INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active, terms_accepted)
            VALUES ($1, $2, $3, $4, 'tenant_admin', true, true)
            RETURNING id, email, full_name, role;
        `;
        const userRes = await client.query(userQuery, [
            newTenant.id, 
            adminEmail, 
            hashedPassword, 
            adminFullName
        ]);
        const newUser = userRes.rows[0];

        // 6. Commit Transaction (Save Changes)
        await client.query('COMMIT');

        // 7. Send Success Response
        res.status(201).json({
            success: true,
            message: "Tenant registered successfully",
            data: {
                tenantId: newTenant.id,
                subdomain: newTenant.subdomain,
                adminUser: newUser
            }
        });

    } catch (error) {
        // 8. Rollback on Error (Undo everything if it fails)
        await client.query('ROLLBACK');

        console.error("Registration Error:", error);

        // Handle Unique Constraint Violations (e.g., Duplicate Email or Subdomain)
        if (error.code === '23505') {
            if (error.constraint.includes('subdomain')) {
                return res.status(409).json({ error: "Subdomain is already taken" });
            }
            if (error.constraint.includes('email')) {
                return res.status(409).json({ error: "Email is already registered" });
            }
        }

        res.status(500).json({ error: "Server Error during registration" });
    } finally {
        client.release();
    }
};

module.exports = { registerTenant };