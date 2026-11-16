import type { Difficulty } from '../types';

/**
 * O conteúdo do modo mock: a trilha da v1 com Frações completa (as duas lições e os quatro exercícios do protótipo) e um
 * pouco dos outros tópicos. Usa a marcação de frações (`{1/2}`), como o conteúdo do back.
 */

export type MockErrorType = {
  name: string;
  feedback: string;
  card: { question: string; answer: string };
};

export type MockAlternative = { id: string; text: string; errorType?: string };

export type MockExercise = {
  id: string;
  statement: string;
  difficulty: Difficulty;
  correct: string;
  alternatives: MockAlternative[];
};

export type MockLesson = {
  id: string;
  order: number;
  title: string;
  content: string;
  exercises: MockExercise[];
};

export type MockTopic = {
  id: string;
  slug: string;
  name: string;
  prerequisites: string[];
  lessons: MockLesson[];
};

const id = (table: number, row: number) =>
  `0192f0c4-${table.toString(16).padStart(4, '0')}-7000-8000-${row.toString().padStart(12, '0')}`;

export const TOPIC_ID = {
  basics: id(1, 1),
  fractions: id(1, 2),
  equations: id(1, 3),
  percentage: id(1, 4),
};

export const ERROR_TYPES: Record<string, MockErrorType> = {
  soma_direta: {
    name: 'Soma de numeradores e denominadores',
    feedback:
      'Só os numeradores se somam. Antes, as duas frações precisam ter o mesmo denominador: ache o denominador comum, converta e só então some os numeradores.',
    card: {
      question: 'Por que {1/2} + {1/3} não é {2/5}?',
      answer:
        'Só se somam numeradores com o mesmo denominador: {1/2} + {1/3} = {3/6} + {2/6} = {5/6}.',
    },
  },
  multiplica: {
    name: 'Multiplicou em vez de somar',
    feedback:
      'Multiplicar frações é outra operação. Para somar, deixe os denominadores iguais e some só os numeradores.',
    card: {
      question: 'Qual a diferença entre {1/2} + {1/4} e {1/2} × {1/4}?',
      answer: 'Somar: {2/4} + {1/4} = {3/4}. Multiplicar: {1/2} × {1/4} = {1/8}.',
    },
  },
  nao_converte: {
    name: 'Trocou o denominador sem converter o numerador',
    feedback:
      'Ao mudar o denominador, multiplique o numerador pelo mesmo número. Senão a fração muda de valor.',
    card: {
      question: 'Como escrever {1/2} com denominador 4?',
      answer: 'Multiplique em cima e embaixo por 2: {1/2} = {2/4}.',
    },
  },
  esquece_vai_um: {
    name: 'Esqueceu o "vai um"',
    feedback:
      'Quando a soma de uma coluna passa de 9, a dezena vai para a coluna da esquerda e entra na soma dela.',
    card: {
      question: 'Quanto é 48 + 37, e onde entra o "vai um"?',
      answer: '8 + 7 = 15: fica o 5 e vai 1 para as dezenas. 4 + 3 + 1 = 8. Resultado: 85.',
    },
  },
  operacao_inversa: {
    name: 'Usou a mesma operação em vez da inversa',
    feedback:
      'Para isolar o x, desfaça a operação com a inversa: o que está somando passa subtraindo, e vice-versa.',
    card: {
      question: 'Em x + 3 = 7, por que x não é 10?',
      answer: 'O 3 está somando ao x; para isolar o x, subtraia 3 dos dois lados: x = 7 − 3 = 4.',
    },
  },
  confunde_porcento: {
    name: 'Tratou a porcentagem como número inteiro',
    feedback: 'Porcentagem é uma fração de 100: 10% é {10/100}, e 10% de 50 é {10/100} × 50.',
    card: {
      question: 'Quanto é 10% de 50?',
      answer: '10% é {10/100} = {1/10}. Um décimo de 50 é 5.',
    },
  },
};

