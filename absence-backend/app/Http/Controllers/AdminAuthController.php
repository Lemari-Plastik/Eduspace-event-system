<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdminLoginRequest;
use App\Http\Resources\AdminResource;
use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AdminAuthController extends Controller
{
    /**
     * Authenticate admin user and issue Sanctum token.
     */
    public function login(AdminLoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $admin = Admin::where('username', $validated['username'])->first();

        if ($admin === null || ! Hash::check($validated['password'], $admin->password)) {
            throw ValidationException::withMessages([
                'username' => [trans('auth.failed')],
            ]);
        }

        $token = $admin->createToken('admin-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'admin' => new AdminResource($admin),
        ]);
    }

    /**
     * Get the authenticated admin details.
     */
    public function me(Request $request): AdminResource
    {
        /** @var Admin $admin */
        $admin = $request->user();

        return new AdminResource($admin);
    }

    /**
     * Invalidate the current access token.
     */
    public function logout(Request $request): JsonResponse
    {
        /** @var Admin $admin */
        $admin = $request->user();

        $admin->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Successfully logged out',
        ]);
    }
}
