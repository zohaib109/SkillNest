import type * as React from "react";

import { cn } from "@/lib/utils";

function Select({
	className,
	children,
	...props
}: React.ComponentProps<"select">) {
	return (
		<select
			data-slot="select"
			className={cn(
				"h-9 w-full min-w-0 rounded-4xl border border-input bg-card text-foreground px-3 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 md:text-sm [&>option]:bg-card [&>option]:text-foreground",
				className,
			)}
			{...props}
		>
			{children}
		</select>
	);
}

export { Select };
