<?php

namespace App\Http\Controllers;

use App\Support\TenantContext;
use App\Support\TenantStaffAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class TenantDeviceController extends Controller
{
    private function currentMembership(Request $request, TenantContext $context): object
    {
        $membership = DB::table('tenant_memberships')
            ->where('tenant_id', $context->id())
            ->where('user_id', $request->user()->getKey())
            ->where('status', 'active')->first();
        if ($membership === null) abort(404);
        return $membership;
    }

    public function status(Request $request, TenantContext $context): JsonResponse
    {
        $membership = $this->currentMembership($request, $context);
        $tenantUlid = (string) DB::table('tenants')->where('id', $context->id())->value('ulid');
        $device = TenantStaffAccess::currentDevice(
            $request, $context->id(), (int) $membership->id, $tenantUlid,
        );
        return response()->json(['data' => [
            'required' => (bool) $membership->requires_device_approval,
            'status' => $device?->status ?? 'unregistered',
            'device_ulid' => $device?->ulid,
            'device_name' => $device?->device_name,
        ]])->header('Cache-Control', 'no-store');
    }

    public function request(Request $request, TenantContext $context): JsonResponse
    {
        $membership = $this->currentMembership($request, $context);
        if (! $membership->requires_device_approval) {
            return response()->json(['message' => 'Device approval is not required for this membership.'], 409);
        }
        $data = $request->validate([
            'device_name' => ['required', 'string', 'min:2', 'max:100'],
        ]);
        $tenantUlid = (string) DB::table('tenants')->where('id', $context->id())->value('ulid');
        $existing = TenantStaffAccess::currentDevice(
            $request, $context->id(), (int) $membership->id, $tenantUlid,
        );
        if ($existing?->status === 'approved' || $existing?->status === 'pending') {
            return response()->json(['data' => [
                'device_ulid' => $existing->ulid, 'status' => $existing->status,
            ]])->header('Cache-Control', 'no-store');
        }

        $token = bin2hex(random_bytes(32));
        $deviceUlid = (string) Str::ulid();
        DB::transaction(function () use ($request, $data, $context, $membership, $token, $deviceUlid): void {
            DB::table('tenant_staff_devices')->insert([
                'ulid' => $deviceUlid,
                'tenant_id' => $context->id(), 'membership_id' => $membership->id,
                'device_name' => trim($data['device_name']),
                'token_hash' => hash('sha256', $token), 'status' => 'pending',
                'requested_ip' => $request->ip(),
                'requested_agent' => substr((string) $request->userAgent(), 0, 1000),
                'created_at' => now(), 'updated_at' => now(),
            ]);
            TenantStaffAccess::audit($request, $context->id(), 'tenant.device.requested', $deviceUlid, [
                'device_name' => trim($data['device_name']),
            ]);
        });

        // Secure, HTTP-only browser installation cookie. The raw credential is
        // NEVER emitted in JSON/localStorage or placed in the tenant DB.
        return response()->json(['data' => [
            'device_ulid' => $deviceUlid, 'status' => 'pending',
        ]], 201)->cookie(
            TenantStaffAccess::cookieName($tenantUlid), $token, 60 * 24 * 30,
            '/', null, null, true, false, 'lax',
        )->header('Cache-Control', 'no-store');
    }

    public function index(TenantContext $context): JsonResponse
    {
        $devices = DB::table('tenant_staff_devices as d')
            ->join('tenant_memberships as m', function ($join): void {
                $join->on('m.tenant_id', '=', 'd.tenant_id')
                    ->on('m.id', '=', 'd.membership_id');
            })
            ->join('users as u', 'u.id', '=', 'm.user_id')
            ->where('d.tenant_id', $context->id())->orderBy('d.id', 'desc')
            ->limit(250)->get([
                'd.ulid', 'd.device_name', 'd.status', 'd.requested_ip',
                'd.approved_at', 'd.revoked_at', 'd.created_at',
                'u.name as staff_name', 'u.email as staff_email',
            ]);
        return response()->json(['data' => $devices]);
    }

    public function decision(Request $request, TenantContext $context, string $device): JsonResponse
    {
        $data = $request->validate(['decision' => ['required', 'in:approve,reject,revoke']]);
        $decision = $data['decision'];
        $result = DB::transaction(function () use ($request, $context, $device, $decision): array {
            $row = DB::table('tenant_staff_devices')->where('tenant_id', $context->id())
                ->where('ulid', strtoupper($device))->lockForUpdate()->first();
            if ($row === null) abort(404);
            $allowed = ($row->status === 'pending' && in_array($decision, ['approve','reject'], true))
                || ($row->status === 'approved' && $decision === 'revoke');
            if (! $allowed) abort(409, 'Invalid device status transition.');

            $status = $decision === 'approve' ? 'approved' : ($decision === 'reject' ? 'rejected' : 'revoked');
            DB::table('tenant_staff_devices')->where('id', $row->id)->where('tenant_id', $context->id())
                ->update([
                    'status' => $status, 'approved_by' => $decision === 'approve' ? $request->user()->getKey() : $row->approved_by,
                    'approved_at' => $decision === 'approve' ? now() : $row->approved_at,
                    'revoked_at' => $decision === 'revoke' ? now() : $row->revoked_at,
                    'updated_at' => now(),
                ]);
            TenantStaffAccess::audit($request, $context->id(), 'tenant.device.'.$status, $row->ulid);
            return ['ulid' => $row->ulid, 'status' => $status];
        });
        return response()->json(['data' => $result]);
    }
}
