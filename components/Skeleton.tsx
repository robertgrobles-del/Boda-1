import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rect' }) => {
  const baseClasses = 'animate-pulse bg-stone-200/60';
  const variantClasses = {
    text: 'h-4 w-full rounded-md',
    rect: 'rounded-2xl',
    circle: 'rounded-full'
  };

  return <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />;
};
