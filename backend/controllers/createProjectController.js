const pool = require('../db');

const createProject = async (req, res) => {
    // MOVE LOGS TO THE VERY TOP
    console.log(">>> CREATE PROJECT REQUEST RECEIVED <<<");
    console.log("Body:", req.body);
    console.log("User from Token:", req.user);

    const { name, description, status } = req.body;
    const { tenantId, userId } = req.user; 

    if (!name) {
        return res.status(400).json({ error: "Project name is required" });
    }

    try {
        // 1. FETCH LIMITS
        const limitQuery = `
            SELECT t.subscription_plan, t.max_projects
            FROM tenants t 
            WHERE t.id = $1
        `;
        const countQuery = `SELECT COUNT(*) FROM projects WHERE tenant_id = $1`;
        
        const limitRes = await pool.query(limitQuery, [tenantId]);
        const countRes = await pool.query(countQuery, [tenantId]);
        
        if (limitRes.rowCount === 0) {
            console.log("DEBUG: Tenant Not Found in DB");
            return res.status(404).json({ error: "Tenant not found" });
        }

        const plan = limitRes.rows[0].subscription_plan;
        const maxAllowed = parseInt(limitRes.rows[0].max_projects);
        const currentCount = parseInt(countRes.rows[0].count);

        // CLEAR AND BOLD LOGS
        console.log("\n*****************************************");
        console.log(`PLAN: ${plan}`);
        console.log(`LIMIT: ${maxAllowed}`);
        console.log(`CURRENT COUNT: ${currentCount}`);
        console.log(`BLOCKING ENABLED: ${currentCount >= maxAllowed}`);
        console.log("*****************************************\n");

        if (currentCount >= maxAllowed) {
            console.log("!!! ACCESS DENIED: LIMIT REACHED !!!");
            return res.status(403).json({ 
                error: `Limit Reached: Your ${plan} plan only allows ${maxAllowed} projects.` 
            });
        }

        const insertQuery = `
            INSERT INTO projects (tenant_id, name, description, status, created_by, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING id
        `;

        await pool.query(insertQuery, [tenantId, name, description || '', status || 'active', userId]);
        
        res.status(201).json({ success: true, message: "Project created" });

    } catch (error) {
        console.error("CRITICAL ERROR:", error.message);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { createProject };