<?php

namespace Tests\Unit;

use App\Models\Review;
use App\Models\Template;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Unit tests for Review model — approve/reject and syncTemplateCachedRating.
 *
 * Tests [FIX BUG-NEW-01]: verifies that Template.average_rating and
 * reviews_count are updated atomically when a review is approved or rejected.
 */
class ReviewSyncTest extends TestCase
{
    use RefreshDatabase;

    // ─────────────────────────────────────────────────────────
    // Approve — rating sync
    // ─────────────────────────────────────────────────────────

    public function test_approve_updates_template_average_rating(): void
    {
        $user     = User::factory()->create();
        $template = Template::factory()->create(['average_rating' => 0, 'reviews_count' => 0]);

        $review = Review::factory()->create([
            'user_id'     => $user->id,
            'template_id' => $template->id,
            'rating'      => 4,
            'is_approved' => false,
        ]);

        $review->approve();

        $template->refresh();

        $this->assertEquals(1, $template->reviews_count);
        $this->assertEquals(4.0, (float) $template->average_rating);
    }

    public function test_approve_multiple_reviews_calculates_correct_average(): void
    {
        $user     = User::factory()->create();
        $template = Template::factory()->create(['average_rating' => 0, 'reviews_count' => 0]);

        $user2    = User::factory()->create();
        $user3    = User::factory()->create();

        $r1 = Review::factory()->create([
            'user_id'     => $user->id,
            'template_id' => $template->id,
            'rating'      => 5,
            'is_approved' => false,
        ]);
        $r2 = Review::factory()->create([
            'user_id'     => $user2->id,
            'template_id' => $template->id,
            'rating'      => 3,
            'is_approved' => false,
        ]);
        $r3 = Review::factory()->create([
            'user_id'     => $user3->id,
            'template_id' => $template->id,
            'rating'      => 4,
            'is_approved' => false,
        ]);

        $r1->approve();
        $r2->approve();
        $r3->approve();

        $template->refresh();

        $this->assertEquals(3, $template->reviews_count);
        $this->assertEquals(4.0, (float) $template->average_rating); // (5+3+4)/3 = 4.0
    }

    // ─────────────────────────────────────────────────────────
    // Reject — rating sync
    // ─────────────────────────────────────────────────────────

    public function test_reject_decrements_average_rating(): void
    {
        $user     = User::factory()->create();
        $user2    = User::factory()->create();
        $template = Template::factory()->create(['average_rating' => 0, 'reviews_count' => 0]);

        $r1 = Review::factory()->create([
            'user_id'     => $user->id,
            'template_id' => $template->id,
            'rating'      => 5,
            'is_approved' => true,
        ]);
        $r2 = Review::factory()->create([
            'user_id'     => $user2->id,
            'template_id' => $template->id,
            'rating'      => 1,
            'is_approved' => true,
        ]);

        // Reject the high-rated review
        $r1->reject();

        $template->refresh();

        $this->assertEquals(1, $template->reviews_count); // Only r2 remains approved
        $this->assertEquals(1.0, (float) $template->average_rating);
    }

    public function test_reject_all_reviews_sets_rating_to_zero(): void
    {
        $user     = User::factory()->create();
        $template = Template::factory()->create(['average_rating' => 4.0, 'reviews_count' => 1]);

        $review = Review::factory()->create([
            'user_id'     => $user->id,
            'template_id' => $template->id,
            'rating'      => 4,
            'is_approved' => true,
        ]);

        $review->reject();

        $template->refresh();

        $this->assertEquals(0, $template->reviews_count);
        $this->assertEquals(0.0, (float) $template->average_rating);
    }
}
