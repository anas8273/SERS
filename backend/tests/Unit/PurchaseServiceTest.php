<?php
// tests/Unit/PurchaseServiceTest.php

namespace Tests\Unit;

use App\Models\Order;
use App\Models\Outbox;
use App\Models\Product;
use App\Models\User;
use App\Services\PurchaseService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseServiceTest extends TestCase
{
    use RefreshDatabase;

    protected PurchaseService $purchaseService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->purchaseService = new PurchaseService();
    }

    public function test_can_create_order(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'type' => 'interactive',
            'price' => 50.00,
        ]);

        $order = $this->purchaseService->createOrder($user, [
            ['product_id' => $product->id],
        ]);

        $this->assertInstanceOf(Order::class, $order);
        $this->assertEquals('pending', $order->status);
        $this->assertEquals(50.00, $order->total);
        $this->assertCount(1, $order->items);
    }

    public function test_completing_payment_creates_outbox_event(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'type' => 'interactive',
            'price' => 50.00,
            'template_structure' => ['field1' => 'text', 'field2' => 'textarea'],
        ]);

        $order = $this->purchaseService->createOrder($user, [
            ['product_id' => $product->id],
        ]);

        $this->purchaseService->completePayment(
            $order,
            'payment_123',
            'stripe',
            ['charge_id' => 'ch_123']
        );

        // التحقق من تحديث حالة الطلب
        $order->refresh();
        $this->assertEquals('completed', $order->status);

        // التحقق من إنشاء حدث في صندوق الصادر
        $outboxEvent = Outbox::where('aggregate_id', $order->id)->first();
        $this->assertNotNull($outboxEvent);
        $this->assertEquals('order.completed', $outboxEvent->event_type);
        $this->assertEquals('pending', $outboxEvent->status);
    }

    public function test_downloadable_products_do_not_create_outbox_event(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'type' => 'downloadable',
            'price' => 30.00,
        ]);

        $order = $this->purchaseService->createOrder($user, [
            ['product_id' => $product->id],
        ]);

        $this->purchaseService->completePayment(
            $order,
            'payment_456',
            'stripe'
        );

        // لا يجب إنشاء حدث في صندوق الصادر للمنتجات القابلة للتحميل
        $outboxEvent = Outbox::where('aggregate_id', $order->id)->first();
        $this->assertNull($outboxEvent);
    }
}