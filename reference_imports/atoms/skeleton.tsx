import React from "react";

interface SkeletonProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  height = "1rem",
  width = "100%",
  rounded = false,
  animate = true,
}) => {
  const baseClasses = "bg-white/10";
  const animationClasses = animate ? "animate-pulse" : "";
  const roundedClasses = rounded ? "rounded-full" : "";

  return (
    <div
      className={`${baseClasses} ${animationClasses} ${roundedClasses} ${className}`}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        width: typeof width === "number" ? `${width}px` : width,
      }}
    />
  );
};

export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
  lineHeight?: string;
}> = ({ lines = 1, className = "", lineHeight = "1rem" }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 && lines > 1 ? "75%" : "100%"}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className = "", children }) => {
  return (
    <div className={`box bg-white/5 border-white/10 ${className}`}>
      {children}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number; className?: string }> = ({ rows = 5, cols = 4, className = "" }) => {
  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className="flex gap-4 mb-4 border-b border-white/10 pb-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`head-${i}`} width={`${100 / cols}%`} height="1rem" />
        ))}
      </div>
      {/* Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`row-${r}`} className="flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={`cell-${r}-${c}`} width={`${100 / cols}%`} height="1rem" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => {
  return (
    <div className="space-y-6">
      <Skeleton width="200px" height="1.5rem" className="mb-6" />
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton width="150px" height="0.875rem" />
            <Skeleton width="100%" height="2.5rem" />
          </div>
        ))}
      </div>
      <div className="pt-4">
        <Skeleton width="120px" height="2.5rem" />
      </div>
    </div>
  );
};

export const TickerDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton width="120px" height="1rem" className="mb-2" />
        <Skeleton width="150px" height="2.5rem" className="mb-1" />
        <Skeleton width="300px" height="1rem" />
      </div>

      {/* Position Summary */}
      <SkeletonCard className="p-6">
        <Skeleton width="180px" height="1.25rem" className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} className="p-4">
              <Skeleton width="120px" height="0.875rem" className="mb-2" />
              <Skeleton width="150px" height="2rem" className="mb-1" />
              <Skeleton width="100px" height="0.75rem" />
            </SkeletonCard>
          ))}
        </div>
      </SkeletonCard>

      {/* Transactions Table */}
      <SkeletonCard className="overflow-hidden">
        <div className="p-4 border-b border-box-border">
          <Skeleton width="180px" height="1.25rem" />
        </div>
        <div className="p-4">
          <TableSkeleton rows={8} cols={7} className="border-0" />
        </div>
      </SkeletonCard>
    </div>
  );
};

export const IssuerRequestDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton width="200px" height="2rem" />
          <Skeleton width="300px" height="1rem" />
        </div>
        <Skeleton width="120px" height="2.5rem" />
      </div>
      
      <SkeletonCard className="p-6">
        <Skeleton width="150px" height="1.25rem" className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i}>
                <Skeleton width="100px" height="0.875rem" className="mb-1" />
                <Skeleton width="80%" height="1.25rem" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
             {[1, 2, 3, 4].map(i => (
              <div key={i}>
                <Skeleton width="100px" height="0.875rem" className="mb-1" />
                <Skeleton width="80%" height="1.25rem" />
              </div>
            ))}
          </div>
        </div>
      </SkeletonCard>
    </div>
  );
};

