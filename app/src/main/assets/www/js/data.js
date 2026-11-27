/* Biblioteca de exercícios e plano padrão (Toji Fushiguro – Anime Physique Files #005). */
(function (root) {
  'use strict';

  // load: 'load' = carga obrigatória | 'bw' = peso corporal (+ carga opcional) | 'none' = sem carga
  // type: 'reps' | 'max' (reps máximas) | 'time' (segundos) | 'distance' (metros) | 'interval'
  const EXERCISES = {
    agachamento: {
      name: 'Agachamento livre (barra)', gifs: ['agachamento'], load: 'load', muscles: 'Quadríceps, glúteos, core',
      cues: [
        'Barra apoiada no trapézio, pés na largura dos ombros e levemente abertos.',
        'Inspire e trave o abdômen antes de descer (bracing).',
        'Desça até a coxa ficar paralela ou abaixo, joelhos na direção dos pés.',
        'Suba empurrando o chão, mantendo o peito aberto e a coluna neutra.',
      ],
      safety: 'Use as travas de segurança do rack nas séries pesadas.',
    },
    leg_press: {
      name: 'Leg press', gifs: ['leg_press'], load: 'load', muscles: 'Quadríceps, glúteos',
      cues: [
        'Lombar e quadril sempre colados no encosto.',
        'Desça até ~90° de joelho sem o quadril sair do banco.',
        'Empurre com o pé inteiro; não trave os joelhos no topo.',
      ],
      safety: 'Mantenha as travas laterais até se posicionar.',
    },
    remada_cabo: {
      name: 'Remada sentada no cabo', gifs: ['remada_cabo'], load: 'load', muscles: 'Dorsais, romboides, bíceps',
      cues: [
        'Joelhos levemente flexionados, coluna neutra.',
        'Puxe o puxador até o umbigo levando os cotovelos para trás.',
        'Aperte as escápulas no fim e volte controlando.',
      ],
    },
    afundo: {
      name: 'Afundo andando', gifs: ['afundo'], load: 'load', perSide: true, muscles: 'Quadríceps, glúteos',
      cues: [
        'Passo longo à frente, tronco alto.',
        'Desça até o joelho de trás quase tocar o chão.',
        'Empurre com o calcanhar da frente e já dê o próximo passo.',
      ],
    },
    barra_fixa: {
      name: 'Barra fixa', gifs: ['barra_fixa'], load: 'bw', type: 'max', muscles: 'Dorsais, bíceps, antebraços',
      cues: [
        'Pegada pronada um pouco mais aberta que os ombros.',
        'Comece com os braços estendidos, escápulas para baixo.',
        'Suba até o queixo passar a barra, sem balanço.',
        'Sem conseguir? Use o graviton e registre a assistência como carga negativa (ex.: -20).',
      ],
    },
    puxada_alta: {
      name: 'Puxada alta', gifs: ['puxada_alta'], load: 'load', muscles: 'Dorsais, bíceps',
      cues: [
        'Coxas presas no apoio, tronco levemente inclinado para trás.',
        'Puxe a barra até a parte alta do peito.',
        'Cotovelos apontam para baixo; volte controlando.',
      ],
    },
    paralelas: {
      name: 'Paralelas (dips)', gifs: ['paralelas'], load: 'bw', muscles: 'Peitoral inferior, tríceps, ombros',
      cues: [
        'Braços estendidos, ombros longe das orelhas.',
        'Incline o tronco à frente e desça até ~90° de cotovelo.',
        'Suba sem travar bruscamente os cotovelos.',
      ],
      safety: 'Se sentir o ombro, reduza a amplitude.',
    },
    rosca_direta: {
      name: 'Rosca direta', gifs: ['rosca_direta'], load: 'load', muscles: 'Bíceps',
      cues: [
        'Cotovelos colados ao corpo, sem balançar o tronco.',
        'Suba até a contração total e desça em ~2 s.',
        'Pode fazer em bi-set com o tríceps corda.',
      ],
    },
    triceps_corda: {
      name: 'Tríceps corda', gifs: ['triceps_corda'], load: 'load', muscles: 'Tríceps',
      cues: [
        'Cotovelos fixos ao lado do corpo.',
        'Estenda até o fim abrindo a corda para os lados.',
        'Volte até ~90° sem deixar os cotovelos subirem.',
      ],
    },
    terra_trap: {
      name: 'Levantamento terra com trap bar', gifs: ['terra_trap'], load: 'load', muscles: 'Posterior, glúteos, quadríceps, costas',
      cues: [
        'Fique no centro da barra, pés na largura do quadril.',
        'Quadril para trás, peito alto, coluna neutra, braços estendidos.',
        'Empurre o chão e estenda quadril e joelhos juntos.',
        'Desça controlando pelo mesmo caminho.',
      ],
      safety: 'Coluna neutra sempre; pare a série se arredondar.',
    },
    bulgaro: {
      name: 'Agachamento búlgaro com barra', gifs: ['bulgaro'], load: 'load', perSide: true, muscles: 'Quadríceps, glúteos',
      cues: [
        'Peito do pé de trás apoiado no banco.',
        'Desça na vertical até a coxa da frente ficar paralela.',
        'Joelho da frente alinhado com o pé.',
      ],
      safety: 'Comece leve ou com halteres até dominar o equilíbrio.',
    },
    salto_grupado: {
      name: 'Salto grupado ou no caixote', gifs: ['salto_grupado', 'salto_caixote'], load: 'none', muscles: 'Potência de pernas',
      cues: [
        'Agache rápido e salte o mais alto possível.',
        'Grupado: leve os joelhos ao peito. Caixote: aterrisse suave em cima.',
        'Descanso completo: qualidade > cansaço.',
      ],
      safety: 'Aterrisse com joelhos flexionados e alinhados; desça do caixote andando.',
    },
    salto_caixote: {
      name: 'Salto no caixote', gifs: ['salto_caixote'], load: 'none', muscles: 'Potência de pernas',
      cues: [
        'Braços para trás, agache e exploda.',
        'Aterrisse suave, com o pé inteiro no caixote.',
        'Desça andando, não saltando para trás.',
      ],
    },
    desenvolvimento: {
      name: 'Desenvolvimento sentado com barra', gifs: ['desenvolvimento'], load: 'load', muscles: 'Deltoides, tríceps',
      cues: [
        'Costas no encosto, abdômen firme.',
        'Barra parte da altura do queixo/clavícula.',
        'Empurre para cima até estender os braços sem arquear a lombar.',
      ],
    },
    elevacao_lateral: {
      name: 'Elevação lateral sentado', gifs: ['elevacao_lateral'], load: 'load', muscles: 'Deltoide lateral',
      cues: [
        'Sentado, tronco reto, cotovelos levemente flexionados.',
        'Eleve até a altura dos ombros, conduzindo pelos cotovelos.',
        'Desça devagar; sem impulso.',
      ],
    },
    supino_ponte: {
      name: 'Supino c/ halteres no chão em ponte de glúteo', gifs: ['supino_ponte'], load: 'load', muscles: 'Peitoral, tríceps, glúteos',
      cues: [
        'Deitado, pés apoiados e quadril elevado (ponte) o tempo todo.',
        'Desça até o cotovelo tocar o chão.',
        'Empurre os halteres até estender os braços sobre o peito.',
      ],
    },
    prancha: {
      name: 'Prancha', gifs: ['prancha'], load: 'none', type: 'time', muscles: 'Core',
      cues: [
        'Cotovelos sob os ombros, corpo em linha reta.',
        'Contraia glúteos e abdômen; não deixe o quadril cair.',
        'Respire normalmente.',
      ],
    },
    abdominal_infra: {
      name: 'Abdominal infra', gifs: ['abdominal_infra'], load: 'none', muscles: 'Reto abdominal (porção inferior)',
      cues: [
        'Deitado, mãos ao lado do corpo, lombar no chão.',
        'Eleve as pernas e tire levemente o quadril do chão no final.',
        'Desça devagar sem encostar os pés no chão.',
      ],
    },
    farmer: {
      name: "Farmer's carry", gifs: ['farmer'], load: 'load', type: 'distance', muscles: 'Pegada, trapézio, core',
      cues: [
        'Halteres/kettlebells pesados, um em cada mão.',
        'Ombros para trás e para baixo, tronco alto.',
        'Passos curtos e firmes; não deixe o corpo pender.',
      ],
    },
    esteira: {
      name: 'Tiro na esteira', gifs: ['esteira'], load: 'none', type: 'interval', muscles: 'Condicionamento',
      cues: [
        '20 s forte / 40 s leve, 6 vezes.',
        'No forte, velocidade que você só aguenta por ~20 s.',
        'Use o cronômetro de intervalos do app (bipa nas trocas).',
      ],
      safety: 'Segure no apoio ao trocar a velocidade; use a trava de segurança.',
    },
    burpee: {
      name: 'Burpee ou flexão', gifs: ['burpee', 'flexao'], load: 'none', muscles: 'Corpo todo',
      cues: [
        'Burpee: agache, mãos no chão, pés para trás, volte e salte.',
        'Flexão: corpo em linha, peito quase no chão, cotovelos ~45°.',
        'Escolha a versão que mantém a técnica limpa.',
      ],
    },
    barra_carga: {
      name: 'Barra fixa com carga (desafio)', gifs: ['barra_carga'], load: 'bw', type: 'max', muscles: 'Dorsais, bíceps',
      cues: [
        'Aqueça bem: 2–3 séries leves de barra.',
        'Carga presa no cinto de anilhas ou halter entre as pernas.',
        'Teste: maior carga para 1–3 reps limpas, queixo acima da barra.',
      ],
      safety: 'Tenha alguém por perto e não falhe com carga muito alta.',
    },
  };

  // Itens do plano: uid estável (usado no histórico), ex = id da biblioteca.
  const DEFAULT_PLAN = {
    version: 1,
    name: 'Toji Fushiguro – Anime Physique Files #005',
    days: [
      {
        id: 'd1', name: 'Dia 1', title: 'Força pesada', mode: 'normal',
        items: [
          { uid: 'd1-agachamento', ex: 'agachamento', sets: 4, min: 4, max: 6, rest: 150 },
          { uid: 'd1-leg_press', ex: 'leg_press', sets: 3, min: 8, max: 8, rest: 120 },
          { uid: 'd1-remada_cabo', ex: 'remada_cabo', sets: 4, min: 6, max: 8, rest: 120 },
          { uid: 'd1-afundo', ex: 'afundo', sets: 3, min: 10, max: 10, rest: 90 },
        ],
      },
      {
        id: 'd2', name: 'Dia 2', title: 'Costas e braços', mode: 'normal',
        items: [
          { uid: 'd2-barra_fixa', ex: 'barra_fixa', sets: 4, min: 0, max: 0, rest: 120 },
          { uid: 'd2-puxada_alta', ex: 'puxada_alta', sets: 3, min: 8, max: 10, rest: 90 },
          { uid: 'd2-paralelas', ex: 'paralelas', sets: 3, min: 8, max: 12, rest: 90 },
          { uid: 'd2-rosca_direta', ex: 'rosca_direta', sets: 3, min: 10, max: 10, rest: 60 },
          { uid: 'd2-triceps_corda', ex: 'triceps_corda', sets: 3, min: 12, max: 12, rest: 60 },
        ],
      },
      {
        id: 'd3', name: 'Dia 3', title: 'Inferiores e potência', mode: 'normal',
        items: [
          { uid: 'd3-terra_trap', ex: 'terra_trap', sets: 4, min: 4, max: 6, rest: 150 },
          { uid: 'd3-bulgaro', ex: 'bulgaro', sets: 3, min: 8, max: 8, rest: 90 },
          { uid: 'd3-salto', ex: 'salto_grupado', sets: 4, min: 5, max: 5, rest: 120, note: 'Explosivo, descanso completo' },
        ],
      },
      {
        id: 'd4', name: 'Dia 4', title: 'Ombros, peito e core', mode: 'normal',
        items: [
          { uid: 'd4-desenvolvimento', ex: 'desenvolvimento', sets: 4, min: 6, max: 8, rest: 120 },
          { uid: 'd4-elevacao_lateral', ex: 'elevacao_lateral', sets: 3, min: 12, max: 15, rest: 60 },
          { uid: 'd4-supino_ponte', ex: 'supino_ponte', sets: 3, min: 10, max: 10, rest: 90 },
          { uid: 'd4-prancha', ex: 'prancha', sets: 3, min: 45, max: 45, rest: 45 },
          { uid: 'd4-abdominal_infra', ex: 'abdominal_infra', sets: 3, min: 12, max: 12, rest: 45 },
        ],
      },
      {
        id: 'd5', name: 'Dia 5', title: 'Full body e condicionamento', mode: 'circuit', rounds: 4, roundRest: 120,
        items: [
          { uid: 'd5-farmer', ex: 'farmer', sets: 4, min: 30, max: 40, rest: 15 },
          { uid: 'd5-esteira', ex: 'esteira', sets: 4, min: 0, max: 0, rest: 15, interval: { work: 20, rest: 40, reps: 6 } },
          { uid: 'd5-burpee', ex: 'burpee', sets: 4, min: 10, max: 10, rest: 15 },
          { uid: 'd5-salto_caixote', ex: 'salto_caixote', sets: 4, min: 8, max: 8, rest: 15 },
        ],
      },
    ],
  };

  const CHALLENGE = {
    ex: 'barra_carga',
    title: 'Desafio do personagem',
    text: 'Barra fixa com carga: teste seu máximo e tente bater a marca a cada 4 semanas.',
    everyDays: 28,
  };

  const api = { EXERCISES, DEFAULT_PLAN, CHALLENGE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DojoData = api;
})(typeof self !== 'undefined' ? self : this);
