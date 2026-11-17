/* Vídeos curtos (MP4 em loop, sem áudio) que substituem o GIF quando existem.
 * Gerado por tools/video/build.py a partir de tools/video/sources.json.
 * Cada entrada precisa de crédito e licença: só use vídeo próprio ou com licença que permita redistribuição. */
(function (root) {
  'use strict';
  const MEDIA = {
  "afundo": {
    "src": "videos/afundo.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/206/view/"
  },
  "agachamento_smith": {
    "src": "videos/agachamento_smith.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/341/view/"
  },
  "barra_fixa": {
    "src": "videos/barra_fixa.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/475/view/"
  },
  "cadeira_adutora": {
    "src": "videos/cadeira_adutora.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/12/view/"
  },
  "cadeira_flexora": {
    "src": "videos/cadeira_flexora.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/366/view/"
  },
  "crucifixo_invertido": {
    "src": "videos/crucifixo_invertido.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/82/view/"
  },
  "desenvolvimento_halteres": {
    "src": "videos/desenvolvimento_halteres.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/567/view/"
  },
  "desenvolvimento_maquina": {
    "src": "videos/desenvolvimento_maquina.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/543/view/"
  },
  "elevacao_lateral": {
    "src": "videos/elevacao_lateral.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/348/view/"
  },
  "elevacao_lateral_cabo": {
    "src": "videos/elevacao_lateral_cabo.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/349/view/"
  },
  "elevacao_pelvica": {
    "src": "videos/elevacao_pelvica.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/294/view/"
  },
  "encolhimento": {
    "src": "videos/encolhimento.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/570/view/"
  },
  "face_pull": {
    "src": "videos/face_pull.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/222/view/"
  },
  "hack_squat": {
    "src": "videos/hack_squat.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/375/view/"
  },
  "leg_press": {
    "src": "videos/leg_press.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/371/view/"
  },
  "mesa_flexora": {
    "src": "videos/mesa_flexora.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/365/view/"
  },
  "panturrilha_pe": {
    "src": "videos/panturrilha_pe.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/622/view/"
  },
  "panturrilha_sentado": {
    "src": "videos/panturrilha_sentado.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/590/view/"
  },
  "paralelas": {
    "src": "videos/paralelas.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/194/view/"
  },
  "remada_cabo": {
    "src": "videos/remada_cabo.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/512/view/"
  },
  "rosca_alternada": {
    "src": "videos/rosca_alternada.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/92/view/"
  },
  "rosca_cabo": {
    "src": "videos/rosca_cabo.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/95/view/"
  },
  "rosca_direta": {
    "src": "videos/rosca_direta.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/91/view/"
  },
  "rosca_martelo": {
    "src": "videos/rosca_martelo.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/272/view/"
  },
  "rosca_scott": {
    "src": "videos/rosca_scott.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/465/view/"
  },
  "stiff": {
    "src": "videos/stiff.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/507/view/"
  },
  "supino_halteres": {
    "src": "videos/supino_halteres.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/75/view/"
  },
  "supino_inclinado": {
    "src": "videos/supino_inclinado.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/537/view/"
  },
  "supino_inclinado_barra": {
    "src": "videos/supino_inclinado_barra.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/538/view/"
  },
  "supino_reto": {
    "src": "videos/supino_reto.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/73/view/"
  },
  "triceps_coice": {
    "src": "videos/triceps_coice.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/655/view/"
  },
  "triceps_frances": {
    "src": "videos/triceps_frances.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/211/view/"
  },
  "triceps_testa": {
    "src": "videos/triceps_testa.mp4",
    "credit": "Goulart / wger.de (recortado e reenquadrado)",
    "license": "CC-BY-SA-4.0",
    "source": "https://wger.de/exercise/246/view/"
  }
};
  if (typeof module !== 'undefined' && module.exports) module.exports = MEDIA;
  else root.DojoMedia = MEDIA;
})(typeof self !== 'undefined' ? self : this);
