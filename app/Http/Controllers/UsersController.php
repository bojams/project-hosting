<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UsersController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'username' => 'required|string|max:255|unique:users,username',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|max:100',
            'role' => 'sometimes|in:user,admin,membership',
        ]);

        $user = User::create([
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'plain_password' => $validated['password'],
            'role' => $validated['role'] ?? 'user',
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => $user,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $query = User::select('id', 'username', 'email', 'plain_password', 'avatar_url', 'role', 'status', 'created_at', 'updated_at');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    public function updateRole(Request $request, User $user): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'role' => 'required|in:user,admin,membership',
        ]);

        $user->update(['role' => $validated['role']]);

        return response()->json([
            'success' => true,
            'message' => 'User role updated',
            'data' => $user,
        ]);
    }

    public function approve(Request $request, User $user): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $user->update(['status' => 'active']);

        return response()->json([
            'success' => true,
            'message' => 'User approved.',
            'data' => $user,
        ]);
    }

    public function reject(Request $request, User $user): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $user->update(['status' => 'rejected']);

        return response()->json([
            'success' => true,
            'message' => 'User rejected.',
            'data' => $user,
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'email' => 'sometimes|email|max:255|unique:users,email,'.$user->id,
            'role' => 'sometimes|in:user,admin,membership',
            'password' => 'sometimes|string|min:8|max:100',
        ]);

        $data = [];
        if (isset($validated['email'])) {
            $data['email'] = $validated['email'];
        }
        if (isset($validated['role'])) {
            $data['role'] = $validated['role'];
        }
        if (isset($validated['password'])) {
            $data['password'] = $validated['password'];
            $data['plain_password'] = $validated['password'];
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $user,
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        if ($user->id === $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Cannot delete yourself'], 400);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted',
        ]);
    }
}
