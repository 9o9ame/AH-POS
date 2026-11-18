<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Tenant extends Model
{
    protected $fillable = ['name'];
    protected $hidden = ['id'];

    protected static function booted(): void
    {
        static::creating(function (self $tenant): void {
            $tenant->ulid ??= (string) Str::ulid();
        });
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(TenantMembership::class);
    }
}
