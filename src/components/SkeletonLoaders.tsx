import { motion } from "framer-motion";

export const ProductCardSkeleton = () => (
  <div className="bg-card rounded-xl border overflow-hidden animate-pulse">
    <div className="aspect-square bg-secondary/60" />
    <div className="p-3.5 space-y-2.5">
      <div className="h-3 bg-secondary/60 rounded w-16" />
      <div className="h-4 bg-secondary/60 rounded w-full" />
      <div className="h-4 bg-secondary/60 rounded w-2/3" />
      <div className="h-5 bg-secondary/60 rounded w-20 mt-3" />
      <div className="h-9 bg-secondary/60 rounded w-full mt-3" />
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export const OrderCardSkeleton = () => (
  <div className="border rounded-xl p-5 bg-card animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full bg-secondary/60" />
        <div className="h-4 bg-secondary/60 rounded w-24" />
      </div>
      <div className="h-5 bg-secondary/60 rounded w-16" />
    </div>
    <div className="h-3 bg-secondary/60 rounded w-full mb-3" />
    <div className="flex justify-between">
      <div className="h-8 bg-secondary/60 rounded w-28" />
      <div className="h-3 bg-secondary/60 rounded w-32" />
    </div>
  </div>
);

export const DashboardStatSkeleton = () => (
  <div className="border rounded-xl p-5 bg-card animate-pulse">
    <div className="w-10 h-10 rounded-xl bg-secondary/60 mb-3" />
    <div className="h-3 bg-secondary/60 rounded w-16 mb-2" />
    <div className="h-7 bg-secondary/60 rounded w-20" />
  </div>
);

export const TableRowSkeleton = () => (
  <tr className="border-t animate-pulse">
    <td className="p-3"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-secondary/60" /><div className="space-y-1.5"><div className="h-4 bg-secondary/60 rounded w-28" /><div className="h-3 bg-secondary/60 rounded w-16" /></div></div></td>
    <td className="p-3"><div className="h-4 bg-secondary/60 rounded w-16" /></td>
    <td className="p-3"><div className="h-4 bg-secondary/60 rounded w-12" /></td>
    <td className="p-3"><div className="h-4 bg-secondary/60 rounded w-20" /></td>
    <td className="p-3"><div className="h-4 bg-secondary/60 rounded w-16 ml-auto" /></td>
  </tr>
);

export const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
  >
    {children}
  </motion.div>
);
