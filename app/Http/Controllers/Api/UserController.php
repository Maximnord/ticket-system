<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    /**
     * List users. Used by the frontend assignment dropdown.
     */
    public function index(): JsonResponse
    {
        $users = User::query()
            ->select(['id', 'name', 'email'])
            ->orderBy('name')
            ->get();

        return response()->json($users);
    }
}
