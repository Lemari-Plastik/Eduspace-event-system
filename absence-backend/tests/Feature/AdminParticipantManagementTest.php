<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Participant;
use App\Models\School;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminParticipantManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_requires_auth_to_list_participants(): void
    {
        $response = $this->getJson('/api/admin/participants');

        $response->assertUnauthorized();
    }

    public function test_admin_can_list_participants_with_pagination(): void
    {
        $admin = Admin::factory()->create();
        Sanctum::actingAs($admin);

        $school = School::factory()->create();
        Participant::factory()->count(20)->create(['school_id' => $school->id]);

        $response = $this->getJson('/api/admin/participants?per_page=10&page=1');

        $response->assertOk()
            ->assertJsonPath('meta.total', 20)
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonCount(10, 'data');
    }

    public function test_admin_can_filter_participants_by_is_redeemed(): void
    {
        $admin = Admin::factory()->create();
        Sanctum::actingAs($admin);

        $school = School::factory()->create();
        Participant::factory()->count(3)->create([
            'school_id' => $school->id,
            'is_redeemed' => false,
        ]);
        Participant::factory()->count(2)->redeemed($admin)->create([
            'school_id' => $school->id,
        ]);

        $redeemedResponse = $this->getJson('/api/admin/participants?is_redeemed=1');
        $redeemedResponse->assertOk()->assertJsonCount(2, 'data');

        $unredeemedResponse = $this->getJson('/api/admin/participants?is_redeemed=0');
        $unredeemedResponse->assertOk()->assertJsonCount(3, 'data');
    }

    public function test_admin_can_search_participants_by_name_or_coupon(): void
    {
        $admin = Admin::factory()->create();
        Sanctum::actingAs($admin);

        $school = School::factory()->create();
        Participant::factory()->create([
            'school_id' => $school->id,
            'name' => 'Budi Santoso',
            'coupon_code' => 'ABSC-0010',
        ]);
        Participant::factory()->create([
            'school_id' => $school->id,
            'name' => 'Siti Nurhaliza',
            'coupon_code' => 'ABSC-0020',
        ]);

        $nameSearch = $this->getJson('/api/admin/participants?name=Santoso');
        $nameSearch->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Budi Santoso');

        $couponSearch = $this->getJson('/api/admin/participants?coupon_code=0020');
        $couponSearch->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.coupon_code', 'ABSC-0020');

        $generalSearch = $this->getJson('/api/admin/participants?search=Budi');
        $generalSearch->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Budi Santoso');
    }

    public function test_admin_can_manually_register_participant(): void
    {
        $admin = Admin::factory()->create();
        Sanctum::actingAs($admin);

        $school = School::factory()->create();

        $payload = [
            'role' => 'siswa',
            'name' => 'Admin Registered Student',
            'identity_number' => '555666777',
            'school_id' => $school->id,
            'trial_class' => 'DKV',
            'referral_source' => 'Banner',
            'referral_detail' => 'Spanduk Gerbang Sekolah',
        ];

        $response = $this->postJson('/api/admin/participants', $payload);

        $response->assertCreated()
            ->assertJsonPath('name', 'Admin Registered Student')
            ->assertJsonPath('coupon_code', 'ABSC-0001');

        $this->assertDatabaseHas('participants', [
            'name' => 'Admin Registered Student',
            'coupon_code' => 'ABSC-0001',
        ]);
    }

    public function test_admin_can_delete_participant(): void
    {
        $admin = Admin::factory()->create();
        Sanctum::actingAs($admin);

        $school = School::factory()->create();
        $participant = Participant::factory()->create(['school_id' => $school->id]);

        $response = $this->deleteJson('/api/admin/participants/'.$participant->id);

        $response->assertOk()
            ->assertJson(['message' => 'Participant deleted successfully']);

        $this->assertDatabaseMissing('participants', [
            'id' => $participant->id,
        ]);
    }

    public function test_delete_returns_404_when_participant_not_found(): void
    {
        $admin = Admin::factory()->create();
        Sanctum::actingAs($admin);

        $response = $this->deleteJson('/api/admin/participants/99999');

        $response->assertNotFound();
    }
}
