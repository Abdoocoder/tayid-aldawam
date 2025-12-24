import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div className="relative group">
                <select
                    className={cn(
                        "flex h-10 w-full appearance-none rounded-xl border border-white/20 bg-white px-3 py-2 text-sm font-bold text-slate-900 shadow-sm ring-offset-background transition-all hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 cursor-pointer",
                        className
                    )}
                    ref={ref}
                    {...props}
                >
                    {children}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                    <ChevronDown className="h-4 w-4" />
                </div>
            </div>
        )
    }
)
Select.displayName = "Select"

export { Select }
