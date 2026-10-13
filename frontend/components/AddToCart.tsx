"use client";

import { Button } from "@/components/ui/Button";
import { useCart } from "@/lib/cart";

export default function AddToCart({ variantId, stock }: { variantId: string; stock: number }) {
  const { lines, add } = useCart();
  const inCart = lines.find((l) => l.variant === variantId)?.quantity ?? 0;

  if (stock <= 0) {
    return <Button disabled className="mt-3">Нет в наличии</Button>;
  }
  const maxed = inCart >= Math.min(stock, 10);
  return (
    <Button className="mt-3" disabled={maxed} onClick={() => add(variantId)}>
      {maxed ? "Максимум в корзине" : inCart > 0 ? `В корзине: ${inCart} · добавить ещё` : "В корзину"}
    </Button>
  );
}