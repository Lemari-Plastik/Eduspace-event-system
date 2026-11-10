<?php

namespace App\Console\Commands;

use App\Models\School;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SyncSchoolsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'schools:sync';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Synchronize the schools table with the official 23 SMP/MTs list';

    /**
     * Execute the console command.
     */
    public function handle(): int
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

        $this->info('Starting schools synchronization...');

        foreach ($schools as $name) {
            School::firstOrCreate(['name' => $name]);
        }

        $fallback = School::where('name', 'SMP Negeri 1 Cibitung')->first();
        $legacySchools = School::whereNotIn('name', $schools)->get();
        foreach ($legacySchools as $legacy) {
            if ($fallback) {
                DB::table('participants')
                    ->where('school_id', $legacy->id)
                    ->update(['school_id' => $fallback->id]);
            }
            $legacy->delete();
        }

        $count = School::count();
        $this->info("Successfully synchronized schools table! Total schools in database: {$count}");

        return self::SUCCESS;
    }
}
