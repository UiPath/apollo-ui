export function Components() {
	return (
		<div
			style={{
				padding: "60px 20px",
				maxWidth: "800px",
				margin: "0 auto",
				minHeight: "calc(100vh - 80px)",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				textAlign: "center",
			}}
		>
			<div style={{ fontSize: "120px", marginBottom: "32px" }}>🚧</div>

			<h1
				style={{
					fontSize: "48px",
					marginBottom: "24px",
					color: "var(--color-foreground)",
				}}
			>
				Components Library
			</h1>

			<p
				style={{
					fontSize: "24px",
					color: "var(--color-background-de-emp)",
					marginBottom: "48px",
				}}
			>
				Coming Soon
			</p>

			<div
				style={{
					background: "var(--color-background-subtle)",
					borderRadius: "12px",
					padding: "32px",
					maxWidth: "600px",
				}}
			>
				<p
					style={{
						fontSize: "16px",
						color: "var(--color-foreground-de-em)",
						lineHeight: "1.6",
						margin: 0,
					}}
				>
					The Apollo React component library is currently under construction.
					Check back soon to explore our growing collection of accessible,
					themeable components built with the Apollo design system.
				</p>
			</div>
		</div>
	);
}
