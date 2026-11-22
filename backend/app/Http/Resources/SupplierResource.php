<?php

namespace App\Http\Resources;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Supplier
 */
class SupplierResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'ulid' => $this->ulid,
            'code' => $this->code,
            'name' => $this->name,
            'contact_person' => $this->contact_person,
            'mobile' => $this->mobile,
            'mobile_secondary' => $this->mobile_secondary,
            'phone' => $this->phone,
            'phone_secondary' => $this->phone_secondary,
            'email' => $this->email,
            'address' => $this->address,
            'billing_address' => $this->billing_address,
            'deals_in' => $this->deals_in,
            'tax_number' => $this->tax_number,
            'notes' => $this->notes,
            'is_active' => $this->is_active,
        ];
    }
}
