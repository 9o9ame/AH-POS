<?php

namespace App\Http\Controllers;

use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

final class PartyController extends Controller
{
    public function index(Request $request, TenantContext $context): JsonResponse
    {
        $input = $request->validate([
            'type' => ['required', Rule::in(['customer', 'supplier'])],
            'q' => ['nullable', 'string', 'max:120'],
        ]);

        $query = DB::table('parties')
            ->where('tenant_id', $context->id())
            ->where('type', $input['type'])
            ->select(['ulid', 'type', 'name', 'phone', 'email', 'address', 'is_active'])
            ->orderBy('name')->orderBy('id');

        $search = trim($input['q'] ?? '');
        if ($search !== '') {
            $term = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';
            $query->where(fn ($q) => $q->where('name', 'ilike', $term)
                ->orWhere('phone', 'ilike', $term)
                ->orWhere('email', 'ilike', $term));
        }

        return response()->json($query->paginate(30));
    }

    public function store(Request $request, TenantContext $context): JsonResponse
    {
        $request->merge([
            'name' => trim((string) $request->input('name', '')),
            'phone' => $request->filled('phone') ? trim((string) $request->input('phone')) : null,
            'email' => $request->filled('email') ? strtolower(trim((string) $request->input('email'))) : null,
            'address' => $request->filled('address') ? trim((string) $request->input('address')) : null,
        ]);

        $data = $request->validate([
            'type' => ['required', Rule::in(['customer', 'supplier'])],
            'name' => ['required', 'string', 'max:180'],
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:2000'],
        ]);

        $ulid = (string) Str::ulid();
        DB::table('parties')->insert([
            'tenant_id' => $context->id(),
            'ulid' => $ulid,
            'type' => $data['type'],
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'address' => $data['address'] ?? null,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['data' => DB::table('parties')
            ->where('tenant_id', $context->id())
            ->where('ulid', $ulid)
            ->first(['ulid', 'type', 'name', 'phone', 'email', 'address', 'is_active'])], 201);
    }
}
