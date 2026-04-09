<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ViolationController;
use Illuminate\Support\Facades\Route;

// PUBLIC: Edge device (tanpa token)
Route::post('/violations', [ViolationController::class, 'store']);

// PUBLIC: Auth
Route::post('/auth/login', [AuthController::class, 'login']);

// PROTECTED: Semua role yang sudah login
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Violations
    Route::get('/violations',      [ViolationController::class, 'index']);
    Route::get('/violations/{id}', [ViolationController::class, 'show']);
});