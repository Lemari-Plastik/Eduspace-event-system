<?php

namespace App\Models;

use Database\Factories\ParticipantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Participant extends Model
{
    /** @use HasFactory<ParticipantFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'role',
        'name',
        'identity_number',
        'school_id',
        'trial_class',
        'referral_source',
        'referral_detail',
        'coupon_code',
        'is_redeemed',
        'redeemed_at',
        'redeemed_by',
    ];

    protected $attributes = [
        'identity_number' => '-',
        'is_redeemed' => false,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_redeemed' => 'boolean',
            'redeemed_at' => 'datetime',
        ];
    }

    /**
     * Get the school that the participant belongs to.
     *
     * @return BelongsTo<School, $this>
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Get the admin who redeemed the participant's coupon.
     *
     * @return BelongsTo<Admin, $this>
     */
    public function redeemedByAdmin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'redeemed_by');
    }
}
