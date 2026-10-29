import { TicketPriority } from './ticket-priority';

/**
 * Recorte de chamados aceito pelas estatísticas (GET /tickets/stats/overview, /times e /volume) e
 * pela listagem (GET /tickets): setores, prioridade, responsável e períodos (specs 025 e 026 do
 * back-end). Datas são locais `aaaa-mm-dd` de `America/Sao_Paulo`, intervalo inclusivo — o
 * back-end converte pra UTC.
 */
export interface TicketStatsQuery {
  /** Setores aceitos (vazio ou ausente = todos). Vai como `sectorId` repetido. */
  sectorIds?: string[];
  /** Uma prioridade só. */
  priority?: TicketPriority;
  /** Só chamados com este responsável; exclusivo com `unassignedOnly`. */
  assignedToUserId?: string;
  /** Só chamados sem responsável. */
  unassignedOnly?: boolean;
  /** Abertos a partir deste dia. */
  createdFrom?: string;
  /** Abertos até este dia. */
  createdTo?: string;
  /** Resolvidos (primeira resolução, ou a conclusão nos tempos médios) a partir deste dia. */
  resolvedFrom?: string;
  /** Resolvidos até este dia. */
  resolvedTo?: string;
}
