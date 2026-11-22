<?php

namespace App\Http\Requests\Catalog;

use App\Tenancy\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'code' => strtoupper(trim((string) $this->input('code'))),
            'name' => trim((string) $this->input('name')),
            'contact_person' => $this->filled('contact_person')
                ? trim((string) $this->input('contact_person'))
                : null,
            'phone' => $this->filled('phone') ? trim((string) $this->input('phone')) : null,
            'phone_secondary' => $this->filled('phone_secondary')
                ? trim((string) $this->input('phone_secondary'))
                : null,
            'mobile' => $this->filled('mobile') ? trim((string) $this->input('mobile')) : null,
            'mobile_secondary' => $this->filled('mobile_secondary')
                ? trim((string) $this->input('mobile_secondary'))
                : null,
            'email' => $this->filled('email')
                ? strtolower(trim((string) $this->input('email')))
                : null,
            'tax_number' => $this->filled('tax_number')
                ? trim((string) $this->input('tax_number'))
                : null,
            'deals_in' => $this->filled('deals_in') ? trim((string) $this->input('deals_in')) : null,
            'billing_address' => $this->filled('billing_address')
                ? trim((string) $this->input('billing_address'))
                : null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $tenantId = app(TenantContext::class)->tenantId();

        return [
            'code' => [
                'required',
                'string',
                'max:64',
                Rule::unique('suppliers', 'code')->where('tenant_id', $tenantId),
            ],
            'name' => ['required', 'string', 'max:180'],
            'deals_in' => ['nullable', 'string', 'max:180'],
            'contact_person' => ['nullable', 'string', 'max:180'],
            'mobile' => ['nullable', 'string', 'max:64'],
            'mobile_secondary' => ['nullable', 'string', 'max:64'],
            'phone' => ['nullable', 'string', 'max:64'],
            'phone_secondary' => ['nullable', 'string', 'max:64'],
            'email' => ['nullable', 'email', 'max:180'],
            'address' => ['nullable', 'string'],
            'billing_address' => ['nullable', 'string'],
            'tax_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
