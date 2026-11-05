<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Participant;
use App\Models\School;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminCouponScanTest extends TestCase
{
    use RefreshDatabase;

    public function test_requires_authentication_to_scan_coupon(): void
    {
        $response = $this->postJson('/api/admin/coupons/scan', [
            'coupon_code' => 'ABSC-0001',
        ]);

        $response->assertUnauthorized();
    }

    public function test_admin_can_successfully_redeem_valid_coupon(): void
    {
        $admin = Admin::factory()->create();
        Sanctum::actingAs($admin);

        $school = School::factory()->create();
        $participant = Participant::factory()->create([
            'school_id' => $school->id,
            'coupon_code' => 'ABSC-0001',
            'is_redeemed' => false,
            'redeemed_at' => null,
            'redeemed_by' => null,
        ]);

        $response = $this->postJson('/api/admin/coupons/scan', [
            'coupon_code' => 'ABSC-0001',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Coupon successfully redeemed')
            ->assertJsonPath('data.is_redeemed', true)
            ->assertJsonPath('data.redeemed_by', $admin->id);

        $participant->refresh();
        $this->assertTrue($participant->is_redeemed);
        $this->assertNotNull($participant->redeemed_at);
        $this->assertEquals($admin->id, $participant->redeemed_by);
    }

    public function test_anti_double_scan_prevents_redeeming_already_redeemed_coupon(): void
    {
        $admin1 = Admin::factory()->create();
        $admin2 = Admin::factory()->create();
        Sanctum::actingAs($admin2);

        $school = School::factory()->create();
        $participant = Participant::factory()->redeemed($admin1)->create([
            'school_id' => $school->id,
            'coupon_code' => 'ABSC-0001',
        ]);

        $response = $this->postJson('/api/admin/coupons/scan', [
            'coupon_code' => 'ABSC-0001',
        ]);

        $response->assertUnprocessable();
        $this->assertStringContainsString('di-scan', $response->json('message'));

        $participant->refresh();
        $this->assertEquals($admin1->id, $participant->redeemed_by);
    }

    public function test_cannot_scan_non_existent_coupon(): void
    {
        $admin = Admin::factory()->create();
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/admin/coupons/scan', [
            'coupon_code' => 'ABSC-9999',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['coupon_code']);
    }
}