export const TOPICS: MockTopic[] = [
  {
    id: TOPIC_ID.basics,
    slug: 'operacoes-basicas',
    name: 'Operações básicas',
    prerequisites: [],
    lessons: [
      {
        id: id(3, 1),
        order: 1,
        title: 'Adição com reserva',
        content:
          'Some coluna por coluna, da direita para a esquerda. Quando uma coluna passa de 9, escreva as unidades e leve a dezena para a coluna seguinte: é o "vai um".',
        exercises: [
          {
            id: id(4, 1),
            statement: 'Quanto é 48 + 37?',
            difficulty: 'easy',
            correct: id(5, 2),
            alternatives: [
              { id: id(5, 1), text: '75', errorType: 'esquece_vai_um' },
              { id: id(5, 2), text: '85' },
              { id: id(5, 3), text: '715', errorType: 'esquece_vai_um' },
              { id: id(5, 4), text: '84', errorType: 'esquece_vai_um' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: TOPIC_ID.fractions,
    slug: 'fracoes',
    name: 'Frações',
    prerequisites: [TOPIC_ID.basics],
    lessons: [
      {
        id: id(3, 2),
        order: 1,
        title: 'Soma com denominadores iguais',
        content:
          'Quando os denominadores são iguais, as partes têm o mesmo tamanho. Some só os numeradores e mantenha o denominador.\n\n{1/5} + {2/5} = {3/5}\n\nO denominador diz em quantas partes o inteiro foi dividido. Somar não muda isso.',
        exercises: [
          {
            id: id(4, 2),
            statement: 'Quanto é {1/4} + {2/4}?',
            difficulty: 'easy',
            correct: id(5, 7),
            alternatives: [
              { id: id(5, 5), text: '{3/8}', errorType: 'soma_direta' },
              { id: id(5, 6), text: '{2/16}', errorType: 'multiplica' },
              { id: id(5, 7), text: '{3/4}' },
              { id: id(5, 8), text: '{3/16}', errorType: 'multiplica' },
            ],
          },
        ],
      },
      {
        id: id(3, 3),
        order: 2,
        title: 'Soma com denominadores diferentes',
        content:
          'Frações com denominadores diferentes falam de partes de tamanhos diferentes. Antes de somar, reescreva as duas com o mesmo denominador.\n\nO menor denominador comum de 2 e 3 é 6: {1/2} = {3/6} e {1/3} = {2/6}.\n\nAgora sim, some os numeradores: {3/6} + {2/6} = {5/6}.',
        exercises: [
          {
            id: id(4, 3),
            statement: 'Quanto é {1/2} + {1/3}?',
            difficulty: 'easy',
            correct: id(5, 10),
            alternatives: [
              { id: id(5, 9), text: '{2/5}', errorType: 'soma_direta' },
              { id: id(5, 10), text: '{5/6}' },
              { id: id(5, 11), text: '{2/6}', errorType: 'nao_converte' },
              { id: id(5, 12), text: '{1/6}', errorType: 'multiplica' },
            ],
          },
          {
            id: id(4, 4),
            statement: 'Quanto é {2/3} + {1/6}?',
            difficulty: 'medium',
            correct: id(5, 15),
            alternatives: [
              { id: id(5, 13), text: '{3/9}', errorType: 'soma_direta' },
              { id: id(5, 14), text: '{3/6}', errorType: 'nao_converte' },
              { id: id(5, 15), text: '{5/6}' },
              { id: id(5, 16), text: '{2/18}', errorType: 'multiplica' },
            ],
          },
          {
            id: id(4, 5),
            statement: 'Quanto é {3/4} + {1/6}?',
            difficulty: 'hard',
            correct: id(5, 20),
            alternatives: [
              { id: id(5, 17), text: '{4/10}', errorType: 'soma_direta' },
              { id: id(5, 18), text: '{4/12}', errorType: 'nao_converte' },
              { id: id(5, 19), text: '{3/24}', errorType: 'multiplica' },
              { id: id(5, 20), text: '{11/12}' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: TOPIC_ID.equations,
    slug: 'equacoes-1-grau',
    name: 'Equações do 1º grau',
    prerequisites: [TOPIC_ID.fractions],
    lessons: [
      {
        id: id(3, 4),
        order: 1,
        title: 'Equações com uma operação',
        content:
          'Resolver uma equação é descobrir o valor que torna a igualdade verdadeira. Para isolar o x, desfaça a operação com a inversa, nos dois lados.\n\nx + 3 = 7 → x = 7 − 3 → x = 4',
        exercises: [
          {
            id: id(4, 6),
            statement: 'Quanto vale x em x + 3 = 7?',
            difficulty: 'easy',
            correct: id(5, 21),
            alternatives: [
              { id: id(5, 21), text: '4' },
              { id: id(5, 22), text: '10', errorType: 'operacao_inversa' },
              { id: id(5, 23), text: '21', errorType: 'operacao_inversa' },
              { id: id(5, 24), text: '-4', errorType: 'operacao_inversa' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: TOPIC_ID.percentage,
    slug: 'porcentagem',
    name: 'Porcentagem',
    prerequisites: [TOPIC_ID.fractions, TOPIC_ID.equations],
    lessons: [
      {
        id: id(3, 5),
        order: 1,
        title: 'Porcentagem de um valor',
        content:
          'Porcentagem é uma fração de 100: 25% é {25/100}. Para achar 25% de um valor, multiplique o valor por {25/100}.',
        exercises: [
          {
            id: id(4, 7),
            statement: 'Quanto é 10% de 50?',
            difficulty: 'easy',
            correct: id(5, 26),
            alternatives: [
              { id: id(5, 25), text: '10', errorType: 'confunde_porcento' },
              { id: id(5, 26), text: '5' },
              { id: id(5, 27), text: '500', errorType: 'confunde_porcento' },
              { id: id(5, 28), text: '40', errorType: 'confunde_porcento' },
            ],
          },
        ],
      },
    ],
  },
];

/** Os cartões manuais com que o aluno do mock já começa, vencidos, para a aba Revisão ter o que mostrar. */
export const MANUAL_CARDS = [
  {
    topicId: TOPIC_ID.basics,
    question: 'Quanto é 7 × 8?',
    answer: '56. Dica: 7 × 8 = 7 × 4 × 2 = 28 × 2.',
  },
];

export const mockId = id;
