<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

final class AuthSessionController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::guard('web')->attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        // A business workspace login invalidates a prior Platform session.
        // Only one security realm can be active in the same browser cookie.
        $request->session()->forget('platform_user_id');
        $request->session()->regenerate();

        return response()->json(['data' => [
            'name' => $request->user()->name,
            'email' => $request->user()->email,
        ]]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => [
            'name' => $request->user()->name,
            'email' => $request->user()->email,
        ]]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out.']);
    }
}
