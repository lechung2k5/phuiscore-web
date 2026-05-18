const AuditLogRepo = require('../repositories/auditLog.repo');

/**
 * Utility to log administrative actions
 */
const auditLog = async (req, { action, entityType, entityId, oldValue, newValue, note }) => {
    try {
        const userId = req.user?.username || 'system';
        await AuditLogRepo.log({
            userId,
            action,
            entityType,
            entityId,
            oldValue,
            newValue,
            note
        });
    } catch (e) {
        console.error('[AuditLogger Utility Error]', e);
    }
};

module.exports = { auditLog };
