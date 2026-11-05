<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('participants', function (Blueprint $table) {
            $table->id();
            $table->string('role', 50);
            $table->string('name');
            $table->string('identity_number', 50);
            $table->foreignId('school_id')->constrained('schools')->restrictOnDelete();
            $table->string('trial_class', 50);
            $table->string('referral_source', 100);
            $table->string('referral_detail', 100)->nullable();
            $table->string('coupon_code', 20)->unique();
            $table->boolean('is_redeemed')->default(false)->index();
            $table->timestamp('redeemed_at')->nullable();
            $table->foreignId('redeemed_by')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('participants');
    }
};
