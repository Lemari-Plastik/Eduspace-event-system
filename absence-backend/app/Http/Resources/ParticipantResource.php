<?php

namespace App\Http\Resources;

use App\Models\Participant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Participant
 */
class ParticipantResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'role' => $this->role,
            'name' => $this->name,
            'identity_number' => $this->identity_number,
            'school_id' => $this->school_id,
            'school' => new SchoolResource($this->whenLoaded('school')),
            'trial_class' => $this->trial_class,
            'referral_source' => $this->referral_source,
            'referral_detail' => $this->referral_detail,
            'coupon_code' => $this->coupon_code,
            'is_redeemed' => (bool) $this->is_redeemed,
            'redeemed_at' => $this->redeemed_at?->toISOString() ?? $this->redeemed_at,
            'redeemed_by' => $this->redeemed_by,
            'redeemed_by_admin' => new AdminResource($this->whenLoaded('redeemedByAdmin')),
            'created_at' => $this->created_at?->toISOString() ?? $this->created_at,
            'updated_at' => $this->updated_at?->toISOString() ?? $this->updated_at,
        ];
    }
}
