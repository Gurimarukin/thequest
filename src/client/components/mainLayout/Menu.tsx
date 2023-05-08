import { ChildrenFC } from '../../models/ChildrenFC'

export const Menu: ChildrenFC = ({ children }) => (
  <div className="absolute right-px top-full z-10 flex flex-col items-center gap-3 border border-goldenrod bg-zinc-900 px-5 py-4">
    {children}
  </div>
)
