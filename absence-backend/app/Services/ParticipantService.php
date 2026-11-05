<?php

namespace App\Services;

use App\Models\Participant;
use Illuminate\Support\Facades\DB;

class ParticipantService
{
    /**
     * Register a new participant with auto-generated coupon code.
     *
     * @param  array{
     *     role: string,
     *     name: string,
     *     identity_number: string,
     *     school_id: int|string,
     *     trial_class: string,
     *     referral_source: string,
     *     referral_detail?: string|null
     * }  $data
     */
    public function register(array $data): Participant
    {
        return DB::transaction(function () use ($data): Participant {
            if (DB::getDriverName() === 'pgsql') {
                DB::statement('SELECT pg_advisory_xact_lock(749216)');
            }

            $couponCode = $this->generateNextCouponCode();

            return Participant::create([
                'role' => $data['role'],
                'name' => $data['name'],
                'identity_number' => $data['identity_number'],
                'school_id' => (int) $data['school_id'],
                'trial_class' => $data['trial_class'],
                'referral_source' => $data['referral_source'],
                'referral_detail' => $data['referral_detail'] ?? null,
                'coupon_code' => $couponCode,
                'is_redeemed' => false,
            ]);
        });
    }

    /**
     * Generate the next sequential coupon code formatted as ABSC-XXXX.
     */
    public function generateNextCouponCode(): string
    {
        $latestParticipant = Participant::where('coupon_code', 'LIKE', 'ABSC-%')
            ->orderByDesc('id')
            ->lockForUpdate()
            ->first();

        $nextNumber = 1;

        if ($latestParticipant !== null && preg_match('/^ABSC-(\d+)$/', $latestParticipant->coupon_code, $matches) === 1) {
            $nextNumber = ((int) $matches[1]) + 1;
        }

        return 'ABSC-'.str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Redeem a participant's coupon using pessimistic locking.
     */
    public function redeemCoupon(string $couponCode, int $adminId): Participant
    {
        return DB::transaction(function () use ($couponCode, $adminId): Participant {
            $participant = Participant::where('coupon_code', $couponCode)
                ->lockForUpdate()
                ->firstOrFail();

            if ($participant->is_redeemed) {
                abort(422, 'Kupon sudah di-scan sebelumnya.');
            }

            $participant->update([
                'is_redeemed' => true,
                'redeemed_at' => now(),
                'redeemed_by' => $adminId,
            ]);

            return $participant;
        });
    }
}
