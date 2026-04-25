<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ViolationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\CameraController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;

// ── PUBLIC: Edge device (tanpa token) ──
Route::post('/violations', [ViolationController::class, 'store']);

// ── PUBLIC: Auth ──
Route::post('/auth/login', [AuthController::class, 'login']);

// ── PUBLIC: Shift active (dipakai backend internal) ──
Route::get('/shifts/active', [ShiftController::class, 'active']);

// ── PUBLIC: Cooldown check ──
Route::get('/notifications/cooldown-check', [NotificationController::class, 'cooldownCheck']);

// ── PROTECTED: Semua role yang sudah login ──
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Violations — semua role
    Route::get('/violations',      [ViolationController::class, 'index']);
    Route::get('/violations/{id}', [ViolationController::class, 'show']);

    // Dashboard — semua role
    Route::get('/dashboard/summary',  [DashboardController::class, 'summary']);
    Route::get('/dashboard/trend',    [DashboardController::class, 'trend']);
    Route::get('/dashboard/by-shift', [DashboardController::class, 'byShift']);
    Route::get('/dashboard/by-type',  [DashboardController::class, 'byType']);

    // Shifts — read semua role
    Route::get('/shifts', [ShiftController::class, 'index']);

    // Cameras — read semua role
    Route::get('/cameras', [CameraController::class, 'index']);

    // Notifications — semua role
    Route::get('/notifications', [NotificationController::class, 'index']);

    // ── ADMIN ONLY ──
    Route::middleware('role:admin')->group(function () {
        Route::post('/shifts',         [ShiftController::class, 'store']);
        Route::put('/shifts/{id}',     [ShiftController::class, 'update']);
        Route::delete('/shifts/{id}',  [ShiftController::class, 'destroy']);
        Route::post('/cameras',        [CameraController::class, 'store']);
        Route::put('/cameras/{id}',    [CameraController::class, 'update']);
        Route::delete('/cameras/{id}', [CameraController::class, 'destroy']);
    });
});