import type { MessageEntry } from '../types/mqtt';
export type HistoryFilter = 'Todas' | 'Recebidas' | 'Enviadas' | 'Inválidas';
export function filterMessages(messages: MessageEntry[], filter: HistoryFilter, query: string): MessageEntry[] {
  const search = query.trim().toLocaleLowerCase('pt-BR');
  return messages.filter(message => {
    const direction = filter === 'Todas' || (filter === 'Inválidas' && !message.valid)
      || (filter === 'Recebidas' && message.direction === 'recebida')
      || (filter === 'Enviadas' && message.direction === 'enviada');
    return direction && (!search || (message.topic + ' ' + message.payload).toLocaleLowerCase('pt-BR').includes(search));
  });
}
export function prettyPayload(payload: string): string {
  try { return JSON.stringify(JSON.parse(payload), null, 2); } catch { return payload || '(payload vazio)'; }
}
