/**
 * O desenho do mapa da trilha: cada tópico vira um nó numa linha (o nível) abaixo de todos os seus pré-requisitos, e os nós
 * de um mesmo nível se espalham na largura. Só usa os pré-requisitos que a API manda; nenhuma posição é fixa no app.
 */
export type GraphTopic = { id: string; prerequisites: string[] };

export type GraphNode = {
  id: string;
  /** 0 para quem não tem pré-requisito; senão, um a mais que o pré-requisito mais fundo. */
  level: number;
  /** A posição horizontal do centro do nó, de 0 a 1. */
  x: number;
};

export type GraphEdge = { from: string; to: string };

export type TrailGraph = { nodes: GraphNode[]; edges: GraphEdge[]; levels: number };

export function layoutTrail(topics: GraphTopic[]): TrailGraph {
  const byId = new Map(topics.map((topic) => [topic.id, topic]));
  const levels = new Map<string, number>();

  function levelOf(id: string, path: Set<string>): number {
    const known = levels.get(id);
    if (known !== undefined) {
      return known;
    }
    // Um ciclo ou um pré-requisito desconhecido não deve travar a tela: o validador do conteúdo é quem os impede.
    if (path.has(id)) {
      return 0;
    }
    path.add(id);
    const requisites = (byId.get(id)?.prerequisites ?? []).filter((requisite) =>
      byId.has(requisite),
    );
    const level =
      requisites.length === 0 ? 0 : 1 + Math.max(...requisites.map((r) => levelOf(r, path)));
    path.delete(id);
    levels.set(id, level);
    return level;
  }

  topics.forEach((topic) => levelOf(topic.id, new Set()));

  const rows = new Map<number, string[]>();
  topics.forEach((topic) => {
    const level = levels.get(topic.id) ?? 0;
    rows.set(level, [...(rows.get(level) ?? []), topic.id]);
  });

  const nodes = topics.map((topic) => {
    const level = levels.get(topic.id) ?? 0;
    const row = rows.get(level) ?? [topic.id];
    // Um tópico sozinho no nível alterna de lado a cada nível, para a seta que pula um nível não passar por cima dele.
    const x =
      row.length > 1
        ? (row.indexOf(topic.id) + 1) / (row.length + 1)
        : level === 0
          ? 0.5
          : level % 2 === 1
            ? 0.32
            : 0.68;
    return { id: topic.id, level, x };
  });

  const edges = topics.flatMap((topic) =>
    topic.prerequisites
      .filter((requisite) => byId.has(requisite))
      .map((requisite) => ({ from: requisite, to: topic.id })),
  );

  return { nodes, edges, levels: rows.size };
}
