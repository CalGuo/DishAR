export function formatPrice(amount: number, currency: string): string {
  const code = (currency || "USD").trim().toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).format(amount);
  } catch {
    // Unknown/unparseable currency code -> fall back to plain dollars.
    return `$${amount.toFixed(2)}`;
  }
}