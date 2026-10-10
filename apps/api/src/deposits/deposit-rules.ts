export const INR_OFFERS = { Payment: [465, 485, 487], VIP: [24000, 42000] } as const;

export function validateDepositAmount(
  currency: "INR" | "USDT",
  amount: number,
  offerKind?: "Payment" | "VIP",
) {
  if (currency === "INR") {
    const offers = offerKind ? INR_OFFERS[offerKind] : [];
    return offers.includes(amount as never);
  }
  return amount >= 1 && amount <= 10_000;
}
