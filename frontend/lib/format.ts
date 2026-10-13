export const CONDITIONS: Record<string, string> = {
  new: "Новый",
  like_new: "Как новый",
  good: "Хорошее",
  used: "Б/у",
};

export const formatPrice = (value: string | number) =>
  `${new Intl.NumberFormat("ru-RU").format(Number(value))} сом`;