<?php
// app/Traits/LogsActivity.php

namespace App\Traits;

use App\Models\ActivityLog;

/**
 * LogsActivity Trait
 * 
 * Add to any controller to easily log user activities.
 * 
 * Usage:
 * $this->logActivity('create', 'template', $template->id, 'Created template: ' . $template->name_ar);
 */
trait LogsActivity
{
    /**
     * Log an activity
     */
    protected function logActivity(
        string $action,
        string $entityType,
        ?string $entityId = null,
        string $description = '',
        ?array $oldValues = null,
        ?array $newValues = null
    ): ActivityLog {
        return ActivityLog::log(
            $action,
            $entityType,
            $entityId,
            $description,
            $oldValues,
            $newValues
        );
    }

    /**
     * Log a create action
     */
    protected function logCreate(string $entityType, string $entityId, string $name): ActivityLog
    {
        return $this->logActivity('create', $entityType, $entityId, "تم إنشاء {$name}");
    }

    /**
     * Log an update action
     */
    protected function logUpdate(string $entityType, string $entityId, string $name, ?array $changes = null): ActivityLog
    {
        return $this->logActivity('update', $entityType, $entityId, "تم تحديث {$name}", null, $changes);
    }

    /**
     * Log a delete action
     */
    protected function logDelete(string $entityType, string $entityId, string $name): ActivityLog
    {
        return $this->logActivity('delete', $entityType, $entityId, "تم حذف {$name}");
    }

    /**
     * Log a login action
     */
    protected function logLogin(): ActivityLog
    {
        return $this->logActivity('login', 'session', null, 'تسجيل دخول');
    }

    /**
     * Log a logout action
     */
    protected function logLogout(): ActivityLog
    {
        return $this->logActivity('logout', 'session', null, 'تسجيل خروج');
    }
}
