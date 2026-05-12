<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'            => ['required', 'string', 'max:255'],
            'description'      => ['required', 'string'],
            'status'           => ['sometimes', 'in:open,in_progress,closed'],
            'priority'         => ['required', 'in:low,medium,high'],
            'assigned_user_id' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}
