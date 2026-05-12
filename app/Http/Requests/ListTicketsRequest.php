<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ListTicketsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status'   => ['sometimes', 'in:open,in_progress,closed'],
            'priority' => ['sometimes', 'in:low,medium,high'],
            'user_id'  => ['sometimes', 'integer', 'exists:users,id'],
            'sort_by'  => ['sometimes', 'in:created_at,updated_at,priority,status'],
            'order'    => ['sometimes', 'in:asc,desc'],
        ];
    }
}
