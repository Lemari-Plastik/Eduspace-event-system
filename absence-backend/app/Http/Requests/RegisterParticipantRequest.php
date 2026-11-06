<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RegisterParticipantRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'role' => ['required', 'in:siswa,guru_pendamping'],
            'name' => ['required', 'string', 'max:255'],
            'identity_number' => ['required', 'string', 'max:50'],
            'school_id' => ['required', 'exists:schools,id'],
            'trial_class' => [
                'required_if:role,siswa',
                'nullable',
                'string',
                'in:IT,DKV,KULINER,MOBILE_LEGENDS,NONE,-',
            ],
            'referral_source' => ['required', 'string', 'max:100'],
            'referral_detail' => ['required_if:referral_source,Medsos,Banner,Event', 'nullable', 'string', 'max:100'],
        ];
    }
}
