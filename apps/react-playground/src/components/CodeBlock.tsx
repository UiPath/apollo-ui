import { useEffect, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export interface CodeBlockProps {
	children: string;
	language?: "tsx" | "javascript" | "json" | "css" | "html";
	showLineNumbers?: boolean;
}

export function CodeBlock({
	children,
	language = "tsx",
	showLineNumbers = true,
}: CodeBlockProps) {
	const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
	const timeoutRef = useRef<number | null>(null);

	const code = children.trim();

	async function copyToClipboard() {
		try {
			if (!navigator.clipboard?.writeText) {
				throw new Error("Clipboard API not supported");
			}

			await navigator.clipboard.writeText(code);
			setStatus("copied");

			timeoutRef.current = window.setTimeout(() => setStatus("idle"), 1500);
		} catch {
			setStatus("error");
			timeoutRef.current = window.setTimeout(() => setStatus("idle"), 1500);
			console.error("Failed to copy code to clipboard");
		}
	}

	useEffect(() => {
		return () => {
			if (timeoutRef.current !== null) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	const label =
		status === "copied" ? "Copied!" : status === "error" ? "Error" : "Copy";

	return (
		<div style={{ position: "relative" }}>
			<button
				type="button"
				onClick={copyToClipboard}
				style={{
					position: "absolute",
					top: 14,
					right: 14,
					padding: "4px 8px",
					fontSize: 12,
					cursor: "pointer",
					borderRadius: 4,
					border: "none",
					background:
						status === "copied"
							? "#22c55e"
							: status === "error"
								? "#ef4444"
								: "#374151",
					color: "#fff",
				}}
			>
				{label}
			</button>

			<SyntaxHighlighter
				language={language}
				style={coldarkDark}
				showLineNumbers={showLineNumbers}
				customStyle={{
					borderRadius: 8,
					fontSize: 14,
					margin: 0,
				}}
			>
				{code}
			</SyntaxHighlighter>
		</div>
	);
}
