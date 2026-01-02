const pool = require('../db');

// Define Plan Limits (Keys MUST match what your Frontend sends: 'Free', 'Pro', 'Enterprise')
const PLAN_LIMITS = {
    'Free': { maxUsers: 5, maxProjects: 3 },
    'Pro': { maxUsers: 25, maxProjects: 15 },
    'Enterprise': { maxUsers: 100, maxProjects: 50 }
};

// --- HELPER FUNCTIONS ---

// Convert App format to DB format ("Pro" -> "pro")
const toDbFormat = (plan) => {
    if (!plan) return 'free';
    return plan.toLowerCase();
};

// Convert DB format to App format ("pro" -> "Pro")
const toAppFormat = (plan) => {
    if (!plan) return 'Free';
    // Capitalize first letter: "pro" -> "Pro"
    return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
};

// ------------------------

// 1. GET Subscription Details
const getSubscription = async (req, res) => {
    const { tenantId } = req.user; 

    try {
        const tenantRes = await pool.query(
            "SELECT subscription_plan, max_users, max_projects FROM tenants WHERE id = $1", 
            [tenantId]
        );
        
        if (tenantRes.rowCount === 0) return res.status(404).json({ error: "Tenant not found" });
        
        const tenant = tenantRes.rows[0];
        
        // FIX 1: Convert lowercase DB value ("pro") back to Capitalized ("Pro") for Frontend
        const rawPlan = tenant.subscription_plan || 'free';
        const currentPlan = toAppFormat(rawPlan);

        // Get Real Usage
        const userCountRes = await pool.query("SELECT COUNT(*) FROM users WHERE tenant_id = $1", [tenantId]);
        const projectCountRes = await pool.query("SELECT COUNT(*) FROM projects WHERE tenant_id = $1", [tenantId]);

        // Get Limits (Look up using Capitalized key)
        const limits = PLAN_LIMITS[currentPlan] || PLAN_LIMITS['Free'];

        res.status(200).json({
            success: true,
            data: {
                plan: currentPlan, // Frontend gets "Pro"
                usersCount: parseInt(userCountRes.rows[0].count),
                projectsCount: parseInt(projectCountRes.rows[0].count),
                maxUsers: tenant.max_users || limits.maxUsers,
                maxProjects: tenant.max_projects || limits.maxProjects
            }
        });

    } catch (error) {
        console.error("Get Subscription Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// 2. UPDATE Subscription Plan
const updateSubscription = async (req, res) => {
    const { tenantId, role } = req.user;
    const { newPlan } = req.body; // Frontend sends "Pro"
    
    const userId = req.user.userId || req.user.id;
    const ipAddress = req.ip || '0.0.0.0';

    if (role !== 'tenant_admin') {
        return res.status(403).json({ error: "Access denied. Only Admins can change billing." });
    }

    // Validate using App format ("Pro")
    if (!['Free', 'Pro', 'Enterprise'].includes(newPlan)) {
        return res.status(400).json({ error: "Invalid plan selected." });
    }

    try {
        const newLimits = PLAN_LIMITS[newPlan]; // Lookup using "Pro"
        
        // FIX 2: Convert "Pro" -> "pro" before sending to Database
        const dbPlan = toDbFormat(newPlan);

        // 1. Update Tenant
        await pool.query(
            `UPDATE tenants 
             SET subscription_plan = $1, 
                 max_users = $2, 
                 max_projects = $3,
                 updated_at = NOW()
             WHERE id = $4`, 
            [dbPlan, newLimits.maxUsers, newLimits.maxProjects, tenantId]
        );

        // 2. Insert Audit Log
        await pool.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                tenantId, 
                userId, 
                `UPGRADE_TO_${newPlan.toUpperCase()}`, 
                'SUBSCRIPTION', 
                tenantId.toString(),
                ipAddress
            ]
        );

        res.status(200).json({
            success: true,
            message: `Successfully upgraded to ${newPlan}`,
            data: { plan: newPlan }
        });

    } catch (error) {
        console.error("Update Subscription DB Error:", error);
        res.status(500).json({ error: error.message }); 
    }
};

module.exports = { getSubscription, updateSubscription };