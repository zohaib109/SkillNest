"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

const MAX_OUTPUT_SIZE = 1_350_000;

async function compressPhoto(file: File) {
	if (!file.type.startsWith("image/")) {
		throw new Error("Choose an image file for your profile photo");
	}
	if (file.size > 8 * 1024 * 1024) {
		throw new Error("Choose an image smaller than 8 MB");
	}

	const sourceUrl = await new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(new Error("We could not read that image"));
		reader.readAsDataURL(file);
	});

	return new Promise<string>((resolve, reject) => {
		const image = new Image();
		image.onload = () => {
			const longestEdge = 640;
			const scale = Math.min(1, longestEdge / Math.max(image.width, image.height));
			const canvas = document.createElement("canvas");
			canvas.width = Math.max(1, Math.round(image.width * scale));
			canvas.height = Math.max(1, Math.round(image.height * scale));
			const context = canvas.getContext("2d");
			if (!context) {
				reject(new Error("We could not prepare that image"));
				return;
			}
			context.drawImage(image, 0, 0, canvas.width, canvas.height);

			let quality = 0.88;
			let result = canvas.toDataURL("image/jpeg", quality);
			while (result.length > MAX_OUTPUT_SIZE && quality > 0.45) {
				quality -= 0.1;
				result = canvas.toDataURL("image/jpeg", quality);
			}
			if (result.length > MAX_OUTPUT_SIZE) {
				reject(new Error("Choose a simpler or smaller image"));
				return;
			}
			resolve(result);
		};
		image.onerror = () => reject(new Error("We could not open that image"));
		image.src = sourceUrl;
	});
}

export function ProfilePhotoPicker({
	value,
	name,
	onChange,
	disabled = false,
}: {
	value: string;
	name: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}) {
	const inputId = useId();
	const [error, setError] = useState("");
	const initial = name.trim().charAt(0).toUpperCase() || "T";

	async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;
		setError("");
		try {
			onChange(await compressPhoto(file));
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Could not use that image");
		} finally {
			event.target.value = "";
		}
	}

	return (
		<div className="flex flex-wrap items-center gap-4">
			<div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-primary/20 bg-primary/10 text-2xl font-bold text-primary">
				{value ? (
					// biome-ignore lint/performance/noImgElement: locally compressed data URLs cannot use Next image optimization
					<img
						src={value}
						alt={`${name || "Tutor"} profile`}
						className="h-full w-full object-cover"
					/>
				) : (
					initial
				)}
			</div>
			<div className="flex min-w-52 flex-col gap-1.5">
				<label
					htmlFor={inputId}
					className={cn(
						"inline-flex w-fit cursor-pointer items-center rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5",
						disabled && "pointer-events-none opacity-50",
					)}
				>
					{value ? "Replace photo" : "Upload photo"}
				</label>
				<input
					id={inputId}
					type="file"
					accept="image/png,image/jpeg,image/webp"
					className="sr-only"
					onChange={handleFileChange}
					disabled={disabled}
				/>
				<p className="text-xs leading-relaxed text-muted-foreground">
					JPG, PNG, or WebP. We resize it for a fast profile page.
				</p>
				{error && <p className="text-xs font-medium text-destructive">{error}</p>}
			</div>
		</div>
	);
}
