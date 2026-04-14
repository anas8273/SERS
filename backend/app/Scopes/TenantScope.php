<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * TenantScope — Soft Multi-tenancy via Global Scope.
 *
 * [F-05] Adds automatic tenant filtering to Eloquent models.
 * When applied, every query on the model is automatically filtered
 * by the current tenant (organization/school).
 *
 * This is a "soft" multi-tenant approach — all data lives in the same
 * database, but is logically separated by `tenant_id`.
 *
 * Usage:
 *   1. Add `tenant_id` column to your migration:
 *      $table->string('tenant_id')->nullable()->index();
 *
 *   2. Apply the scope in your model:
 *      protected static function booted(): void
 *      {
 *          static::addGlobalScope(new TenantScope());
 *      }
 *
 *   3. Auto-fill tenant_id on create:
 *      protected static function boot(): void
 *      {
 *          parent::boot();
 *          static::creating(function ($model) {
 *              if (auth()->check() && auth()->user()->tenant_id) {
 *                  $model->tenant_id = auth()->user()->tenant_id;
 *              }
 *          });
 *      }
 *
 * Current status: GROUNDWORK ONLY — not applied to any model yet.
 * To activate, add tenant_id to the users table and relevant models.
 */
class TenantScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     *
     * Automatically filters results to the current user's tenant.
     * If no user is authenticated or they have no tenant, scope is skipped
     * (allowing admin/super-admin full access).
     */
    public function apply(Builder $builder, Model $model): void
    {
        $user = auth()->user();

        if ($user && !empty($user->tenant_id)) {
            $builder->where($model->getTable() . '.tenant_id', $user->tenant_id);
        }
    }

    /**
     * Extend the builder with a `withoutTenant` macro.
     *
     * Usage: Model::withoutTenant()->get() — for admin queries across all tenants.
     */
    public function extend(Builder $builder): void
    {
        $builder->macro('withoutTenant', function (Builder $builder) {
            return $builder->withoutGlobalScope(TenantScope::class);
        });
    }
}
