<?php

namespace App\Http\Controllers;

use App\Http\Resources\SchoolResource;
use App\Models\School;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SchoolController extends Controller
{
    /**
     * Retrieve list of schools for dropdown.
     */
    public function index(): AnonymousResourceCollection
    {
        $query = School::query();

        if (!empty(School::OFFICIAL_SCHOOLS)) {
            $query->whereIn('name', School::OFFICIAL_SCHOOLS);
        }

        $schools = $query->orderBy('name')->get(['id', 'name']);

        if ($schools->isEmpty()) {
            $schools = School::query()->orderBy('name')->get(['id', 'name']);
        }

        return SchoolResource::collection($schools);
    }
}
