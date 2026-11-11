/* Biblioteca expandida, grupos musculares, equipamentos, programas prontos e guia.
 * Estende o DojoData (data.js). Recomendações baseadas em:
 * - Schoenfeld, Ogborn & Krieger (2017) – dose-resposta do volume semanal (10+ séries/músculo/semana)
 * - ACSM (2009) – progressão em treinamento resistido (frequência 2–3x iniciante, 3–4 intermediário, 4–5 avançado)
 * - Maeo et al. (2021) – flexora sentada > deitada para isquiotibiais (músculo alongado)
 */
(function (root) {
  'use strict';

  const D = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root.DojoData;
  const { EXERCISES, DEFAULT_PLAN } = D;

  const GROUPS = {
    peito: 'Peito', costas: 'Costas', ombros: 'Ombros', biceps: 'Bíceps', triceps: 'Tríceps', antebraco: 'Antebraço/pegada',
    quadriceps: 'Quadríceps', posterior: 'Posterior de coxa', gluteos: 'Glúteos', panturrilha: 'Panturrilha',
    core: 'Abdômen/core', cardio: 'Cardio/condicionamento', potencia: 'Potência/pliometria',
  };

  const EQUIP = {
    barra: 'Barra', halteres: 'Halteres', maquina: 'Máquina', cabo: 'Cabo/polia', peso_corporal: 'Peso corporal',
    banco: 'Banco', kettlebell: 'Kettlebell', barra_fixa: 'Barra fixa', caixote: 'Caixote/degrau', esteira: 'Esteira',
    corda: 'Corda', roda: 'Roda abdominal', paralelas: 'Paralelas',
  };

  // [grupo principal, grupos secundários, equipamentos, nível, padrão {sets,min,max,rest}]
  const META = {
    agachamento: ['quadriceps', ['gluteos', 'core'], ['barra'], 'intermediario', [4, 6, 10, 150]],
    leg_press: ['quadriceps', ['gluteos'], ['maquina'], 'iniciante', [3, 10, 12, 120]],
    remada_cabo: ['costas', ['biceps'], ['cabo'], 'iniciante', [3, 8, 12, 90]],
    afundo: ['quadriceps', ['gluteos'], ['halteres', 'peso_corporal'], 'iniciante', [3, 10, 12, 90]],
    barra_fixa: ['costas', ['biceps', 'antebraco'], ['barra_fixa'], 'intermediario', [4, 0, 0, 120]],
    puxada_alta: ['costas', ['biceps'], ['cabo', 'maquina'], 'iniciante', [3, 8, 12, 90]],
    paralelas: ['triceps', ['peito', 'ombros'], ['paralelas'], 'intermediario', [3, 8, 12, 90]],
    rosca_direta: ['biceps', ['antebraco'], ['barra'], 'iniciante', [3, 8, 12, 60]],
    triceps_corda: ['triceps', [], ['cabo'], 'iniciante', [3, 10, 15, 60]],
    terra_trap: ['posterior', ['gluteos', 'quadriceps', 'costas'], ['barra'], 'intermediario', [4, 4, 6, 150]],
    bulgaro: ['quadriceps', ['gluteos'], ['barra', 'banco'], 'intermediario', [3, 8, 10, 90]],
    salto_grupado: ['potencia', ['quadriceps'], ['peso_corporal'], 'intermediario', [4, 5, 5, 120]],
    salto_caixote: ['potencia', ['quadriceps'], ['caixote'], 'intermediario', [4, 5, 8, 90]],
    desenvolvimento: ['ombros', ['triceps'], ['barra', 'banco'], 'intermediario', [4, 6, 10, 120]],
    elevacao_lateral: ['ombros', [], ['halteres', 'banco'], 'iniciante', [3, 12, 15, 60]],
    supino_ponte: ['peito', ['triceps', 'gluteos'], ['halteres'], 'iniciante', [3, 10, 12, 90]],
    prancha: ['core', [], ['peso_corporal'], 'iniciante', [3, 30, 45, 45]],
    abdominal_infra: ['core', [], ['peso_corporal'], 'iniciante', [3, 12, 15, 45]],
    farmer: ['antebraco', ['core', 'costas'], ['halteres', 'kettlebell'], 'iniciante', [3, 30, 40, 90]],
    esteira: ['cardio', [], ['esteira'], 'iniciante', [1, 0, 0, 60]],
    burpee: ['cardio', ['peito', 'quadriceps'], ['peso_corporal'], 'iniciante', [3, 8, 12, 60]],
    barra_carga: ['costas', ['biceps'], ['barra_fixa'], 'avancado', [3, 1, 5, 180]],
  };

  const E = (name, gifs, load, muscles, cues, extra) => Object.assign({ name, gifs, load, muscles, cues }, extra || {});

  const EXTRA = {
    // ------------------------------------------------------------- PEITO
    supino_reto: E('Supino reto com barra', ['supino_reto'], 'load', 'Peitoral, tríceps, deltoide anterior', [
      'Escápulas retraídas e “encaixadas” no banco, pés firmes no chão.',
      'Desça a barra controlando até tocar a parte baixa do peito.',
      'Cotovelos a ~45–70° do tronco (não abra a 90°).',
      'Empurre a barra de volta em linha levemente diagonal até os ombros.',
    ], { safety: 'Use as travas do rack ou um parceiro para séries pesadas.' }),
    supino_inclinado: E('Supino inclinado com halteres', ['supino_inclinado'], 'load', 'Peitoral superior, deltoide anterior, tríceps', [
      'Banco a 15–30°: é a faixa que mais enfatiza a porção clavicular do peitoral.',
      'Halteres na linha do peito, punhos firmes.',
      'Desça até sentir o alongamento do peito e suba sem bater os halteres.',
    ]),
    supino_fechado: E('Supino fechado', ['supino_reto'], 'load', 'Tríceps, peitoral', [
      'Pegada na largura dos ombros (não muito fechada para poupar os punhos).',
      'Cotovelos próximos ao corpo durante toda a descida.',
      'Toque a barra na parte baixa do peito e estenda os braços.',
    ]),
    crossover: E('Crossover no cabo', ['crossover'], 'load', 'Peitoral', [
      'Polias no alto, um passo à frente, tronco levemente inclinado.',
      'Cotovelos levemente flexionados e fixos durante o movimento.',
      'Traga as mãos à frente do quadril “abraçando”, aperte o peito e volte devagar.',
    ]),
    voador: E('Voador (peck deck)', ['voador'], 'load', 'Peitoral', [
      'Ajuste o banco para as mãos ficarem na altura do peito.',
      'Feche os braços à frente sem tirar as costas do encosto.',
      'Volte controlando até sentir o peito alongar.',
    ]),
    flexao: E('Flexão de braço', ['flexao'], 'bw', 'Peitoral, tríceps, core', [
      'Mãos um pouco mais abertas que os ombros, corpo em linha reta.',
      'Desça até o peito quase tocar o chão, cotovelos a ~45°.',
      'Difícil? Apoie os joelhos ou faça com as mãos num banco. Fácil? Use mochila com peso.',
    ]),

    // ------------------------------------------------------------- COSTAS
    remada_curvada: E('Remada curvada com barra', ['remada_curvada'], 'load', 'Dorsais, romboides, deltoide posterior, bíceps', [
      'Quadril para trás, tronco a ~45°, coluna neutra e joelhos levemente flexionados.',
      'Puxe a barra até o umbigo levando os cotovelos para trás.',
      'Desça com controle sem perder a posição do tronco.',
    ], { safety: 'Se a lombar cansar antes das costas, use a remada apoiada (serrote).' }),
    serrote: E('Remada unilateral (serrote)', ['serrote'], 'load', 'Dorsais, romboides, bíceps', [
      'Joelho e mão do mesmo lado apoiados no banco, costas retas.',
      'Puxe o halter em direção ao quadril, cotovelo rente ao corpo.',
      'Alongue bem embaixo sem girar o tronco.',
    ]),
    terra: E('Levantamento terra', ['terra'], 'load', 'Glúteos, posterior, lombar, costas, quadríceps', [
      'Barra sobre o meio do pé, canelas quase encostando na barra.',
      'Quadril para trás, peito alto, coluna neutra; “dobre” a barra para tirar a folga.',
      'Empurre o chão e estenda quadril e joelhos juntos, barra rente ao corpo.',
    ], { safety: 'Coluna neutra sempre. Comece leve e aprenda o movimento com orientação.' }),
    pulldown_reto: E('Pulldown braço estendido', ['pulldown_reto'], 'load', 'Dorsais', [
      'Polia alta, tronco levemente inclinado, braços quase estendidos.',
      'Leve a barra/corda até as coxas usando as costas, não os braços.',
      'Volte devagar até os braços acima da cabeça.',
    ]),
    hiperextensao: E('Hiperextensão lombar (banco romano)', ['hiperextensao'], 'bw', 'Lombar, glúteos, posterior', [
      'Quadril apoiado na almofada, pés presos.',
      'Desça com a coluna neutra e suba até alinhar tronco e pernas.',
      'Não hiperestenda no topo. Para progredir, segure uma anilha no peito.',
    ]),

    // ------------------------------------------------------------- OMBROS
    desenvolvimento_halteres: E('Desenvolvimento com halteres', ['desenvolvimento_halteres'], 'load', 'Deltoides, tríceps', [
      'Halteres na altura dos ombros, abdômen firme, glúteos contraídos.',
      'Empurre para cima até quase estender os braços.',
      'Desça até a altura do queixo/orelhas.',
    ]),
    elevacao_frontal: E('Elevação frontal', ['elevacao_frontal'], 'load', 'Deltoide anterior', [
      'Braços quase estendidos, sem balançar o tronco.',
      'Eleve até a altura dos ombros e desça devagar.',
    ]),
    face_pull: E('Face pull', ['face_pull'], 'load', 'Deltoide posterior, trapézio médio, manguito rotador', [
      'Corda na altura do rosto, pegada neutra.',
      'Puxe em direção à testa abrindo os cotovelos e girando os ombros para fora.',
      'Ótimo para postura e saúde do ombro.',
    ]),
    encolhimento: E('Encolhimento com halteres', ['encolhimento'], 'load', 'Trapézio superior', [
      'Halteres ao lado do corpo, braços estendidos.',
      'Suba os ombros em direção às orelhas, segure 1 s e desça.',
      'Não gire os ombros.',
    ]),

    // ------------------------------------------------------------- BÍCEPS
    rosca_alternada: E('Rosca alternada com halteres', ['rosca_alternada'], 'load', 'Bíceps, braquial', [
      'Cotovelos colados ao corpo.',
      'Suba um braço girando a palma para cima (supinação) e desça devagar.',
      'Alterne os lados sem balançar o tronco.',
    ]),
    rosca_martelo: E('Rosca martelo', ['rosca_martelo'], 'load', 'Braquial, braquiorradial, bíceps', [
      'Pegada neutra (palmas viradas uma para a outra).',
      'Suba até a contração sem mover os cotovelos.',
    ]),
    rosca_scott: E('Rosca Scott', ['rosca_scott'], 'load', 'Bíceps', [
      'Axilas encaixadas no banco, braços apoiados.',
      'Desça até quase estender (sem relaxar no fundo) e suba.',
      'Treina o bíceps bem alongado.',
    ]),
    rosca_concentrada: E('Rosca concentrada', ['rosca_concentrada'], 'load', 'Bíceps', [
      'Sentado, cotovelo apoiado na parte interna da coxa.',
      'Suba devagar e aperte no topo; desça controlando.',
    ]),

    // ------------------------------------------------------------- TRÍCEPS
    triceps_testa: E('Tríceps testa', ['triceps_testa'], 'load', 'Tríceps (cabeça longa)', [
      'Deitado, braços apontando para o teto, levemente inclinados para trás.',
      'Flexione só os cotovelos levando a barra até a testa/atrás da cabeça.',
      'Estenda sem abrir os cotovelos.',
    ]),
    triceps_frances: E('Tríceps francês (halter acima da cabeça)', ['triceps_frances'], 'load', 'Tríceps (cabeça longa)', [
      'Halter seguro com as duas mãos acima da cabeça.',
      'Desça atrás da cabeça mantendo os cotovelos apontando para cima.',
      'Estenda totalmente os braços.',
    ]),
    mergulho_banco: E('Mergulho no banco', ['mergulho_banco'], 'bw', 'Tríceps, peitoral', [
      'Mãos na borda do banco, quadril perto dele.',
      'Desça até ~90° de cotovelo e empurre de volta.',
      'Joelhos flexionados = mais fácil; pernas estendidas = mais difícil.',
    ], { safety: 'Se sentir o ombro, reduza a profundidade.' }),

    // ------------------------------------------------------------- PERNAS
    cadeira_extensora: E('Cadeira extensora', ['cadeira_extensora'], 'load', 'Quadríceps', [
      'Joelho alinhado com o eixo da máquina, rolo acima do tornozelo.',
      'Estenda até o fim e segure 1 s.',
      'Desça devagar sem deixar o peso bater.',
    ]),
    agachamento_goblet: E('Agachamento goblet', ['agachamento_goblet'], 'load', 'Quadríceps, glúteos, core', [
      'Halter ou kettlebell junto ao peito.',
      'Desça entre as pernas mantendo o tronco alto.',
      'Ótimo para aprender o agachamento.',
    ]),
    agachamento_livre: E('Agachamento livre (peso corporal)', ['agachamento_livre'], 'none', 'Quadríceps, glúteos', [
      'Pés na largura dos ombros.',
      'Leve o quadril para trás e para baixo, braços à frente para equilibrar.',
      'Suba empurrando o chão. Para dificultar: pausa de 2 s embaixo ou descida em 3 s.',
    ]),
    step_up: E('Subida no banco/caixote (step-up)', ['step_up'], 'bw', 'Quadríceps, glúteos', [
      'Pé inteiro apoiado no caixote ou num degrau firme.',
      'Suba empurrando com a perna da frente, sem impulsionar com a de trás.',
      'Desça controlando. Faça todas as reps de um lado e troque.',
    ]),
    stiff: E('Stiff / terra romeno', ['stiff'], 'load', 'Posterior de coxa, glúteos, lombar', [
      'Joelhos levemente flexionados e fixos.',
      'Leve o quadril para trás deslizando a barra/halteres rente às pernas.',
      'Desça até sentir o alongamento atrás das coxas e volte contraindo os glúteos.',
    ]),
    cadeira_flexora: E('Cadeira flexora (sentado)', ['cadeira_flexora'], 'load', 'Posterior de coxa', [
      'Rolo logo acima do calcanhar, coxas presas pelo apoio.',
      'Flexione os joelhos ao máximo e volte devagar.',
      'Estudo (Maeo et al., 2021): a versão sentada gerou mais hipertrofia que a deitada.',
    ]),
    mesa_flexora: E('Mesa flexora (deitado)', ['mesa_flexora'], 'load', 'Posterior de coxa', [
      'Deitado, joelhos logo após a borda do banco.',
      'Flexione os joelhos sem tirar o quadril do banco.',
      'Volte devagar até quase estender.',
    ]),

    // ------------------------------------------------------------- GLÚTEOS
    elevacao_pelvica: E('Elevação pélvica (hip thrust)', ['elevacao_pelvica'], 'load', 'Glúteos, posterior', [
      'Parte alta das costas no banco, barra (com proteção) sobre o quadril.',
      'Suba até alinhar tronco e coxas, queixo levemente para baixo.',
      'Segure 1 s contraindo os glúteos e desça.',
    ]),
    ponte_gluteo: E('Ponte de glúteo', ['ponte_gluteo'], 'bw', 'Glúteos, posterior', [
      'Deitado, joelhos flexionados, pés perto do quadril.',
      'Suba o quadril contraindo os glúteos até alinhar com o tronco.',
      'Progrida com uma perna só ou com peso sobre o quadril.',
    ]),
    abdutora: E('Cadeira abdutora', ['abdutora'], 'load', 'Glúteo médio', [
      'Costas no encosto, apoios por fora dos joelhos.',
      'Abra as pernas até o máximo e volte devagar.',
      'Incline o tronco à frente para enfatizar mais os glúteos.',
    ]),
    coice_cabo: E('Coice no cabo (glúteo)', ['coice_cabo'], 'load', 'Glúteo máximo', [
      'Tornozeleira presa na polia baixa, mãos apoiadas na máquina.',
      'Leve a perna para trás estendendo o quadril, sem arquear a lombar.',
      'Volte controlando.',
    ]),

    // ------------------------------------------------------------- PANTURRILHA
    panturrilha_pe: E('Panturrilha em pé', ['panturrilha_pe'], 'bw', 'Gastrocnêmio', [
      'Ponta dos pés na borda de um degrau.',
      'Desça o calcanhar ao máximo (alongue) e suba até a ponta dos pés.',
      'Pausa de 1–2 s embaixo evita “quicar”.',
    ]),
    panturrilha_sentado: E('Panturrilha sentado', ['panturrilha_sentado'], 'load', 'Sóleo', [
      'Joelhos a 90° sob o apoio.',
      'Suba e desça o calcanhar com amplitude total.',
    ]),

    // ------------------------------------------------------------- CORE
    abdominal_crunch: E('Abdominal (crunch)', ['abdominal_crunch'], 'none', 'Reto abdominal', [
      'Deitado, joelhos flexionados, lombar no chão.',
      'Enrole o tronco tirando as escápulas do chão, sem puxar o pescoço.',
      'Desça devagar.',
    ]),
    prancha_lateral: E('Prancha lateral', ['prancha_lateral'], 'none', 'Oblíquos, glúteo médio', [
      'Cotovelo sob o ombro, corpo em linha.',
      'Mantenha o quadril alto. Faça os dois lados.',
    ], { type: 'time' }),
    roda_abdominal: E('Roda abdominal', ['roda_abdominal'], 'none', 'Reto abdominal, core', [
      'Ajoelhado, mãos na roda abaixo dos ombros.',
      'Role à frente mantendo o abdômen firme e a lombar sem afundar.',
      'Volte puxando com o abdômen. Comece com pouca amplitude.',
    ], { safety: 'Pare a amplitude antes da lombar arquear.' }),
    elevacao_pernas: E('Elevação de pernas na barra', ['elevacao_pernas'], 'none', 'Abdômen inferior, flexores do quadril', [
      'Pendurado na barra, sem balanço.',
      'Eleve as pernas até a horizontal (ou joelhos ao peito para facilitar).',
      'Desça devagar.',
    ]),
    mountain_climber: E('Escalador (mountain climber)', ['mountain_climber'], 'none', 'Core, condicionamento', [
      'Posição de prancha alta.',
      'Leve um joelho ao peito e troque rapidamente.',
      'Quadril baixo e estável.',
    ]),

    // ------------------------------------------------------------- CARDIO
    polichinelo: E('Polichinelo', ['polichinelo'], 'none', 'Condicionamento', [
      'Salte abrindo pernas e braços ao mesmo tempo.',
      'Volte fechando. Ritmo constante.',
    ]),
    pular_corda: E('Pular corda', ['pular_corda'], 'none', 'Condicionamento, panturrilhas', [
      'Saltos baixos na ponta dos pés.',
      'Gire a corda com os punhos, cotovelos perto do corpo.',
    ], { type: 'time' }),
    kettlebell_swing: E('Kettlebell swing', ['kettlebell_swing'], 'load', 'Glúteos, posterior, core', [
      'Movimento de dobradiça do quadril (não é agachamento).',
      'Projete o quadril à frente para levar o kettlebell à altura do peito.',
      'Deixe o kettlebell voltar entre as pernas e repita.',
    ], { safety: 'Coluna neutra; a força vem do quadril, não dos braços.' }),
  };

  Object.assign(EXTRA.flexao, { load: 'bw' });
  EXERCISES.afundo.load = 'bw';
  Object.assign(EXERCISES, EXTRA);

  Object.assign(META, {
    supino_reto: ['peito', ['triceps', 'ombros'], ['barra', 'banco'], 'iniciante', [3, 6, 10, 120]],
    supino_inclinado: ['peito', ['ombros', 'triceps'], ['halteres', 'banco'], 'iniciante', [3, 8, 12, 90]],
    supino_fechado: ['triceps', ['peito'], ['barra', 'banco'], 'intermediario', [3, 6, 10, 120]],
    crossover: ['peito', ['ombros'], ['cabo'], 'iniciante', [3, 12, 15, 60]],
    voador: ['peito', [], ['maquina'], 'iniciante', [3, 12, 15, 60]],
    flexao: ['peito', ['triceps', 'core'], ['peso_corporal'], 'iniciante', [3, 8, 15, 60]],
    remada_curvada: ['costas', ['biceps', 'ombros'], ['barra'], 'intermediario', [3, 6, 10, 120]],
    serrote: ['costas', ['biceps'], ['halteres', 'banco'], 'iniciante', [3, 8, 12, 60]],
    terra: ['posterior', ['gluteos', 'costas', 'quadriceps'], ['barra'], 'intermediario', [3, 4, 6, 180]],
    pulldown_reto: ['costas', [], ['cabo'], 'iniciante', [3, 12, 15, 60]],
    hiperextensao: ['posterior', ['gluteos'], ['banco'], 'iniciante', [3, 10, 15, 60]],
    desenvolvimento_halteres: ['ombros', ['triceps'], ['halteres'], 'iniciante', [3, 8, 12, 90]],
    elevacao_frontal: ['ombros', [], ['halteres'], 'iniciante', [2, 10, 15, 60]],
    face_pull: ['ombros', ['costas'], ['cabo'], 'iniciante', [3, 12, 15, 60]],
    encolhimento: ['costas', ['antebraco'], ['halteres'], 'iniciante', [3, 10, 15, 60]],
    rosca_alternada: ['biceps', [], ['halteres'], 'iniciante', [3, 8, 12, 60]],
    rosca_martelo: ['biceps', ['antebraco'], ['halteres'], 'iniciante', [3, 10, 12, 60]],
    rosca_scott: ['biceps', [], ['barra', 'banco'], 'iniciante', [3, 8, 12, 60]],
    rosca_concentrada: ['biceps', [], ['halteres', 'banco'], 'iniciante', [2, 10, 15, 45]],
    triceps_testa: ['triceps', [], ['barra', 'banco'], 'iniciante', [3, 8, 12, 60]],
    triceps_frances: ['triceps', [], ['halteres', 'banco'], 'iniciante', [3, 10, 12, 60]],
    mergulho_banco: ['triceps', ['peito'], ['banco', 'peso_corporal'], 'iniciante', [3, 10, 15, 60]],
    cadeira_extensora: ['quadriceps', [], ['maquina'], 'iniciante', [3, 12, 15, 60]],
    agachamento_goblet: ['quadriceps', ['gluteos', 'core'], ['halteres', 'kettlebell'], 'iniciante', [3, 8, 12, 90]],
    agachamento_livre: ['quadriceps', ['gluteos'], ['peso_corporal'], 'iniciante', [3, 15, 20, 60]],
    step_up: ['quadriceps', ['gluteos'], ['caixote', 'halteres'], 'iniciante', [3, 10, 12, 60]],
    stiff: ['posterior', ['gluteos', 'costas'], ['barra', 'halteres'], 'iniciante', [3, 8, 12, 90]],
    cadeira_flexora: ['posterior', [], ['maquina'], 'iniciante', [3, 10, 12, 60]],
    mesa_flexora: ['posterior', [], ['maquina'], 'iniciante', [3, 10, 12, 60]],
    elevacao_pelvica: ['gluteos', ['posterior'], ['barra', 'banco'], 'iniciante', [3, 8, 12, 90]],
    ponte_gluteo: ['gluteos', ['posterior'], ['peso_corporal'], 'iniciante', [3, 15, 20, 45]],
    abdutora: ['gluteos', [], ['maquina'], 'iniciante', [3, 12, 20, 45]],
    coice_cabo: ['gluteos', ['posterior'], ['cabo'], 'iniciante', [3, 12, 15, 45]],
    panturrilha_pe: ['panturrilha', [], ['peso_corporal', 'maquina'], 'iniciante', [4, 10, 15, 60]],
    panturrilha_sentado: ['panturrilha', [], ['maquina'], 'iniciante', [3, 12, 20, 45]],
    abdominal_crunch: ['core', [], ['peso_corporal'], 'iniciante', [3, 15, 20, 45]],
    prancha_lateral: ['core', [], ['peso_corporal'], 'iniciante', [3, 20, 30, 30]],
    roda_abdominal: ['core', [], ['roda'], 'intermediario', [3, 8, 12, 60]],
    elevacao_pernas: ['core', [], ['barra_fixa'], 'intermediario', [3, 8, 12, 60]],
    mountain_climber: ['cardio', ['core'], ['peso_corporal'], 'iniciante', [3, 20, 30, 30]],
    polichinelo: ['cardio', [], ['peso_corporal'], 'iniciante', [3, 30, 40, 30]],
    pular_corda: ['cardio', ['panturrilha'], ['corda'], 'iniciante', [5, 45, 60, 30]],
    kettlebell_swing: ['gluteos', ['posterior', 'core'], ['kettlebell'], 'iniciante', [4, 12, 20, 60]],
  });

  for (const [id, m] of Object.entries(META)) {
    const ex = EXERCISES[id];
    if (!ex) continue;
    ex.group = m[0];
    ex.secondary = m[1];
    ex.equip = m[2];
    ex.level = m[3];
    ex.def = { sets: m[4][0], min: m[4][1], max: m[4][2], rest: m[4][3] };
  }

  // ------------------------------------------------------------- programas

  /** Item de plano: [id, séries, min, max, descanso, nota?]. uid estável = dia + posição + exercício. */
  function it(prefix, row, idx) {
    const [ex, sets, min, max, rest, note] = row;
    const o = { uid: `${prefix}-${idx + 1}-${ex}`, ex, sets, min, max, rest };
    if (note) o.note = note;
    return o;
  }
  function day(prog, key, name, title, rows, extra) {
    const id = `${prog}-${key}`;
    return Object.assign({ id, name, title, mode: 'normal', items: rows.map((r, i) => it(id, r, i)) }, extra || {});
  }

  const TOJI = Object.assign(DEFAULT_PLAN, {
    id: 'toji', short: 'Toji (5 dias)', level: 'intermediario', daysPerWeek: 5, place: 'academia', goal: 'força + hipertrofia',
    description: 'Força pesada, potência e condicionamento inspirados no Toji Fushiguro. Para quem já tem base de treino.',
  });

  const PROGRAMS = [
    {
      id: 'fullbody3', name: 'Full Body 3x – Iniciante', short: 'Full Body 3x', level: 'iniciante', daysPerWeek: 3, place: 'academia',
      goal: 'hipertrofia + base de força',
      description: 'Corpo todo em cada treino, 3 dias não seguidos (ex.: seg/qua/sex). Cada músculo é treinado ~3x por semana — a melhor porta de entrada segundo a ACSM.',
      days: [
        day('fb3', 'a', 'Treino A', 'Corpo todo – agachamento', [
          ['agachamento', 3, 6, 10, 120], ['supino_reto', 3, 6, 10, 120], ['remada_curvada', 3, 8, 12, 90],
          ['elevacao_pelvica', 2, 10, 12, 90], ['elevacao_lateral', 2, 12, 15, 60], ['prancha', 2, 30, 45, 45]]),
        day('fb3', 'b', 'Treino B', 'Corpo todo – máquinas', [
          ['leg_press', 3, 10, 12, 90], ['desenvolvimento_halteres', 3, 8, 12, 90], ['puxada_alta', 3, 8, 12, 90],
          ['cadeira_flexora', 2, 10, 12, 60], ['crossover', 2, 12, 15, 60], ['rosca_direta', 2, 10, 12, 60], ['triceps_corda', 2, 10, 15, 60]]),
        day('fb3', 'c', 'Treino C', 'Corpo todo – posterior', [
          ['stiff', 3, 8, 12, 90], ['supino_inclinado', 3, 8, 12, 90], ['remada_cabo', 3, 10, 12, 90],
          ['afundo', 2, 10, 12, 60], ['face_pull', 2, 12, 15, 60], ['panturrilha_pe', 3, 12, 15, 45]]),
      ],
    },
    {
      id: 'abc', name: 'ABC – Iniciante/Intermediário', short: 'ABC', level: 'iniciante', daysPerWeek: 3, place: 'academia',
      goal: 'hipertrofia',
      description: 'A: peito, ombros e tríceps · B: costas e bíceps · C: pernas e abdômen. Faça ABC 3x/semana para começar ou ABCABC (6 dias) para treinar cada músculo 2x.',
      days: [
        day('abc', 'a', 'Treino A', 'Peito, ombros e tríceps', [
          ['supino_reto', 3, 8, 12, 90], ['supino_inclinado', 3, 8, 12, 90], ['voador', 3, 12, 15, 60],
          ['desenvolvimento_halteres', 3, 8, 12, 90], ['elevacao_lateral', 3, 12, 15, 60],
          ['triceps_corda', 3, 10, 12, 60], ['triceps_frances', 2, 10, 12, 60]]),
        day('abc', 'b', 'Treino B', 'Costas e bíceps', [
          ['puxada_alta', 3, 8, 12, 90], ['remada_cabo', 3, 8, 12, 90], ['serrote', 3, 8, 12, 60],
          ['pulldown_reto', 2, 12, 15, 60], ['face_pull', 2, 12, 15, 60], ['rosca_direta', 3, 8, 12, 60], ['rosca_martelo', 3, 10, 12, 60]]),
        day('abc', 'c', 'Treino C', 'Pernas e abdômen', [
          ['agachamento', 3, 8, 10, 120], ['leg_press', 3, 10, 12, 90], ['cadeira_extensora', 3, 12, 15, 60],
          ['stiff', 3, 8, 12, 90], ['cadeira_flexora', 3, 10, 12, 60], ['panturrilha_pe', 4, 12, 15, 45], ['abdominal_crunch', 3, 15, 20, 45]]),
      ],
    },
    {
      id: 'upperlower', name: 'Upper/Lower 4x – Intermediário', short: 'Upper/Lower', level: 'intermediario', daysPerWeek: 4, place: 'academia',
      goal: 'força + hipertrofia',
      description: 'Superior/inferior em 4 dias (ex.: seg/ter/qui/sex). Cada músculo 2x por semana — um dia mais pesado (A) e um mais volumoso (B).',
      days: [
        day('ul', 'ua', 'Superior A', 'Força', [
          ['supino_reto', 4, 5, 8, 150], ['remada_curvada', 4, 6, 8, 120], ['desenvolvimento', 3, 6, 10, 120],
          ['puxada_alta', 3, 8, 10, 90], ['rosca_direta', 2, 8, 12, 60], ['triceps_testa', 2, 8, 12, 60]]),
        day('ul', 'la', 'Inferior A', 'Força', [
          ['agachamento', 4, 5, 8, 150], ['stiff', 3, 8, 10, 120], ['leg_press', 3, 10, 12, 90],
          ['cadeira_flexora', 3, 10, 12, 60], ['panturrilha_pe', 4, 8, 12, 60], ['abdominal_infra', 3, 12, 15, 45]]),
        day('ul', 'ub', 'Superior B', 'Volume', [
          ['supino_inclinado', 4, 8, 12, 90], ['barra_fixa', 4, 0, 0, 120], ['crossover', 3, 12, 15, 60],
          ['remada_cabo', 3, 10, 12, 90], ['elevacao_lateral', 3, 12, 20, 60], ['rosca_martelo', 3, 10, 12, 60], ['triceps_corda', 3, 10, 15, 60]]),
        day('ul', 'lb', 'Inferior B', 'Volume', [
          ['terra', 3, 4, 6, 180], ['bulgaro', 3, 8, 10, 90], ['cadeira_extensora', 3, 12, 15, 60],
          ['mesa_flexora', 3, 10, 12, 60], ['elevacao_pelvica', 3, 8, 12, 90], ['panturrilha_sentado', 3, 12, 15, 45], ['prancha', 3, 45, 60, 45]]),
      ],
    },
    {
      id: 'abcd', name: 'ABCD – Intermediário', short: 'ABCD', level: 'intermediario', daysPerWeek: 4, place: 'academia', goal: 'hipertrofia',
      description: 'A: peito e tríceps · B: costas e bíceps · C: pernas · D: ombros e abdômen. Mais volume por sessão; cada músculo ~1x por semana (bíceps/tríceps recebem estímulo extra nos dias de peito/costas).',
      days: [
        day('abcd', 'a', 'Treino A', 'Peito e tríceps', [
          ['supino_reto', 4, 6, 10, 120], ['supino_inclinado', 3, 8, 12, 90], ['crossover', 3, 12, 15, 60],
          ['paralelas', 3, 8, 12, 90], ['triceps_testa', 3, 8, 12, 60], ['triceps_corda', 3, 12, 15, 60]]),
        day('abcd', 'b', 'Treino B', 'Costas e bíceps', [
          ['barra_fixa', 4, 0, 0, 120], ['remada_curvada', 4, 6, 10, 120], ['puxada_alta', 3, 10, 12, 90],
          ['serrote', 3, 10, 12, 60], ['rosca_direta', 3, 8, 12, 60], ['rosca_concentrada', 2, 12, 15, 45]]),
        day('abcd', 'c', 'Treino C', 'Pernas', [
          ['agachamento', 4, 6, 10, 150], ['leg_press', 3, 10, 12, 90], ['cadeira_extensora', 3, 12, 15, 60], ['stiff', 3, 8, 12, 90],
          ['mesa_flexora', 3, 10, 12, 60], ['elevacao_pelvica', 3, 10, 12, 90], ['panturrilha_pe', 4, 12, 15, 45]]),
        day('abcd', 'd', 'Treino D', 'Ombros e abdômen', [
          ['desenvolvimento', 4, 6, 10, 120], ['elevacao_lateral', 4, 12, 20, 60], ['elevacao_frontal', 2, 12, 15, 60],
          ['face_pull', 3, 12, 15, 60], ['encolhimento', 3, 10, 15, 60], ['roda_abdominal', 3, 8, 12, 60], ['prancha_lateral', 3, 20, 30, 30]]),
      ],
    },
    {
      id: 'ppl', name: 'Push/Pull/Legs – Avançado (6 dias)', short: 'PPL 6x', level: 'avancado', daysPerWeek: 6, place: 'academia', goal: 'hipertrofia',
      description: 'Empurrar / Puxar / Pernas, duas vezes por semana com variações A e B. Alto volume (~15–20 séries por músculo/semana). Com só 3 dias, prefira Full Body ou Upper/Lower.',
      days: [
        day('ppl', 'pa', 'Push A', 'Peito, ombros, tríceps', [
          ['supino_reto', 4, 6, 8, 150], ['desenvolvimento_halteres', 3, 8, 10, 90], ['supino_inclinado', 3, 8, 12, 90],
          ['elevacao_lateral', 3, 12, 15, 60], ['triceps_testa', 3, 8, 12, 60], ['triceps_corda', 2, 12, 15, 60]]),
        day('ppl', 'qa', 'Pull A', 'Costas, bíceps', [
          ['barra_fixa', 4, 0, 0, 120], ['remada_curvada', 4, 6, 10, 120], ['puxada_alta', 3, 8, 12, 90],
          ['face_pull', 3, 12, 15, 60], ['rosca_direta', 3, 8, 12, 60], ['rosca_martelo', 2, 10, 12, 60]]),
        day('ppl', 'la', 'Legs A', 'Pernas (quadríceps)', [
          ['agachamento', 4, 6, 8, 150], ['stiff', 3, 8, 10, 120], ['leg_press', 3, 10, 12, 90],
          ['cadeira_flexora', 3, 10, 12, 60], ['panturrilha_pe', 4, 10, 15, 45], ['abdominal_infra', 3, 12, 15, 45]]),
        day('ppl', 'pb', 'Push B', 'Peito, ombros, tríceps', [
          ['supino_inclinado', 4, 6, 10, 120], ['desenvolvimento', 3, 6, 10, 120], ['crossover', 3, 12, 15, 60],
          ['paralelas', 3, 8, 12, 90], ['elevacao_lateral', 3, 15, 20, 45], ['triceps_frances', 3, 10, 12, 60]]),
        day('ppl', 'qb', 'Pull B', 'Costas, bíceps, trapézio', [
          ['terra', 3, 4, 6, 180], ['puxada_alta', 3, 10, 12, 90], ['serrote', 3, 8, 12, 60],
          ['pulldown_reto', 3, 12, 15, 60], ['rosca_scott', 3, 10, 12, 60], ['encolhimento', 3, 10, 15, 60]]),
        day('ppl', 'lb', 'Legs B', 'Pernas (posterior e glúteos)', [
          ['bulgaro', 3, 8, 10, 90], ['elevacao_pelvica', 4, 8, 12, 90], ['cadeira_extensora', 3, 12, 15, 60],
          ['mesa_flexora', 3, 10, 12, 60], ['panturrilha_sentado', 4, 12, 15, 45], ['roda_abdominal', 3, 8, 12, 60]]),
      ],
    },
    TOJI,
    {
      id: 'casa', name: 'Em casa – peso corporal (3 dias)', short: 'Casa', level: 'iniciante', daysPerWeek: 3, place: 'casa',
      goal: 'condicionamento + hipertrofia',
      description: 'Sem equipamento (uma cadeira firme ajuda). Progrida com mais reps, descidas lentas (3 s) e pausas. Quando passar de 20 reps fácil, adicione uma mochila com peso.',
      days: [
        day('casa', 'a', 'Treino A', 'Corpo todo', [
          ['agachamento_livre', 4, 15, 20, 60], ['flexao', 4, 8, 15, 60], ['ponte_gluteo', 3, 15, 20, 45],
          ['mergulho_banco', 3, 10, 15, 60], ['prancha', 3, 30, 45, 30], ['mountain_climber', 3, 20, 30, 30]]),
        day('casa', 'b', 'Treino B', 'Corpo todo + cardio', [
          ['afundo', 3, 10, 12, 60], ['flexao', 3, 8, 15, 60], ['abdominal_infra', 3, 12, 15, 45],
          ['polichinelo', 3, 30, 40, 30], ['burpee', 3, 8, 12, 60], ['prancha_lateral', 3, 20, 30, 30]]),
        day('casa', 'c', 'Treino C', 'Pernas e core', [
          ['step_up', 3, 10, 12, 60], ['agachamento_livre', 3, 15, 20, 60], ['ponte_gluteo', 3, 15, 20, 45],
          ['panturrilha_pe', 4, 15, 20, 45], ['abdominal_crunch', 3, 15, 20, 45], ['pular_corda', 5, 45, 60, 30]]),
      ],
    },
    {
      id: 'halteres', name: 'Só halteres (3 dias)', short: 'Halteres', level: 'iniciante', daysPerWeek: 3, place: 'halteres',
      goal: 'hipertrofia',
      description: 'Para quem tem um par de halteres (de preferência ajustáveis) e um banco ou cadeira. Corpo todo, 3x por semana.',
      days: [
        day('hal', 'a', 'Treino A', 'Corpo todo', [
          ['agachamento_goblet', 4, 8, 12, 90], ['supino_ponte', 3, 10, 12, 90], ['serrote', 3, 8, 12, 60],
          ['desenvolvimento_halteres', 3, 8, 12, 90], ['rosca_alternada', 2, 10, 12, 60], ['prancha', 3, 30, 45, 30]]),
        day('hal', 'b', 'Treino B', 'Corpo todo', [
          ['afundo', 3, 10, 12, 60], ['supino_inclinado', 3, 8, 12, 90], ['stiff', 3, 10, 12, 90, 'Com halteres'],
          ['elevacao_lateral', 3, 12, 15, 60], ['triceps_frances', 3, 10, 12, 60], ['rosca_martelo', 2, 10, 12, 60]]),
        day('hal', 'c', 'Treino C', 'Corpo todo + pegada', [
          ['step_up', 3, 10, 12, 60], ['elevacao_pelvica', 3, 10, 15, 60, 'Halter sobre o quadril'], ['serrote', 3, 10, 12, 60],
          ['elevacao_frontal', 2, 12, 15, 45], ['encolhimento', 3, 10, 15, 60], ['farmer', 3, 30, 40, 90], ['abdominal_crunch', 3, 15, 20, 45]]),
      ],
    },
    {
      id: 'condicionamento', name: 'Condicionamento em circuito (3 dias)', short: 'Circuito', level: 'iniciante', daysPerWeek: 3,
      place: 'casa', goal: 'condicionamento / gasto calórico',
      description: 'Circuitos curtos e intensos. Combine com alimentação adequada se o objetivo for emagrecer. Kettlebell opcional (troque por agachamento).',
      days: [
        day('cond', 'a', 'Circuito A', 'Corpo todo', [
          ['kettlebell_swing', 4, 15, 15, 15], ['flexao', 4, 10, 10, 15], ['agachamento_livre', 4, 20, 20, 15],
          ['mountain_climber', 4, 30, 30, 15], ['prancha', 4, 30, 30, 15]], { mode: 'circuit', rounds: 4, roundRest: 90 }),
        day('cond', 'b', 'Circuito B', 'Cardio + core', [
          ['burpee', 4, 10, 10, 15], ['polichinelo', 4, 40, 40, 15], ['afundo', 4, 12, 12, 15],
          ['abdominal_crunch', 4, 20, 20, 15], ['pular_corda', 4, 60, 60, 15]], { mode: 'circuit', rounds: 4, roundRest: 90 }),
        day('cond', 'c', 'Intervalado', 'Tiros + core', [
          ['esteira', 1, 0, 0, 60], ['prancha_lateral', 3, 30, 30, 30], ['abdominal_infra', 3, 15, 15, 30]]),
      ],
    },
  ];
  // Itens de intervalo precisam da configuração
  for (const p of PROGRAMS) for (const d of p.days) for (const i of d.items) {
    if (i.ex === 'esteira' && !i.interval) i.interval = { work: 20, rest: 40, reps: 8 };
  }

  // ------------------------------------------------------------- guia

  const GUIDE = [
    {
      title: 'Quantas séries por semana?',
      body: [
        'Para hipertrofia, mire em ~10 a 20 séries “de verdade” por grupo muscular por semana (séries perto da falha, 0–3 repetições na reserva).',
        'Iniciante: 10–12 já dá ótimo resultado. Intermediário: 12–16. Avançado: 16–20+.',
        'Mais volume ajuda até certo ponto; se a recuperação piorar (dor que não passa, força caindo), reduza.',
      ],
    },
    {
      title: 'Frequência: quantas vezes treinar cada músculo',
      body: [
        'Treinar cada músculo ~2x por semana é uma base sólida. Com o volume semanal igualado, a frequência importa pouco — escolha a que você consegue manter.',
        'Dividir o volume em 2 sessões costuma deixar cada treino mais curto e com séries de melhor qualidade.',
      ],
    },
    {
      title: 'Qual divisão escolher',
      body: [
        '2–3 dias: Full Body (corpo todo em todos os treinos).',
        '3 dias: ABC ou Full Body. ABC treina cada músculo 1x — ok para começar; Full Body treina 3x.',
        '4 dias: Upper/Lower (superior/inferior) — cada músculo 2x. ABCD também funciona, com mais volume por sessão.',
        '5–6 dias: Push/Pull/Legs (PPL) ou ABCDE. Só vale se você recupera bem e tem tempo.',
        'A melhor divisão é a que você cumpre. Faltou um dia? Continue de onde parou (o app sugere o próximo treino).',
      ],
    },
    {
      title: 'Repetições, carga e descanso',
      body: [
        'Hipertrofia acontece numa faixa ampla (~5 a 30 reps) se a série for levada perto da falha. Na prática: 6–12 reps nos multiarticulares e 10–20 nos isoladores.',
        'Força: 1–6 reps com cargas altas e 2–5 min de descanso.',
        'Descanso: 2–3 min em agachamento, terra e supino; 1–2 min em exercícios menores.',
      ],
    },
    {
      title: 'Progressão (sobrecarga progressiva)',
      body: [
        'Use a progressão dupla: trabalhe dentro de uma faixa (ex.: 8–12). Quando fechar todas as séries no topo, suba a carga 2,5–5% e recomece no início da faixa.',
        'O app faz isso automaticamente: veja a sugestão verde em cada exercício.',
        'Sem carga para subir? Aumente reps, faça a descida mais lenta (3 s) ou diminua o descanso.',
      ],
    },
    {
      title: 'Deload (semana leve)',
      body: [
        'A cada 4–8 semanas, ou quando o cansaço acumular, faça uma semana com ~metade das séries e carga um pouco menor.',
        'Não é perda de tempo: ajuda a recuperar articulações e voltar mais forte.',
      ],
    },
    {
      title: 'Aquecimento e técnica',
      body: [
        '5 min de cardio leve + 2–3 séries de aproximação no primeiro exercício (ex.: 50% × 8, 70% × 4, 85% × 2).',
        'Técnica antes de carga. Amplitude completa e controlada gera mais resultado que roubar no movimento.',
        'Grave suas séries de vez em quando para conferir a execução.',
      ],
    },
    {
      title: 'Segurança',
      body: [
        'Dor aguda, pontada ou formigamento: pare o exercício.',
        'Use travas, safety bars ou um parceiro em agachamento e supino pesados.',
        'Sono (7–9 h) e proteína (~1,6–2,2 g/kg/dia) são parte do treino.',
        'Tem lesão, doença cardíaca, hipertensão ou está começando agora? Procure avaliação de um profissional de educação física e de um médico.',
      ],
    },
  ];

  const SOURCES = [
    'Schoenfeld, Ogborn & Krieger (2017). Dose-response relationship between weekly resistance training volume and increases in muscle mass. J Sports Sci.',
    'American College of Sports Medicine (2009). Progression models in resistance training for healthy adults. Med Sci Sports Exerc. pubmed.ncbi.nlm.nih.gov/19204579',
    'Garber et al. – ACSM (2011). Quantity and quality of exercise for developing and maintaining fitness.',
    'Maeo et al. (2021). Greater hamstrings muscle hypertrophy but similar damage protection after training at long versus short muscle lengths. Med Sci Sports Exerc.',
    'Renaissance Periodization – Progressing for hypertrophy (rpstrength.com).',
  ];

  const LEVELS = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' };
  const PLACES = { academia: 'Academia', casa: 'Em casa', halteres: 'Halteres' };

  /** Sugere um programa a partir das respostas do questionário. */
  function recommend(answers) {
    const { days, level, place, goal } = answers;
    if (place === 'casa') return goal === 'condicionamento' ? 'condicionamento' : 'casa';
    if (place === 'halteres') return 'halteres';
    if (goal === 'condicionamento') return 'condicionamento';
    if (days <= 3) return level === 'iniciante' ? 'fullbody3' : 'abc';
    if (days === 4) return level === 'iniciante' ? 'upperlower' : (goal === 'forca' ? 'upperlower' : 'abcd');
    if (days === 5) return 'toji';
    return level === 'avancado' ? 'ppl' : 'upperlower';
  }

  const api = { GROUPS, EQUIP, PROGRAMS, GUIDE, SOURCES, LEVELS, PLACES, recommend };
  Object.assign(D, api);
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(typeof self !== 'undefined' ? self : this);
