<?php

namespace Tests\Feature;

use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_login_with_valid_credentials(): void
    {
        $admin = Admin::factory()->create([
            'username' => 'admin_test',
            'password' => 'secret123',
        ]);

        $response = $this->postJson('/api/admin/login', [
            'username' => 'admin_test',
            'password' => 'secret123',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'token',
                'token_type',
                'admin' => ['id', 'name', 'username'],
            ])
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonPath('admin.username', 'admin_test');
    }

    public function test_admin_login_fails_with_invalid_credentials(): void
    {
        Admin::factory()->create([
            'username' => 'admin_test',
            'password' => 'secret123',
        ]);

        $response = $this->postJson('/api/admin/login', [
            'username' => 'admin_test',
            'password' => 'wrong_password',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['username']);
    }

    public function test_authenticated_admin_can_get_profile(): void
    {
        $admin = Admin::factory()->create(['username' => 'current_admin']);
        $token = $admin->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/admin/me');

        $response->assertOk()
            ->assertJsonPath('username', 'current_admin');
    }

    public function test_unauthenticated_request_fails(): void
    {
        $response = $this->getJson('/api/admin/me');

        $response->assertUnauthorized();
    }

    public function test_admin_can_logout_and_token_is_revoked(): void
    {
        $admin = Admin::factory()->create();
        $token = $admin->createToken('logout-token')->plainTextToken;

        $logoutResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/admin/logout');

        $logoutResponse->assertOk()
            ->assertJson(['message' => 'Successfully logged out']);

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $admin->id,
            'name' => 'logout-token',
        ]);

        $this->app['auth']->forgetGuards();

        $followUpResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/admin/me');

        $followUpResponse->assertUnauthorized();
    }
}
