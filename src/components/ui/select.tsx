import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps
    extends React.SelectHTMLAttributes<HTMLSelectElement> { }

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, ...props }, ref) => {
        return (
            <div className="relative">
                <select
                    className={cn(
                        "flex h-10 w-full appearance-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {/* Chevron Icon can be added via CSS or SVG here, but Appearance-none hides default. 
            For now, let's keep default appearance or use a background image for chevron.
            Actually, keep simple native for now to guarantee functionality.
            I will remove 'appearance-none' if I don't provide a replacement icon.
        */}
            </div>
        )
    }
)
Select.displayName = "Select"

export { Select }
