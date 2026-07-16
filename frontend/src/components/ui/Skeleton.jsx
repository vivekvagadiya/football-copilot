import React from 'react';

export const Skeleton = ({
  className = '',
  ...props
}) => {
  return (
    <div
      className={`animate-pulse rounded bg-border/20 ${className}`}
      {...props}
    />
  );
};

export const ScoreCardSkeleton = () => (
  <div className="border border-border p-4 rounded-xl space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-5 w-12 rounded-full" />
    </div>
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-6 w-8" />
    </div>
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-6 w-8" />
    </div>
  </div>
);

export const NewsCardSkeleton = () => (
  <div className="border border-border p-4 rounded-xl flex gap-4">
    <Skeleton className="h-20 w-28 rounded-lg shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);

export const FixtureCardSkeleton = () => (
  <div className="border border-border p-3 rounded-lg flex items-center justify-between">
    <div className="flex items-center gap-4">
      <Skeleton className="h-4 w-12" />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
    <Skeleton className="h-5 w-10 rounded-full" />
  </div>
);
