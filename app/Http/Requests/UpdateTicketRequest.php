<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'            => ['sometimes', 'string', 'max:255'],
            'description'     => ['sometimes', 'string'],
            'priority'         => ['sometimes', 'in:low,medium,high'],
            'assigned_user_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
        ];
    }
}
