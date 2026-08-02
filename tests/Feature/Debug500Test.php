<?php

use App\Models\User;

test('debug logout 500', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->post(route('logout'));
    if ($response->status() === 500) {
        fwrite(STDERR, "\n=== EXC ===\n");
        fwrite(STDERR, (string) $response->exception);
        fwrite(STDERR, "\n=== END ===\n");
    }

    $response->assertRedirect(route('home'));
});
