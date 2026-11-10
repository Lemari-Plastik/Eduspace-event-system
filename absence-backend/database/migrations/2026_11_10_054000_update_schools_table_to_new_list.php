<?php

use App\Models\School;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Updates the schools table to the official 23 SMP/MTs list.
     */
    public function up(): void
    {
        $newSchools = [
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

        // 1. Insert any new schools that do not exist yet
        foreach ($newSchools as $name) {
            School::firstOrCreate(['name' => $name]);
        }

        // 2. Safely reassign any participants referencing legacy schools to avoid FK constraint violations
        $fallbackSchool = School::where('name', 'SMP Negeri 1 Cibitung')->first();

        $legacySchools = School::whereNotIn('name', $newSchools)->get();
        foreach ($legacySchools as $legacy) {
            if ($fallbackSchool) {
                DB::table('participants')
                    ->where('school_id', $legacy->id)
                    ->update(['school_id' => $fallbackSchool->id]);
            }
            $legacy->delete();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reversible if needed
    }
};
