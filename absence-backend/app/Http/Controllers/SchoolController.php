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
        $schools = School::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return SchoolResource::collection($schools);
    }
}
