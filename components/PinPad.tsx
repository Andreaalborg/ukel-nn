"use client";

import { useEffect, useState } from "react";

type Props = {
  length?: number;
  onComplete: (pin: string) => void;
  error?: string | null;
  reset?: number;
};

export default function PinPad({ length = 4, onComplete, error, reset }: Props) {
  const [pin, setPin] = useState("");

  useEffect(() => {
    setPin("");
  }, [reset]);

  useEffect(() => {
    if (pin.length === length) {
      onComplete(pin);
    }
  }, [pin, length, onComplete]);

  const press = (digit: string) => {
    if (pin.length >= length) return;
    setPin((p) => p + digit);
  };

  const back = () => setPin((p) => p.slice(0, -1));

  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="flex justify-center gap-3 mb-6">
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all ${
              error
                ? "bg-red-500 animate-wiggle"
                : i < pin.length
                ? "bg-purple-600 scale-110"
                : "bg-purple-200"
            }`}
          />
        ))}
      </div>
      {error && <p className="text-center text-red-600 font-semibold mb-3">{error}</p>}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => press(String(n))}
            className="aspect-square rounded-2xl bg-white text-3xl font-bold text-purple-900 shadow-md active:scale-95 transition-transform hover:bg-purple-50"
          >
            {n}
          </button>
        ))}
        <div />
        <button
          type="button"
          onClick={() => press("0")}
          className="aspect-square rounded-2xl bg-white text-3xl font-bold text-purple-900 shadow-md active:scale-95 transition-transform hover:bg-purple-50"
        >
          0
        </button>
        <button
          type="button"
          onClick={back}
          className="aspect-square rounded-2xl bg-purple-100 text-2xl font-bold text-purple-900 shadow-md active:scale-95"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
