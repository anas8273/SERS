<?php

namespace App\Policies;

use App\Models\Template;
use App\Models\User;
use App\Models\OrderItem;

class TemplatePolicy
{
    /**
     * Determine whether the user can view the template.
     */
    public function view(User $user, Template $template): bool
    {
        // Free templates are always viewable
        if (!$template->is_paid || $template->price <= 0) {
            return true;
        }

        // Check if user has purchased this template
        return $this->hasPurchased($user, $template);
    }

    /**
     * Determine whether the user can edit the template.
     */
    public function edit(User $user, Template $template): bool
    {
        // Only interactive templates can be edited
        if ($template->type !== 'interactive') {
            return false;
        }

        return $this->view($user, $template);
    }

    /**
     * Determine whether the user can export the template.
     */
    public function export(User $user, Template $template): bool
    {
        return $this->view($user, $template);
    }

    /**
     * Determine whether the user can download the template.
     */
    public function download(User $user, Template $template): bool
    {
        return $this->view($user, $template);
    }

    /**
     * Check if user has purchased the template
     */
    private function hasPurchased(User $user, Template $template): bool
    {
        return OrderItem::whereHas('order', function($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->where('status', 'completed');
            })
            ->where('template_id', $template->id)
            ->exists();
    }

    /**
     * Admin can do everything
     */
    public function before(User $user, string $ability): bool|null
    {
        if ($user->role === 'admin') {
            return true;
        }

        return null;
    }
}