export const AdminRequestDetailSkeleton: React.FC = () => {
   return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton width="250px" height="2rem" />
          <Skeleton width="350px" height="1rem" />
        </div>
        <Skeleton width="100px" height="2.5rem" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <SkeletonCard className="p-6">
             <Skeleton width="180px" height="1.25rem" className="mb-4" />
             <div className="grid grid-cols-3 gap-4">
               {[1, 2, 3, 4, 5, 6].map(i => (
                 <div key={i} className="space-y-2">
                   <Skeleton width="80px" height="0.75rem" />
                   <Skeleton width="100%" height="1rem" />
                 </div>
               ))}
             </div>
           </SkeletonCard>
           
           <SkeletonCard className="p-6">
             <Skeleton width="180px" height="1.25rem" className="mb-4" />
             <div className="space-y-4">
               <Skeleton width="100%" height="200px" />
             </div>
           </SkeletonCard>
        </div>
        
        <div className="space-y-6">
          <SkeletonCard className="p-6">
            <Skeleton width="150px" height="1.25rem" className="mb-4" />
            <div className="space-y-3">
              <Skeleton width="100%" height="3rem" />
              <Skeleton width="100%" height="3rem" />
              <Skeleton width="100%" height="3rem" />
            </div>
          </SkeletonCard>
        </div>
      </div>
    </div>
   );
};

// Market Trading Specific Skeletons
export const IssuerDetailsSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton width={40} height={40} rounded />
        <div className="space-y-2 flex-1">
          <Skeleton height="1.5rem" width="60%" />
          <Skeleton height="1rem" width="40%" />
        </div>
      </div>
      <Skeleton height="1rem" width="80%" />
      <Skeleton height="3rem" width="100%" />
    </div>
  );
};

export const OrderSettingsSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton width="40%" height="1.25rem" />
        <Skeleton width="60px" height="24px" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Skeleton width="60%" height="0.75rem" />
          <Skeleton width="80%" height="1.5rem" />
        </div>
        <div className="space-y-2">
          <Skeleton width="70%" height="0.75rem" />
          <Skeleton width="90%" height="1.5rem" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <Skeleton width="100%" height="0.75rem" />
            <Skeleton width="100%" height="1rem" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const TradingFormSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton width="40%" height="0.75rem" />
        <Skeleton width="100%" height="40px" />
      </div>
      <div className="flex gap-3">
        <Skeleton width="50%" height="40px" />
        <Skeleton width="50%" height="40px" />
      </div>
      <Skeleton width="100%" height="0.75rem" />
    </div>
  );
};

export const AdminStatisticsDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <SkeletonCard className="p-6">
        <Skeleton width="150px" height="1rem" className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i}>
              <Skeleton width="100px" height="0.875rem" className="mb-2" />
              <Skeleton width="200px" height="4rem" className="mb-2" />
              <Skeleton width="180px" height="0.875rem" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      <SkeletonCard className="p-6">
        <Skeleton width="150px" height="1rem" className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i}>
              <Skeleton width="100px" height="0.875rem" className="mb-2" />
              <Skeleton width="200px" height="4rem" className="mb-2" />
              <Skeleton width="180px" height="0.875rem" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      <SkeletonCard className="p-6">
        <Skeleton width="150px" height="1rem" className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i}>
              <Skeleton width="100px" height="0.875rem" className="mb-2" />
              <Skeleton width="200px" height="4rem" className="mb-2" />
              <Skeleton width="180px" height="0.875rem" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      <SkeletonCard className="p-6">
        <Skeleton width="150px" height="1rem" className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i}>
              <Skeleton width="100px" height="0.875rem" className="mb-2" />
              <Skeleton width="200px" height="4rem" className="mb-2" />
              <Skeleton width="180px" height="0.875rem" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} className="p-6">
            <Skeleton width="120px" height="1rem" className="mb-4" />
            <Skeleton width="100%" height="300px" />
          </SkeletonCard>
        ))}
      </div>

      <SkeletonCard className="p-6">
        <Skeleton width="200px" height="1rem" className="mb-4" />
        <Skeleton width="100%" height="400px" />
      </SkeletonCard>

      <SkeletonCard className="p-6">
        <Skeleton width="200px" height="1rem" className="mb-4" />
        <Skeleton width="100%" height="400px" />
      </SkeletonCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <SkeletonCard key={i} className="p-6">
            <Skeleton width="150px" height="1rem" className="mb-4" />
            <Skeleton width="100%" height="300px" />
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
};

