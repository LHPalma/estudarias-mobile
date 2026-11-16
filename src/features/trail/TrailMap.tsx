import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import type { Trail, TrailTopic } from '@/api';
import { AppText, Button, Icon } from '@/components';
import { joinNames, shownScore } from '@/lib/format';
import { layoutTrail } from '@/lib/trail-graph';
import { colors, fonts, radius, spacing } from '@/theme';

const NODE = 64;
const ROW = 140;
/** A altura do nó com o nome embaixo: a seta sai de baixo do nome, não do círculo. */
const NODE_BLOCK = NODE + 40;
const LABEL_WIDTH = 112;

const STATUS_LABEL = {
  mastered: 'Dominado',
  available: 'Disponível',
  locked: 'Bloqueado',
} as const;

type Props = { trail: Trail; width: number; onOpenTopic: (topicId: string) => void };

/**
 * O mapa da trilha: os tópicos como nós, ligados pelas setas de pré-requisito. Tocar num nó mostra o painel com o que ele
 * exige e o que libera. As posições saem dos pré-requisitos que a API manda.
 */
export function TrailMap({ trail, width, onOpenTopic }: Props) {
  const graph = layoutTrail(trail.topics);
  const byId = new Map(trail.topics.map((topic) => [topic.id, topic]));
  const firstOpen = trail.topics.find((topic) => topic.status === 'available') ?? trail.topics[0];
  const [selectedId, setSelectedId] = useState(firstOpen?.id);
  const selected = selectedId ? byId.get(selectedId) : undefined;

  const position = (id: string) => {
    const node = graph.nodes.find((candidate) => candidate.id === id);
    return { x: (node?.x ?? 0.5) * width, top: (node?.level ?? 0) * ROW };
  };
  const height = graph.levels * ROW;

  return (
    <View style={styles.root}>
      <View style={{ width, height }}>
        <Svg
          width={width}
          height={height}
          style={StyleSheet.absoluteFill}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {graph.edges.map((edge) => {
            // A seta sai de baixo do nome do pré-requisito e chega em cima do nó que ele libera; fica tracejada enquanto o
            // pré-requisito não foi dominado.
            const from = position(edge.from);
            const to = position(edge.to);
            return (
              <Line
                key={`${edge.from}-${edge.to}`}
                x1={from.x}
                y1={from.top + NODE_BLOCK}
                x2={to.x}
                y2={to.top - 4}
                stroke={colors.inkMuted}
                strokeWidth={2}
                strokeDasharray={byId.get(edge.from)?.status === 'mastered' ? undefined : '6 6'}
              />
            );
          })}
        </Svg>

        {graph.nodes.map((node) => {
          const topic = byId.get(node.id);
          if (!topic) {
            return null;
          }
          const isSelected = node.id === selectedId;
          return (
            <Pressable
              key={node.id}
              accessibilityRole="button"
              accessibilityLabel={`${topic.name}, ${STATUS_LABEL[topic.status].toLowerCase()}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => setSelectedId(node.id)}
              style={[
                styles.node,
                { left: node.x * width - LABEL_WIDTH / 2, top: node.level * ROW },
              ]}
            >
              <View style={[styles.ring, isSelected && styles.ringSelected]}>
                <View style={[styles.dot, dotStyle(topic)]}>
                  <NodeGlyph topic={topic} index={trail.topics.indexOf(topic) + 1} />
                </View>
              </View>
              <AppText variant="label" style={styles.nodeLabel} numberOfLines={2}>
                {topic.name}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {selected ? (
        <View style={styles.panel}>
          <AppText variant="overline" color={STATUS_COLOR[selected.status]}>
            {STATUS_LABEL[selected.status]}
            {selected.score !== null ? ` · nota ${shownScore(selected.score)}` : ''}
          </AppText>
          <AppText variant="title" accessibilityRole="header">
            {selected.name}
          </AppText>
          <View style={styles.facts}>
            <View style={styles.fact}>
              <AppText variant="support" color="inkSoft">
                Exige
              </AppText>
              <AppText variant="label">
                {selected.prerequisites.length > 0
                  ? joinNames(selected.prerequisites.map((id) => byId.get(id)?.name ?? ''))
                  : 'Nada: é o começo'}
              </AppText>
            </View>
            <View style={styles.fact}>
              <AppText variant="support" color="inkSoft">
                Libera
              </AppText>
              <AppText variant="label">{unlocksOf(selected, trail.topics)}</AppText>
            </View>
          </View>
          <Button label="Abrir tópico" onPress={() => onOpenTopic(selected.id)} />
        </View>
      ) : null}
    </View>
  );
}

function unlocksOf(topic: TrailTopic, topics: TrailTopic[]): string {
  const unlocked = topics.filter((other) => other.prerequisites.includes(topic.id));
  return unlocked.length > 0 ? joinNames(unlocked.map((other) => other.name)) : 'Fim da trilha';
}

const STATUS_COLOR = {
  mastered: 'masteredInk',
  available: 'progress',
  locked: 'inkMuted',
} as const;

function dotStyle(topic: TrailTopic) {
  if (topic.status === 'mastered') {
    return { backgroundColor: colors.mastered };
  }
  if (topic.status === 'available') {
    return { backgroundColor: colors.progress };
  }
  return {
    backgroundColor: colors.inkBody,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: colors.inkMuted,
  };
}

function NodeGlyph({ topic, index }: { topic: TrailTopic; index: number }) {
  if (topic.status === 'mastered') {
    return <Icon name="check" size={26} color={colors.onStrong} strokeWidth={2.6} />;
  }
  if (topic.status === 'available') {
    return <AppText style={styles.nodeNumber}>{index}</AppText>;
  }
  return <Icon name="lock" size={22} color={colors.lineStrong} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between', gap: spacing.xl },
  node: { position: 'absolute', width: LABEL_WIDTH, alignItems: 'center', gap: spacing.xs },
  ring: { padding: 4, borderRadius: NODE / 2 + 6, borderWidth: 2, borderColor: 'transparent' },
  ringSelected: { borderColor: colors.paper },
  dot: {
    width: NODE - 8,
    height: NODE - 8,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeNumber: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26, color: colors.onStrong },
  nodeLabel: { color: colors.paper, textAlign: 'center', fontSize: 13, lineHeight: 16 },
  panel: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: radius.xl + 2,
    borderTopRightRadius: radius.xl + 2,
    padding: spacing.xl,
    gap: spacing.sm + 2,
  },
  facts: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xs },
  fact: { flex: 1, gap: 2 },
});
