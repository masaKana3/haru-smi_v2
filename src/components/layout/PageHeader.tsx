import React from 'react';

type Props = {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
};

export default function PageHeader({ title, onBack, showBackButton = true }: Props) {
  return (
    <div className="sticky top-0 z-20 w-full bg-[#D4829A] text-white shadow-md">
      <div className="relative mx-auto flex h-16 max-w-sm items-center justify-center px-4">
        {showBackButton && onBack && (
          <div className="absolute left-4">
            <button onClick={onBack} className="text-sm transition-opacity hover:opacity-80">
              戻る
            </button>
          </div>
        )}
        <h1 className="text-md font-semibold">{title}</h1>
      </div>
    </div>
  );
}
