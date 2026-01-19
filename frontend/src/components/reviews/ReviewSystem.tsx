'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Star, ThumbsUp, Flag, MoreVertical, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  content: string;
  createdAt: Date;
  helpful: number;
  verified: boolean;
}

interface ReviewSystemProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  onAddReview?: (review: { rating: number; title: string; content: string }) => void;
  onHelpful?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  canReview?: boolean;
}

// Star Rating Component
export function StarRating({
  rating,
  size = 'md',
  interactive = false,
  onChange,
}: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={cn(
            'transition-colors',
            interactive && 'cursor-pointer hover:scale-110'
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              (hoverRating || rating) >= star
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            )}
          />
        </button>
      ))}
    </div>
  );
}

// Rating Summary Component
export function RatingSummary({
  averageRating,
  totalReviews,
  distribution,
}: {
  averageRating: number;
  totalReviews: number;
  distribution: { [key: number]: number };
}) {
  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 bg-muted/50 rounded-lg">
      {/* Average Rating */}
      <div className="text-center md:text-right">
        <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
        <StarRating rating={averageRating} size="lg" />
        <p className="text-sm text-muted-foreground mt-2">
          بناءً على {totalReviews} تقييم
        </p>
      </div>

      {/* Distribution */}
      <div className="flex-1 space-y-2">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = distribution[stars] || 0;
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

          return (
            <div key={stars} className="flex items-center gap-3">
              <span className="text-sm w-8">{stars}</span>
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-12">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Review Card Component
export function ReviewCard({
  review,
  onHelpful,
  onReport,
}: {
  review: Review;
  onHelpful?: () => void;
  onReport?: () => void;
}) {
  return (
    <div className="border-b pb-6 last:border-0">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          {review.userAvatar ? (
            <img
              src={review.userAvatar}
              alt={review.userName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-primary" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{review.userName}</span>
            {review.verified && (
              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full">
                مشتري موثق
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(review.createdAt, {
                addSuffix: true,
                locale: ar,
              })}
            </span>
          </div>

          {review.title && (
            <h4 className="font-medium mt-3">{review.title}</h4>
          )}

          <p className="text-sm text-muted-foreground mt-2">{review.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={onHelpful}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ThumbsUp className="w-4 h-4" />
              مفيد ({review.helpful})
            </button>
            <button
              onClick={onReport}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              <Flag className="w-4 h-4" />
              إبلاغ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Review Form
export function AddReviewForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (review: { rating: number; title: string; content: string }) => void;
  onCancel?: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit({ rating, title, content });
    setRating(0);
    setTitle('');
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-muted/50 rounded-lg">
      <h3 className="font-semibold">أضف تقييمك</h3>

      <div>
        <label className="block text-sm mb-2">التقييم</label>
        <StarRating rating={rating} size="lg" interactive onChange={setRating} />
      </div>

      <div>
        <label className="block text-sm mb-2">عنوان التقييم (اختياري)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ملخص تجربتك"
          className="w-full p-2 rounded-lg border bg-background"
        />
      </div>

      <div>
        <label className="block text-sm mb-2">تفاصيل التقييم</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="شاركنا تجربتك مع هذا القالب..."
          rows={4}
          className="w-full p-2 rounded-lg border bg-background resize-none"
          required
        />
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
        )}
        <Button type="submit" disabled={rating === 0}>
          إرسال التقييم
        </Button>
      </div>
    </form>
  );
}

// Main Review System Component
export function ReviewSystem({
  reviews,
  averageRating,
  totalReviews,
  ratingDistribution,
  onAddReview,
  onHelpful,
  onReport,
  canReview = false,
}: ReviewSystemProps) {
  const [showAddReview, setShowAddReview] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'recent') {
      return b.createdAt.getTime() - a.createdAt.getTime();
    }
    if (sortBy === 'helpful') {
      return b.helpful - a.helpful;
    }
    return b.rating - a.rating;
  });

  return (
    <div className="space-y-6">
      {/* Summary */}
      <RatingSummary
        averageRating={averageRating}
        totalReviews={totalReviews}
        distribution={ratingDistribution}
      />

      {/* Add Review */}
      {canReview && !showAddReview && (
        <Button onClick={() => setShowAddReview(true)}>
          أضف تقييمك
        </Button>
      )}

      {showAddReview && onAddReview && (
        <AddReviewForm
          onSubmit={(review) => {
            onAddReview(review);
            setShowAddReview(false);
          }}
          onCancel={() => setShowAddReview(false)}
        />
      )}

      {/* Reviews List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">التقييمات ({totalReviews})</h3>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="p-2 rounded-lg border bg-background text-sm"
          >
            <option value="recent">الأحدث</option>
            <option value="helpful">الأكثر فائدة</option>
            <option value="rating">الأعلى تقييماً</option>
          </select>
        </div>

        <div className="space-y-6">
          {sortedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onHelpful={() => onHelpful?.(review.id)}
              onReport={() => onReport?.(review.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
