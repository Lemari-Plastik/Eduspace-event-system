<?php

use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\ParticipantController;
use App\Http\Controllers\SchoolController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::get('/schools', [SchoolController::class, 'index'])->name('schools.index');
Route::post('/register', [ParticipantController::class, 'register'])->name('register');

/*
|--------------------------------------------------------------------------
| Admin Authentication Route (Unprotected)
|--------------------------------------------------------------------------
*/
Route::post('/admin/login', [AdminAuthController::class, 'login'])->name('admin.login');

/*
|--------------------------------------------------------------------------
| Protected Admin Routes (Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->prefix('admin')->name('admin.')->group(function (): void {
    Route::get('/me', [AdminAuthController::class, 'me'])->name('me');
    Route::post('/logout', [AdminAuthController::class, 'logout'])->name('logout');

    Route::post('/coupons/scan', [ParticipantController::class, 'scanCoupon'])->name('coupons.scan');
    Route::get('/participants', [ParticipantController::class, 'index'])->name('participants.index');
    Route::post('/participants', [ParticipantController::class, 'store'])->name('participants.store');
    Route::delete('/participants/{id}', [ParticipantController::class, 'destroy'])->name('participants.destroy');
});