export const AdminControlsSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="space-y-2">
          <Skeleton width="250px" height="2.5rem" />
          <Skeleton width="350px" height="1rem" />
        </div>
        <Skeleton width="80px" height="2.5rem" />
      </div>

      {/* Table */}
      <SkeletonCard className="overflow-hidden">
        <div className="p-4 border-b border-box-border">
           <Skeleton width="100%" height="2rem" />
        </div>
        <div className="p-4">
          <TableSkeleton rows={5} cols={9} className="border-0" />
        </div>
      </SkeletonCard>

      {/* Form Section */}
      <div className="border-t border-box-border pt-8 space-y-6">
         <div className="flex gap-4 mb-6">
            <Skeleton width="200px" height="2rem" />
         </div>
         <div className="space-y-6">
            <Skeleton width="100%" height="3rem" />
            <Skeleton width="100%" height="3rem" />
            <Skeleton width="100%" height="3rem" />
            <div className="flex justify-end gap-4">
               <Skeleton width="120px" height="3rem" />
            </div>
         </div>
      </div>
    </div>
  );
};

export const AdminTagsSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="space-y-2">
          <Skeleton width="200px" height="2.5rem" />
          <Skeleton width="300px" height="1rem" />
        </div>
        <Skeleton width="80px" height="2.5rem" />
      </div>

      {/* Create Form */}
      <SkeletonCard className="p-6">
        <Skeleton width="150px" height="1.5rem" className="mb-4" />
        <div className="flex gap-4 items-end">
           <Skeleton width="300px" height="3rem" />
           <Skeleton width="120px" height="3rem" />
        </div>
      </SkeletonCard>

      {/* Search Form */}
      <SkeletonCard className="p-6">
        <Skeleton width="150px" height="1.5rem" className="mb-4" />
        <div className="flex gap-4">
           <Skeleton width="100%" height="3rem" />
           <Skeleton width="100px" height="3rem" />
        </div>
      </SkeletonCard>

      {/* Table */}
      <SkeletonCard className="overflow-hidden">
        <div className="p-4">
          <TableSkeleton rows={5} cols={4} className="border-0" />
        </div>
      </SkeletonCard>
    </div>
  );
};

export const AdminIssuerRequestsSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="space-y-2">
          <Skeleton width="300px" height="2.5rem" />
          <Skeleton width="250px" height="1rem" />
        </div>
        <Skeleton width="80px" height="2.5rem" />
      </div>

      {/* Table */}
      <SkeletonCard className="overflow-hidden">
        <div className="p-4">
          <TableSkeleton rows={8} cols={6} className="border-0" />
        </div>
      </SkeletonCard>
    </div>
  );
};

export const AdminRequestsTableSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <Skeleton width="300px" height="2.5rem" />
        <Skeleton width="250px" height="1rem" />
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
           <Skeleton width="100%" height="3rem" />
           <Skeleton width="120px" height="3rem" />
           <Skeleton width="100px" height="3rem" />
        </div>
        <div className="flex gap-2">
           {[1, 2, 3, 4].map(i => <Skeleton key={i} width="100px" height="2.5rem" />)}
        </div>
      </div>

      {/* Table */}
      <SkeletonCard className="overflow-hidden">
        <div className="p-4">
          <TableSkeleton rows={10} cols={7} className="border-0" />
        </div>
      </SkeletonCard>
    </div>
  );
};

export const AdminLPSettingsSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="space-y-2">
          <Skeleton width="200px" height="2.5rem" />
          <Skeleton width="400px" height="1rem" />
        </div>
        <Skeleton width="80px" height="2.5rem" />
      </div>

      {/* Current LP Settings Table */}
      <SkeletonCard className="overflow-hidden">
        <div className="p-6 border-b border-box-border">
           <Skeleton width="200px" height="1.5rem" />
        </div>
        <div className="p-4">
          <TableSkeleton rows={5} cols={8} className="border-0" />
        </div>
      </SkeletonCard>

      {/* Global Update Form */}
      <SkeletonCard className="p-6">
         <Skeleton width="200px" height="1.5rem" className="mb-4" />
         <div className="space-y-4">
            <Skeleton width="100%" height="3rem" />
            <Skeleton width="150px" height="3rem" />
         </div>
      </SkeletonCard>
    </div>
  );
};

