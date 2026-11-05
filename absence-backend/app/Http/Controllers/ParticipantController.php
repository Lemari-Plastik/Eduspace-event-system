<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListParticipantsRequest;
use App\Http\Requests\RegisterParticipantRequest;
use App\Http\Requests\ScanCouponRequest;
use App\Http\Resources\ParticipantResource;
use App\Models\Admin;
use App\Models\Participant;
use App\Services\ParticipantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ParticipantController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        protected ParticipantService $participantService
    ) {}

    /**
     * Handle public user registration.
     */
    public function register(RegisterParticipantRequest $request): JsonResponse
    {
        $participant = $this->participantService->register($request->validated());

        return (new ParticipantResource($participant->load('school')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * List participants for admin dashboard.
     */
    public function index(ListParticipantsRequest $request): AnonymousResourceCollection
    {
        $query = Participant::query()->with(['school', 'redeemedByAdmin']);

        if ($request->has('is_redeemed') && $request->input('is_redeemed') !== null && $request->input('is_redeemed') !== '') {
            $query->where('is_redeemed', $request->boolean('is_redeemed'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($subQuery) use ($search): void {
                $subQuery->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('coupon_code', 'LIKE', "%{$search}%");
            });
        }

        if ($request->filled('name')) {
            $name = $request->string('name')->toString();
            $query->where('name', 'LIKE', "%{$name}%");
        }

        if ($request->filled('coupon_code')) {
            $couponCode = $request->string('coupon_code')->toString();
            $query->where('coupon_code', 'LIKE', "%{$couponCode}%");
        }

        $perPage = $request->integer('per_page', 15);
        $participants = $query->orderByDesc('id')->paginate($perPage);

        return ParticipantResource::collection($participants);
    }

    /**
     * Handle manual participant creation by admin.
     */
    public function store(RegisterParticipantRequest $request): JsonResponse
    {
        $participant = $this->participantService->register($request->validated());

        return (new ParticipantResource($participant->load('school')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Redeem a participant's coupon.
     */
    public function scanCoupon(ScanCouponRequest $request): JsonResponse
    {
        /** @var Admin $admin */
        $admin = $request->user();

        $participant = $this->participantService->redeemCoupon(
            $request->validated('coupon_code'),
            $admin->id
        );

        return response()->json([
            'message' => 'Coupon successfully redeemed',
            'data' => new ParticipantResource($participant->load(['school', 'redeemedByAdmin'])),
            'participant' => new ParticipantResource($participant),
        ]);
    }

    /**
     * Delete a participant.
     */
    public function destroy(int $id): JsonResponse
    {
        $participant = Participant::findOrFail($id);
        $participant->delete();

        return response()->json([
            'message' => 'Participant deleted successfully',
        ]);
    }
}
