import React, { Suspense } from 'react';
import CreatePage from '@/app/create/page';

export default function CreateStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full bg-[#0F0F0F] flex items-center justify-center text-zinc-500 font-mono text-xs">
          Loading Jumby Studio...
        </div>
      }
    >
      <CreatePage />
    </Suspense>
  );
}