export const WalletAssetsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton width="150px" height="2rem" className="mb-2" />
        <Skeleton width="300px" height="1rem" />
      </div>

      <SkeletonCard className="p-6 bg-[#171717] border-[#3f3f46]">
        <div className="mb-4">
          <Skeleton width="150px" height="1rem" className="mb-2" />
          <Skeleton width="250px" height="3.5rem" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg p-4 bg-[#1e1e1e] border border-[#3f3f46]">
              <Skeleton width="100px" height="1rem" className="mb-2" />
              <Skeleton width="150px" height="2rem" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      <SkeletonCard className="overflow-hidden">
        <div className="p-4 border-b border-box-border">
          <Skeleton width="100px" height="1.5rem" className="mb-4" />
          <Skeleton width="100%" height="2.5rem" />
        </div>
        <div className="p-4">
          <TableSkeleton rows={5} cols={8} className="border-0" />
        </div>
      </SkeletonCard>
    </div>
  );
};

export const WalletDepositsWithdrawalsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton width="300px" height="2.5rem" />
          <Skeleton width="250px" height="1rem" />
        </div>
        <Skeleton width="100px" height="2.5rem" />
      </div>

      <SkeletonCard className="p-6">
        <Skeleton width="120px" height="1rem" className="mb-2" />
        <Skeleton width="200px" height="3rem" />
      </SkeletonCard>

      <SkeletonCard className="p-6">
        <Skeleton width="150px" height="1.5rem" className="mb-4" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton width="100%" height="2.5rem" />
              <Skeleton width="100%" height="2.5rem" />
            </div>
            <div className="space-y-3">
              <Skeleton width="100px" height="1rem" />
              <Skeleton width="100%" height="2.5rem" />
              <Skeleton width="100%" height="2.5rem" />
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton width="100%" height="8rem" />
          </div>
        </div>
      </SkeletonCard>

      <SkeletonCard className="overflow-hidden">
        <div className="p-6 border-b border-box-border">
          <Skeleton width="180px" height="1.5rem" />
        </div>
        <div className="p-4">
          <TableSkeleton rows={5} cols={6} className="border-0" />
        </div>
      </SkeletonCard>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} className="p-4">
            <Skeleton width="120px" height="0.8rem" className="mb-1" />
            <Skeleton width="150px" height="1.5rem" />
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
};

export const WalletFeesSlippageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton width="250px" height="2rem" />
        <Skeleton width="400px" height="1rem" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} className="p-4 sm:p-6">
            <Skeleton width="120px" height="1rem" className="mb-2" />
            <Skeleton width="150px" height="2rem" />
          </SkeletonCard>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} className="p-4 sm:p-6">
            <Skeleton width="100px" height="1rem" className="mb-2" />
            <Skeleton width="80px" height="2rem" />
          </SkeletonCard>
        ))}
      </div>

      <SkeletonCard className="p-6">
        <Skeleton width="200px" height="1.5rem" className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton width="150px" height="1.25rem" />
              <Skeleton width="100px" height="2rem" />
              <Skeleton width="180px" height="1rem" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton width="200px" height="1.25rem" />
          <TableSkeleton rows={3} cols={3} className="border-0" />
        </div>
      </SkeletonCard>
    </div>
  );
};

