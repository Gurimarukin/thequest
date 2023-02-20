import React from 'react'

export const Menu: React.FC = ({ children }) => (
  <div className="absolute right-[1px] top-full z-10 flex flex-col items-center gap-3 border border-goldenrod bg-zinc-900 px-5 py-4">
    {children}
  </div>
)
