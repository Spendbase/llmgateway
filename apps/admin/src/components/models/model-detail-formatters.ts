const tokenPriceFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	minimumFractionDigits: 2,
	maximumFractionDigits: 6,
});

export function formatTokenPrice(price?: number): string {
	if (!price) {
		return "-";
	}
	return tokenPriceFormatter.format(price * 1_000_000);
}

export function formatCharPrice(pricePerChar?: number): string {
	if (!pricePerChar) {
		return "-";
	}
	return `$${(pricePerChar * 1000).toFixed(4)}/1K`;
}

export function formatLatency(ms?: number): string {
	if (!ms) {
		return "-";
	}
	return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

export function formatMaxChars(n?: number): string {
	if (!n) {
		return "-";
	}
	return n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);
}
