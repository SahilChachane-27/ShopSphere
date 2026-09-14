import React from 'react';

interface BadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeStyle = (st: string) => {
    switch (st.toUpperCase()) {
      case 'ACTIVE':
      case 'APPROVED':
      case 'SUCCESS':
      case 'PAID':
      case 'DELIVERED':
      case 'CONFIRMED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

      case 'PENDING':
      case 'PROCESSING':
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';

      case 'DRAFT':
      case 'INACTIVE':
      case 'UNPAID':
      case 'COD':
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';

      case 'REJECTED':
      case 'FAILED':
      case 'CANCELLED':
      case 'OUT_OF_STOCK':
      case 'SUSPENDED':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';

      default:
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
    }
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs tracking-wide font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-full border ${getBadgeStyle(
        status
      )} ${sizeClass}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
};
