<?php

namespace Tests\Feature;

use App\Models\School;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ParticipantRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_register_participant_and_receives_absc_0001(): void
    {
        $school = School::factory()->create();

        $payload = [
            'role' => 'siswa',
            'name' => 'John Doe',
            'identity_number' => '1234567890',
            'school_id' => $school->id,
            'trial_class' => 'IT',
            'referral_source' => 'Teman',
            'referral_detail' => null,
        ];

        $response = $this->postJson('/api/register', $payload);

        $response->assertCreated()
            ->assertJsonPath('name', 'John Doe')
            ->assertJsonPath('coupon_code', 'ABSC-0001')
            ->assertJsonPath('is_redeemed', false);

        $this->assertDatabaseHas('participants', [
            'name' => 'John Doe',
            'coupon_code' => 'ABSC-0001',
            'is_redeemed' => false,
            'trial_class' => 'IT',
        ]);
    }

    public function test_coupon_codes_are_generated_sequentially(): void
    {
        $school = School::factory()->create();

        $payloadBase = [
            'role' => 'siswa',
            'identity_number' => '1234567890',
            'school_id' => $school->id,
            'trial_class' => 'DKV',
            'referral_source' => 'Teman',
        ];

        $res1 = $this->postJson('/api/register', array_merge($payloadBase, ['name' => 'Student 1']));
        $res1->assertCreated()->assertJsonPath('coupon_code', 'ABSC-0001');

        $res2 = $this->postJson('/api/register', array_merge($payloadBase, ['name' => 'Student 2']));
        $res2->assertCreated()->assertJsonPath('coupon_code', 'ABSC-0002');

        $res3 = $this->postJson('/api/register', array_merge($payloadBase, ['name' => 'Student 3']));
        $res3->assertCreated()->assertJsonPath('coupon_code', 'ABSC-0003');
    }

    public function test_validation_fails_for_invalid_inputs(): void
    {
        $response = $this->postJson('/api/register', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors([
                'role',
                'name',
                'identity_number',
                'school_id',
                'trial_class',
                'referral_source',
            ]);
    }

    public function test_validation_fails_for_invalid_role_or_trial_class(): void
    {
        $school = School::factory()->create();

        $response = $this->postJson('/api/register', [
            'role' => 'kepala_sekolah',
            'name' => 'Jane Doe',
            'identity_number' => '123456',
            'school_id' => $school->id,
            'trial_class' => 'ROBOTICS',
            'referral_source' => 'Teman',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['role', 'trial_class']);
    }

    public function test_referral_detail_required_if_referral_source_is_medsos_banner_or_event(): void
    {
        $school = School::factory()->create();

        $sourcesRequiringDetail = ['Medsos', 'Banner', 'Event'];

        foreach ($sourcesRequiringDetail as $source) {
            $response = $this->postJson('/api/register', [
                'role' => 'siswa',
                'name' => 'Student '.$source,
                'identity_number' => '123456',
                'school_id' => $school->id,
                'trial_class' => 'KULINER',
                'referral_source' => $source,
                'referral_detail' => null,
            ]);

            $response->assertUnprocessable()
                ->assertJsonValidationErrors(['referral_detail']);
        }
    }

    public function test_can_register_with_referral_detail_for_medsos(): void
    {
        $school = School::factory()->create();

        $response = $this->postJson('/api/register', [
            'role' => 'guru_pendamping',
            'name' => 'Teacher One',
            'identity_number' => '987654321',
            'school_id' => $school->id,
            'trial_class' => 'MOBILE_LEGENDS',
            'referral_source' => 'Medsos',
            'referral_detail' => 'Instagram @official',
        ]);

        $response->assertCreated()
            ->assertJsonPath('name', 'Teacher One')
            ->assertJsonPath('role', 'guru_pendamping')
            ->assertJsonPath('referral_source', 'Medsos')
            ->assertJsonPath('referral_detail', 'Instagram @official');
    }
}
