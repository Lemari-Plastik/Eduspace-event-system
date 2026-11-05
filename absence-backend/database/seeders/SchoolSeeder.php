<?php

namespace Database\Seeders;

use App\Models\School;
use Illuminate\Database\Seeder;

class SchoolSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $schools = [
            'SMK Metland Cibitung',
            'SMK Negeri 1 Jakarta',
            'SMK Negeri 2 Jakarta',
            'SMA Negeri 1 Jakarta',
            'SMA Negeri 8 Jakarta',
            'SMK Telkom',
            'SMK Taruna Bhakti',
            'SMP Negeri 1 Cibitung',
            'SMP Negeri 2 Cibitung',
            'SMA Negeri 1 Tambun',
        ];

        foreach ($schools as $name) {
            School::firstOrCreate(['name' => $name]);
        }
    }
}
