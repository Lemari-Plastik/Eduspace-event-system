<?php

namespace App\Services;

use App\Models\Participant;
use Illuminate\Database\QueryException;

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
        $maxAttempts = 5;
        $attempt = 0;

        while ($attempt < $maxAttempts) {
            $attempt++;
            $couponCode = $this->generateNextCouponCode();

            $trialClass = ($data['role'] === 'guru_pendamping')
                ? ($data['trial_class'] ?? '-')
                : ($data['trial_class'] ?? 'IT');
            if (empty($trialClass)) {
                $trialClass = '-';
            }

            try {
                return Participant::create([
                    'role' => $data['role'],
                    'name' => $data['name'],
                    'identity_number' => !empty($data['identity_number']) ? $data['identity_number'] : '-',
                    'school_id' => (int) $data['school_id'],
                    'trial_class' => $trialClass,
                    'referral_source' => $data['referral_source'],
                    'referral_detail' => $data['referral_detail'] ?? null,
                    'coupon_code' => $couponCode,
                ]);
            } catch (QueryException $e) {
                // If collision occurs on unique coupon_code, retry with next number
                if ($attempt < $maxAttempts && (str_contains($e->getMessage(), 'unique') || str_contains($e->getMessage(), 'duplicate') || str_contains($e->getMessage(), '23505'))) {
                    continue;
                }
                throw $e;
            }
        }

        throw new \RuntimeException('Gagal membuat kupon unik setelah beberapa kali percobaan.');
    }

    /**
     * Generate the next sequential coupon code formatted as ABSC-XXXX.
     */
    public function generateNextCouponCode(): string
    {
        $latestParticipant = Participant::where('coupon_code', 'LIKE', 'ABSC-%')
            ->orderByDesc('id')
            ->first();

        $nextNumber = 1;

        if ($latestParticipant !== null && preg_match('/^ABSC-(\d+)$/', $latestParticipant->coupon_code, $matches) === 1) {
            $nextNumber = ((int) $matches[1]) + 1;
        }

        return 'ABSC-'.str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Redeem a participant's coupon using atomic conditional update.
     */
    public function redeemCoupon(string $couponCode, int $adminId): Participant
    {
        $participant = Participant::where('coupon_code', $couponCode)->first();

        if (! $participant) {
            abort(404, 'Kupon tidak ditemukan.');
        }

        if ($participant->is_redeemed) {
            abort(422, 'Kupon sudah di-scan sebelumnya.');
        }

        // Atomic update preventing double redemption race conditions
        $affected = Participant::where('id', $participant->id)
            ->where('is_redeemed', false)
            ->update([
                'is_redeemed' => true,
                'redeemed_at' => now(),
                'redeemed_by' => $adminId,
            ]);

        if ($affected === 0) {
            abort(422, 'Kupon sudah di-scan sebelumnya.');
        }

        $participant->refresh();

        return $participant;
    }
}
