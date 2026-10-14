export type TradeIn = {
  id: string;
  device: string;
  condition: string;
  condition_display: string;
  description: string;
  phone: string;
  status: string;
  status_display: string;
  offer_amount: string | null;
  offer_note: string;
  created_at: string;
  allowed_actions: string[];
};

export const TRADE_STATUS: Record<string, string> = {
  submitted: "Отправлена",
  offered: "Есть предложение",
  accepted: "Предложение принято",
  declined: "Отклонена",
  completed: "Завершена",
  cancelled: "Отменена",
};

export const RESPONSE_LABEL: Record<string, string> = {
  accepted: "Принять предложение",
  declined: "Отклонить предложение",
  cancelled: "Отменить заявку",
};

export const CONDITION_OPTIONS = [
  { value: "excellent", label: "Отличное" },
  { value: "good", label: "Хорошее" },
  { value: "fair", label: "Удовлетворительное" },
  { value: "broken", label: "Неисправное" },
];