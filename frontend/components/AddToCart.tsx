"use client";

import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/lib/cart";

export default function AddToCart({ variantId, stock }: { variantId: string; stock: number }) {
  const { m } = useI18n();
  const { lines, add } = useCart();
  const inCart = lines.find((l) => l.variant === variantId)?.quantity ?? 0;

  if (stock <= 0) {
    return <Button disabled className="mt-3">{m.common.outOfStock}</Button>;
  }
  const maxed = inCart >= Math.min(stock, 10);
  return (
    <Button className="mt-3" disabled={maxed} onClick={() => add(variantId)}>
      {maxed ? m.product.maxInCart : inCart > 0 ? m.product.inCartAddMore(inCart) : m.product.addToCart}
    </Button>
  );
}