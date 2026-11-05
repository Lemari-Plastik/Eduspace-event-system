<?php

namespace Database\Factories;

use App\Models\Admin;
use App\Models\Participant;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Participant>
 */
class ParticipantFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'role' => fake()->randomElement(['siswa', 'guru_pendamping']),
            'name' => fake()->name(),
            'identity_number' => fake()->numerify('##########'),
            'school_id' => School::factory(),
            'trial_class' => fake()->randomElement(['IT', 'DKV', 'KULINER', 'MOBILE_LEGENDS']),
            'referral_source' => fake()->randomElement(['Medsos', 'Banner', 'Event', 'Teman', 'Website']),
            'referral_detail' => fake()->optional()->word(),
            'coupon_code' => 'ABSC-'.fake()->unique()->numerify('####'),
            'is_redeemed' => false,
            'redeemed_at' => null,
            'redeemed_by' => null,
        ];
    }

    /**
     * Indicate that the participant's coupon is redeemed.
     */
    public function redeemed(?Admin $admin = null): static
    {
        return $this->state(fn (array $attributes) => [
            'is_redeemed' => true,
            'redeemed_at' => now(),
            'redeemed_by' => $admin ?? Admin::factory(),
        ]);
    }
}
