<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Template;
use App\Models\User;
use App\Models\UserLibrary;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for LibraryController — GET /api/library and /api/library/count.
 *
 * Verifies:
 * - Unauthenticated access is blocked
 * - Returns only owned templates
 * - Pagination works correctly
 * - Count endpoint is accurate
 */
class LibraryControllerTest extends TestCase
{
    use RefreshDatabase;

    // ─────────────────────────────────────────────────────────
    // Auth Guard
    // ─────────────────────────────────────────────────────────

    public function test_unauthenticated_cannot_access_library(): void
    {
        $this->getJson('/api/library')->assertStatus(401);
    }

    public function test_unauthenticated_cannot_access_library_count(): void
    {
        $this->getJson('/api/library/count')->assertStatus(401);
    }

    // ─────────────────────────────────────────────────────────
    // Index — empty library
    // ─────────────────────────────────────────────────────────

    public function test_empty_library_returns_empty_data(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
             ->getJson('/api/library')
             ->assertStatus(200)
             ->assertJson(['success' => true])
             ->assertJsonPath('meta.total', 0);
    }

    // ─────────────────────────────────────────────────────────
    // Index — returns only user's own templates
    // ─────────────────────────────────────────────────────────

    public function test_library_returns_only_current_user_templates(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $template = Template::factory()->create(['is_active' => true, 'price' => 0]);
        $order    = Order::factory()->create(['user_id' => $user1->id, 'status' => 'completed', 'total' => 0]);

        // user1 owns a template
        UserLibrary::create([
            'user_id'      => $user1->id,
            'template_id'  => $template->id,
            'order_id'     => $order->id,
            'purchased_at' => now(),
        ]);

        // user2 gets their own library
        $response = $this->actingAs($user2, 'sanctum')
                         ->getJson('/api/library');

        $response->assertStatus(200)
                 ->assertJsonPath('meta.total', 0);
    }

    public function test_library_returns_owned_templates(): void
    {
        $user     = User::factory()->create();
        $template = Template::factory()->create(['is_active' => true, 'price' => 0]);
        $order    = Order::factory()->create(['user_id' => $user->id, 'status' => 'completed', 'total' => 0]);

        UserLibrary::create([
            'user_id'      => $user->id,
            'template_id'  => $template->id,
            'order_id'     => $order->id,
            'purchased_at' => now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')
                         ->getJson('/api/library');

        $response->assertStatus(200)
                 ->assertJson(['success' => true])
                 ->assertJsonPath('meta.total', 1)
                 ->assertJsonStructure([
                     'data' => [['id', 'template_id', 'order_id', 'purchased_at', 'title']],
                     'meta' => ['current_page', 'last_page', 'total', 'per_page'],
                 ]);
    }

    // ─────────────────────────────────────────────────────────
    // Count endpoint
    // ─────────────────────────────────────────────────────────

    public function test_count_returns_correct_number(): void
    {
        $user = User::factory()->create();

        // Create 3 library entries
        $templates = Template::factory()->count(3)->create(['is_active' => true, 'price' => 0]);
        $order     = Order::factory()->create(['user_id' => $user->id, 'status' => 'completed', 'total' => 0]);

        foreach ($templates as $tmpl) {
            UserLibrary::create([
                'user_id'      => $user->id,
                'template_id'  => $tmpl->id,
                'order_id'     => $order->id,
                'purchased_at' => now(),
            ]);
        }

        $this->actingAs($user, 'sanctum')
             ->getJson('/api/library/count')
             ->assertStatus(200)
             ->assertJsonPath('data.count', 3);
    }

    // ─────────────────────────────────────────────────────────
    // Pagination
    // ─────────────────────────────────────────────────────────

    public function test_pagination_respects_per_page(): void
    {
        $user     = User::factory()->create();
        $templates = Template::factory()->count(5)->create(['is_active' => true, 'price' => 0]);
        $order    = Order::factory()->create(['user_id' => $user->id, 'status' => 'completed', 'total' => 0]);

        foreach ($templates as $tmpl) {
            UserLibrary::create([
                'user_id'      => $user->id,
                'template_id'  => $tmpl->id,
                'order_id'     => $order->id,
                'purchased_at' => now(),
            ]);
        }

        $this->actingAs($user, 'sanctum')
             ->getJson('/api/library?per_page=2')
             ->assertStatus(200)
             ->assertJsonPath('meta.total', 5)
             ->assertJsonPath('meta.last_page', 3)
             ->assertJsonCount(2, 'data');
    }
}
