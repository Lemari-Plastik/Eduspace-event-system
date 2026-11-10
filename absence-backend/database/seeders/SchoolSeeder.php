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
            'SMPN Negeri 5 Cibitung',
            'SMP Negeri 2 Cibitung',
            'SMP Sariputra',
            'SMPN 2 Cikarang Barat',
            'SMP IT Darussalam',
            'SMP IT Daarul Fikri',
            'SMPN 1 Cikarang Barat',
            'SMPN 1 Cibitung',
            'SMP IT Ulil Albab',
            'MTs Ar Rohmah',
            'SMP Negeri 4 Cibitung',
            'MTs Al Imaroh',
            'SMP Negeri 8 Cibitung',
            'SMP Negeri 3 Cibitung',
            'SMP IT Al Fath',
            'MTS RMB',
            'SMP IT Fitrah Haniah',
            'SMP IT Al Imaroh',
            'SMP IT Nurul Fajri',
            'SMP IT Al Munawwaroh',
            'SMP Negeri 1 Tambun Selatan',
            'SMP Negeri 2 Tambun Selatan',
            'SMP PGRI Tambun Selatan',
        ];

        foreach ($schools as $name) {
            School::firstOrCreate(['name' => $name]);
        }

        // Clean up legacy schools not in the official 23 list
        $fallback = School::where('name', 'SMP Negeri 1 Cibitung')->first();
        $legacySchools = School::whereNotIn('name', $schools)->get();
        foreach ($legacySchools as $legacy) {
            if ($fallback) {
                \Illuminate\Support\Facades\DB::table('participants')
                    ->where('school_id', $legacy->id)
                    ->update(['school_id' => $fallback->id]);
            }
            $legacy->delete();
        }
    }
}
