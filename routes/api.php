<?php

use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/users', [UserController::class, 'index']);

Route::prefix('tickets')->group(function () {
    Route::get('/',                  [TicketController::class, 'index']);
    Route::post('/',                 [TicketController::class, 'store']);
    Route::get('/stats',             [TicketController::class, 'stats']);
    Route::put('/{ticket}',          [TicketController::class, 'update']);
    Route::patch('/{ticket}/status', [TicketController::class, 'changeStatus']);
    Route::patch('/{ticket}/assign', [TicketController::class, 'assign']);
});