export const AdminWalletSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton width="150px" height="2rem" />
        <Skeleton width="80px" height="2.5rem" />
      </div>

      <SkeletonCard className="p-8">
        <div className="text-center mb-8 space-y-2">
          <Skeleton width="200px" height="2rem" className="mx-auto" />
          <Skeleton width="300px" height="1rem" className="mx-auto" />
        </div>
        <div className="mb-8 p-6 rounded-xl border border-box-border/30">
          <div className="flex flex-col items-center space-y-2">
            <Skeleton width="150px" height="1rem" />
            <Skeleton width="200px" height="3rem" />
          </div>
        </div>
        <div className="max-w-sm mx-auto space-y-5">
          <div className="text-center space-y-2">
            <Skeleton width="150px" height="1.5rem" className="mx-auto" />
            <Skeleton width="200px" height="1rem" className="mx-auto" />
          </div>
          <div className="space-y-3">
            <Skeleton width="100px" height="1rem" />
            <Skeleton width="100%" height="3rem" />
            <Skeleton width="100%" height="3rem" />
          </div>
        </div>
      </SkeletonCard>

      <SkeletonCard className="p-6">
        <Skeleton width="150px" height="1.5rem" className="mb-4" />
        <TableSkeleton rows={5} cols={8} className="border-0" />
      </SkeletonCard>

      <SkeletonCard className="p-6">
        <Skeleton width="250px" height="1.5rem" className="mb-4" />
        <TableSkeleton rows={5} cols={7} className="border-0" />
      </SkeletonCard>
    </div>
  );
};

export const AdminFeesSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton width="200px" height="2rem" />
        <Skeleton width="80px" height="2.5rem" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} className="p-6">
            <Skeleton width="120px" height="1rem" className="mb-2" />
            <Skeleton width="150px" height="2rem" />
          </SkeletonCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonCard className="p-6 h-full">
            <Skeleton width="200px" height="1.5rem" className="mb-4" />
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-4 p-4 border border-box-border rounded-lg">
                  <Skeleton width="150px" height="1.25rem" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton width="100%" height="2.5rem" />
                    <Skeleton width="100%" height="2.5rem" />
                  </div>
                </div>
              ))}
            </div>
          </SkeletonCard>
        </div>
        <div>
          <SkeletonCard className="p-6 h-full">
            <Skeleton width="150px" height="1.5rem" className="mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton width="100px" height="1rem" />
                  <Skeleton width="80px" height="1rem" />
                </div>
              ))}
            </div>
          </SkeletonCard>
        </div>
      </div>
    </div>
  );
};

export const AdminTickersSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton width="200px" height="2rem" />
        <Skeleton width="80px" height="2.5rem" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} className="p-6">
            <Skeleton width="120px" height="1rem" className="mb-2" />
            <Skeleton width="150px" height="2rem" />
          </SkeletonCard>
        ))}
      </div>

      <SkeletonCard className="overflow-hidden">
        <div className="p-4 border-b border-box-border flex justify-between">
          <Skeleton width="200px" height="2rem" />
          <Skeleton width="100px" height="2rem" />
        </div>
        <div className="p-4">
          <TableSkeleton rows={8} cols={6} className="border-0" />
        </div>
      </SkeletonCard>
    </div>
  );
};

export const IssuerProfileSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <SkeletonCard className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton width="64px" height="64px" className="rounded-full" />
          <div className="space-y-2">
            <Skeleton width="200px" height="1.5rem" />
            <Skeleton width="150px" height="1rem" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton width="100px" height="0.8rem" />
              <Skeleton width="120px" height="1.2rem" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      <div className="space-y-4">
        <div className="flex gap-2 border-b border-box-border">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100px" height="2.5rem" />
          ))}
        </div>
        <SkeletonCard className="p-6 h-[400px]">
          <div className="space-y-4">
             <Skeleton width="40%" height="2rem" />
             <Skeleton width="100%" height="1rem" />
             <Skeleton width="100%" height="1rem" />
             <Skeleton width="80%" height="1rem" />
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
};

export const IssuerRequestsListSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton width="200px" height="2rem" />
          <Skeleton width="300px" height="1rem" />
        </div>
        <Skeleton width="150px" height="2.5rem" />
      </div>

      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <Skeleton width="150px" height="1.25rem" />
                <Skeleton width="100px" height="1rem" />
              </div>
              <Skeleton width="80px" height="1.5rem" className="rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Skeleton width="100px" height="1rem" />
              <Skeleton width="100px" height="1rem" />
              <Skeleton width="100px" height="1rem" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
};