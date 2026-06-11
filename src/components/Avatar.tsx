import React from 'react';
import { Friend } from '../types';

interface AvatarProps {
  friend: Friend;
  className?: string; // Additional classes for the container
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function Avatar({ friend, className = '', size = 'md' }: AvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-[12px]',
    md: 'w-10 h-10 text-[14px]',
    lg: 'w-12 h-12 text-[16px]',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0 ${friend.avatarColor} overflow-hidden ${className}`}>
      {friend.avatarUrl ? (
        <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover" />
      ) : (
        friend.avatarEmoji
      )}
    </div>
  );
}
