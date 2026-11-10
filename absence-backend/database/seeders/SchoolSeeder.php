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
            'SMP Negeri 5 Cibitung',
            'SMP Negeri 2 Cibitung',
            'SMP Sariputra',
            'SMPN 2 Cikbar',
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
            'MTSS RMB',
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
    }
}
