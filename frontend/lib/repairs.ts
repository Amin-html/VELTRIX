export type RepairEvent = {
  from_status: string;
  to_status: string;
  note: string;
  created_at: string;
};

export type Repair = {
  id: string;
  device: string;
  issue: string;
  phone: string;
  status: string;
  status_display: string;
  quote_amount: string | null;
  quote_note: string;
  created_at: string;
  updated_at: string;
  events: RepairEvent[];
  allowed_statuses: string[];
  can_quote: boolean;
};

export const STATUS_LABEL: Record<string, string> = {
  submitted: "Отправлена",
  accepted: "Принята",
  diagnostics: "Диагностика",
  awaiting_approval: "Ждёт согласования сметы",
  approved: "Смета согласована",
  in_progress: "В работе",
  ready: "Готова к выдаче",
  delivered: "Выдана",
  cancelled: "Отменена",
};

export const ACTION_LABEL: Record<string, string> = {
  accepted: "Принять заявку",
  diagnostics: "Начать диагностику",
  approved: "Согласовать смету",
  in_progress: "Начать ремонт",
  ready: "Готово к выдаче",
  delivered: "Выдано клиенту",
  cancelled: "Отменить заявку",
};

export const formatDate = (iso: string) => new Date(iso).toLocaleString("ru-RU");