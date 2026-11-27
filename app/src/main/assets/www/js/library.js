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
    core: 'Abdômen/core', cardio: 'Cardio/condicionamento', potencia: 'Potência/pliometria', mobilidade: 'Mobilidade/alongamento',
  };

  /** Grupos que são músculos (entram no volume semanal e no mapa do corpo). */
  const MUSCLES = Object.keys(GROUPS).filter((g) => !['cardio', 'potencia', 'mobilidade'].includes(g));

  const EQUIP = {
    barra: 'Barra', halteres: 'Halteres', maquina: 'Máquina', cabo: 'Cabo/polia', peso_corporal: 'Peso corporal',
    banco: 'Banco', kettlebell: 'Kettlebell', barra_fixa: 'Barra fixa', caixote: 'Caixote/degrau', esteira: 'Esteira',
    corda: 'Corda', roda: 'Roda abdominal', paralelas: 'Paralelas',
    bicicleta: 'Bicicleta', eliptico: 'Elíptico', remo: 'Remo ergômetro', simulador_escada: 'Simulador de escada',
    step: 'Step', corda_naval: 'Corda naval', medicine_ball: 'Medicine/slam ball', treno: 'Trenó', elastico: 'Elástico/mini band',
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


  // ------------------------------------------------------------- MÁQUINAS E VARIAÇÕES (academia completa)
  Object.assign(EXTRA, {
    pullover: E('Pullover com halter', ['pullover'], 'load', 'Dorsais, peitoral, serrátil', [
      'Deitado no banco, halter seguro com as duas mãos acima do peito, cotovelos levemente flexionados.',
      'Leve o halter para trás da cabeça em arco até sentir o alongamento das costas e do peito.',
      'Volte pelo mesmo arco até acima do peito, sem dobrar mais os cotovelos.',
    ], { safety: 'Carga moderada e amplitude que o ombro tolera sem dor.' }),
    desenvolvimento_arnold: E('Desenvolvimento Arnold', ['desenvolvimento_arnold'], 'load', 'Deltoides (anterior e lateral), tríceps', [
      'Sentado, halteres à frente do rosto com as palmas viradas para você.',
      'Ao subir, gire os punhos até as palmas ficarem para frente no topo.',
      'Desça fazendo o caminho inverso, sem bater os halteres.',
    ]),
    encolhimento_barra: E('Encolhimento com barra', ['encolhimento_barra'], 'load', 'Trapézio superior', [
      'Barra à frente das coxas, pegada na largura dos ombros, braços estendidos.',
      'Suba os ombros em direção às orelhas e segure 1 s.',
      'Desça controlando; não gire os ombros nem dobre os cotovelos.',
    ]),
    supino_maquina: E('Supino máquina (chest press)', ['supino_maquina'], 'load', 'Peitoral, tríceps, deltoide anterior', [
      'Ajuste o banco para as pegadas ficarem na linha do meio do peito.',
      'Costas e cabeça no encosto, escápulas para trás.',
      'Empurre até quase estender e volte controlando até sentir o peito alongar.',
    ], { safety: 'Ótimo para ir perto da falha com segurança, sem precisar de parceiro.' }),
    supino_declinado: E('Supino declinado com barra', ['supino_declinado'], 'load', 'Peitoral (porção inferior), tríceps', [
      'Prenda as pernas no apoio, cabeça mais baixa que o quadril.',
      'Desça a barra até a parte baixa do peito.',
      'Empurre de volta sem tirar o quadril do banco.',
    ], { safety: 'Use parceiro ou travas; não desça o banco além de ~15–20°.' }),
    supino_halteres: E('Supino reto com halteres', ['supino_halteres'], 'load', 'Peitoral, tríceps, deltoide anterior', [
      'Halteres na linha do peito, escápulas retraídas.',
      'Desça até sentir o alongamento (amplitude maior que a barra).',
      'Empurre convergindo levemente os halteres sobre o peito.',
    ]),
    supino_inclinado_barra: E('Supino inclinado com barra', ['supino_inclinado_barra'], 'load', 'Peitoral superior, deltoide anterior, tríceps', [
      'Banco a 15–30°, barra na linha da clavícula.',
      'Desça controlando até a parte alta do peito.',
      'Empurre de volta sem arquear demais a lombar.',
    ]),
    crucifixo: E('Crucifixo com halteres', ['crucifixo'], 'load', 'Peitoral', [
      'Deitado no banco, cotovelos levemente flexionados e fixos.',
      'Abra os braços em arco até sentir o peito alongar (sem passar da linha do ombro).',
      'Feche “abraçando” até os halteres ficarem sobre o peito.',
    ], { safety: 'Carga moderada: o ombro fica vulnerável no ponto mais aberto.' }),
    remada_maquina: E('Remada máquina (apoio no peito)', ['remada_maquina'], 'load', 'Dorsais, romboides, trapézio médio, bíceps', [
      'Peito apoiado na almofada, pés firmes.',
      'Puxe os cotovelos para trás e junte as escápulas.',
      'Estenda os braços devagar alongando as costas. Sem sobrecarregar a lombar.',
    ]),
    remada_cavalinho: E('Remada cavalinho (T-bar)', ['remada_cavalinho'], 'load', 'Dorsais, romboides, trapézio, bíceps', [
      'Pés afastados, quadril para trás, tronco a ~45° e coluna neutra.',
      'Puxe a pegada em direção ao abdômen.',
      'Desça controlando sem perder a posição do tronco.',
    ], { safety: 'Se a lombar cansar antes das costas, troque pela remada máquina com apoio.' }),
    desenvolvimento_maquina: E('Desenvolvimento máquina', ['desenvolvimento_maquina'], 'load', 'Deltoides, tríceps', [
      'Pegadas na altura dos ombros, costas no encosto.',
      'Empurre para cima até quase estender.',
      'Desça até a altura das orelhas.',
    ]),
    elevacao_lateral_cabo: E('Elevação lateral no cabo', ['elevacao_lateral_cabo'], 'load', 'Deltoide lateral', [
      'Polia baixa, cabo passando à frente do corpo.',
      'Eleve o braço lateralmente até a altura do ombro.',
      'O cabo mantém tensão também embaixo: desça devagar. Faça um lado de cada vez.',
    ]),
    crucifixo_invertido: E('Crucifixo invertido (deltoide posterior)', ['crucifixo_invertido'], 'load', 'Deltoide posterior, trapézio médio, romboides', [
      'Sentado na ponta do banco com o tronco inclinado à frente (ou na máquina voador invertido).',
      'Abra os braços para os lados com cotovelos levemente flexionados.',
      'Segure 1 s no topo e desça devagar.',
    ]),
    hack_squat: E('Hack squat (máquina)', ['hack_squat'], 'load', 'Quadríceps, glúteos', [
      'Costas e ombros apoiados, pés no meio da plataforma.',
      'Destrave e desça até ~90° ou abaixo, joelhos na direção dos pés.',
      'Suba empurrando a plataforma sem travar os joelhos.',
    ], { safety: 'Sempre recoloque as travas ao terminar.' }),
    agachamento_smith: E('Agachamento no Smith', ['agachamento_smith'], 'load', 'Quadríceps, glúteos', [
      'Barra no trapézio, pés um pouco à frente da linha da barra.',
      'Desça até a coxa ficar paralela.',
      'As travas do Smith permitem ir perto da falha com mais segurança.',
    ]),
    agachamento_frontal: E('Agachamento frontal', ['agachamento_frontal'], 'load', 'Quadríceps, glúteos, core', [
      'Barra apoiada na frente dos ombros, cotovelos altos.',
      'Tronco bem ereto durante toda a descida.',
      'Desça fundo e suba mantendo os cotovelos para cima.',
    ]),
    cadeira_adutora: E('Cadeira adutora', ['cadeira_adutora'], 'load', 'Adutores (parte interna da coxa)', [
      'Apoios por dentro dos joelhos, costas no encosto.',
      'Feche as pernas e segure 1 s.',
      'Volte devagar até sentir o alongamento.',
    ]),
    rosca_inclinada: E('Rosca inclinada com halteres', ['rosca_inclinada'], 'load', 'Bíceps (cabeça longa)', [
      'Banco a ~45–60°, braços pendurados atrás da linha do corpo.',
      'Suba sem levar os cotovelos para frente.',
      'Trabalha o bíceps bem alongado.',
    ]),
    rosca_cabo: E('Rosca no cabo', ['rosca_cabo'], 'load', 'Bíceps', [
      'Polia baixa, barra ou corda.',
      'Cotovelos fixos ao lado do corpo.',
      'Tensão constante: ótimo para drop-sets.',
    ]),
    triceps_coice: E('Tríceps coice (kickback)', ['triceps_coice'], 'load', 'Tríceps', [
      'Tronco inclinado com apoio no banco, braço colado ao corpo e paralelo ao chão.',
      'Estenda o cotovelo até o braço ficar reto e segure 1 s.',
      'Volte sem mover o braço.',
    ]),
    abdominal_polia: E('Abdominal na polia (ajoelhado)', ['abdominal_polia'], 'load', 'Reto abdominal', [
      'Ajoelhado de frente para a polia alta, corda junto à cabeça.',
      'Enrole o tronco levando os cotovelos em direção às coxas.',
      'O quadril não se move: o movimento é da coluna. Dá para progredir carga como em qualquer exercício.',
    ]),
  });

  // ------------------------------------------------------------- EMAGRECIMENTO, CORE, MOBILIDADE, PESO CORPORAL E FUNCIONAL
  // Gasto calórico: o que mais pesa é o volume semanal de atividade + déficit calórico; musculação mantém a massa magra
  // enquanto se perde gordura (ACSM 2009; Willis et al., 2012). Cardio contínuo moderado e intervalado (HIIT) somam.
  const T = { type: 'time' };
  const SIDE = { perSide: true, sideLabel: 'lado' };
  const LEG = { perSide: true };
  Object.assign(EXTRA, {
    // ---- cardio em máquina (tempo em minutos)
    bike_ergometrica: E('Bicicleta ergométrica', ['bike_ergometrica'], 'none', 'Quadríceps, glúteos, condicionamento', [
      'Selim na altura do quadril: com o pedal embaixo, o joelho fica levemente flexionado.',
      'Ritmo em que dá para falar frases curtas (zona 2) no contínuo; nos tiros, forte de verdade.',
      'Baixo impacto: ótima para quem tem sobrepeso ou dor no joelho ao correr.',
    ], T),
    eliptico: E('Elíptico (transport)', ['eliptico'], 'none', 'Corpo todo, condicionamento', [
      'Postura ereta, pés inteiros nos pedais, empurre e puxe as alças junto com as pernas.',
      'Ajuste a carga para manter um ritmo constante sem “quicar”.',
      'Baixo impacto nas articulações; bom para volume de cardio diário.',
    ], T),
    remo_ergometro: E('Remo ergômetro', ['remo_ergometro'], 'none', 'Costas, pernas, glúteos, condicionamento', [
      'Ordem na puxada: pernas → tronco → braços. Na volta: braços → tronco → pernas.',
      'Cerca de 60% da força vem das pernas; não puxe só com os braços.',
      'Coluna neutra; termine com o cabo na altura da parte baixa do peito.',
    ], T),
    escada: E('Simulador de escada', ['escada'], 'none', 'Glúteos, quadríceps, panturrilhas, condicionamento', [
      'Tronco quase ereto, mãos apenas apoiadas no corrimão (não pendure o peso do corpo).',
      'Apoie o pé inteiro em cada degrau e empurre pelo calcanhar.',
      'Gasta muita energia em pouco tempo: comece com 10 min.',
    ], T),
    caminhada_inclinada: E('Caminhada inclinada na esteira', ['caminhada_inclinada'], 'none', 'Glúteos, panturrilhas, posterior, condicionamento', [
      'Inclinação de 8–15% e velocidade de caminhada firme (5–6 km/h).',
      'Não segure no painel: braços balançam naturalmente.',
      'Cardio de baixo impacto que não atrapalha a recuperação da musculação.',
    ], T),
    step_aerobico: E('Step aeróbico (sobe e desce)', ['step_aerobico'], 'none', 'Quadríceps, glúteos, condicionamento', [
      'Suba com um pé, depois o outro; desça na mesma ordem.',
      'Pé inteiro no step, joelho na direção da ponta do pé.',
      'Troque a perna que inicia a cada minuto.',
    ], T),
    marcha_estacionaria: E('Marcha estacionária', ['marcha_estacionaria'], 'none', 'Condicionamento, flexores do quadril', [
      'Marche no lugar elevando os joelhos até a altura do quadril.',
      'Braços acompanham o movimento, ritmo constante.',
      'Opção sem impacto para começar ou para dias leves.',
    ], T),
    // ---- cardio com o peso do corpo / HIIT
    skipping: E('Skipping (corrida estacionária joelho alto)', ['skipping'], 'none', 'Condicionamento, quadríceps, panturrilhas', [
      'Corra no lugar levando os joelhos à altura do quadril.',
      'Pise na ponta dos pés, tronco ereto, braços rápidos.',
    ], T),
    afundo_salto: E('Afundo com salto (troca no ar)', ['afundo_salto'], 'none', 'Quadríceps, glúteos, potência', [
      'Comece em posição de afundo, salte e troque as pernas no ar.',
      'Aterrisse suave, joelho da frente alinhado com o pé.',
      'Muito intenso: use em circuitos curtos.',
    ], LEG),
    agachamento_salto: E('Agachamento com salto', ['agachamento_salto'], 'none', 'Quadríceps, glúteos, panturrilhas', [
      'Agache até perto da paralela e salte o mais alto possível.',
      'Aterrisse com os joelhos flexionados e já emende a próxima repetição.',
    ]),
    sprawl: E('Sprawl (burpee sem flexão)', ['sprawl'], 'none', 'Corpo todo, condicionamento', [
      'Apoie as mãos, jogue as pernas para trás e encoste o quadril perto do chão.',
      'Volte os pés para perto das mãos e levante. Ritmo rápido.',
    ]),
    corda_naval: E('Corda naval (battle rope)', ['corda_naval'], 'none', 'Ombros, core, condicionamento', [
      'Meio agachamento, abdômen firme, cordas uma em cada mão.',
      'Ondas alternadas rápidas usando ombros e braços; as ondas devem chegar à ancoragem.',
    ], T),
    bear_crawl: E('Bear crawl (caminhada do urso)', ['bear_crawl'], 'none', 'Core, ombros, quadríceps', [
      'Em quatro apoios com os joelhos a 2–3 cm do chão.',
      'Ande movendo mão e pé opostos ao mesmo tempo, costas retas e quadril baixo.',
    ], T),
    boxe_sombra: E('Boxe de sombra', ['boxe_sombra'], 'none', 'Ombros, core, condicionamento', [
      'Base de luta, guarda alta, queixo baixo.',
      'Socos rápidos alternados (jab, direto), girando o quadril, e volte à guarda.',
      'Em rounds de 1–3 min com 30 s de descanso.',
    ], T),
    treno: E('Empurrar trenó (sled push)', ['treno'], 'load', 'Quadríceps, glúteos, panturrilhas, condicionamento', [
      'Tronco inclinado a ~45°, braços estendidos nas alças.',
      'Passadas curtas e fortes empurrando o chão.',
      'Sem fase excêntrica: dá pouca dor muscular e combina com qualquer treino.',
    ], { type: 'distance' }),
    wall_ball: E('Wall ball', ['wall_ball'], 'load', 'Quadríceps, glúteos, ombros, condicionamento', [
      'Bola na altura do peito, agache até a paralela.',
      'Suba explosivo e lance a bola no alvo da parede (2,7–3 m).',
      'Receba a bola já descendo para o próximo agachamento.',
    ]),
    slam_ball: E('Slam ball (arremesso no chão)', ['slam_ball'], 'load', 'Core, dorsais, ombros, condicionamento', [
      'Eleve a bola acima da cabeça subindo na ponta dos pés.',
      'Arremesse com força no chão dobrando quadril e joelhos.',
      'Use bola própria (que não quica) e pegue-a com a coluna neutra.',
    ]),
    thruster: E('Thruster (agachamento + desenvolvimento)', ['thruster'], 'load', 'Quadríceps, glúteos, ombros, tríceps', [
      'Halteres ou barra apoiados nos ombros, agache fundo.',
      'Suba explosivo e use o impulso para empurrar a carga acima da cabeça.',
      'Desça a carga aos ombros já entrando no próximo agachamento.',
    ]),
    // ---- funcional com kettlebell
    kettlebell_clean: E('Kettlebell clean', ['kettlebell_clean'], 'load', 'Glúteos, posterior, ombros, pegada', [
      'Comece como no swing: dobradiça do quadril, kettlebell entre as pernas.',
      'Estenda o quadril e puxe o kettlebell rente ao corpo até a posição de rack (no ombro).',
      'Gire a mão por dentro para o kettlebell não bater no antebraço.',
    ], SIDE),
    kettlebell_press: E('Desenvolvimento com kettlebell (unilateral)', ['kettlebell_press'], 'load', 'Deltoides, tríceps, core', [
      'Kettlebell em rack no ombro, glúteos e abdômen contraídos.',
      'Empurre até estender o braço, bíceps perto da orelha.',
      'Desça controlando até o rack. Não arqueie a lombar.',
    ], SIDE),
    suitcase_carry: E('Suitcase carry (carregamento unilateral)', ['suitcase_carry'], 'load', 'Oblíquos, core, trapézio, pegada', [
      'Peso em uma só mão, como uma mala.',
      'Ande mantendo o tronco reto, sem inclinar para o lado do peso.',
      'Faça a mesma distância com cada mão.',
    ], { type: 'distance', perSide: true, sideLabel: 'lado' }),

    // ---- core
    dead_bug: E('Dead bug', ['dead_bug'], 'none', 'Core (transverso, reto abdominal)', [
      'Deitado, braços para o teto, quadris e joelhos a 90°.',
      'Estenda braço e perna opostos sem tirar a lombar do chão.',
      'Volte e troque o lado. Expire devagar ao estender.',
    ], SIDE),
    bird_dog: E('Perdigueiro (bird dog)', ['bird_dog'], 'none', 'Core, lombar, glúteos', [
      'Quatro apoios: mãos sob os ombros, joelhos sob o quadril.',
      'Estenda braço e perna opostos até a linha do tronco, sem girar o quadril.',
      'Segure 2 s e troque. Excelente para a lombar.',
    ], SIDE),
    hollow_hold: E('Hollow hold (canoa)', ['hollow_hold'], 'none', 'Core, reto abdominal', [
      'Deitado, lombar colada no chão.',
      'Tire ombros e pernas do chão, braços estendidos para trás.',
      'Difícil? Dobre os joelhos ou traga os braços para frente.',
    ], T),
    russian_twist: E('Rotação russa (russian twist)', ['russian_twist'], 'bw', 'Oblíquos, core', [
      'Sentado, tronco inclinado para trás, pés no chão (ou suspensos para dificultar).',
      'Gire o tronco levando as mãos (ou a anilha) de um lado ao outro.',
      'O movimento vem do tronco, não só dos braços. Conte cada lado como 1 repetição.',
    ]),
    abdominal_bicicleta: E('Abdominal bicicleta', ['abdominal_bicicleta'], 'none', 'Oblíquos, reto abdominal', [
      'Deitado, mãos atrás da cabeça sem puxar o pescoço.',
      'Leve o cotovelo em direção ao joelho oposto enquanto estende a outra perna.',
      'Alterne devagar e controlado; cada lado conta 1.',
    ]),
    v_up: E('Abdominal canivete (V-up)', ['v_up'], 'none', 'Reto abdominal, flexores do quadril', [
      'Deitado com braços acima da cabeça e pernas estendidas.',
      'Suba tronco e pernas ao mesmo tempo e toque os pés.',
      'Desça controlando. Mais fácil: dobre os joelhos.',
    ]),
    shoulder_taps: E('Prancha com toque no ombro', ['shoulder_taps'], 'none', 'Core (anti-rotação), ombros', [
      'Prancha alta com os pés um pouco afastados.',
      'Toque o ombro oposto com uma mão sem balançar o quadril.',
      'Alterne os lados; cada toque conta 1.',
    ]),
    pallof_press: E('Pallof press', ['pallof_press'], 'bw', 'Core (anti-rotação), oblíquos', [
      'De lado para a polia (ou elástico) na altura do peito.',
      'Empurre as mãos à frente e segure 2 s sem deixar o tronco girar.',
      'Volte as mãos ao peito. Faça os dois lados.',
    ], SIDE),
    elevacao_joelhos_paralela: E('Elevação de joelhos na paralela (cadeira do capitão)', ['elevacao_joelhos_paralela'], 'none', 'Abdômen inferior, flexores do quadril', [
      'Antebraços nos apoios, costas no encosto.',
      'Eleve os joelhos até acima do quadril, enrolando levemente a pelve.',
      'Desça devagar sem balançar.',
    ]),
    flutter_kicks: E('Flutter kicks (tesoura alternada)', ['flutter_kicks'], 'none', 'Abdômen inferior, flexores do quadril', [
      'Deitado, mãos sob o quadril, lombar no chão.',
      'Pernas estendidas a um palmo do chão, alterne pequenas batidas para cima e para baixo.',
    ], T),

    // ---- mobilidade e alongamento
    gato_vaca: E('Gato-vaca', ['gato_vaca'], 'none', 'Mobilidade da coluna', [
      'Quatro apoios. Expire arredondando as costas (gato), queixo ao peito.',
      'Inspire afundando a coluna e olhando à frente (vaca).',
      'Movimento lento, sem forçar.',
    ]),
    crianca: E('Postura da criança', ['crianca'], 'none', 'Lombar, dorsais, quadril (alongamento)', [
      'Ajoelhado, sente sobre os calcanhares e leve o tronco à frente.',
      'Braços estendidos no chão, testa apoiada. Respire fundo.',
    ], T),
    cobra: E('Cobra (extensão da coluna)', ['cobra'], 'none', 'Abdômen e flexores do quadril (alongamento), coluna', [
      'Deitado de barriga para baixo, mãos sob os ombros.',
      'Empurre o chão erguendo o peito, quadril apoiado.',
      'Suba só até onde for confortável para a lombar.',
    ], T),
    alongamento_posterior: E('Alongamento de posterior (em pé)', ['alongamento_posterior'], 'none', 'Posterior de coxa, panturrilhas', [
      'Pés na largura do quadril, joelhos levemente flexionados.',
      'Dobre o quadril levando as mãos em direção aos pés, coluna relaxada.',
      'Respire e solte um pouco mais a cada expiração. Sem balançar.',
    ], T),
    alongamento_quadriceps: E('Alongamento de quadríceps (em pé)', ['alongamento_quadriceps'], 'none', 'Quadríceps, flexores do quadril', [
      'Segure o tornozelo atrás do corpo, joelhos juntos.',
      'Leve o quadril levemente à frente e contraia o glúteo.',
      'Apoie a outra mão na parede para o equilíbrio.',
    ], Object.assign({}, T, LEG)),
    alongamento_flexor: E('Alongamento do flexor do quadril (meio ajoelhado)', ['alongamento_flexor'], 'none', 'Flexores do quadril, quadríceps', [
      'Um joelho no chão, o outro pé à frente.',
      'Contraia o glúteo de trás e leve o quadril à frente; braços para cima intensificam.',
      'Ótimo para quem passa o dia sentado.',
    ], Object.assign({}, T, LEG)),
    alongamento_peitoral: E('Alongamento de peitoral (na parede/batente)', ['alongamento_peitoral'], 'none', 'Peitoral, deltoide anterior', [
      'Braço estendido para trás apoiado numa coluna ou batente, na altura do ombro.',
      'Gire o tronco para o lado oposto até sentir o peito alongar.',
    ], Object.assign({}, T, SIDE)),
    agachamento_profundo: E('Agachamento profundo (sustentado)', ['agachamento_profundo'], 'none', 'Mobilidade de quadril e tornozelo', [
      'Desça ao agachamento mais fundo possível com os calcanhares no chão.',
      'Cotovelos por dentro dos joelhos empurrando-os para fora, peito alto.',
      'Segure respirando. Calcanhar sobe? Use um apoio leve sob ele.',
    ], T),
    rotacao_toracica: E('Rotação torácica em quatro apoios', ['rotacao_toracica'], 'none', 'Mobilidade da coluna torácica, ombros', [
      'Quatro apoios, uma mão atrás da cabeça.',
      'Leve o cotovelo ao braço de apoio e depois gire abrindo o cotovelo para o teto.',
      'Siga o cotovelo com o olhar. Quadril parado.',
    ], SIDE),
    mobilidade_tornozelo: E('Mobilidade de tornozelo (joelho à parede)', ['mobilidade_tornozelo'], 'none', 'Mobilidade de tornozelo, panturrilha', [
      'Meio ajoelhado de frente para a parede, pé da frente a ~10 cm dela.',
      'Leve o joelho à frente até tocar a parede sem tirar o calcanhar do chão.',
      'Ficou fácil? Afaste um pouco o pé da parede.',
    ], LEG),

    // ---- peso corporal
    flexao_diamante: E('Flexão diamante', ['flexao_diamante'], 'bw', 'Tríceps, peitoral', [
      'Mãos juntas sob o peito formando um diamante com indicadores e polegares.',
      'Cotovelos rentes ao corpo durante a descida.',
      'Difícil? Faça com os joelhos apoiados.',
    ]),
    flexao_inclinada: E('Flexão inclinada (mãos no banco)', ['flexao_inclinada'], 'bw', 'Peitoral, tríceps', [
      'Mãos no banco ou degrau, corpo em linha reta.',
      'Quanto mais alto o apoio, mais fácil: ótima progressão para a flexão no chão.',
    ]),
    flexao_joelhos: E('Flexão com joelhos apoiados', ['flexao_joelhos'], 'none', 'Peitoral, tríceps', [
      'Joelhos no chão, corpo em linha reta dos joelhos à cabeça.',
      'Desça o peito até perto do chão e empurre.',
      'Quando fizer 3×15, passe para a flexão normal.',
    ]),
    pike_pushup: E('Flexão pike (ombros)', ['pike_pushup'], 'bw', 'Deltoides, tríceps', [
      'Quadril alto formando um “V” invertido, mãos um pouco à frente dos ombros.',
      'Dobre os cotovelos levando a cabeça à frente das mãos.',
      'Pés num banco deixam mais difícil (próximo passo: parada de mão).',
    ]),
    remada_invertida: E('Remada invertida (barra baixa)', ['remada_invertida'], 'bw', 'Dorsais, romboides, bíceps', [
      'Deitado sob uma barra baixa (Smith ou mesa firme), corpo reto, calcanhares no chão.',
      'Puxe o peito até a barra juntando as escápulas.',
      'Mais fácil: joelhos dobrados. Mais difícil: pés elevados.',
    ]),
    barra_supinada: E('Barra fixa supinada (chin-up)', ['barra_fixa'], 'bw', 'Dorsais, bíceps', [
      'Palmas voltadas para você, mãos na largura dos ombros.',
      'Puxe até o queixo passar a barra, levando o peito em direção a ela.',
      'Desça até estender os braços. Recruta mais bíceps que a pronada.',
    ], { type: 'max' }),
    cadeira_isometrica: E('Cadeira isométrica (wall sit)', ['cadeira_isometrica'], 'none', 'Quadríceps, glúteos', [
      'Costas na parede, desça até as coxas ficarem paralelas ao chão.',
      'Joelhos sobre os tornozelos. Segure respirando.',
    ], T),
    good_morning: E('Good morning (bom dia)', ['good_morning'], 'load', 'Posterior de coxa, glúteos, lombar', [
      'Barra no trapézio como no agachamento, joelhos levemente flexionados.',
      'Empurre o quadril para trás inclinando o tronco com a coluna neutra.',
      'Desça até sentir o posterior alongar e volte contraindo os glúteos.',
    ], { safety: 'Carga bem menor que a do agachamento. Pare antes da lombar arredondar.' }),
    flexao_nordica: E('Flexão nórdica', ['flexao_nordica'], 'bw', 'Posterior de coxa (excêntrico)', [
      'Ajoelhado com os tornozelos presos (parceiro ou apoio).',
      'Desça o corpo à frente o mais devagar possível, em linha reta do joelho à cabeça.',
      'Amorteça com as mãos e volte. Reduz o risco de lesão do posterior.',
    ], { safety: 'Comece com poucas repetições: causa muita dor muscular tardia.' }),
    ponte_unilateral: E('Ponte de glúteo unilateral', ['ponte_unilateral'], 'bw', 'Glúteos, posterior de coxa', [
      'Deitado, um pé no chão e a outra perna estendida.',
      'Empurre pelo calcanhar e suba o quadril até alinhar ombros, quadril e joelho.',
      'Segure 1 s sem deixar o quadril cair de lado.',
    ], LEG),
    agachamento_sumo: E('Agachamento sumô', ['agachamento_sumo'], 'bw', 'Glúteos, adutores, quadríceps', [
      'Pés bem afastados e pontas para fora, halter ou kettlebell entre as pernas.',
      'Desça com o tronco ereto empurrando os joelhos para fora.',
      'Suba contraindo glúteos e parte interna das coxas.',
    ]),

    // ---- pernas e glúteos
    afundo_reverso: E('Afundo reverso', ['afundo_reverso'], 'bw', 'Quadríceps, glúteos', [
      'Dê um passo para trás e desça até o joelho de trás quase tocar o chão.',
      'Empurre com a perna da frente para voltar.',
      'Mais fácil para o joelho do que o afundo à frente.',
    ], LEG),
    afundo_lateral: E('Afundo lateral', ['afundo_lateral'], 'bw', 'Quadríceps, glúteos, adutores', [
      'Pés bem afastados. Desça para um lado dobrando o joelho e empurrando o quadril para trás.',
      'A outra perna fica estendida, pés apontando à frente.',
      'Volte empurrando o chão e alterne.',
    ], LEG),
    passada_lateral: E('Passada lateral com elástico', ['passada_lateral'], 'none', 'Glúteo médio, quadril', [
      'Mini band acima dos joelhos ou nos tornozelos, meio agachamento.',
      'Passos laterais mantendo tensão no elástico, joelhos para fora.',
      'Ótimo aquecimento para pernas e para a estabilidade do joelho.',
    ], SIDE),
    coice_quatro_apoios: E('Coice de glúteo em quatro apoios', ['coice_quatro_apoios'], 'bw', 'Glúteos', [
      'Quatro apoios, joelho a 90°.',
      'Eleve a perna empurrando a sola do pé para o teto, sem arquear a lombar.',
      'Use caneleira ou elástico para progredir.',
    ], LEG),
    agachamento_cadeira: E('Agachamento na cadeira (sentar e levantar)', ['agachamento_cadeira'], 'bw', 'Quadríceps, glúteos', [
      'Cadeira firme atrás de você, pés na largura do quadril.',
      'Desça até encostar levemente o glúteo e suba sem usar as mãos.',
      'Primeiro passo para o agachamento livre; ideal para iniciantes e idosos.',
    ]),

    // ---- membros superiores
    remada_alta: E('Remada alta', ['remada_alta'], 'load', 'Deltoide lateral, trapézio', [
      'Barra ou halteres à frente das coxas, pegada um pouco mais aberta que os ombros.',
      'Puxe até a altura do peito levando os cotovelos para cima e para fora.',
      'Não passe muito da altura dos ombros se sentir desconforto.',
    ]),
    elevacao_y: E('Elevação em Y (banco inclinado)', ['elevacao_y'], 'bw', 'Trapézio inferior, deltoides, manguito', [
      'Peito apoiado num banco inclinado, halteres leves.',
      'Eleve os braços estendidos formando um “Y”, polegares para cima.',
      'Ótimo para postura e saúde do ombro. Carga bem leve.',
    ]),
    rosca_inversa: E('Rosca inversa (pegada pronada)', ['rosca_direta'], 'load', 'Braquiorradial, antebraço, bíceps', [
      'Pegada por cima (palmas para baixo) na barra.',
      'Suba sem mover os cotovelos e desça devagar.',
      'Fortalece antebraço e pegada.',
    ]),
  });

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


  Object.assign(META, {
    pullover: ['costas', ['peito'], ['halteres', 'banco'], 'intermediario', [3, 10, 12, 60]],
    desenvolvimento_arnold: ['ombros', ['triceps'], ['halteres', 'banco'], 'intermediario', [4, 8, 12, 90]],
    encolhimento_barra: ['costas', ['antebraco'], ['barra'], 'iniciante', [4, 8, 12, 60]],
    supino_maquina: ['peito', ['triceps', 'ombros'], ['maquina'], 'iniciante', [3, 8, 12, 90]],
    supino_declinado: ['peito', ['triceps'], ['barra', 'banco'], 'intermediario', [3, 6, 10, 120]],
    supino_halteres: ['peito', ['triceps', 'ombros'], ['halteres', 'banco'], 'iniciante', [3, 8, 12, 90]],
    supino_inclinado_barra: ['peito', ['ombros', 'triceps'], ['barra', 'banco'], 'intermediario', [4, 6, 10, 120]],
    crucifixo: ['peito', [], ['halteres', 'banco'], 'iniciante', [3, 10, 15, 60]],
    remada_maquina: ['costas', ['biceps'], ['maquina'], 'iniciante', [3, 8, 12, 90]],
    remada_cavalinho: ['costas', ['biceps', 'ombros'], ['barra', 'maquina'], 'intermediario', [4, 6, 10, 120]],
    desenvolvimento_maquina: ['ombros', ['triceps'], ['maquina'], 'iniciante', [3, 8, 12, 90]],
    elevacao_lateral_cabo: ['ombros', [], ['cabo'], 'iniciante', [3, 12, 15, 45]],
    crucifixo_invertido: ['ombros', ['costas'], ['halteres', 'maquina'], 'iniciante', [3, 12, 15, 60]],
    hack_squat: ['quadriceps', ['gluteos'], ['maquina'], 'iniciante', [4, 8, 12, 120]],
    agachamento_smith: ['quadriceps', ['gluteos'], ['maquina'], 'iniciante', [3, 8, 12, 120]],
    agachamento_frontal: ['quadriceps', ['gluteos', 'core'], ['barra'], 'avancado', [3, 4, 8, 180]],
    cadeira_adutora: ['quadriceps', [], ['maquina'], 'iniciante', [3, 12, 15, 45]],
    rosca_inclinada: ['biceps', [], ['halteres', 'banco'], 'iniciante', [3, 10, 12, 60]],
    rosca_cabo: ['biceps', [], ['cabo'], 'iniciante', [3, 12, 15, 45]],
    triceps_coice: ['triceps', [], ['halteres', 'banco'], 'iniciante', [3, 12, 15, 45]],
    abdominal_polia: ['core', [], ['cabo'], 'iniciante', [3, 10, 15, 45]],
  });

  Object.assign(META, {
    bike_ergometrica: ['cardio', ['quadriceps'], ['bicicleta'], 'iniciante', [1, 1200, 1800, 60]],
    eliptico: ['cardio', [], ['eliptico'], 'iniciante', [1, 1200, 1800, 60]],
    remo_ergometro: ['cardio', ['costas'], ['remo'], 'iniciante', [1, 600, 1200, 60]],
    escada: ['cardio', ['gluteos'], ['simulador_escada'], 'intermediario', [1, 600, 1200, 60]],
    caminhada_inclinada: ['cardio', ['gluteos'], ['esteira'], 'iniciante', [1, 1200, 2400, 60]],
    step_aerobico: ['cardio', ['quadriceps'], ['step'], 'iniciante', [3, 180, 300, 60]],
    marcha_estacionaria: ['cardio', [], ['peso_corporal'], 'iniciante', [3, 60, 120, 30]],
    skipping: ['cardio', ['quadriceps'], ['peso_corporal'], 'iniciante', [4, 30, 40, 30]],
    afundo_salto: ['potencia', ['quadriceps', 'gluteos'], ['peso_corporal'], 'intermediario', [3, 6, 10, 60]],
    agachamento_salto: ['potencia', ['quadriceps', 'gluteos'], ['peso_corporal'], 'iniciante', [4, 8, 12, 60]],
    sprawl: ['cardio', ['core'], ['peso_corporal'], 'iniciante', [4, 8, 12, 45]],
    corda_naval: ['cardio', ['ombros', 'core'], ['corda_naval'], 'intermediario', [5, 20, 30, 40]],
    bear_crawl: ['core', ['ombros', 'quadriceps'], ['peso_corporal'], 'iniciante', [4, 20, 30, 40]],
    boxe_sombra: ['cardio', ['ombros'], ['peso_corporal'], 'iniciante', [3, 120, 180, 30]],
    treno: ['cardio', ['quadriceps', 'gluteos'], ['treno'], 'intermediario', [4, 20, 30, 90]],
    wall_ball: ['cardio', ['quadriceps', 'ombros'], ['medicine_ball'], 'intermediario', [4, 12, 20, 60]],
    slam_ball: ['cardio', ['core', 'costas'], ['medicine_ball'], 'iniciante', [4, 10, 15, 45]],
    thruster: ['quadriceps', ['ombros', 'gluteos'], ['halteres', 'barra'], 'intermediario', [4, 8, 12, 90]],
    kettlebell_clean: ['gluteos', ['posterior', 'ombros'], ['kettlebell'], 'intermediario', [4, 6, 10, 75]],
    kettlebell_press: ['ombros', ['triceps', 'core'], ['kettlebell'], 'intermediario', [3, 6, 10, 75]],
    suitcase_carry: ['core', ['antebraco'], ['halteres', 'kettlebell'], 'iniciante', [3, 20, 30, 60]],
    dead_bug: ['core', [], ['peso_corporal'], 'iniciante', [3, 8, 12, 45]],
    bird_dog: ['core', ['gluteos'], ['peso_corporal'], 'iniciante', [3, 8, 12, 45]],
    hollow_hold: ['core', [], ['peso_corporal'], 'intermediario', [3, 20, 40, 45]],
    russian_twist: ['core', [], ['peso_corporal'], 'iniciante', [3, 16, 24, 45]],
    abdominal_bicicleta: ['core', [], ['peso_corporal'], 'iniciante', [3, 20, 30, 45]],
    v_up: ['core', [], ['peso_corporal'], 'intermediario', [3, 10, 15, 45]],
    shoulder_taps: ['core', ['ombros'], ['peso_corporal'], 'iniciante', [3, 16, 24, 45]],
    pallof_press: ['core', [], ['cabo', 'elastico'], 'iniciante', [3, 10, 12, 45]],
    elevacao_joelhos_paralela: ['core', [], ['maquina', 'paralelas'], 'iniciante', [3, 10, 15, 45]],
    flutter_kicks: ['core', [], ['peso_corporal'], 'iniciante', [3, 20, 40, 30]],
    gato_vaca: ['mobilidade', [], ['peso_corporal'], 'iniciante', [2, 8, 10, 15]],
    crianca: ['mobilidade', [], ['peso_corporal'], 'iniciante', [2, 30, 60, 15]],
    cobra: ['mobilidade', [], ['peso_corporal'], 'iniciante', [2, 20, 30, 15]],
    alongamento_posterior: ['mobilidade', [], ['peso_corporal'], 'iniciante', [2, 30, 45, 15]],
    alongamento_quadriceps: ['mobilidade', [], ['peso_corporal'], 'iniciante', [2, 30, 45, 15]],
    alongamento_flexor: ['mobilidade', [], ['peso_corporal'], 'iniciante', [2, 30, 45, 15]],
    alongamento_peitoral: ['mobilidade', [], ['peso_corporal'], 'iniciante', [2, 30, 45, 15]],
    agachamento_profundo: ['mobilidade', [], ['peso_corporal'], 'iniciante', [2, 30, 60, 20]],
    rotacao_toracica: ['mobilidade', [], ['peso_corporal'], 'iniciante', [2, 8, 10, 15]],
    mobilidade_tornozelo: ['mobilidade', [], ['peso_corporal'], 'iniciante', [2, 10, 12, 15]],
    flexao_diamante: ['triceps', ['peito'], ['peso_corporal'], 'intermediario', [3, 8, 15, 60]],
    flexao_inclinada: ['peito', ['triceps'], ['peso_corporal', 'banco'], 'iniciante', [3, 10, 15, 60]],
    flexao_joelhos: ['peito', ['triceps'], ['peso_corporal'], 'iniciante', [3, 8, 15, 60]],
    pike_pushup: ['ombros', ['triceps'], ['peso_corporal'], 'intermediario', [3, 6, 12, 90]],
    remada_invertida: ['costas', ['biceps'], ['peso_corporal', 'barra'], 'iniciante', [3, 8, 12, 60]],
    barra_supinada: ['costas', ['biceps'], ['barra_fixa'], 'intermediario', [4, 0, 0, 120]],
    cadeira_isometrica: ['quadriceps', ['gluteos'], ['peso_corporal'], 'iniciante', [3, 30, 60, 45]],
    good_morning: ['posterior', ['gluteos', 'costas'], ['barra'], 'intermediario', [3, 8, 12, 90]],
    flexao_nordica: ['posterior', [], ['peso_corporal'], 'avancado', [3, 4, 8, 120]],
    ponte_unilateral: ['gluteos', ['posterior'], ['peso_corporal'], 'iniciante', [3, 10, 15, 45]],
    agachamento_sumo: ['gluteos', ['quadriceps'], ['halteres', 'kettlebell'], 'iniciante', [3, 10, 15, 75]],
    afundo_reverso: ['quadriceps', ['gluteos'], ['peso_corporal', 'halteres'], 'iniciante', [3, 8, 12, 75]],
    afundo_lateral: ['quadriceps', ['gluteos'], ['peso_corporal', 'halteres'], 'iniciante', [3, 8, 12, 60]],
    passada_lateral: ['gluteos', [], ['elastico'], 'iniciante', [3, 12, 15, 45]],
    coice_quatro_apoios: ['gluteos', ['posterior'], ['peso_corporal', 'elastico'], 'iniciante', [3, 12, 20, 45]],
    agachamento_cadeira: ['quadriceps', ['gluteos'], ['peso_corporal'], 'iniciante', [3, 10, 15, 60]],
    remada_alta: ['ombros', ['costas'], ['barra', 'halteres'], 'iniciante', [3, 10, 12, 60]],
    elevacao_y: ['ombros', ['costas'], ['halteres', 'banco'], 'iniciante', [3, 10, 15, 45]],
    rosca_inversa: ['antebraco', ['biceps'], ['barra'], 'iniciante', [3, 10, 15, 60]],
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
    id: 'toji', focus: 'forca', short: 'Toji (5 dias)', level: 'intermediario', daysPerWeek: 5, place: 'academia', goal: 'força + hipertrofia',
    description: 'Força pesada, potência e condicionamento inspirados no Toji Fushiguro. Para quem já tem base de treino.',
  });

  const PROGRAMS = [
    {
      id: 'fullbody3', focus: 'massa', name: 'Full Body 3x – Iniciante', short: 'Full Body 3x', level: 'iniciante', daysPerWeek: 3, place: 'academia',
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
      id: 'abc', focus: 'massa', name: 'ABC – Iniciante/Intermediário', short: 'ABC', level: 'iniciante', daysPerWeek: 3, place: 'academia',
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
      id: 'upperlower', focus: 'forca', name: 'Upper/Lower 4x – Intermediário', short: 'Upper/Lower', level: 'intermediario', daysPerWeek: 4, place: 'academia',
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
      id: 'abcd', focus: 'massa', name: 'ABCD – Intermediário', short: 'ABCD', level: 'intermediario', daysPerWeek: 4, place: 'academia', goal: 'hipertrofia',
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
      id: 'ppl', focus: 'massa', name: 'Push/Pull/Legs – Avançado (6 dias)', short: 'PPL 6x', level: 'avancado', daysPerWeek: 6, place: 'academia', goal: 'hipertrofia',
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

    {
      id: 'phul', name: 'Força + Hipertrofia 4x (Superior/Inferior)', short: 'Força+Hipertrofia', level: 'intermediario', daysPerWeek: 4,
      place: 'academia', goal: 'força + massa', focus: 'forca',
      description: 'Dois dias de força (3–5 reps, descanso longo) e dois de hipertrofia (8–15 reps com técnicas de intensidade). Ex.: seg força sup., ter força inf., qui hipertrofia sup., sex hipertrofia inf.',
      days: [
        day('phul', 'uf', 'Superior Força', 'Pesado: 3–5 reps', [
          ['supino_reto', 4, 3, 5, 180, '1ª série = série-topo pesada; demais −10%'], ['remada_curvada', 4, 3, 5, 180], ['desenvolvimento', 3, 5, 8, 150],
          ['barra_fixa', 3, 0, 0, 150, 'Use carga se passar de 10 reps'], ['rosca_direta', 2, 6, 10, 90], ['triceps_testa', 2, 6, 10, 90]]),
        day('phul', 'lf', 'Inferior Força', 'Pesado: 3–5 reps', [
          ['agachamento', 4, 3, 5, 180, '1ª série = série-topo pesada; demais −10%'], ['terra', 3, 3, 5, 240], ['leg_press', 4, 8, 12, 120],
          ['cadeira_flexora', 4, 6, 10, 90], ['panturrilha_pe', 4, 6, 10, 60]]),
        day('phul', 'uh', 'Superior Hipertrofia', 'Volume: 8–15 reps', [
          ['supino_inclinado', 4, 8, 12, 90], ['supino_maquina', 3, 10, 12, 90, 'Última série: drop-set (−20–30% e continue até a falha)'], ['crucifixo', 3, 12, 15, 60],
          ['remada_maquina', 4, 8, 12, 90], ['puxada_alta', 3, 10, 12, 90], ['elevacao_lateral_cabo', 3, 12, 15, 45, 'Última série: rest-pause (falha, 15 s, mais reps)'],
          ['rosca_inclinada', 3, 10, 12, 60], ['triceps_corda', 3, 12, 15, 60, 'Última série: drop-set (−20–30% e continue até a falha)']]),
        day('phul', 'lh', 'Inferior Hipertrofia', 'Volume: 8–15 reps', [
          ['hack_squat', 4, 8, 12, 120], ['stiff', 3, 8, 12, 90], ['cadeira_extensora', 4, 10, 15, 60, 'Última série: drop-set (−20–30% e continue até a falha)'],
          ['mesa_flexora', 4, 10, 12, 60], ['elevacao_pelvica', 3, 8, 12, 90], ['panturrilha_sentado', 4, 12, 15, 45]]),
      ],
    },
    {
      id: 'forca5x5', name: 'Força 5×5 (3 dias)', short: 'Força 5×5', level: 'iniciante', daysPerWeek: 3, place: 'academia',
      goal: 'força', focus: 'forca',
      description: 'Clássico de força linear: alterne A e B em 3 dias não seguidos (A-B-A, depois B-A-B). Fechou 5×5? Suba a carga na próxima sessão. Travou 3 vezes seguidas? Reduza 10% e suba de novo.',
      days: [
        day('f55', 'a', 'Treino A', 'Agachamento, supino, remada', [
          ['agachamento', 5, 5, 5, 180], ['supino_reto', 5, 5, 5, 180], ['remada_curvada', 5, 5, 5, 150], ['prancha', 3, 45, 60, 45]]),
        day('f55', 'b', 'Treino B', 'Agachamento, desenvolvimento, terra', [
          ['agachamento', 5, 5, 5, 180], ['desenvolvimento', 5, 5, 5, 180], ['terra', 1, 5, 5, 240, 'Uma série pesada após aquecer bem'],
          ['barra_fixa', 3, 0, 0, 120]]),
      ],
    },
    {
      id: 'powerlifting', name: 'Força máxima: agachamento, supino e terra (4 dias)', short: 'Força máxima', level: 'avancado', daysPerWeek: 4,
      place: 'academia', goal: 'força máxima', focus: 'forca',
      description: 'Foco nos três levantamentos. Dias pesados em 2–3 reps (~85–90% do 1RM) e dias de volume (~70–75%). Faça deload a cada 4–6 semanas. Use o 1RM estimado do app para calcular as cargas.',
      days: [
        day('pl', 'sq', 'Agachamento pesado', 'Força: 3 reps', [
          ['agachamento', 5, 3, 3, 240, '~85% do 1RM'], ['agachamento_frontal', 3, 5, 5, 180], ['stiff', 3, 6, 8, 120],
          ['abdominal_polia', 3, 10, 12, 60]]),
        day('pl', 'bp', 'Supino pesado', 'Força: 3 reps', [
          ['supino_reto', 5, 3, 3, 240, '~85% do 1RM, pausa de 1 s no peito'], ['supino_fechado', 3, 6, 6, 180],
          ['remada_curvada', 4, 6, 8, 120], ['desenvolvimento_halteres', 3, 8, 8, 90], ['triceps_testa', 3, 8, 10, 90]]),
        day('pl', 'dl', 'Terra pesado', 'Força: 2–3 reps', [
          ['terra', 5, 2, 3, 300, '~85–90% do 1RM'], ['agachamento', 3, 6, 8, 180, '~70% do 1RM'], ['barra_fixa', 4, 0, 0, 120],
          ['hiperextensao', 3, 10, 12, 60], ['prancha', 3, 45, 60, 45]]),
        day('pl', 'bv', 'Supino volume', 'Volume: 6–8 reps', [
          ['supino_reto', 4, 6, 8, 180, '~75% do 1RM'], ['supino_inclinado_barra', 3, 6, 8, 150], ['remada_cavalinho', 4, 8, 10, 120],
          ['face_pull', 3, 15, 15, 60], ['rosca_direta', 3, 8, 10, 60], ['elevacao_lateral', 3, 12, 15, 45]]),
      ],
    },
    {
      id: 'maquinas5', name: 'Hipertrofia academia completa (5 dias)', short: 'Academia 5x', level: 'intermediario', daysPerWeek: 5,
      place: 'academia', goal: 'massa muscular', focus: 'massa',
      description: 'Um grupo grande por dia com máquinas, cabos e pesos livres. Muito volume por sessão e técnicas de intensidade nas últimas séries. Ideal para academia bem equipada.',
      days: [
        day('mq', 'pe', 'Peito', 'Peito + abdômen', [
          ['supino_inclinado_barra', 4, 6, 10, 150], ['supino_maquina', 4, 8, 12, 90], ['supino_declinado', 3, 8, 10, 120],
          ['voador', 3, 12, 15, 60, 'Última série: drop-set (−20–30% e continue até a falha)'], ['crossover', 3, 12, 15, 60], ['abdominal_polia', 4, 10, 15, 45]]),
        day('mq', 'co', 'Costas', 'Costas + lombar', [
          ['barra_fixa', 4, 0, 0, 120], ['remada_cavalinho', 4, 6, 10, 120], ['puxada_alta', 4, 8, 12, 90],
          ['remada_maquina', 3, 10, 12, 90, 'Última série: drop-set (−20–30% e continue até a falha)'], ['pulldown_reto', 3, 12, 15, 60], ['hiperextensao', 3, 12, 15, 60]]),
        day('mq', 'pn', 'Pernas', 'Quadríceps, posterior, adutores, panturrilha', [
          ['hack_squat', 4, 6, 10, 150], ['leg_press', 4, 10, 15, 120], ['cadeira_extensora', 3, 12, 15, 60, 'Última série: drop-set (−20–30% e continue até a falha)'],
          ['cadeira_flexora', 4, 10, 12, 60], ['stiff', 3, 8, 12, 90], ['cadeira_adutora', 3, 12, 15, 45], ['panturrilha_sentado', 4, 12, 15, 45]]),
        day('mq', 'om', 'Ombros', 'Ombros + trapézio', [
          ['desenvolvimento_maquina', 4, 8, 12, 90], ['elevacao_lateral_cabo', 4, 12, 15, 45], ['elevacao_lateral', 3, 15, 20, 45, 'Última série: rest-pause (falha, 15 s, mais reps)'],
          ['crucifixo_invertido', 4, 12, 15, 60], ['face_pull', 3, 15, 15, 60], ['encolhimento', 4, 10, 12, 60]]),
        day('mq', 'br', 'Braços', 'Bíceps + tríceps (bi-set)', [
          ['rosca_direta', 4, 8, 10, 60, 'Bi-set com o próximo'], ['triceps_testa', 4, 8, 10, 90],
          ['rosca_inclinada', 3, 10, 12, 60, 'Bi-set com o próximo'], ['triceps_corda', 3, 12, 15, 60],
          ['rosca_cabo', 3, 12, 15, 45, 'Última série: drop-set (−20–30% e continue até a falha)'], ['triceps_coice', 3, 12, 15, 45], ['rosca_martelo', 3, 10, 12, 60]]),
      ],
    },
    {
      id: 'arnold', name: 'Arnold split 6x – Avançado', short: 'Arnold 6x', level: 'avancado', daysPerWeek: 6, place: 'academia',
      goal: 'massa muscular (alto volume)', focus: 'massa',
      description: 'Peito+Costas / Ombros+Braços / Pernas, duas vezes por semana com variações. Volume muito alto (~18–25 séries por músculo). Só para quem recupera bem: durma, coma e faça deload a cada 4–6 semanas.',
      days: [
        day('ar', 'pc1', 'Peito + Costas A', 'Pesado', [
          ['supino_reto', 4, 6, 10, 150], ['barra_fixa', 4, 0, 0, 120], ['supino_inclinado', 4, 8, 12, 90],
          ['remada_curvada', 4, 8, 10, 120], ['crucifixo', 3, 10, 15, 60], ['pulldown_reto', 3, 12, 15, 60], ['abdominal_polia', 3, 12, 15, 45]]),
        day('ar', 'ob1', 'Ombros + Braços A', 'Pesado', [
          ['desenvolvimento', 4, 6, 10, 150], ['elevacao_lateral', 4, 12, 15, 45], ['crucifixo_invertido', 3, 12, 15, 60],
          ['rosca_direta', 4, 8, 10, 60], ['triceps_testa', 4, 8, 10, 90], ['rosca_martelo', 3, 10, 12, 60], ['triceps_corda', 3, 12, 15, 60, 'Última série: drop-set (−20–30% e continue até a falha)']]),
        day('ar', 'pn1', 'Pernas A', 'Agachamento', [
          ['agachamento', 5, 5, 8, 180], ['stiff', 4, 8, 10, 120], ['leg_press', 3, 10, 15, 120],
          ['cadeira_flexora', 3, 10, 12, 60], ['panturrilha_pe', 5, 10, 15, 45], ['abdominal_infra', 3, 15, 15, 45]]),
        day('ar', 'pc2', 'Peito + Costas B', 'Volume', [
          ['supino_inclinado_barra', 4, 6, 10, 150], ['remada_cavalinho', 4, 6, 10, 120], ['supino_halteres', 3, 8, 12, 90],
          ['puxada_alta', 3, 10, 12, 90], ['crossover', 3, 12, 15, 60, 'Última série: drop-set (−20–30% e continue até a falha)'], ['remada_maquina', 3, 10, 12, 90], ['roda_abdominal', 3, 8, 12, 60]]),
        day('ar', 'ob2', 'Ombros + Braços B', 'Volume', [
          ['desenvolvimento_halteres', 4, 8, 12, 90], ['elevacao_lateral_cabo', 4, 12, 15, 45, 'Última série: rest-pause (falha, 15 s, mais reps)'], ['face_pull', 3, 15, 15, 60],
          ['rosca_inclinada', 3, 10, 12, 60], ['triceps_frances', 3, 10, 12, 60], ['rosca_cabo', 3, 12, 15, 45], ['triceps_coice', 3, 12, 15, 45]]),
        day('ar', 'pn2', 'Pernas B', 'Hack + terra', [
          ['hack_squat', 4, 8, 12, 120], ['terra', 3, 3, 5, 240], ['bulgaro', 3, 8, 10, 90],
          ['mesa_flexora', 3, 10, 12, 60], ['cadeira_extensora', 3, 12, 15, 60, 'Última série: drop-set (−20–30% e continue até a falha)'], ['panturrilha_sentado', 4, 12, 15, 45]]),
      ],
    },

    {
      id: 'minimal2', focus: 'massa', name: 'Minimalista 2x (40 min)', short: 'Minimalista 2x', level: 'iniciante', daysPerWeek: 2, place: 'academia',
      goal: 'saúde + massa', description: 'Para semanas corridas: 2 treinos de corpo todo com os básicos que dão mais resultado por minuto. Faça em dias separados (ex.: ter/sex).',
      days: [
        day('min2', 'a', 'Treino A', 'Corpo todo', [
          ['agachamento_goblet', 3, 8, 12, 90], ['supino_halteres', 3, 8, 12, 90], ['remada_maquina', 3, 8, 12, 90], ['prancha', 2, 30, 45, 30]]),
        day('min2', 'b', 'Treino B', 'Corpo todo', [
          ['leg_press', 3, 10, 12, 90], ['desenvolvimento_maquina', 3, 8, 12, 90], ['puxada_alta', 3, 8, 12, 90], ['stiff', 2, 10, 12, 90]]),
      ],
    },
    {
      id: 'primeiros', focus: 'massa', name: 'Primeiros passos – máquinas (3 dias)', short: 'Primeiros passos', level: 'iniciante', daysPerWeek: 3, place: 'academia',
      goal: 'aprender + base', description: 'Primeiro mês na academia: máquinas guiadas para aprender os movimentos com segurança. Use cargas leves e foque na técnica; depois migre para Full Body ou ABC.',
      days: [
        day('pp', 'a', 'Treino A', 'Corpo todo', [
          ['leg_press', 2, 12, 15, 90], ['supino_maquina', 2, 12, 15, 90], ['puxada_alta', 2, 12, 15, 90], ['cadeira_flexora', 2, 12, 15, 60], ['abdominal_crunch', 2, 12, 15, 45]]),
        day('pp', 'b', 'Treino B', 'Corpo todo', [
          ['cadeira_extensora', 2, 12, 15, 60], ['remada_maquina', 2, 12, 15, 90], ['desenvolvimento_maquina', 2, 12, 15, 90], ['mesa_flexora', 2, 12, 15, 60], ['prancha', 2, 20, 30, 30]]),
        day('pp', 'c', 'Treino C', 'Corpo todo', [
          ['agachamento_smith', 2, 10, 12, 90], ['voador', 2, 12, 15, 60], ['remada_cabo', 2, 12, 15, 90], ['elevacao_pelvica', 2, 12, 15, 60], ['panturrilha_sentado', 2, 15, 20, 45]]),
      ],
    },
    {
      id: 'fbdup', focus: 'massa', name: 'Full Body ondulado 3x – Avançado', short: 'Full Body ondulado', level: 'avancado', daysPerWeek: 3, place: 'academia',
      goal: 'força + massa', description: 'Corpo todo 3x por semana com cargas que variam por dia: pesado (4–6), moderado (8–10) e leve (12–15). Treina cada músculo 3x sem repetir o mesmo estímulo.',
      days: [
        day('dup', 'p', 'Dia pesado', '4–6 reps', [
          ['agachamento', 4, 4, 6, 180], ['supino_reto', 4, 4, 6, 180], ['remada_curvada', 4, 4, 6, 150], ['desenvolvimento', 3, 5, 6, 150], ['abdominal_polia', 3, 10, 12, 45]]),
        day('dup', 'm', 'Dia moderado', '8–10 reps', [
          ['terra', 3, 5, 6, 180], ['supino_inclinado_barra', 3, 8, 10, 120], ['barra_fixa', 3, 0, 0, 120], ['bulgaro', 3, 8, 10, 90], ['elevacao_lateral', 3, 12, 15, 45]]),
        day('dup', 'l', 'Dia leve', '12–15 reps', [
          ['hack_squat', 3, 12, 15, 90], ['supino_maquina', 3, 12, 15, 60, 'Última série: drop-set'], ['remada_maquina', 3, 12, 15, 60], ['cadeira_flexora', 3, 12, 15, 60],
          ['rosca_cabo', 2, 12, 15, 45], ['triceps_corda', 2, 12, 15, 45]]),
      ],
    },
    {
      id: 'gluteos', focus: 'massa', name: 'Foco em glúteos e pernas (4 dias)', short: 'Glúteos e pernas', level: 'intermediario', daysPerWeek: 4, place: 'academia',
      goal: 'glúteos + pernas', description: 'Dois dias de membros inferiores com ênfase em glúteos e posterior, e dois dias de superior para manter o equilíbrio.',
      days: [
        day('glu', 'a', 'Inferior A', 'Glúteos (quadril)', [
          ['elevacao_pelvica', 4, 8, 12, 120], ['stiff', 3, 8, 10, 120], ['bulgaro', 3, 8, 10, 90], ['abdutora', 3, 15, 20, 45, 'Última série: drop-set'], ['coice_cabo', 3, 12, 15, 45]]),
        day('glu', 'b', 'Superior A', 'Costas, peito e ombros', [
          ['puxada_alta', 3, 8, 12, 90], ['supino_halteres', 3, 8, 12, 90], ['remada_maquina', 3, 10, 12, 90], ['elevacao_lateral', 3, 12, 15, 45], ['triceps_corda', 2, 12, 15, 45]]),
        day('glu', 'c', 'Inferior B', 'Pernas completas', [
          ['agachamento', 4, 6, 10, 150], ['leg_press', 3, 10, 15, 120], ['cadeira_flexora', 3, 10, 12, 60], ['cadeira_adutora', 3, 12, 15, 45],
          ['ponte_gluteo', 3, 15, 20, 45], ['panturrilha_pe', 3, 12, 15, 45]]),
        day('glu', 'd', 'Superior B', 'Costas e braços', [
          ['remada_cabo', 3, 10, 12, 90], ['desenvolvimento_maquina', 3, 8, 12, 90], ['crucifixo_invertido', 3, 12, 15, 45], ['rosca_alternada', 2, 10, 12, 45], ['abdominal_infra', 3, 12, 15, 45]]),
      ],
    },
    {
      id: 'superior', focus: 'massa', name: 'Foco em peito e braços (4 dias)', short: 'Peito e braços', level: 'intermediario', daysPerWeek: 4, place: 'academia',
      goal: 'peito + braços', description: 'Especialização de superior: peito e braços 2x por semana com volume alto, pernas em manutenção (1 dia).',
      days: [
        day('sup', 'a', 'Peito + tríceps', 'Pesado', [
          ['supino_reto', 4, 6, 8, 150], ['supino_inclinado', 3, 8, 12, 90], ['crucifixo', 3, 12, 15, 60], ['paralelas', 3, 8, 12, 90], ['triceps_testa', 3, 8, 12, 60]]),
        day('sup', 'b', 'Costas + bíceps', 'Volume', [
          ['barra_fixa', 4, 0, 0, 120], ['remada_cavalinho', 3, 8, 10, 120], ['puxada_alta', 3, 10, 12, 90], ['rosca_direta', 3, 8, 10, 60], ['rosca_inclinada', 3, 10, 12, 60]]),
        day('sup', 'c', 'Pernas', 'Manutenção', [
          ['hack_squat', 3, 8, 12, 120], ['stiff', 3, 8, 10, 120], ['cadeira_extensora', 2, 12, 15, 60], ['panturrilha_pe', 3, 12, 15, 45]]),
        day('sup', 'd', 'Peito + braços', 'Máquinas e cabos', [
          ['supino_inclinado_barra', 3, 8, 10, 120], ['supino_maquina', 3, 10, 12, 90, 'Última série: drop-set'], ['crossover', 3, 12, 15, 60],
          ['rosca_scott', 3, 10, 12, 60, 'Bi-set com o próximo'], ['triceps_corda', 3, 12, 15, 60], ['rosca_martelo', 2, 10, 12, 45], ['triceps_coice', 2, 12, 15, 45]]),
      ],
    },
    {
      id: 'vtaper', focus: 'massa', name: 'Costas e ombros “V” (5 dias)', short: 'Costas e ombros', level: 'intermediario', daysPerWeek: 5, place: 'academia',
      goal: 'costas largas + ombros', description: 'Ênfase em dorsais e deltoides (o formato em V): costas e ombros 2x por semana, demais grupos 1x.',
      days: [
        day('vt', 'a', 'Costas A', 'Largura', [
          ['barra_fixa', 4, 0, 0, 120], ['puxada_alta', 4, 8, 12, 90], ['pulldown_reto', 3, 12, 15, 60], ['remada_maquina', 3, 10, 12, 90], ['rosca_direta', 3, 8, 12, 60]]),
        day('vt', 'b', 'Ombros A', 'Deltoides', [
          ['desenvolvimento', 4, 6, 10, 150], ['elevacao_lateral_cabo', 4, 12, 15, 45, 'Última série: rest-pause'], ['crucifixo_invertido', 3, 12, 15, 60], ['encolhimento', 3, 10, 12, 60]]),
        day('vt', 'c', 'Pernas', 'Completo', [
          ['agachamento', 4, 6, 10, 150], ['stiff', 3, 8, 10, 120], ['leg_press', 3, 10, 12, 90], ['cadeira_flexora', 3, 10, 12, 60], ['panturrilha_sentado', 3, 12, 15, 45]]),
        day('vt', 'd', 'Costas B + peito', 'Espessura', [
          ['remada_cavalinho', 4, 6, 10, 120], ['serrote', 3, 8, 12, 60], ['supino_inclinado', 3, 8, 12, 90], ['crossover', 3, 12, 15, 60], ['face_pull', 3, 15, 15, 45]]),
        day('vt', 'e', 'Ombros B + braços', 'Volume', [
          ['desenvolvimento_maquina', 3, 8, 12, 90], ['elevacao_lateral', 4, 15, 20, 45, 'Última série: drop-set'], ['rosca_inclinada', 3, 10, 12, 60], ['triceps_frances', 3, 10, 12, 60], ['abdominal_polia', 3, 10, 15, 45]]),
      ],
    },
    {
      id: 'abcde', focus: 'massa', name: 'ABCDE pesos livres (5 dias)', short: 'ABCDE', level: 'intermediario', daysPerWeek: 5, place: 'academia',
      goal: 'massa muscular', description: 'Divisão clássica de academia, um grupo por dia, com barras e halteres como base: A peito, B costas, C pernas, D ombros, E braços.',
      days: [
        day('a5', 'a', 'Treino A', 'Peito', [
          ['supino_reto', 4, 6, 10, 150], ['supino_inclinado', 4, 8, 12, 90], ['supino_declinado', 3, 8, 10, 120], ['crucifixo', 3, 10, 15, 60], ['flexao', 2, 10, 20, 60]]),
        day('a5', 'b', 'Treino B', 'Costas', [
          ['terra', 3, 4, 6, 180], ['barra_fixa', 4, 0, 0, 120], ['remada_curvada', 4, 6, 10, 120], ['serrote', 3, 8, 12, 60], ['hiperextensao', 3, 12, 15, 45]]),
        day('a5', 'c', 'Treino C', 'Pernas', [
          ['agachamento', 4, 6, 10, 150], ['agachamento_frontal', 3, 6, 8, 150], ['stiff', 3, 8, 10, 120], ['afundo', 3, 10, 12, 60], ['panturrilha_pe', 4, 12, 15, 45]]),
        day('a5', 'd', 'Treino D', 'Ombros', [
          ['desenvolvimento_halteres', 4, 8, 12, 90], ['elevacao_lateral', 4, 12, 15, 45], ['elevacao_frontal', 3, 10, 12, 45], ['crucifixo_invertido', 3, 12, 15, 45], ['encolhimento', 3, 10, 12, 60]]),
        day('a5', 'e', 'Treino E', 'Braços + abdômen', [
          ['rosca_direta', 4, 8, 10, 60], ['triceps_testa', 4, 8, 10, 60], ['rosca_martelo', 3, 10, 12, 60], ['triceps_frances', 3, 10, 12, 60],
          ['rosca_concentrada', 2, 12, 15, 45], ['roda_abdominal', 3, 8, 12, 60]]),
      ],
    },
    {
      id: 'powerbuilding', focus: 'forca', name: 'Powerbuilding 5 dias', short: 'Powerbuilding', level: 'avancado', daysPerWeek: 5, place: 'academia',
      goal: 'força + massa', description: 'Cada dia começa com um básico pesado (série-topo de 3–5 reps) e segue com acessórios de hipertrofia. Junta números de força com estética.',
      days: [
        day('pb', 'a', 'Agachamento', 'Força + pernas', [
          ['agachamento', 4, 3, 5, 240, '1ª série = série-topo; demais −10%'], ['hack_squat', 3, 8, 12, 120], ['cadeira_flexora', 3, 10, 12, 60], ['panturrilha_sentado', 3, 12, 15, 45]]),
        day('pb', 'b', 'Supino', 'Força + peito', [
          ['supino_reto', 4, 3, 5, 240, '1ª série = série-topo; demais −10%'], ['supino_inclinado', 3, 8, 12, 90], ['crossover', 3, 12, 15, 60, 'Última série: drop-set'], ['triceps_testa', 3, 8, 12, 60]]),
        day('pb', 'c', 'Terra', 'Força + costas', [
          ['terra', 4, 2, 4, 300, '1ª série = série-topo; demais −10%'], ['barra_fixa', 4, 0, 0, 120], ['remada_maquina', 3, 10, 12, 90], ['face_pull', 3, 15, 15, 45]]),
        day('pb', 'd', 'Desenvolvimento', 'Força + ombros', [
          ['desenvolvimento', 4, 4, 6, 180], ['elevacao_lateral_cabo', 4, 12, 15, 45], ['crucifixo_invertido', 3, 12, 15, 45], ['encolhimento', 3, 10, 12, 60]]),
        day('pb', 'e', 'Braços e fraquezas', 'Hipertrofia', [
          ['supino_fechado', 3, 6, 8, 150], ['rosca_direta', 3, 8, 10, 60], ['rosca_inclinada', 3, 10, 12, 60], ['triceps_corda', 3, 12, 15, 45], ['abdominal_polia', 3, 10, 15, 45]]),
      ],
    },
    {
      id: 'calistenia', focus: 'casa', name: 'Calistenia 4 dias (barra e paralelas)', short: 'Calistenia', level: 'intermediario', daysPerWeek: 4, place: 'casa',
      goal: 'força relativa + massa', description: 'Só peso corporal com barra fixa e paralelas (praça ou academia). Progrida com mais reps, pausas e, depois, carga num cinto ou mochila.',
      days: [
        day('cal', 'a', 'Puxar A', 'Barra', [
          ['barra_fixa', 5, 0, 0, 120], ['elevacao_pernas', 3, 8, 12, 60], ['hiperextensao', 3, 12, 15, 45], ['prancha', 3, 45, 60, 30]]),
        day('cal', 'b', 'Empurrar A', 'Paralelas', [
          ['paralelas', 5, 8, 12, 120], ['flexao', 4, 10, 20, 60], ['mergulho_banco', 3, 12, 15, 60], ['prancha_lateral', 3, 30, 45, 30]]),
        day('cal', 'c', 'Pernas', 'Unilateral', [
          ['afundo_reverso', 4, 8, 12, 90, 'Com mochila para progredir'], ['step_up', 3, 10, 12, 60], ['ponte_gluteo', 3, 15, 20, 45], ['panturrilha_pe', 4, 15, 20, 45], ['agachamento_livre', 2, 20, 25, 60]]),
        day('cal', 'd', 'Corpo todo', 'Volume', [
          ['barra_fixa', 3, 0, 0, 90], ['paralelas', 3, 8, 12, 90], ['burpee', 3, 10, 12, 60], ['mountain_climber', 3, 30, 40, 30], ['abdominal_infra', 3, 12, 15, 45]]),
      ],
    },
    {
      id: 'halteres4', focus: 'casa', name: 'Halteres Upper/Lower 4 dias', short: 'Halteres 4x', level: 'intermediario', daysPerWeek: 4, place: 'halteres',
      goal: 'massa muscular', description: 'Para quem tem halteres ajustáveis e um banco: superior/inferior 2x por semana. Use descidas lentas e pausas quando a carga ficar leve.',
      days: [
        day('h4', 'ua', 'Superior A', 'Empurrar foco', [
          ['supino_halteres', 4, 8, 12, 90], ['serrote', 4, 8, 12, 60], ['desenvolvimento_halteres', 3, 8, 12, 90], ['crucifixo', 3, 12, 15, 45], ['triceps_frances', 3, 10, 12, 45]]),
        day('h4', 'la', 'Inferior A', 'Quadríceps', [
          ['agachamento_goblet', 4, 10, 15, 90], ['bulgaro', 3, 8, 12, 90, 'Com halteres'], ['stiff', 3, 10, 12, 90, 'Com halteres'], ['panturrilha_pe', 4, 12, 15, 45], ['prancha', 3, 45, 60, 30]]),
        day('h4', 'ub', 'Superior B', 'Puxar foco', [
          ['supino_inclinado', 3, 8, 12, 90], ['serrote', 3, 10, 12, 60], ['crucifixo_invertido', 3, 12, 15, 45], ['elevacao_lateral', 3, 12, 15, 45],
          ['rosca_alternada', 3, 10, 12, 45], ['triceps_coice', 2, 12, 15, 45]]),
        day('h4', 'lb', 'Inferior B', 'Posterior e glúteos', [
          ['stiff', 4, 8, 12, 90, 'Com halteres'], ['afundo', 3, 10, 12, 60], ['elevacao_pelvica', 3, 12, 15, 60, 'Halter sobre o quadril'], ['step_up', 3, 10, 12, 60], ['abdominal_crunch', 3, 15, 20, 45]]),
      ],
    },
    {
      id: 'baixoimpacto', focus: 'condicionamento', name: 'Baixo impacto e saúde (3 dias)', short: 'Baixo impacto', level: 'iniciante', daysPerWeek: 3, place: 'academia',
      goal: 'saúde, articulações, 50+', description: 'Força com pouco impacto e boa estabilidade: máquinas, cabos e apoios. Bom para retorno de pausa longa, 50+ ou quem tem articulações sensíveis (com liberação médica).',
      days: [
        day('bi', 'a', 'Treino A', 'Corpo todo', [
          ['leg_press', 3, 10, 15, 90], ['supino_maquina', 3, 10, 15, 90], ['remada_cabo', 3, 10, 15, 90], ['ponte_gluteo', 2, 12, 15, 45], ['prancha', 2, 20, 30, 30]]),
        day('bi', 'b', 'Treino B', 'Corpo todo', [
          ['cadeira_extensora', 2, 12, 15, 60], ['cadeira_flexora', 2, 12, 15, 60], ['puxada_alta', 3, 10, 15, 90], ['desenvolvimento_maquina', 2, 10, 15, 90], ['face_pull', 2, 15, 15, 45]]),
        day('bi', 'c', 'Treino C', 'Corpo todo + cardio', [
          ['step_up', 2, 10, 12, 60, 'Degrau baixo'], ['remada_maquina', 3, 10, 15, 90], ['voador', 2, 12, 15, 60], ['cadeira_adutora', 2, 12, 15, 45], ['esteira', 1, 0, 0, 60, 'Caminhada inclinada em vez de tiros, se preferir']]),
      ],
    },
    // ------------------------------------------------------------- EMAGRECIMENTO, HIIT, FUNCIONAL E MOBILIDADE
    {
      id: 'emag2', focus: 'emagrecimento', name: 'Primeiros passos – emagrecer (2 dias)', short: 'Emagrecer 2x', level: 'iniciante', daysPerWeek: 2,
      place: 'academia', goal: 'perder gordura, criar o hábito',
      description: 'Para quem está saindo do sedentarismo: máquinas fáceis de aprender + cardio de baixo impacto. Nos outros dias, caminhe 30–40 min. O que mais emagrece é o déficit calórico; o treino preserva a massa muscular.',
      days: [
        day('em2', 'a', 'Treino A', 'Corpo todo + bike', [
          ['agachamento_cadeira', 3, 10, 15, 60], ['supino_maquina', 3, 10, 15, 60], ['puxada_alta', 3, 10, 15, 60], ['ponte_gluteo', 2, 12, 15, 45],
          ['dead_bug', 2, 8, 10, 30], ['bike_ergometrica', 1, 900, 1200, 0, 'Ritmo em que dá para conversar']]),
        day('em2', 'b', 'Treino B', 'Corpo todo + caminhada', [
          ['leg_press', 3, 10, 15, 60], ['remada_maquina', 3, 10, 15, 60], ['desenvolvimento_maquina', 2, 10, 15, 60], ['cadeira_flexora', 2, 12, 15, 45],
          ['prancha', 2, 20, 30, 30], ['caminhada_inclinada', 1, 900, 1200, 0, 'Inclinação 6–10%']]),
      ],
    },
    {
      id: 'emag3', focus: 'emagrecimento', name: 'Emagrecimento – academia (3 dias)', short: 'Emagrecer 3x', level: 'iniciante', daysPerWeek: 3,
      place: 'academia', goal: 'perder gordura mantendo músculo',
      description: 'Musculação de corpo todo com descanso curto + 20–30 min de cardio moderado no fim. Some 7–10 mil passos por dia, déficit moderado (~300–500 kcal) e proteína ~1,6–2,2 g/kg.',
      days: [
        day('em3', 'a', 'Treino A', 'Corpo todo + elíptico', [
          ['leg_press', 3, 10, 15, 60], ['supino_halteres', 3, 10, 12, 60], ['remada_cabo', 3, 10, 12, 60], ['afundo_reverso', 2, 10, 12, 60],
          ['abdominal_bicicleta', 3, 20, 20, 30], ['eliptico', 1, 1200, 1500, 0]]),
        day('em3', 'b', 'Treino B', 'Corpo todo + bike', [
          ['agachamento_goblet', 3, 10, 12, 60], ['puxada_alta', 3, 10, 12, 60], ['flexao_inclinada', 3, 10, 15, 45], ['stiff', 3, 10, 12, 60],
          ['pallof_press', 2, 10, 12, 30], ['bike_ergometrica', 1, 1200, 1500, 0]]),
        day('em3', 'c', 'Treino C', 'Corpo todo + caminhada inclinada', [
          ['hack_squat', 3, 10, 12, 60], ['remada_maquina', 3, 10, 12, 60], ['desenvolvimento_halteres', 3, 10, 12, 60], ['elevacao_pelvica', 3, 10, 12, 60],
          ['bird_dog', 2, 8, 10, 30], ['caminhada_inclinada', 1, 1200, 1800, 0]]),
      ],
    },
    {
      id: 'emag_casa3', focus: 'emagrecimento', name: 'Emagrecer em casa – sem equipamento (3 dias)', short: 'Emagrecer em casa', level: 'iniciante', daysPerWeek: 3,
      place: 'casa', goal: 'perder gordura em casa',
      description: 'Circuitos com o peso do corpo, sem impacto alto no começo. Faça 3–4 voltas; quando ficar fácil, passe para o HIIT em casa. Caminhar nos dias livres ajuda muito.',
      days: [
        day('ec3', 'a', 'Circuito A', 'Pernas + core', [
          ['agachamento_cadeira', 3, 12, 15, 15], ['marcha_estacionaria', 3, 60, 60, 15], ['ponte_gluteo', 3, 15, 15, 15], ['flexao_inclinada', 3, 10, 12, 15],
          ['dead_bug', 3, 8, 8, 15], ['polichinelo', 3, 30, 30, 15]], { mode: 'circuit', rounds: 3, roundRest: 90 }),
        day('ec3', 'b', 'Circuito B', 'Corpo todo', [
          ['afundo_reverso', 3, 8, 10, 15], ['flexao_joelhos', 3, 8, 12, 15], ['skipping', 3, 30, 30, 15], ['coice_quatro_apoios', 3, 12, 15, 15],
          ['shoulder_taps', 3, 16, 16, 15], ['boxe_sombra', 3, 60, 60, 15]], { mode: 'circuit', rounds: 3, roundRest: 90 }),
        day('ec3', 'c', 'Circuito C', 'Cardio + mobilidade', [
          ['step_aerobico', 3, 120, 180, 15, 'Um degrau da escada serve'], ['agachamento_sumo', 3, 12, 15, 15, 'Sem peso ou com uma mochila'],
          ['bird_dog', 3, 8, 8, 15], ['mountain_climber', 3, 20, 30, 15], ['crianca', 3, 30, 30, 15]], { mode: 'circuit', rounds: 3, roundRest: 90 }),
      ],
    },
    {
      id: 'emag4', focus: 'emagrecimento', name: 'Queima de gordura – força + HIIT (4 dias)', short: 'Queima 4x', level: 'intermediario', daysPerWeek: 4,
      place: 'academia', goal: 'secar mantendo força',
      description: 'Dois dias de força (mantém a massa magra no déficit) e dois dias metabólicos com máquinas de cardio e circuito. Faça o HIIT longe do treino de pernas pesado.',
      days: [
        day('eq4', 'f1', 'Força 1', 'Inferior + empurrar', [
          ['agachamento', 4, 6, 8, 120], ['supino_reto', 4, 6, 8, 120], ['afundo_reverso', 3, 10, 10, 60], ['desenvolvimento_halteres', 3, 8, 10, 75],
          ['hollow_hold', 3, 20, 30, 30]]),
        day('eq4', 'h1', 'HIIT 1', 'Remo + circuito', [
          ['remo_ergometro', 4, 60, 60, 20, '1 min forte (~250 m). Aqueça 5–10 min antes'], ['thruster', 4, 12, 12, 20], ['slam_ball', 4, 12, 12, 20],
          ['agachamento_salto', 4, 10, 10, 20], ['corda_naval', 4, 30, 30, 20], ['sprawl', 4, 10, 10, 20]], { mode: 'circuit', rounds: 4, roundRest: 120 }),
        day('eq4', 'f2', 'Força 2', 'Posterior + puxar', [
          ['terra', 4, 4, 6, 150], ['barra_fixa', 4, 0, 0, 120], ['remada_curvada', 3, 8, 10, 90], ['elevacao_pelvica', 3, 10, 12, 75],
          ['pallof_press', 3, 10, 12, 30]]),
        day('eq4', 'h2', 'HIIT 2', 'Bike intervalada + core', [
          ['bike_ergometrica', 1, 1200, 1200, 0, '10 × (30 s forte / 90 s leve)'], ['kettlebell_swing', 4, 15, 20, 45], ['v_up', 3, 10, 15, 30],
          ['russian_twist', 3, 20, 24, 30]]),
      ],
    },
    {
      id: 'emag5', focus: 'emagrecimento', name: 'Emagrecimento 5 dias – musculação + cardio', short: 'Emagrecer 5x', level: 'intermediario', daysPerWeek: 5,
      place: 'academia', goal: 'perder gordura com alto gasto semanal',
      description: 'Superior/inferior 3x com descanso curto + 2 dias de cardio (um contínuo longo, um intervalado). Alto gasto de energia sem perder massa muscular. Durma bem e mantenha proteína alta.',
      days: [
        day('e5', 'u1', 'Superior', 'Descanso curto', [
          ['supino_inclinado', 3, 8, 12, 60], ['puxada_alta', 3, 10, 12, 60], ['supino_maquina', 3, 10, 12, 60], ['remada_cabo', 3, 10, 12, 60],
          ['elevacao_lateral', 3, 12, 15, 45], ['triceps_corda', 2, 12, 15, 45], ['rosca_martelo', 2, 12, 15, 45]]),
        day('e5', 'z2', 'Cardio contínuo', 'Zona 2', [
          ['caminhada_inclinada', 1, 2400, 2700, 0, '40–45 min, ritmo de conversa'], ['dead_bug', 3, 10, 10, 30], ['alongamento_flexor', 2, 30, 30, 15]]),
        day('e5', 'l1', 'Inferior', 'Descanso curto', [
          ['agachamento_smith', 4, 8, 12, 75], ['stiff', 3, 10, 12, 75], ['afundo_lateral', 3, 10, 10, 60], ['cadeira_flexora', 3, 12, 15, 45],
          ['abdutora', 3, 15, 20, 30], ['panturrilha_pe', 3, 15, 20, 30]]),
        day('e5', 'hi', 'Intervalado', 'Escada + metabólico', [
          ['escada', 4, 120, 120, 20, '2 min forte. Aqueça 5 min antes'], ['wall_ball', 4, 15, 15, 20], ['treno', 4, 20, 20, 20], ['bear_crawl', 4, 20, 20, 20],
          ['skipping', 4, 30, 30, 20]], { mode: 'circuit', rounds: 4, roundRest: 120 }),
        day('e5', 'fb', 'Corpo todo', 'Força moderada', [
          ['terra_trap', 3, 6, 8, 120], ['supino_halteres', 3, 8, 10, 75], ['remada_maquina', 3, 8, 10, 75], ['kettlebell_press', 3, 8, 10, 60],
          ['suitcase_carry', 3, 20, 30, 45], ['elevacao_joelhos_paralela', 3, 12, 15, 30]]),
      ],
    },
    {
      id: 'hiit_casa4', focus: 'emagrecimento', name: 'HIIT em casa (4 dias)', short: 'HIIT em casa', level: 'intermediario', daysPerWeek: 4,
      place: 'casa', goal: 'emagrecer e ganhar fôlego sem academia',
      description: 'Circuitos intensos de 20–30 min só com o peso do corpo. Trabalhe forte nos exercícios e respeite os descansos entre as voltas. Alterne com caminhadas leves.',
      days: [
        day('hc4', 'a', 'HIIT A', 'Pernas explosivas', [
          ['agachamento_salto', 4, 12, 12, 15], ['afundo_salto', 4, 8, 8, 15], ['mountain_climber', 4, 30, 30, 15], ['cadeira_isometrica', 4, 40, 40, 15],
          ['skipping', 4, 30, 30, 15]], { mode: 'circuit', rounds: 4, roundRest: 90 }),
        day('hc4', 'b', 'HIIT B', 'Superior + core', [
          ['flexao', 4, 10, 15, 15], ['remada_invertida', 4, 8, 12, 15, 'Mesa firme ou barra baixa'], ['pike_pushup', 4, 8, 10, 15], ['shoulder_taps', 4, 20, 20, 15],
          ['hollow_hold', 4, 20, 30, 15]], { mode: 'circuit', rounds: 4, roundRest: 90 }),
        day('hc4', 'c', 'HIIT C', 'Corpo todo', [
          ['burpee', 4, 10, 10, 15], ['sprawl', 4, 10, 10, 15], ['bear_crawl', 4, 20, 20, 15], ['polichinelo', 4, 40, 40, 15],
          ['abdominal_bicicleta', 4, 20, 20, 15]], { mode: 'circuit', rounds: 4, roundRest: 90 }),
        day('hc4', 'd', 'Força + mobilidade', 'Ritmo controlado', [
          ['afundo_reverso', 3, 12, 12, 45], ['ponte_unilateral', 3, 12, 15, 30], ['flexao_diamante', 3, 8, 12, 45], ['v_up', 3, 10, 15, 30],
          ['agachamento_profundo', 2, 45, 60, 15], ['alongamento_posterior', 2, 30, 45, 15]]),
      ],
    },
    {
      id: 'funcional3', focus: 'condicionamento', name: 'Funcional com kettlebell (3 dias)', short: 'Funcional KB', level: 'intermediario', daysPerWeek: 3,
      place: 'halteres', goal: 'força funcional + fôlego',
      description: 'Um ou dois kettlebells (ou halteres) para força, potência de quadril e condicionamento. Bom para treinar em casa ou em espaços pequenos.',
      days: [
        day('fk', 'a', 'Treino A', 'Swing + empurrar', [
          ['kettlebell_swing', 5, 15, 20, 60], ['kettlebell_press', 4, 6, 10, 60], ['agachamento_goblet', 4, 8, 12, 75], ['flexao', 3, 10, 15, 60],
          ['suitcase_carry', 3, 20, 30, 45]]),
        day('fk', 'b', 'Treino B', 'Clean + puxar', [
          ['kettlebell_clean', 4, 6, 8, 60], ['serrote', 4, 8, 12, 60], ['afundo_reverso', 3, 10, 12, 60], ['stiff', 3, 10, 12, 60, 'Com kettlebell'],
          ['dead_bug', 3, 10, 10, 30]]),
        day('fk', 'c', 'Treino C', 'Circuito metabólico', [
          ['kettlebell_swing', 4, 15, 15, 15], ['thruster', 4, 10, 10, 15, 'Com kettlebells ou halteres'], ['remada_invertida', 4, 10, 10, 15],
          ['agachamento_sumo', 4, 15, 15, 15], ['mountain_climber', 4, 30, 30, 15]], { mode: 'circuit', rounds: 4, roundRest: 90 }),
      ],
    },
    {
      id: 'metcon5', focus: 'condicionamento', exact: true, name: 'Condicionamento atlético avançado (5 dias)', short: 'Atlético 5x', level: 'avancado', daysPerWeek: 5,
      place: 'academia', goal: 'força, potência e fôlego de atleta',
      description: 'Força pesada no começo do treino e um bloco metabólico curto e muito intenso no fim, com trenó, remo, wall ball e corda naval. Exige boa técnica e recuperação; 1 dia de mobilidade fecha a semana.',
      days: [
        day('mc', 'd1', 'Dia 1', 'Agachamento + metcon', [
          ['agachamento', 5, 3, 5, 180], ['agachamento_frontal', 3, 5, 6, 150], ['thruster', 5, 10, 10, 15], ['remo_ergometro', 5, 60, 60, 15, '250 m forte'],
          ['agachamento_salto', 5, 10, 10, 15]]),
        day('mc', 'd2', 'Dia 2', 'Empurrar + puxar', [
          ['supino_reto', 5, 3, 5, 180], ['barra_carga', 5, 3, 5, 150], ['desenvolvimento', 4, 5, 6, 120], ['remada_curvada', 4, 6, 8, 90],
          ['corda_naval', 6, 30, 30, 30], ['hollow_hold', 3, 30, 45, 30]]),
        day('mc', 'd3', 'Dia 3', 'Posterior + trenó', [
          ['terra', 5, 3, 5, 210], ['good_morning', 3, 8, 10, 90], ['flexao_nordica', 3, 4, 6, 90], ['treno', 6, 20, 20, 60],
          ['kettlebell_swing', 4, 20, 20, 45]]),
        day('mc', 'd4', 'Dia 4', 'Potência + metcon', [
          ['salto_caixote', 5, 3, 5, 90], ['kettlebell_clean', 4, 5, 5, 60], ['wall_ball', 5, 20, 20, 15], ['slam_ball', 5, 15, 15, 15],
          ['burpee', 5, 12, 12, 15], ['escada', 1, 600, 600, 0]]),
        day('mc', 'd5', 'Dia 5', 'Mobilidade + cardio zona 2', [
          ['bike_ergometrica', 1, 1800, 2400, 60, 'Leve: ajuda a recuperar'], ['gato_vaca', 2, 10, 10, 15], ['rotacao_toracica', 2, 8, 8, 15],
          ['alongamento_flexor', 2, 45, 45, 15], ['mobilidade_tornozelo', 2, 12, 12, 15], ['agachamento_profundo', 2, 60, 60, 15]]),
      ],
    },
    {
      id: 'mobilidade3', focus: 'mobilidade', name: 'Mobilidade e postura (3 dias)', short: 'Mobilidade 3x', level: 'iniciante', daysPerWeek: 3,
      place: 'casa', goal: 'flexibilidade, postura, menos dor',
      description: 'Sessões de 20–25 min para quem passa o dia sentado: quadril, coluna torácica, tornozelo e ombros, com core e glúteos. Pode ser feito nos dias sem musculação ou depois dela.',
      days: [
        day('mb', 'a', 'Sessão A', 'Coluna + quadril', [
          ['gato_vaca', 2, 10, 10, 15], ['rotacao_toracica', 2, 8, 8, 15], ['alongamento_flexor', 2, 30, 45, 15], ['ponte_gluteo', 3, 12, 15, 30],
          ['bird_dog', 2, 8, 10, 15], ['crianca', 2, 45, 60, 15]]),
        day('mb', 'b', 'Sessão B', 'Pernas + tornozelo', [
          ['mobilidade_tornozelo', 2, 10, 12, 15], ['agachamento_profundo', 3, 30, 45, 15], ['alongamento_posterior', 2, 30, 45, 15],
          ['alongamento_quadriceps', 2, 30, 45, 15], ['passada_lateral', 2, 12, 15, 30], ['dead_bug', 2, 8, 10, 15]]),
        day('mb', 'c', 'Sessão C', 'Ombros + postura', [
          ['alongamento_peitoral', 2, 30, 45, 15], ['elevacao_y', 3, 10, 12, 30, 'Sem peso ou com garrafinhas'], ['cobra', 2, 20, 30, 15],
          ['rotacao_toracica', 2, 8, 8, 15], ['hollow_hold', 2, 15, 25, 30], ['crianca', 2, 45, 60, 15]]),
      ],
    },
    {
      id: 'mob_core2', focus: 'mobilidade', name: 'Mobilidade + core (2 dias)', short: 'Mobilidade + core', level: 'iniciante', daysPerWeek: 2,
      place: 'casa', goal: 'complemento: lombar, core e flexibilidade',
      description: 'Complemento curto (15–20 min) para somar a qualquer programa: core anti-rotação e anti-extensão, que protege a lombar, e mobilidade de quadril e coluna.',
      days: [
        day('mc2', 'a', 'Sessão A', 'Core + quadril', [
          ['dead_bug', 3, 8, 10, 30], ['bird_dog', 3, 8, 10, 30], ['prancha_lateral', 2, 20, 30, 30], ['alongamento_flexor', 2, 30, 45, 15],
          ['agachamento_profundo', 2, 30, 45, 15]]),
        day('mc2', 'b', 'Sessão B', 'Core + coluna', [
          ['hollow_hold', 3, 20, 30, 30], ['shoulder_taps', 3, 16, 20, 30], ['gato_vaca', 2, 10, 10, 15], ['rotacao_toracica', 2, 8, 8, 15],
          ['cobra', 2, 20, 30, 15], ['crianca', 2, 45, 60, 15]]),
      ],
    },
    TOJI,
    {
      id: 'fh6', focus: 'forca', exact: true, periodization: 'fh26', name: 'Força + Hipertrofia periodizado 26 semanas (6 dias)', short: 'Periodizado 6x', level: 'avancado', daysPerWeek: 6,
      place: 'academia', goal: 'força + hipertrofia (periodizado)',
      description: 'Cada músculo 2x por semana (12–20 séries semanais), principal pesado no início de cada dia e acessórios até 0–1 RIR. Periodização de 26 semanas: Base (1–8, ~70–77%), Força (9–16, ~80–85%), Pico (17–24, ~87–92%), polimento (25) e teste de 1RM (26), com deload a cada 4ª semana. O app ajusta séries, reps e RIR dos principais sozinho. Descanso: 3–5 min nos principais, 1,5–2,5 min nos acessórios. Proteína ~1,8–2,7 g/kg; para definir, déficit moderado.',
      days: [
        day('fh6', 'd1', 'Dia 1', 'Peito + Tríceps (força)', [
          ['supino_reto', 4, 4, 6, 240, 'Principal'], ['supino_inclinado', 3, 8, 10, 120], ['crossover', 3, 12, 15, 90, 'De baixo para cima'],
          ['paralelas', 3, 6, 8, 120, 'Com carga'], ['triceps_testa', 3, 8, 10, 90, 'Barra EZ'], ['triceps_frances', 2, 12, 15, 90, 'Extensão overhead no cabo (ou halter)']]),
        day('fh6', 'd2', 'Dia 2', 'Costas + Bíceps (força)', [
          ['barra_carga', 4, 4, 6, 240, 'Principal'], ['remada_curvada', 4, 5, 6, 240, 'Principal · Pendlay: barra volta ao chão a cada rep'],
          ['serrote', 3, 8, 10, 120], ['pullover', 3, 12, 15, 90, 'No cabo, se tiver'], ['rosca_direta', 3, 6, 8, 90], ['rosca_martelo', 3, 10, 12, 90],
          ['face_pull', 2, 15, 20, 90]]),
        day('fh6', 'd3', 'Dia 3', 'Pernas – quadríceps (força)', [
          ['agachamento', 4, 4, 6, 240, 'Principal'], ['stiff', 3, 6, 8, 150], ['bulgaro', 3, 8, 10, 120],
          ['mesa_flexora', 3, 10, 12, 90], ['panturrilha_pe', 4, 8, 10, 90], ['roda_abdominal', 3, 8, 12, 90]]),
        day('fh6', 'd4', 'Dia 4', 'Ombros + Peito (volume)', [
          ['desenvolvimento', 4, 5, 6, 240, 'Principal · desenvolvimento militar em pé'], ['supino_inclinado_barra', 3, 8, 12, 150, 'Barra ou máquina'],
          ['elevacao_lateral', 4, 12, 20, 90, 'Última série em myo-reps'], ['elevacao_lateral_cabo', 2, 15, 15, 90, 'Unilateral'],
          ['voador', 3, 12, 15, 90], ['crucifixo_invertido', 3, 15, 20, 90]]),
        day('fh6', 'd5', 'Dia 5', 'Costas + Braços (volume)', [
          ['puxada_alta', 3, 8, 12, 120, 'Pegada neutra'], ['remada_maquina', 3, 8, 12, 120, 'Apoio no peito (T-bar ou máquina)'],
          ['pulldown_reto', 2, 12, 15, 90], ['rosca_inclinada', 3, 10, 12, 90], ['rosca_cabo', 2, 12, 15, 90, 'Bayesian: de costas para a polia'],
          ['triceps_corda', 3, 10, 15, 90], ['triceps_frances', 2, 12, 12, 90, 'Extensão overhead com halter']]),
        day('fh6', 'd6', 'Dia 6', 'Pernas – posterior (força)', [
          ['terra', 3, 3, 5, 300, 'Principal'], ['hack_squat', 3, 8, 12, 150, 'Ou leg press'], ['cadeira_extensora', 3, 12, 15, 90],
          ['cadeira_flexora', 3, 10, 12, 90], ['elevacao_pelvica', 3, 8, 10, 120], ['panturrilha_sentado', 4, 12, 15, 90], ['elevacao_pernas', 3, 10, 15, 90]]),
      ],
    },
    {
      id: 'fh5', focus: 'forca', exact: true, periodization: 'fh26', name: 'Força + Hipertrofia periodizado 26 semanas (5 dias)', short: 'Periodizado 5x', level: 'avancado', daysPerWeek: 5,
      place: 'academia', goal: 'força + hipertrofia (periodizado)',
      description: 'Versão de 5 dias (sem o Dia 5 de volume: rosca inclinada e tríceps pulley vão para os Dias 2 e 1, puxada frente para o Dia 4). Cada músculo 2x por semana (12–20 séries semanais), principal pesado no início de cada dia e acessórios até 0–1 RIR. Periodização de 26 semanas: Base (1–8, ~70–77%), Força (9–16, ~80–85%), Pico (17–24, ~87–92%), polimento (25) e teste de 1RM (26), com deload a cada 4ª semana. O app ajusta séries, reps e RIR dos principais sozinho. Descanso: 3–5 min nos principais, 1,5–2,5 min nos acessórios. Proteína ~1,8–2,7 g/kg; para definir, déficit moderado.',
      days: [
        day('fh5', 'd1', 'Dia 1', 'Peito + Tríceps (força)', [
          ['supino_reto', 4, 4, 6, 240, 'Principal'], ['supino_inclinado', 3, 8, 10, 120], ['crossover', 3, 12, 15, 90, 'De baixo para cima'],
          ['paralelas', 3, 6, 8, 120, 'Com carga'], ['triceps_testa', 3, 8, 10, 90, 'Barra EZ'], ['triceps_frances', 2, 12, 15, 90, 'Extensão overhead no cabo (ou halter)'], ['triceps_corda', 3, 10, 15, 90, 'Tríceps pulley com corda']]),
        day('fh5', 'd2', 'Dia 2', 'Costas + Bíceps (força)', [
          ['barra_carga', 4, 4, 6, 240, 'Principal'], ['remada_curvada', 4, 5, 6, 240, 'Principal · Pendlay: barra volta ao chão a cada rep'],
          ['serrote', 3, 8, 10, 120], ['pullover', 3, 12, 15, 90, 'No cabo, se tiver'], ['rosca_direta', 3, 6, 8, 90], ['rosca_martelo', 3, 10, 12, 90],
          ['face_pull', 2, 15, 20, 90], ['rosca_inclinada', 3, 10, 12, 90]]),
        day('fh5', 'd3', 'Dia 3', 'Pernas – quadríceps (força)', [
          ['agachamento', 4, 4, 6, 240, 'Principal'], ['stiff', 3, 6, 8, 150], ['bulgaro', 3, 8, 10, 120],
          ['mesa_flexora', 3, 10, 12, 90], ['panturrilha_pe', 4, 8, 10, 90], ['roda_abdominal', 3, 8, 12, 90]]),
        day('fh5', 'd4', 'Dia 4', 'Ombros + Peito (volume)', [
          ['desenvolvimento', 4, 5, 6, 240, 'Principal · desenvolvimento militar em pé'], ['supino_inclinado_barra', 3, 8, 12, 150, 'Barra ou máquina'],
          ['elevacao_lateral', 4, 12, 20, 90, 'Última série em myo-reps'], ['elevacao_lateral_cabo', 2, 15, 15, 90, 'Unilateral'],
          ['voador', 3, 12, 15, 90], ['crucifixo_invertido', 3, 15, 20, 90], ['puxada_alta', 3, 8, 12, 120, 'Pegada neutra']]),
        day('fh5', 'd6', 'Dia 6', 'Pernas – posterior (força)', [
          ['terra', 3, 3, 5, 300, 'Principal'], ['hack_squat', 3, 8, 12, 150, 'Ou leg press'], ['cadeira_extensora', 3, 12, 15, 90],
          ['cadeira_flexora', 3, 10, 12, 90], ['elevacao_pelvica', 3, 8, 10, 120], ['panturrilha_sentado', 4, 12, 15, 90], ['elevacao_pernas', 3, 10, 15, 90]]),
      ],
    },
    // ============================== divisões clássicas e programas extras (26–50)
    {
      id: 'classico5', focus: 'massa', name: 'Clássico 5 dias: Peito, Costas, Pernas, Deltoides, Braços', short: 'Clássico 5x', level: 'intermediario',
      daysPerWeek: 5, place: 'academia', goal: 'massa muscular',
      description: 'Divisão clássica de segunda a sexta, um grupo por dia, com o básico pesado no início. Sábado e domingo de descanso.',
      days: [
        day('cl5', 'seg', 'Segunda', 'Peitoral', [
          ['supino_reto', 4, 6, 8, 150], ['supino_inclinado', 4, 10, 10, 90], ['supino_declinado', 4, 12, 12, 90],
          ['crossover', 3, 12, 12, 60], ['crucifixo', 3, 12, 12, 60]]),
        day('cl5', 'ter', 'Terça', 'Costas', [
          ['barra_fixa', 4, 0, 0, 120, 'Até a falha'], ['remada_curvada', 4, 8, 8, 120, 'Pegada pronada'], ['remada_cabo', 4, 12, 12, 90],
          ['pullover', 4, 10, 10, 60], ['terra', 3, 10, 10, 150]]),
        day('cl5', 'qua', 'Quarta', 'Pernas', [
          ['agachamento', 4, 8, 8, 150], ['leg_press', 4, 10, 12, 120], ['stiff', 4, 8, 10, 120],
          ['cadeira_extensora', 3, 12, 12, 60], ['cadeira_flexora', 3, 12, 12, 60]]),
        day('cl5', 'qui', 'Quinta', 'Deltoides e trapézio', [
          ['desenvolvimento', 4, 8, 8, 120], ['desenvolvimento_arnold', 4, 10, 10, 90], ['elevacao_lateral', 3, 12, 12, 60],
          ['encolhimento_barra', 4, 8, 8, 90], ['encolhimento', 4, 12, 12, 60]]),
        day('cl5', 'sex', 'Sexta', 'Braços', [
          ['paralelas', 3, 0, 0, 90, 'Até a falha'], ['triceps_frances', 3, 10, 10, 60], ['triceps_corda', 3, 12, 12, 60],
          ['rosca_direta', 3, 10, 10, 60], ['rosca_alternada', 3, 12, 12, 60], ['rosca_martelo', 3, 10, 10, 60]]),
      ],
    },
    {
      id: 'split6', focus: 'massa', name: '6 dias: Peito, Perna A, Braço, Costas, Perna B, Ombros', short: 'Split 6x', level: 'avancado',
      daysPerWeek: 6, place: 'academia', goal: 'massa muscular (alto volume)',
      description: 'Um grupo por dia com as pernas divididas em dois dias: Perna A (quadríceps) e Perna B (posterior e glúteos). Braço no meio da semana para chegar descansado em costas.',
      days: [
        day('s6', 'pe', 'Dia 1', 'Peito', [
          ['supino_reto', 4, 6, 8, 150], ['supino_inclinado_barra', 4, 8, 10, 120], ['supino_maquina', 3, 10, 12, 90],
          ['crossover', 3, 12, 15, 60], ['flexao', 2, 0, 0, 60, 'Até a falha']]),
        day('s6', 'pa', 'Dia 2', 'Perna A – quadríceps', [
          ['agachamento', 4, 6, 8, 180], ['hack_squat', 4, 8, 12, 120], ['leg_press', 3, 12, 15, 90],
          ['cadeira_extensora', 4, 12, 15, 60], ['panturrilha_pe', 4, 10, 15, 45]]),
        day('s6', 'br', 'Dia 3', 'Braço', [
          ['rosca_direta', 4, 8, 10, 60], ['triceps_testa', 4, 8, 10, 60], ['rosca_scott', 3, 10, 12, 60],
          ['triceps_corda', 3, 12, 15, 60], ['rosca_martelo', 3, 10, 12, 45], ['triceps_coice', 3, 12, 15, 45]]),
        day('s6', 'co', 'Dia 4', 'Costas', [
          ['barra_fixa', 4, 0, 0, 120], ['remada_curvada', 4, 6, 8, 120], ['puxada_alta', 4, 10, 12, 90],
          ['remada_maquina', 3, 10, 12, 90], ['pullover', 3, 12, 12, 60], ['hiperextensao', 3, 12, 15, 45]]),
        day('s6', 'pb', 'Dia 5', 'Perna B – posterior e glúteos', [
          ['stiff', 4, 8, 10, 150], ['elevacao_pelvica', 4, 8, 12, 120], ['cadeira_flexora', 4, 10, 12, 60],
          ['bulgaro', 3, 8, 10, 90], ['cadeira_adutora', 3, 12, 15, 45], ['panturrilha_sentado', 4, 12, 15, 45]]),
        day('s6', 'om', 'Dia 6', 'Ombros + abdômen', [
          ['desenvolvimento', 4, 6, 8, 150], ['desenvolvimento_arnold', 3, 10, 10, 90], ['elevacao_lateral', 4, 12, 15, 45],
          ['crucifixo_invertido', 3, 12, 15, 45], ['encolhimento_barra', 3, 10, 10, 60], ['abdominal_polia', 3, 12, 15, 45]]),
      ],
    },
    {
      id: 'abcabc', focus: 'massa', name: 'ABC 2x por semana (6 dias)', short: 'ABCABC', level: 'avancado', daysPerWeek: 6, place: 'academia',
      goal: 'massa muscular', description: 'A: peito, ombros e tríceps · B: costas e bíceps · C: pernas — repetido 2x por semana (ABCABC). Cada músculo 2x com volume alto.',
      days: [
        day('a2', 'a', 'Treino A', 'Peito, ombros e tríceps', [
          ['supino_reto', 4, 6, 8, 150], ['desenvolvimento_halteres', 4, 8, 10, 90], ['supino_inclinado', 3, 8, 12, 90],
          ['elevacao_lateral', 4, 12, 15, 45], ['paralelas', 3, 0, 0, 90], ['triceps_corda', 3, 12, 15, 45]]),
        day('a2', 'b', 'Treino B', 'Costas e bíceps', [
          ['terra', 3, 4, 6, 180], ['barra_fixa', 4, 0, 0, 120], ['remada_cavalinho', 4, 8, 10, 120],
          ['puxada_alta', 3, 10, 12, 90], ['rosca_direta', 4, 8, 10, 60], ['rosca_inclinada', 3, 10, 12, 45]]),
        day('a2', 'c', 'Treino C', 'Pernas e abdômen', [
          ['agachamento', 4, 6, 8, 180], ['leg_press', 4, 10, 15, 120], ['stiff', 4, 8, 10, 120],
          ['cadeira_extensora', 3, 12, 15, 60], ['cadeira_flexora', 3, 10, 12, 60], ['panturrilha_pe', 4, 10, 15, 45], ['abdominal_polia', 3, 12, 15, 45]]),
      ],
    },
    {
      id: 'antagonista4', focus: 'massa', name: 'Antagonistas 4 dias (bi-sets)', short: 'Antagonistas', level: 'intermediario', daysPerWeek: 4,
      place: 'academia', goal: 'massa + tempo curto',
      description: 'Pares de músculos opostos em bi-set (ex.: supino + remada): mais trabalho em menos tempo. A: peito+costas · B: pernas · C: ombros+braços · D: peito+costas (máquinas).',
      days: [
        day('an', 'a', 'Treino A', 'Peito + costas', [
          ['supino_reto', 4, 6, 10, 90, 'Bi-set com o próximo'], ['remada_curvada', 4, 6, 10, 120],
          ['supino_inclinado', 3, 8, 12, 60, 'Bi-set com o próximo'], ['puxada_alta', 3, 8, 12, 90], ['crucifixo', 3, 12, 15, 45, 'Bi-set com o próximo'], ['pullover', 3, 12, 12, 60]]),
        day('an', 'b', 'Treino B', 'Pernas', [
          ['agachamento', 4, 6, 10, 150], ['stiff', 4, 8, 10, 120], ['cadeira_extensora', 3, 12, 15, 45, 'Bi-set com o próximo'],
          ['cadeira_flexora', 3, 10, 12, 60], ['panturrilha_pe', 4, 12, 15, 45]]),
        day('an', 'c', 'Treino C', 'Ombros + braços', [
          ['desenvolvimento_halteres', 4, 8, 10, 90], ['elevacao_lateral', 3, 12, 15, 45, 'Bi-set com o próximo'], ['crucifixo_invertido', 3, 12, 15, 60],
          ['rosca_direta', 3, 8, 12, 45, 'Bi-set com o próximo'], ['triceps_testa', 3, 8, 12, 60], ['rosca_martelo', 3, 10, 12, 45, 'Bi-set com o próximo'], ['triceps_corda', 3, 12, 15, 60]]),
        day('an', 'd', 'Treino D', 'Peito + costas (máquinas)', [
          ['supino_maquina', 4, 8, 12, 60, 'Bi-set com o próximo'], ['remada_maquina', 4, 8, 12, 90], ['voador', 3, 12, 15, 45, 'Bi-set com o próximo'],
          ['pulldown_reto', 3, 12, 15, 60], ['abdominal_polia', 3, 12, 15, 45]]),
      ],
    },
    {
      id: 'abcde_av', focus: 'massa', name: 'ABCDE avançado (5 dias)', short: 'ABCDE avançado', level: 'avancado', daysPerWeek: 5, place: 'academia',
      goal: 'massa muscular (alto volume)', description: 'Um grupo por dia com volume alto, básicos pesados e técnicas nas últimas séries. A peito · B costas · C ombros · D braços · E pernas.',
      days: [
        day('a5x', 'a', 'Treino A', 'Peito', [
          ['supino_reto', 5, 5, 8, 180], ['supino_inclinado_barra', 4, 6, 10, 150], ['supino_halteres', 3, 8, 12, 90],
          ['voador', 3, 12, 15, 60], ['crossover', 3, 12, 15, 60], ['paralelas', 2, 0, 0, 90]]),
        day('a5x', 'b', 'Treino B', 'Costas', [
          ['terra', 4, 3, 5, 240], ['barra_fixa', 4, 0, 0, 120], ['remada_curvada', 4, 6, 10, 120],
          ['puxada_alta', 3, 10, 12, 90], ['remada_maquina', 3, 10, 12, 90], ['pullover', 3, 12, 15, 60]]),
        day('a5x', 'c', 'Treino C', 'Ombros e trapézio', [
          ['desenvolvimento', 5, 5, 8, 180], ['desenvolvimento_arnold', 3, 8, 12, 90], ['elevacao_lateral', 4, 12, 15, 45],
          ['elevacao_lateral_cabo', 3, 12, 15, 45], ['crucifixo_invertido', 4, 12, 15, 45], ['encolhimento_barra', 4, 8, 12, 60]]),
        day('a5x', 'd', 'Treino D', 'Braços', [
          ['supino_fechado', 4, 6, 8, 150], ['rosca_direta', 4, 6, 10, 60], ['triceps_testa', 3, 8, 12, 60], ['rosca_inclinada', 3, 10, 12, 60],
          ['triceps_corda', 3, 12, 15, 45], ['rosca_cabo', 3, 12, 15, 45]]),
        day('a5x', 'e', 'Treino E', 'Pernas', [
          ['agachamento', 5, 5, 8, 180], ['hack_squat', 4, 8, 12, 120], ['stiff', 4, 8, 10, 120], ['leg_press', 3, 12, 15, 90],
          ['cadeira_flexora', 3, 10, 12, 60], ['panturrilha_pe', 5, 10, 15, 45]]),
      ],
    },
    {
      id: 'hibrido_av5', focus: 'massa', exact: true, name: 'Híbrido avançado: Upper/Lower pesado + ABC (5 dias)', short: 'Híbrido UL+ABC 5x', level: 'avancado',
      daysPerWeek: 5, place: 'academia', goal: 'força + massa (cada músculo 2x)',
      description: 'Mistura do Upper/Lower 6x com o ABCDE: 2 dias pesados de força (superior e inferior, 3–5 reps) + 3 dias de volume por grupo (costas+bíceps, peito+ombros+tríceps, pernas). Cada músculo é treinado 2x por semana: uma vez pesado, uma vez com volume e técnicas. Sugestão: seg sup. pesado, ter inf. pesado, qui costas, sex peito/ombros, sáb pernas.',
      days: [
        day('hy5', 'up', 'Dia 1', 'Superior pesado', [
          ['supino_reto', 5, 3, 5, 180, 'Série-topo pesada; demais −10% · RIR 1'], ['remada_curvada', 5, 4, 6, 150, 'RIR 1'],
          ['desenvolvimento', 4, 4, 6, 150], ['barra_carga', 4, 4, 6, 150, 'Com carga; sem cinto, faça até a falha'], ['supino_fechado', 3, 5, 8, 120]]),
        day('hy5', 'lp', 'Dia 2', 'Inferior pesado', [
          ['agachamento', 5, 3, 5, 240, 'Série-topo pesada; demais −10% · RIR 1'], ['stiff', 4, 5, 8, 150], ['leg_press', 4, 6, 10, 120],
          ['mesa_flexora', 3, 6, 10, 90], ['panturrilha_pe', 4, 6, 10, 60], ['abdominal_polia', 3, 8, 12, 60]]),
        day('hy5', 'co', 'Dia 3', 'Costas + bíceps (volume)', [
          ['terra', 3, 4, 6, 210, 'Moderado: o pesado de posterior foi no dia 2'], ['barra_fixa', 4, 0, 0, 120, 'Até a falha'], ['remada_cavalinho', 4, 8, 10, 120],
          ['puxada_alta', 3, 10, 12, 90], ['remada_maquina', 3, 10, 12, 90, 'Última série: drop-set até a falha'], ['rosca_direta', 3, 8, 12, 60],
          ['rosca_inclinada', 3, 10, 12, 60, 'Última série até a falha']]),
        day('hy5', 'pe', 'Dia 4', 'Peito + ombros + tríceps (volume)', [
          ['supino_inclinado_barra', 4, 6, 10, 150, 'RIR 1'], ['supino_halteres', 3, 8, 12, 90], ['voador', 3, 12, 15, 60, 'Última série: drop-set até a falha'],
          ['desenvolvimento_arnold', 3, 8, 12, 90], ['elevacao_lateral', 4, 12, 15, 45, 'Última série: rest-pause'], ['crucifixo_invertido', 3, 12, 15, 45],
          ['triceps_corda', 3, 12, 15, 45, 'Última série até a falha']]),
        day('hy5', 'pn', 'Dia 5', 'Pernas (volume)', [
          ['hack_squat', 4, 8, 12, 120, 'RIR 1'], ['bulgaro', 3, 8, 12, 90], ['cadeira_extensora', 3, 12, 15, 60, 'Última série: drop-set até a falha'],
          ['cadeira_flexora', 4, 10, 12, 60], ['elevacao_pelvica', 3, 8, 12, 90], ['panturrilha_sentado', 4, 12, 15, 45]]),
      ],
    },
    {
      id: 'hibrido_av6', focus: 'massa', exact: true, name: 'Híbrido avançado: Upper/Lower pesado + ABCD (6 dias)', short: 'Híbrido UL+ABCD 6x', level: 'avancado',
      daysPerWeek: 6, place: 'academia', goal: 'força + massa (cada músculo 2x)',
      description: 'Mistura do Upper/Lower 6x com o ABCDE: superior e inferior pesados (força) + peito, costas, ombros+braços e pernas em dias de volume. Cada músculo 2x por semana com dia pesado e dia de volume. Sugestão: seg sup. pesado, ter inf. pesado, qua peito, qui costas, sex ombros+braços, sáb pernas, dom descanso.',
      days: [
        day('hy6', 'up', 'Dia 1', 'Superior pesado', [
          ['supino_reto', 5, 3, 5, 180, 'Série-topo pesada; demais −10% · RIR 1'], ['remada_curvada', 5, 4, 6, 150, 'RIR 1'],
          ['desenvolvimento', 4, 4, 6, 150], ['barra_carga', 4, 4, 6, 150, 'Com carga; sem cinto, faça até a falha'], ['triceps_testa', 3, 6, 10, 90]]),
        day('hy6', 'lp', 'Dia 2', 'Inferior pesado', [
          ['agachamento', 5, 3, 5, 240, 'Série-topo pesada; demais −10% · RIR 1'], ['terra', 3, 3, 5, 240], ['leg_press', 3, 6, 10, 120],
          ['mesa_flexora', 3, 6, 10, 90], ['panturrilha_pe', 4, 6, 10, 60]]),
        day('hy6', 'pe', 'Dia 3', 'Peito (volume)', [
          ['supino_inclinado_barra', 4, 6, 10, 150, 'RIR 1'], ['supino_halteres', 4, 8, 12, 90], ['supino_maquina', 3, 10, 12, 90, 'Última série: drop-set até a falha'],
          ['voador', 3, 12, 15, 60], ['crossover', 3, 12, 15, 60, 'Última série até a falha'], ['paralelas', 2, 0, 0, 90]]),
        day('hy6', 'co', 'Dia 4', 'Costas (volume)', [
          ['barra_fixa', 4, 0, 0, 120, 'Até a falha'], ['remada_cavalinho', 4, 8, 10, 120, 'RIR 1'], ['puxada_alta', 3, 10, 12, 90],
          ['remada_maquina', 3, 10, 12, 90, 'Última série: drop-set até a falha'], ['face_pull', 3, 15, 20, 45], ['rosca_martelo', 3, 10, 12, 60]]),
        day('hy6', 'ob', 'Dia 5', 'Ombros + braços (volume)', [
          ['desenvolvimento_arnold', 4, 8, 12, 90, 'RIR 1'], ['elevacao_lateral', 4, 12, 15, 45, 'Última série: rest-pause'], ['crucifixo_invertido', 3, 12, 15, 45],
          ['encolhimento_barra', 3, 8, 12, 60], ['rosca_direta', 3, 8, 12, 60], ['triceps_corda', 3, 12, 15, 45, 'Última série até a falha'],
          ['rosca_inclinada', 3, 10, 12, 60], ['triceps_frances', 3, 10, 12, 60]]),
        day('hy6', 'pn', 'Dia 6', 'Pernas (volume)', [
          ['hack_squat', 4, 8, 12, 120, 'RIR 1'], ['stiff', 4, 8, 10, 120], ['bulgaro', 3, 8, 12, 90],
          ['cadeira_extensora', 3, 12, 15, 60, 'Última série: drop-set até a falha'], ['cadeira_flexora', 3, 10, 12, 60], ['panturrilha_sentado', 4, 12, 15, 45]]),
      ],
    },
    {
      id: 'hibrido5', focus: 'forca', name: 'Upper/Lower + PPL (5 dias)', short: 'Híbrido 5x', level: 'intermediario', daysPerWeek: 5, place: 'academia',
      goal: 'força + massa', description: 'Superior e inferior pesados no começo da semana, depois empurrar, puxar e pernas com mais volume. Cada músculo ~2x por semana.',
      days: [
        day('hb', 'u', 'Superior', 'Força', [
          ['supino_reto', 4, 4, 6, 180], ['remada_curvada', 4, 5, 8, 150], ['desenvolvimento', 3, 6, 8, 120], ['barra_fixa', 3, 0, 0, 120]]),
        day('hb', 'l', 'Inferior', 'Força', [
          ['agachamento', 4, 4, 6, 180], ['terra', 3, 3, 5, 240], ['leg_press', 3, 8, 12, 120], ['panturrilha_pe', 4, 8, 12, 60]]),
        day('hb', 'pu', 'Empurrar', 'Volume', [
          ['supino_inclinado', 4, 8, 12, 90], ['supino_maquina', 3, 10, 12, 90], ['elevacao_lateral', 4, 12, 15, 45], ['triceps_corda', 3, 12, 15, 45], ['triceps_frances', 3, 10, 12, 60]]),
        day('hb', 'pl', 'Puxar', 'Volume', [
          ['puxada_alta', 4, 8, 12, 90], ['remada_maquina', 3, 10, 12, 90], ['face_pull', 3, 15, 15, 45], ['rosca_direta', 3, 8, 12, 60], ['rosca_martelo', 3, 10, 12, 45]]),
        day('hb', 'lg', 'Pernas', 'Volume', [
          ['hack_squat', 4, 8, 12, 120], ['stiff', 3, 8, 12, 120], ['cadeira_extensora', 3, 12, 15, 60], ['cadeira_flexora', 3, 10, 12, 60], ['elevacao_pelvica', 3, 10, 12, 90]]),
      ],
    },
    {
      id: 'torso3', focus: 'massa', name: 'Superior / Inferior / Corpo todo (3 dias)', short: 'Sup/Inf/Corpo', level: 'intermediario', daysPerWeek: 3,
      place: 'academia', goal: 'massa + praticidade',
      description: 'Três treinos que, juntos, treinam cada músculo ~2x por semana: um superior, um inferior e um de corpo todo.',
      days: [
        day('t3', 's', 'Superior', 'Peito, costas, ombros, braços', [
          ['supino_reto', 4, 6, 10, 150], ['remada_curvada', 4, 6, 10, 120], ['desenvolvimento_halteres', 3, 8, 12, 90],
          ['puxada_alta', 3, 8, 12, 90], ['rosca_direta', 2, 10, 12, 45], ['triceps_corda', 2, 12, 15, 45]]),
        day('t3', 'i', 'Inferior', 'Pernas e core', [
          ['agachamento', 4, 6, 10, 150], ['stiff', 3, 8, 10, 120], ['leg_press', 3, 10, 15, 90], ['cadeira_flexora', 3, 10, 12, 60], ['panturrilha_pe', 3, 12, 15, 45], ['prancha', 3, 45, 60, 30]]),
        day('t3', 'c', 'Corpo todo', 'Volume', [
          ['hack_squat', 3, 10, 12, 120], ['supino_inclinado', 3, 8, 12, 90], ['remada_maquina', 3, 10, 12, 90],
          ['elevacao_pelvica', 3, 10, 12, 90], ['elevacao_lateral', 3, 12, 15, 45], ['abdominal_polia', 3, 12, 15, 45]]),
      ],
    },
    {
      id: 'ul6', focus: 'forca', name: 'Upper/Lower 6x – Avançado', short: 'Upper/Lower 6x', level: 'avancado', daysPerWeek: 6, place: 'academia',
      goal: 'força + massa (alta frequência)', description: 'Superior e inferior alternados 3x cada por semana: um dia pesado, um moderado e um de volume para cada metade do corpo.',
      days: [
        day('u6', 'u1', 'Superior 1', 'Pesado', [
          ['supino_reto', 5, 3, 5, 180], ['remada_curvada', 5, 5, 6, 150], ['desenvolvimento', 3, 5, 8, 150], ['barra_fixa', 3, 0, 0, 120], ['triceps_testa', 3, 8, 10, 60]]),
        day('u6', 'l1', 'Inferior 1', 'Pesado', [
          ['agachamento', 5, 3, 5, 240], ['stiff', 4, 6, 8, 150], ['leg_press', 3, 8, 10, 120], ['panturrilha_pe', 4, 8, 12, 60]]),
        day('u6', 'u2', 'Superior 2', 'Moderado', [
          ['supino_inclinado_barra', 4, 6, 10, 150], ['remada_cavalinho', 4, 8, 10, 120], ['desenvolvimento_arnold', 3, 8, 12, 90],
          ['puxada_alta', 3, 10, 12, 90], ['rosca_direta', 3, 8, 12, 60]]),
        day('u6', 'l2', 'Inferior 2', 'Moderado', [
          ['terra', 4, 3, 5, 240], ['hack_squat', 4, 8, 12, 120], ['cadeira_flexora', 3, 10, 12, 60], ['elevacao_pelvica', 3, 8, 12, 90]]),
        day('u6', 'u3', 'Superior 3', 'Volume', [
          ['supino_maquina', 4, 10, 12, 90], ['remada_maquina', 4, 10, 12, 90], ['elevacao_lateral_cabo', 4, 12, 15, 45], ['crucifixo', 3, 12, 15, 60],
          ['triceps_corda', 3, 12, 15, 45], ['rosca_cabo', 3, 12, 15, 45]]),
        day('u6', 'l3', 'Inferior 3', 'Volume', [
          ['bulgaro', 4, 8, 12, 90], ['leg_press', 3, 12, 15, 90], ['cadeira_extensora', 3, 12, 15, 60], ['mesa_flexora', 3, 10, 12, 60], ['panturrilha_sentado', 4, 12, 15, 45]]),
      ],
    },
    {
      id: 'forca_av', focus: 'forca', name: 'Força avançada: pesados + back-off (4 dias)', short: 'Força avançada', level: 'avancado', daysPerWeek: 4,
      place: 'academia', goal: 'força máxima',
      description: 'Para quem já passou da progressão linear: uma série pesadíssima (1–2 reps, ~90–93% do 1RM) e depois séries back-off com 80%. Deload a cada 4ª semana.',
      days: [
        day('fa', 'sq', 'Agachamento', 'Pesado + back-off', [
          ['agachamento', 1, 1, 2, 300, 'Série-topo ~90–93% do 1RM'], ['agachamento', 4, 4, 4, 210, 'Back-off: 80% do 1RM'],
          ['agachamento_frontal', 3, 5, 5, 150], ['stiff', 3, 6, 8, 120], ['abdominal_polia', 3, 10, 12, 45]]),
        day('fa', 'bp', 'Supino', 'Pesado + back-off', [
          ['supino_reto', 1, 1, 2, 300, 'Série-topo ~90–93% do 1RM'], ['supino_reto', 4, 4, 4, 210, 'Back-off: 80% do 1RM, pausa de 1 s'],
          ['supino_fechado', 3, 5, 6, 150], ['remada_curvada', 4, 6, 8, 120], ['triceps_testa', 3, 8, 10, 60]]),
        day('fa', 'dl', 'Terra', 'Pesado + back-off', [
          ['terra', 1, 1, 2, 300, 'Série-topo ~90–93% do 1RM'], ['terra', 3, 3, 3, 240, 'Back-off: 80% do 1RM'],
          ['agachamento', 3, 6, 6, 180, '~70% do 1RM'], ['barra_fixa', 4, 0, 0, 120], ['hiperextensao', 3, 10, 12, 45]]),
        day('fa', 'ohp', 'Desenvolvimento + supino volume', 'Moderado', [
          ['desenvolvimento', 5, 3, 5, 180], ['supino_reto', 4, 6, 8, 180, '~75% do 1RM'], ['remada_cavalinho', 4, 8, 10, 120],
          ['face_pull', 3, 15, 15, 45], ['rosca_direta', 3, 8, 10, 60]]),
      ],
    },
    {
      id: 'esp_supino', focus: 'forca', name: 'Especialização no supino (4 dias)', short: 'Supino forte', level: 'intermediario', daysPerWeek: 4,
      place: 'academia', goal: 'aumentar o supino',
      description: 'Supino 3x por semana com estímulos diferentes (pesado, pausado e volume) e tríceps/ombros fortes. Pernas e costas em manutenção.',
      days: [
        day('esb', 'h', 'Supino pesado', '3–5 reps', [
          ['supino_reto', 5, 3, 5, 210], ['supino_inclinado_barra', 3, 6, 8, 150], ['triceps_testa', 3, 8, 10, 60], ['remada_curvada', 4, 6, 8, 120]]),
        day('esb', 'l', 'Pernas', 'Manutenção', [
          ['agachamento', 4, 5, 6, 180], ['stiff', 3, 8, 10, 120], ['leg_press', 3, 10, 12, 90], ['abdominal_polia', 3, 12, 15, 45]]),
        day('esb', 'p', 'Supino pausado', '5 reps com 2 s no peito', [
          ['supino_reto', 4, 5, 5, 180, 'Pausa de 2 s no peito'], ['supino_fechado', 4, 6, 8, 150], ['desenvolvimento_halteres', 3, 8, 10, 90],
          ['barra_fixa', 4, 0, 0, 120]]),
        day('esb', 'v', 'Supino volume', '8–10 reps', [
          ['supino_halteres', 4, 8, 10, 90], ['supino_maquina', 3, 10, 12, 90], ['paralelas', 3, 0, 0, 90], ['triceps_corda', 3, 12, 15, 45],
          ['face_pull', 3, 15, 15, 45]]),
      ],
    },
    {
      id: 'esp_agacho', focus: 'forca', name: 'Especialização no agachamento (3 dias)', short: 'Agachamento forte', level: 'avancado', daysPerWeek: 3,
      place: 'academia', goal: 'aumentar o agachamento',
      description: 'Agachamento 3x por semana (pesado, frontal e volume) com posterior e core fortes. Superior em manutenção.',
      days: [
        day('esa', 'h', 'Pesado', 'Agachamento 3–5', [
          ['agachamento', 5, 3, 5, 240], ['stiff', 3, 6, 8, 150], ['supino_reto', 4, 5, 8, 150], ['abdominal_polia', 3, 10, 12, 45]]),
        day('esa', 'f', 'Frontal', 'Técnica e quadríceps', [
          ['agachamento_frontal', 4, 4, 6, 180], ['bulgaro', 3, 8, 10, 90], ['barra_fixa', 4, 0, 0, 120], ['remada_cavalinho', 3, 8, 10, 120], ['prancha', 3, 45, 60, 30]]),
        day('esa', 'v', 'Volume', 'Agachamento 6–8', [
          ['agachamento', 4, 6, 8, 180, '~72–75% do 1RM'], ['cadeira_extensora', 3, 12, 15, 60], ['cadeira_flexora', 3, 10, 12, 60],
          ['desenvolvimento', 3, 6, 8, 150], ['panturrilha_pe', 4, 10, 15, 45]]),
      ],
    },
    {
      id: 'esp_terra', focus: 'forca', name: 'Especialização no terra e posterior (4 dias)', short: 'Terra forte', level: 'intermediario', daysPerWeek: 4,
      place: 'academia', goal: 'aumentar o levantamento terra',
      description: 'Terra pesado 1x, variação (stiff) 1x e muito trabalho de posterior, glúteos, costas e pegada.',
      days: [
        day('esd', 'd', 'Terra pesado', '2–5 reps', [
          ['terra', 5, 2, 5, 240], ['remada_curvada', 4, 6, 8, 120], ['hiperextensao', 3, 10, 12, 45], ['farmer', 3, 30, 40, 90]]),
        day('esd', 'u', 'Superior', 'Empurrar', [
          ['supino_reto', 4, 5, 8, 150], ['desenvolvimento', 3, 6, 8, 150], ['triceps_corda', 3, 12, 15, 45], ['elevacao_lateral', 3, 12, 15, 45]]),
        day('esd', 'p', 'Posterior', 'Stiff e glúteos', [
          ['stiff', 4, 6, 8, 150], ['elevacao_pelvica', 4, 8, 10, 120], ['cadeira_flexora', 4, 10, 12, 60], ['agachamento', 3, 6, 8, 180], ['encolhimento_barra', 3, 8, 10, 60]]),
        day('esd', 'b', 'Costas', 'Puxar', [
          ['barra_fixa', 4, 0, 0, 120], ['remada_cavalinho', 4, 8, 10, 120], ['puxada_alta', 3, 10, 12, 90], ['rosca_direta', 3, 8, 12, 60], ['abdominal_polia', 3, 12, 15, 45]]),
      ],
    },
    {
      id: 'bracos5', focus: 'massa', name: 'Especialização em braços (5 dias)', short: 'Braços', level: 'intermediario', daysPerWeek: 5, place: 'academia',
      goal: 'braços maiores', description: 'Bíceps e tríceps 3x por semana com ângulos diferentes (alongado, neutro e contraído); o resto do corpo em manutenção.',
      days: [
        day('bz', 'a', 'Braços A', 'Pesado', [
          ['supino_fechado', 4, 6, 8, 150], ['rosca_direta', 4, 6, 10, 60], ['triceps_testa', 3, 8, 10, 60], ['rosca_martelo', 3, 8, 10, 45]]),
        day('bz', 'l', 'Pernas', 'Manutenção', [
          ['agachamento', 4, 6, 8, 150], ['stiff', 3, 8, 10, 120], ['leg_press', 3, 10, 12, 90], ['panturrilha_pe', 3, 12, 15, 45]]),
        day('bz', 'b', 'Braços B', 'Alongado', [
          ['paralelas', 3, 0, 0, 90], ['rosca_inclinada', 4, 10, 12, 60], ['triceps_frances', 4, 10, 12, 60], ['rosca_scott', 3, 10, 12, 45], ['triceps_coice', 3, 12, 15, 45]]),
        day('bz', 'u', 'Superior', 'Peito, costas, ombros', [
          ['supino_inclinado', 4, 8, 10, 90], ['remada_maquina', 4, 8, 12, 90], ['puxada_alta', 3, 10, 12, 90], ['elevacao_lateral', 3, 12, 15, 45]]),
        day('bz', 'c', 'Braços C', 'Bombeio', [
          ['rosca_cabo', 4, 12, 15, 45, 'Bi-set com o próximo'], ['triceps_corda', 4, 12, 15, 45], ['rosca_concentrada', 3, 12, 15, 45, 'Bi-set com o próximo'],
          ['mergulho_banco', 3, 12, 15, 45], ['rosca_alternada', 2, 15, 20, 45]]),
      ],
    },
    {
      id: 'ombros5', focus: 'massa', name: 'Especialização em ombros (5 dias)', short: 'Ombros 3D', level: 'intermediario', daysPerWeek: 5, place: 'academia',
      goal: 'ombros largos', description: 'Deltoide lateral e posterior em quase todos os treinos (pouca fadiga, muito resultado) e desenvolvimento pesado 2x.',
      days: [
        day('oz', 'a', 'Ombros A', 'Pesado', [
          ['desenvolvimento', 4, 5, 8, 150], ['elevacao_lateral', 4, 12, 15, 45], ['crucifixo_invertido', 3, 12, 15, 45], ['encolhimento_barra', 3, 8, 10, 60]]),
        day('oz', 'p', 'Peito + costas', 'Superior', [
          ['supino_inclinado', 4, 8, 10, 90], ['barra_fixa', 4, 0, 0, 120], ['remada_maquina', 3, 10, 12, 90], ['elevacao_lateral_cabo', 3, 12, 15, 45]]),
        day('oz', 'l', 'Pernas', 'Completo', [
          ['agachamento', 4, 6, 8, 150], ['stiff', 3, 8, 10, 120], ['leg_press', 3, 10, 12, 90], ['cadeira_flexora', 3, 10, 12, 60]]),
        day('oz', 'b', 'Ombros B', 'Volume', [
          ['desenvolvimento_arnold', 4, 8, 12, 90], ['elevacao_lateral_cabo', 4, 12, 15, 45], ['face_pull', 3, 15, 15, 45], ['elevacao_frontal', 2, 12, 15, 45]]),
        day('oz', 'c', 'Braços + ombros', 'Bombeio', [
          ['rosca_direta', 3, 8, 12, 60], ['triceps_corda', 3, 12, 15, 45], ['elevacao_lateral', 3, 15, 20, 45], ['crucifixo_invertido', 3, 15, 20, 45]]),
      ],
    },
    {
      id: 'pernas5', focus: 'massa', name: 'Pernas pesadas: 2 dias de perna (5 dias)', short: 'Pernas 2x', level: 'intermediario', daysPerWeek: 5,
      place: 'academia', goal: 'pernas grandes e fortes',
      description: 'Perna A (quadríceps) e Perna B (posterior e glúteos) bem separadas na semana, com superior em 3 dias.',
      days: [
        day('pz', 'a', 'Perna A', 'Quadríceps', [
          ['agachamento', 4, 5, 8, 180], ['hack_squat', 3, 8, 12, 120], ['leg_press', 3, 12, 15, 90], ['cadeira_extensora', 3, 12, 15, 60], ['panturrilha_pe', 4, 10, 15, 45]]),
        day('pz', 'p', 'Empurrar', 'Peito, ombros, tríceps', [
          ['supino_reto', 4, 6, 8, 150], ['desenvolvimento_halteres', 3, 8, 12, 90], ['crossover', 3, 12, 15, 60], ['triceps_corda', 3, 12, 15, 45]]),
        day('pz', 'q', 'Puxar', 'Costas e bíceps', [
          ['barra_fixa', 4, 0, 0, 120], ['remada_curvada', 4, 6, 10, 120], ['puxada_alta', 3, 10, 12, 90], ['rosca_direta', 3, 8, 12, 60]]),
        day('pz', 'b', 'Perna B', 'Posterior e glúteos', [
          ['terra', 3, 3, 5, 240], ['stiff', 3, 8, 10, 120], ['elevacao_pelvica', 4, 8, 12, 90], ['cadeira_flexora', 4, 10, 12, 60], ['panturrilha_sentado', 4, 12, 15, 45]]),
        day('pz', 'u', 'Superior', 'Volume', [
          ['supino_inclinado', 3, 8, 12, 90], ['remada_maquina', 3, 10, 12, 90], ['elevacao_lateral', 4, 12, 15, 45], ['rosca_martelo', 3, 10, 12, 45], ['triceps_frances', 3, 10, 12, 60]]),
      ],
    },
    {
      id: 'fb4', focus: 'massa', name: 'Full Body 4x – Intermediário', short: 'Full Body 4x', level: 'intermediario', daysPerWeek: 4, place: 'academia',
      goal: 'massa + frequência', description: 'Corpo todo 4x por semana com volume distribuído: sessões médias e cada músculo estimulado com frequência.',
      days: [
        day('f4', 'a', 'Treino A', 'Agachamento + supino', [
          ['agachamento', 3, 6, 8, 150], ['supino_reto', 3, 6, 8, 150], ['remada_cabo', 3, 10, 12, 90], ['elevacao_lateral', 3, 12, 15, 45], ['rosca_direta', 2, 10, 12, 45]]),
        day('f4', 'b', 'Treino B', 'Terra + desenvolvimento', [
          ['terra', 3, 4, 6, 180], ['desenvolvimento', 3, 6, 8, 150], ['puxada_alta', 3, 10, 12, 90], ['cadeira_extensora', 2, 12, 15, 60], ['triceps_corda', 2, 12, 15, 45]]),
        day('f4', 'c', 'Treino C', 'Leg press + inclinado', [
          ['leg_press', 3, 10, 12, 120], ['supino_inclinado', 3, 8, 12, 90], ['remada_maquina', 3, 10, 12, 90], ['cadeira_flexora', 3, 10, 12, 60], ['abdominal_polia', 3, 12, 15, 45]]),
        day('f4', 'd', 'Treino D', 'Unilateral + barra', [
          ['bulgaro', 3, 8, 10, 90], ['barra_fixa', 3, 0, 0, 120], ['supino_halteres', 3, 8, 12, 90], ['elevacao_pelvica', 3, 10, 12, 90], ['rosca_martelo', 2, 10, 12, 45]]),
      ],
    },
    {
      id: 'fb5', focus: 'massa', name: 'Full Body 5x – Avançado (alta frequência)', short: 'Full Body 5x', level: 'avancado', daysPerWeek: 5,
      place: 'academia', goal: 'massa + força', description: 'Corpo todo 5x por semana, cada sessão com um foco diferente. Muito volume semanal dividido em sessões de ~60 min.',
      days: [
        day('f5', 'a', 'Dia 1', 'Foco agachamento', [
          ['agachamento', 4, 4, 6, 180], ['supino_halteres', 3, 8, 10, 90], ['remada_maquina', 3, 10, 12, 90], ['elevacao_lateral', 3, 12, 15, 45]]),
        day('f5', 'b', 'Dia 2', 'Foco supino', [
          ['supino_reto', 4, 4, 6, 180], ['barra_fixa', 3, 0, 0, 120], ['stiff', 3, 8, 10, 120], ['triceps_corda', 3, 12, 15, 45]]),
        day('f5', 'c', 'Dia 3', 'Foco terra', [
          ['terra', 4, 3, 5, 240], ['desenvolvimento', 3, 6, 8, 150], ['leg_press', 3, 10, 12, 90], ['rosca_direta', 3, 8, 12, 60]]),
        day('f5', 'd', 'Dia 4', 'Foco costas', [
          ['remada_curvada', 4, 6, 8, 150], ['supino_inclinado_barra', 3, 6, 10, 150], ['hack_squat', 3, 8, 12, 120], ['crucifixo_invertido', 3, 12, 15, 45]]),
        day('f5', 'e', 'Dia 5', 'Volume e bombeio', [
          ['bulgaro', 3, 8, 10, 90], ['supino_maquina', 3, 10, 12, 90], ['puxada_alta', 3, 10, 12, 90], ['elevacao_lateral_cabo', 3, 12, 15, 45],
          ['rosca_cabo', 2, 12, 15, 45], ['triceps_frances', 2, 10, 12, 45]]),
      ],
    },
    {
      id: 'abc_maq', focus: 'massa', name: 'ABC em máquinas – Iniciante', short: 'ABC máquinas', level: 'iniciante', daysPerWeek: 3, place: 'academia',
      goal: 'aprender + massa', description: 'ABC clássico só com máquinas e cabos: seguro para aprender e perfeito para academias cheias de aparelhos.',
      days: [
        day('am', 'a', 'Treino A', 'Peito, ombros e tríceps', [
          ['supino_maquina', 3, 10, 12, 90], ['voador', 3, 12, 15, 60], ['desenvolvimento_maquina', 3, 10, 12, 90], ['elevacao_lateral_cabo', 2, 12, 15, 45], ['triceps_corda', 3, 12, 15, 45]]),
        day('am', 'b', 'Treino B', 'Costas e bíceps', [
          ['puxada_alta', 3, 10, 12, 90], ['remada_maquina', 3, 10, 12, 90], ['pulldown_reto', 2, 12, 15, 60], ['rosca_cabo', 3, 12, 15, 45], ['abdominal_polia', 2, 12, 15, 45]]),
        day('am', 'c', 'Treino C', 'Pernas', [
          ['leg_press', 3, 10, 15, 120], ['cadeira_extensora', 3, 12, 15, 60], ['cadeira_flexora', 3, 10, 12, 60], ['cadeira_adutora', 2, 12, 15, 45],
          ['abdutora', 2, 15, 20, 45], ['panturrilha_sentado', 3, 12, 15, 45]]),
      ],
    },
    {
      id: 'inferior5', focus: 'massa', name: 'Inferior 3x + superior 2x (5 dias)', short: 'Inferior 3x', level: 'intermediario', daysPerWeek: 5,
      place: 'academia', goal: 'glúteos e pernas',
      description: 'Membros inferiores 3x por semana (quadríceps, glúteos, posterior) e superior 2x para manter o equilíbrio do corpo.',
      days: [
        day('i5', 'g', 'Inferior 1', 'Glúteos', [
          ['elevacao_pelvica', 4, 8, 12, 120], ['stiff', 3, 8, 10, 120], ['abdutora', 3, 15, 20, 45], ['coice_cabo', 3, 12, 15, 45]]),
        day('i5', 's1', 'Superior 1', 'Costas e ombros', [
          ['puxada_alta', 3, 8, 12, 90], ['remada_maquina', 3, 10, 12, 90], ['desenvolvimento_maquina', 3, 10, 12, 90], ['elevacao_lateral', 3, 12, 15, 45]]),
        day('i5', 'q', 'Inferior 2', 'Quadríceps', [
          ['agachamento', 4, 6, 10, 150], ['leg_press', 3, 10, 15, 120], ['cadeira_extensora', 3, 12, 15, 60], ['cadeira_adutora', 3, 12, 15, 45], ['panturrilha_pe', 3, 12, 15, 45]]),
        day('i5', 's2', 'Superior 2', 'Peito e braços', [
          ['supino_halteres', 3, 8, 12, 90], ['crossover', 3, 12, 15, 60], ['rosca_direta', 3, 10, 12, 45], ['triceps_corda', 3, 12, 15, 45]]),
        day('i5', 'p', 'Inferior 3', 'Posterior e glúteos', [
          ['bulgaro', 3, 8, 12, 90], ['cadeira_flexora', 4, 10, 12, 60], ['ponte_gluteo', 3, 15, 20, 45], ['hiperextensao', 3, 12, 15, 45], ['abdominal_infra', 3, 12, 15, 45]]),
      ],
    },
    {
      id: 'hib_cond', focus: 'condicionamento', name: 'Força + condicionamento (4 dias)', short: 'Força + cardio', level: 'intermediario', daysPerWeek: 4,
      place: 'academia', goal: 'força + fôlego',
      description: 'Dois dias de força com básicos e dois dias de circuito metabólico. Bom para quem quer ser forte e ter fôlego.',
      days: [
        day('hc', 'f1', 'Força 1', 'Agachamento + supino', [
          ['agachamento', 4, 4, 6, 180], ['supino_reto', 4, 4, 6, 180], ['remada_curvada', 3, 6, 8, 120], ['prancha', 3, 45, 60, 30]]),
        day('hc', 'c1', 'Circuito 1', 'Metabólico', [
          ['kettlebell_swing', 4, 15, 15, 15], ['burpee', 4, 10, 10, 15], ['remada_cabo', 4, 12, 12, 15], ['mountain_climber', 4, 30, 30, 15], ['farmer', 4, 30, 30, 15]],
          { mode: 'circuit', rounds: 4, roundRest: 90 }),
        day('hc', 'f2', 'Força 2', 'Terra + desenvolvimento', [
          ['terra', 4, 3, 5, 240], ['desenvolvimento', 4, 5, 6, 150], ['barra_fixa', 3, 0, 0, 120], ['abdominal_polia', 3, 12, 15, 45]]),
        day('hc', 'c2', 'Circuito 2', 'Intervalado', [
          ['esteira', 1, 0, 0, 60], ['salto_caixote', 4, 5, 5, 60], ['afundo', 3, 12, 12, 60], ['pular_corda', 4, 45, 60, 30]]),
      ],
    },
    {
      id: 'halteres5', focus: 'casa', name: 'Halteres e banco – divisão 5 dias', short: 'Halteres 5x', level: 'intermediario', daysPerWeek: 5,
      place: 'halteres', goal: 'massa muscular', description: 'Divisão por grupos só com halteres ajustáveis e um banco: peito, costas, pernas, ombros e braços.',
      days: [
        day('h5', 'pe', 'Peito', 'Halteres', [
          ['supino_halteres', 4, 8, 12, 90], ['supino_inclinado', 4, 8, 12, 90], ['crucifixo', 3, 12, 15, 60], ['flexao', 2, 0, 0, 60]]),
        day('h5', 'co', 'Costas', 'Halteres', [
          ['serrote', 4, 8, 12, 60], ['pullover', 3, 10, 12, 60], ['crucifixo_invertido', 3, 12, 15, 45], ['encolhimento', 3, 12, 15, 45]]),
        day('h5', 'pn', 'Pernas', 'Halteres', [
          ['agachamento_goblet', 4, 10, 15, 90], ['bulgaro', 3, 8, 12, 90, 'Com halteres'], ['stiff', 4, 10, 12, 90, 'Com halteres'], ['panturrilha_pe', 4, 15, 20, 45]]),
        day('h5', 'om', 'Ombros', 'Halteres', [
          ['desenvolvimento_arnold', 4, 8, 12, 90], ['elevacao_lateral', 4, 12, 15, 45], ['elevacao_frontal', 2, 12, 15, 45], ['crucifixo_invertido', 3, 15, 15, 45]]),
        day('h5', 'br', 'Braços', 'Halteres', [
          ['rosca_alternada', 4, 8, 12, 45], ['triceps_frances', 4, 10, 12, 60], ['rosca_martelo', 3, 10, 12, 45], ['triceps_coice', 3, 12, 15, 45], ['rosca_concentrada', 2, 12, 15, 45]]),
      ],
    },
    {
      id: 'casa_av', focus: 'casa', name: 'Peso corporal avançado (5 dias)', short: 'Casa avançado', level: 'avancado', daysPerWeek: 5, place: 'casa',
      goal: 'força relativa + resistência', description: 'Para quem já domina o básico em casa: volume alto, séries até a falha e progressões difíceis (descida lenta, pausas, unilateral).',
      days: [
        day('ca', 'pu', 'Empurrar', 'Peito, ombros e tríceps', [
          ['flexao', 5, 0, 0, 60, 'Descida em 3 s'], ['paralelas', 4, 0, 0, 90], ['mergulho_banco', 3, 15, 20, 45], ['prancha', 3, 60, 60, 30]]),
        day('ca', 'pl', 'Puxar', 'Costas e bíceps', [
          ['barra_fixa', 5, 0, 0, 120], ['elevacao_pernas', 4, 10, 15, 60], ['hiperextensao', 3, 15, 20, 45], ['prancha_lateral', 3, 45, 45, 30]]),
        day('ca', 'lg', 'Pernas', 'Unilateral', [
          ['afundo_reverso', 4, 12, 15, 60, 'Com mochila pesada'], ['step_up', 4, 12, 15, 60], ['ponte_gluteo', 4, 20, 25, 45], ['panturrilha_pe', 4, 20, 25, 45]]),
        day('ca', 'mc', 'Metcon', 'Circuito', [
          ['burpee', 5, 12, 12, 15], ['agachamento_livre', 5, 25, 25, 15], ['flexao', 5, 15, 15, 15], ['mountain_climber', 5, 40, 40, 15]],
          { mode: 'circuit', rounds: 5, roundRest: 90 }),
        day('ca', 'ft', 'Corpo todo', 'Volume', [
          ['barra_fixa', 4, 0, 0, 90], ['paralelas', 4, 0, 0, 90], ['agachamento_livre', 4, 20, 25, 60], ['abdominal_infra', 4, 15, 20, 45]]),
      ],
    },
    {
      id: 'atleta3', focus: 'forca', name: 'Atleta: força e potência (3 dias)', short: 'Força e potência', level: 'intermediario', daysPerWeek: 3,
      place: 'academia', goal: 'explosão + força para esporte',
      description: 'Saltos no início (com o corpo descansado), depois básicos pesados e trabalho de core. Ótimo como complemento de futebol, luta, corrida etc.',
      days: [
        day('at', 'a', 'Treino A', 'Inferior potente', [
          ['salto_caixote', 4, 4, 5, 90, 'Explosivo, descanso completo'], ['agachamento', 4, 3, 5, 180], ['stiff', 3, 6, 8, 120], ['prancha_lateral', 3, 30, 45, 30]]),
        day('at', 'b', 'Treino B', 'Superior forte', [
          ['salto_grupado', 3, 5, 5, 90], ['supino_reto', 4, 4, 6, 150], ['barra_fixa', 4, 0, 0, 120], ['desenvolvimento_halteres', 3, 6, 8, 90], ['farmer', 3, 30, 40, 90]]),
        day('at', 'c', 'Treino C', 'Corpo todo', [
          ['kettlebell_swing', 4, 10, 12, 60, 'Explosivo'], ['terra_trap', 4, 3, 5, 180], ['bulgaro', 3, 6, 8, 90], ['remada_curvada', 3, 6, 8, 120], ['abdominal_polia', 3, 10, 12, 45]]),
      ],
    },
    {
      id: 'recomp5', focus: 'condicionamento', name: 'Recomposição corporal (5 dias)', short: 'Recomposição', level: 'intermediario', daysPerWeek: 5,
      place: 'academia', goal: 'perder gordura mantendo músculo',
      description: 'Musculação com descanso curto em 3 dias e 2 dias de condicionamento. Combine com déficit calórico moderado e proteína alta.',
      days: [
        day('rc', 'u', 'Superior', 'Descanso curto', [
          ['supino_halteres', 3, 8, 12, 60], ['remada_maquina', 3, 10, 12, 60], ['desenvolvimento_maquina', 3, 10, 12, 60], ['puxada_alta', 3, 10, 12, 60], ['triceps_corda', 2, 12, 15, 45]]),
        day('rc', 'c1', 'Condicionamento 1', 'Intervalado', [
          ['esteira', 1, 0, 0, 60], ['mountain_climber', 3, 30, 40, 30], ['abdominal_infra', 3, 15, 15, 30]]),
        day('rc', 'l', 'Inferior', 'Descanso curto', [
          ['agachamento', 3, 8, 10, 90], ['stiff', 3, 10, 12, 90], ['leg_press', 3, 12, 15, 60], ['cadeira_flexora', 3, 12, 15, 45], ['panturrilha_pe', 3, 15, 20, 30]]),
        day('rc', 'c2', 'Condicionamento 2', 'Circuito', [
          ['kettlebell_swing', 4, 15, 15, 15], ['burpee', 4, 10, 10, 15], ['remada_cabo', 4, 12, 12, 15], ['polichinelo', 4, 40, 40, 15]],
          { mode: 'circuit', rounds: 4, roundRest: 90 }),
        day('rc', 'f', 'Corpo todo', 'Força', [
          ['terra_trap', 3, 5, 6, 150], ['supino_reto', 3, 6, 8, 150], ['barra_fixa', 3, 0, 0, 120], ['abdominal_polia', 3, 12, 15, 45]]),
      ],
    },
    {
      id: 'retorno3', focus: 'massa', name: 'Retorno após pausa (3 dias)', short: 'Retorno', level: 'iniciante', daysPerWeek: 3, place: 'academia',
      goal: 'voltar a treinar sem lesão', description: 'Para quem ficou meses parado: volume baixo, cargas moderadas e progressão gradual por 4–6 semanas antes de voltar a um programa mais pesado.',
      days: [
        day('rt', 'a', 'Treino A', 'Corpo todo', [
          ['leg_press', 2, 12, 15, 90], ['supino_maquina', 2, 10, 12, 90], ['remada_maquina', 2, 10, 12, 90], ['prancha', 2, 30, 30, 30]]),
        day('rt', 'b', 'Treino B', 'Corpo todo', [
          ['agachamento_goblet', 2, 10, 12, 90], ['puxada_alta', 2, 10, 12, 90], ['desenvolvimento_maquina', 2, 10, 12, 90], ['ponte_gluteo', 2, 15, 15, 45]]),
        day('rt', 'c', 'Treino C', 'Corpo todo', [
          ['cadeira_extensora', 2, 12, 15, 60], ['cadeira_flexora', 2, 12, 15, 60], ['supino_halteres', 2, 10, 12, 90], ['remada_cabo', 2, 10, 12, 90], ['face_pull', 2, 15, 15, 45]]),
      ],
    },
    {
      id: 'casa', focus: 'casa', name: 'Em casa – peso corporal (3 dias)', short: 'Casa', level: 'iniciante', daysPerWeek: 3, place: 'casa',
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
      id: 'halteres', focus: 'casa', name: 'Só halteres (3 dias)', short: 'Halteres', level: 'iniciante', daysPerWeek: 3, place: 'halteres',
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
      id: 'condicionamento', focus: 'condicionamento', name: 'Condicionamento em circuito (3 dias)', short: 'Circuito', level: 'iniciante', daysPerWeek: 3,
      place: 'casa', goal: 'condicionamento / gasto calórico',
      description: 'Circuitos curtos e intensos. Combine com alimentação adequada se o objetivo for emagrecer. Sem equipamento.',
      days: [
        day('cond', 'a', 'Circuito A', 'Corpo todo', [
          ['agachamento_salto', 4, 12, 12, 15], ['flexao', 4, 10, 10, 15], ['agachamento_livre', 4, 20, 20, 15],
          ['mountain_climber', 4, 30, 30, 15], ['prancha', 4, 30, 30, 15]], { mode: 'circuit', rounds: 4, roundRest: 90 }),
        day('cond', 'b', 'Circuito B', 'Cardio + core', [
          ['burpee', 4, 10, 10, 15], ['polichinelo', 4, 40, 40, 15], ['afundo', 4, 12, 12, 15],
          ['abdominal_crunch', 4, 20, 20, 15], ['pular_corda', 4, 60, 60, 15]], { mode: 'circuit', rounds: 4, roundRest: 90 }),
        day('cond', 'c', 'Intervalado', 'Tiros + core', [
          ['esteira', 1, 0, 0, 60], ['prancha_lateral', 3, 30, 30, 30], ['abdominal_infra', 3, 15, 15, 30]]),
      ],
    },
  ];
  // ------------------------------------------------------------- intensidade dos avançados
  // Avançado de verdade: mais séries nos principais, RIR 1 nos básicos e falha (+ drop-set) nos isoladores.
  const extra = {
    'dup-p': [['stiff', 3, 6, 8, 150]],
    'dup-m': [['elevacao_pelvica', 3, 8, 10, 90]],
    'pb-a': [['stiff', 3, 8, 10, 120], ['leg_press', 3, 10, 12, 90]],
    'pb-e': [['rosca_martelo', 3, 10, 12, 45]],
    'pl-sq': [['bulgaro', 3, 8, 8, 90]],
    'pl-bv': [['rosca_martelo', 3, 10, 12, 45]],
    'ar-pn1': [['elevacao_pelvica', 3, 8, 12, 90]],
    'ppl-la': [['elevacao_pelvica', 3, 8, 12, 90]],
    'f5-a': [['cadeira_flexora', 3, 10, 12, 60]],
    'f5-b': [['elevacao_lateral_cabo', 3, 12, 15, 45]],
    'f5-c': [['face_pull', 3, 15, 15, 45]],
    'f5-d': [['rosca_martelo', 3, 10, 12, 45]],
  };
  function intensify(p) {
    for (const d of p.days) {
      for (const row of extra[d.id] || []) d.items.splice(d.items.length - 1, 0, it(d.id, row, d.items.length + 10));
      if (d.mode === 'circuit') continue;
      d.items.forEach((i, k) => {
        const ex = EXERCISES[i.ex];
        if (k === 0) { i.sets = Math.min(6, i.sets + 1); if (!i.note) i.note = 'Séries de trabalho com RIR 1 (sobra só 1 rep)'; }
        else if (k === 1) i.sets = Math.min(5, i.sets + 1);
        else if (k >= d.items.length - 2 && ex.load !== 'none' && !i.note && (ex.equip || []).some((e) => e === 'maquina' || e === 'cabo' || e === 'halteres')) {
          i.note = 'Última série até a falha + drop-set';
        }
      });
    }
    p.description += ' Avançado: séries perto da falha, exige técnica sólida e boa recuperação.';
    return p;
  }
  for (const p of PROGRAMS) if (p.level === 'avancado' && !p.exact) intensify(p);

  // ABCDE com o treino de costas e a divisão de pernas do Upper/Lower 6x. Peito, ombros e braços são
  // copiados do ABCDE avançado já intensificado (exatamente como aparece no app).
  {
    const src = PROGRAMS.find((p) => p.id === 'abcde_av');
    const copy = (from, key, name) => {
      const d = src.days.find((x) => x.id === `a5x-${from}`);
      const id = `a6p-${key}`;
      return Object.assign({}, d, { id, name, items: d.items.map((i, k) => Object.assign({}, i, { uid: `${id}-${k + 1}-${i.ex}` })) });
    };
    const RIR = 'Séries de trabalho com RIR 1 (sobra só 1 rep)';
    const DROP = 'Última série até a falha + drop-set';
    PROGRAMS.push({
      id: 'abcde_pernas2', focus: 'massa', exact: true, name: 'ABCDE + costas e pernas do Upper/Lower (6 dias)', short: 'ABCDE + 2 pernas',
      level: 'avancado', daysPerWeek: 6, place: 'academia', goal: 'massa muscular (alto volume)',
      description: 'Divisão do ABCDE avançado (um grupo por dia) com o treino de costas do Upper/Lower 6x (remadas pesadas + puxadas) e as pernas em dois dias: um pesado (agachamento) e um moderado (terra). As duas pernas ficam espaçadas na semana para recuperar. Se treinar só 5 dias por semana, tudo bem: o app segue a ordem A→F, e o ciclo continua na semana seguinte.',
      days: [
        copy('a', 'a', 'Treino A'),
        day('a6p', 'b', 'Treino B', 'Costas', [
          ['remada_curvada', 5, 5, 6, 150, RIR], ['remada_cavalinho', 5, 8, 10, 120], ['barra_fixa', 4, 0, 0, 120],
          ['puxada_alta', 3, 10, 12, 90], ['remada_maquina', 4, 10, 12, 90, DROP]]),
        day('a6p', 'c', 'Treino C', 'Pernas 1 – Pesado', [
          ['agachamento', 6, 3, 5, 240, RIR], ['stiff', 5, 6, 8, 150], ['leg_press', 3, 8, 10, 120, DROP],
          ['cadeira_extensora', 3, 12, 15, 60], ['panturrilha_pe', 4, 8, 12, 60, DROP]]),
        copy('c', 'd', 'Treino D'),
        copy('d', 'e', 'Treino E'),
        day('a6p', 'f', 'Treino F', 'Pernas 2 – Moderado', [
          ['terra', 5, 3, 5, 240, RIR], ['hack_squat', 5, 8, 12, 120], ['cadeira_flexora', 3, 10, 12, 60, DROP],
          ['elevacao_pelvica', 3, 8, 12, 90], ['panturrilha_sentado', 4, 12, 15, 45, DROP]]),
      ],
    });
  }
  // Principais dos periodizados: marcados para o app ajustar séries/reps/RIR conforme o bloco.
  for (const p of PROGRAMS) {
    if (!p.periodization) continue;
    for (const d of p.days) for (const i of d.items) {
      if (i.note && i.note.startsWith('Principal')) {
        i.main = true;
        if (i.ex === 'terra') i.mainDelta = -1;
        i.note = i.note.replace(/^Principal( · )?/, '') || undefined;
        if (!i.note) delete i.note;
      }
    }
  }

  // Itens de intervalo precisam da configuração
  for (const p of PROGRAMS) for (const d of p.days) for (const i of d.items) {
    if (i.ex === 'esteira' && !i.interval) i.interval = { work: 20, rest: 40, reps: 8 };
  }

  // ------------------------------------------------------------- guia

  const GUIDE = [
    {
      title: 'Emagrecer (perder gordura)',
      body: [
        'Quem decide a perda de gordura é o déficit calórico: coma ~300–500 kcal abaixo do que gasta (perda de ~0,5–1% do peso por semana).',
        'Mantenha a musculação 2–4x por semana: no déficit, ela é o que segura a massa muscular (e o metabolismo).',
        'Proteína alta (~1,6–2,2 g/kg) e sono de 7–9 h ajudam a perder gordura e não músculo.',
        'Cardio soma gasto: 150–300 min/semana moderado (ou 75–150 min intenso). Caminhada inclinada, bike e elíptico quase não atrapalham a recuperação.',
        'HIIT economiza tempo, mas cansa muito: 1–2 sessões por semana bastam. Passos no dia a dia (7–10 mil) fazem muita diferença.',
      ],
    },
    {
      title: 'Mobilidade e alongamento',
      body: [
        'Antes do treino: mobilidade dinâmica (gato-vaca, rotação torácica, agachamento profundo), 5–10 min.',
        'Alongamento estático longo (30–60 s) fica melhor depois do treino ou em outro horário.',
        'Ganhar amplitude leva semanas: faça 2–3x por semana, sem forçar até a dor.',
      ],
    },
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
      title: 'Técnicas de intensidade (para treinos avançados)',
      body: [
        'Use só na ÚLTIMA série de 1–2 exercícios por treino, de preferência em máquinas e cabos (mais seguro perto da falha).',
        'Drop-set: chegou perto da falha, reduza a carga 20–30% e continue até falhar de novo (1–2 quedas).',
        'Rest-pause: falhou, descanse 10–20 s e faça mais reps com a mesma carga (1–2 vezes).',
        'Bi-set: dois exercícios seguidos sem descanso (ex.: rosca + tríceps). Economiza tempo.',
        'Série-topo + back-off: 1 série pesada e as demais 10% mais leves, com mais reps.',
        'Evite falha total em agachamento, terra e supino livre sem segurança — use RIR 1–2 (sobrar 1–2 reps).',
      ],
    },
    {
      title: 'Treino de força: cargas e progressão',
      body: [
        'Força máxima pede cargas altas: 1–5 reps a ~80–90% do 1RM, 3–5 min de descanso.',
        'Use o 1RM estimado do app (tela do exercício) para calcular: ex.: 1RM 100 kg → 85% = 85 kg.',
        '5×5 e progressão linear funcionam muito bem nos primeiros meses: suba 2,5 kg (membros superiores) ou 5 kg (inferiores) quando fechar todas as séries.',
        'Quando a progressão travar, alterne semanas pesadas e leves e faça deload a cada 4–6 semanas.',
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
    'Willis et al. (2012). Effects of aerobic and/or resistance training on body mass and fat mass in overweight or obese adults. J Appl Physiol.',
    'Donnelly et al. – ACSM (2009). Appropriate physical activity intervention strategies for weight loss and prevention of weight regain. Med Sci Sports Exerc.',
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
    if (goal === 'mobilidade') return days <= 2 ? 'mob_core2' : 'mobilidade3';
    if (goal === 'emagrecer') {
      if (place !== 'academia') return days >= 4 && level !== 'iniciante' ? 'hiit_casa4' : 'emag_casa3';
      if (days <= 2) return 'emag2';
      if (days === 3) return 'emag3';
      if (days === 4) return level === 'iniciante' ? 'emag3' : 'emag4';
      return level === 'iniciante' ? 'emag3' : 'emag5';
    }
    // Iniciante: sempre um programa de iniciante (3 dias rendem mais que 5–6 no começo).
    if (level === 'iniciante') {
      if (place !== 'academia') return goal === 'condicionamento' ? 'condicionamento' : (place === 'casa' ? 'casa' : 'halteres');
      if (days <= 2) return 'minimal2';
      if (goal === 'condicionamento') return 'baixoimpacto';
      return goal === 'forca' ? 'forca5x5' : 'fullbody3';
    }
    if (place === 'casa') {
      if (goal === 'condicionamento') return 'condicionamento';
      return days >= 4 && level !== 'iniciante' ? 'calistenia' : 'casa';
    }
    if (place === 'halteres') {
      if (goal === 'condicionamento' && days === 3 && level !== 'iniciante') return 'funcional3';
      return days >= 4 ? 'halteres4' : 'halteres';
    }
    if (days <= 2) return 'minimal2';
    if (goal === 'condicionamento') {
      if (level === 'iniciante') return 'baixoimpacto';
      return days >= 5 && level === 'avancado' ? 'metcon5' : (days === 4 ? 'hib_cond' : 'condicionamento');
    }
    if (goal === 'forca') {
      if (days <= 3) return level === 'avancado' ? 'esp_agacho' : 'forca5x5';
      if (days === 4) return level === 'iniciante' ? 'upperlower' : (level === 'avancado' ? 'powerlifting' : 'phul');
      if (days === 5) return level === 'avancado' ? 'powerbuilding' : 'hibrido5';
      return 'ul6';
    }
    // hipertrofia
    if (days <= 3) return level === 'iniciante' ? 'fullbody3' : 'abc';
    if (days === 4) return level === 'iniciante' ? 'upperlower' : (level === 'avancado' ? 'phul' : 'abcd');
    if (days === 5) return level === 'iniciante' ? 'abc' : (level === 'avancado' ? 'abcde_av' : 'classico5');
    return level === 'avancado' ? 'split6' : (level === 'intermediario' ? 'ppl' : 'upperlower');
  }

  const GOAL_FOCUS = { hipertrofia: 'massa', forca: 'forca', emagrecer: 'emagrecimento', condicionamento: 'condicionamento', mobilidade: 'mobilidade' };
  /** Objetivos que não são só musculação: o foco do programa precisa bater em qualquer local. */
  const STRICT_GOALS = ['emagrecer', 'condicionamento', 'mobilidade'];

  /** Um programa atende às respostas? (null = qualquer). Emagrecer, condicionamento e mobilidade sempre exigem o foco certo;
   * em casa, massa/força aceitam programas de casa, mas nunca de emagrecimento ou mobilidade. */
  function matches(p, a) {
    if (a.days && p.daysPerWeek !== a.days) return false;
    if (a.level && p.level !== a.level) return false;
    // mobilidade se faz em qualquer lugar: o local não exclui programas de mobilidade
    if (a.place && p.place !== a.place && !(a.goal === 'mobilidade' && p.focus === 'mobilidade')) return false;
    if (a.goal) {
      const f = GOAL_FOCUS[a.goal];
      if (p.place === 'academia' || STRICT_GOALS.includes(a.goal)) { if (p.focus !== f) return false; }
      else if (p.focus === 'emagrecimento' || p.focus === 'mobilidade') return false;
    }
    return true;
  }

  const LEVEL_N = { iniciante: 0, intermediario: 1, avancado: 2 };

  /** Proximidade quando nada atende tudo: local > dias > experiência > objetivo. */
  function closeness(p, a) {
    let sc = 0;
    const anyPlace = a.goal === 'mobilidade' && p.focus === 'mobilidade';
    if (a.place) sc += p.place === a.place || anyPlace ? 20 : (a.place === 'halteres' && p.place === 'casa' ? 8 : 0);
    if (a.days) sc += 10 - 4 * Math.abs(p.daysPerWeek - a.days);
    if (a.level && anyPlace) sc += 6; // mobilidade serve para qualquer nível
    else if (a.level) {
      const d = LEVEL_N[p.level] - LEVEL_N[a.level];
      sc += d === 0 ? 6 : d === -1 ? 3 : d === 1 ? -2 : -12; // nunca empurra avançado para iniciante
    }
    if (a.goal) sc += p.focus === GOAL_FOCUS[a.goal] ? (a.goal === 'emagrecer' || a.goal === 'mobilidade' ? 20 : 8) : (p.place !== 'academia' && !STRICT_GOALS.includes(a.goal) && p.focus === 'casa') ? 5 : 0;
    return sc;
  }

  /** Recomendação + lista coerentes: a recomendação respeita o que foi escolhido; sem programa exato, mostra o mais próximo. */
  function findPrograms(a) {
    const list = PROGRAMS.filter((p) => matches(p, a));
    const full = a.days && a.level && a.place && a.goal;
    if (list.length) {
      const pref = full ? recommend(a) : null;
      const best = list.find((p) => p.id === pref) || list[0];
      return { best, approx: false, others: list.filter((p) => p !== best) };
    }
    const near = PROGRAMS.slice().sort((x, y) => closeness(y, a) - closeness(x, a)).slice(0, 6);
    return { best: near[0], approx: true, others: near.slice(1) };
  }

  const FOCUS = { massa: 'Massa muscular', forca: 'Força', casa: 'Casa/halteres', emagrecimento: 'Emagrecimento', condicionamento: 'Condicionamento', mobilidade: 'Mobilidade' };

  const api = { GROUPS, MUSCLES, EQUIP, PROGRAMS, GUIDE, SOURCES, LEVELS, PLACES, FOCUS, recommend, findPrograms, matches };
  Object.assign(D, api);
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(typeof self !== 'undefined' ? self : this);
