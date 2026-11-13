<?php

namespace App\Models;

use Database\Factories\SchoolFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class School extends Model
{
    /** @use HasFactory<SchoolFactory> */
    use HasFactory;

    /**
     * Official list of 23 partner schools shown in dropdown.
     *
     * @var list<string>
     */
    public const OFFICIAL_SCHOOLS = [
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

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
    ];

    /**
     * Get the participants for the school.
     *
     * @return HasMany<Participant, $this>
     */
    public function participants(): HasMany
    {
        return $this->hasMany(Participant::class);
    }
}
