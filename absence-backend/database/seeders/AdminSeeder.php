<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Admin::firstOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Administrator',
                'password' => 'admin123',
            ]
        );
    }
}
