<?php

namespace Tests\Feature;

use App\Models\School;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchoolTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_retrieve_empty_schools_list(): void
    {
        $response = $this->getJson('/api/schools');

        $response->assertOk()
            ->assertExactJson([]);
    }

    public function test_can_retrieve_schools_list_for_dropdown(): void
    {
        $schoolB = School::factory()->create(['name' => 'B School']);
        $schoolA = School::factory()->create(['name' => 'A School']);

        $response = $this->getJson('/api/schools');

        $response->assertOk()
            ->assertJsonCount(2)
            ->assertJson([
                ['id' => $schoolA->id, 'name' => 'A School'],
                ['id' => $schoolB->id, 'name' => 'B School'],
            ]);
    }
}
