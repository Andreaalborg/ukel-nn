"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

type Item = {
  href?: string;
  label: string;
  icon: string;
  onClick?: () => void;
  danger?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  items: Item[];
};

export default function MoreMenu({ open, onClose, items }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-4 max-h-[80vh] overflow-y-auto"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <div className="w-12 h-1 bg-purple-200 rounded-full mx-auto mb-4" />
            <div className="grid gap-1">
              {items.map((item, i) => {
                const inner = (
                  <>
                    <span className="text-2xl">{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                  </>
                );
                const className = `w-full p-3 rounded-xl flex items-center gap-3 font-bold text-left active:scale-[0.98] transition ${
                  item.danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-purple-900 hover:bg-purple-50"
                }`;
                if (item.href) {
                  return (
                    <Link key={i} href={item.href} onClick={onClose} className={className}>
                      {inner}
                    </Link>
                  );
                }
                return (
                  <button
                    key={i}
                    onClick={() => {
                      item.onClick?.();
                      onClose();
                    }}
                    className={className}
                  >
                    {inner}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
