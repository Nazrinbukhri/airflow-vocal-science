// Scene script: timing, camera moves, what is visible, the vocal-fold
// settings, on-screen labels and the Malay / English narration.
//
// Every number in `keys` eases smoothly to the next key. Keys prefixed
// with L_ / R_ drive the left / right model on the comparison stage.

import { GLOTTIS } from './anatomy.js';

const g = (x, y, z) => [GLOTTIS.x + x, GLOTTIS.y + y, GLOTTIS.z + z];
const G = [GLOTTIS.x, GLOTTIS.y, GLOTTIS.z];
export const STAGE = [10, 1.8, 0];
const st = (x, y, z) => [STAGE[0] + x, STAGE[1] + y, STAGE[2] + z];

// Bilingual anatomical labels.
export const LABELS = {
  lungR: { ms: 'Paru-paru kanan', en: 'Right lung' },
  lungL: { ms: 'Paru-paru kiri', en: 'Left lung' },
  trachea: { ms: 'Trakea', en: 'Trachea (windpipe)' },
  bronchus: { ms: 'Bronkus', en: 'Bronchus' },
  diaphragm: { ms: 'Diafragma', en: 'Diaphragm' },
  larynx: { ms: 'Laring (peti suara)', en: 'Larynx (voice box)' },
  pharynx: { ms: 'Farinks', en: 'Pharynx' },
  oral: { ms: 'Rongga mulut', en: 'Oral cavity' },
  nasal: { ms: 'Rongga hidung', en: 'Nasal cavity' },
  thyroid: { ms: 'Kartilaj tiroid', en: 'Thyroid cartilage' },
  cricoid: { ms: 'Kartilaj krikoid', en: 'Cricoid cartilage' },
  epiglottis: { ms: 'Epiglotis', en: 'Epiglottis' },
  hyoid: { ms: 'Tulang hioid', en: 'Hyoid bone' },
  glottis: { ms: 'Glotis', en: 'Glottis' },
  fold: { ms: 'Lipatan vokal', en: 'Vocal fold' },
  falseFold: { ms: 'Lipatan vestibular (palsu)', en: 'Ventricular (false) fold' },
  arytenoid: { ms: 'Kartilaj aritenoid', en: 'Arytenoid cartilage' },
  subglottis: { ms: 'Tekanan subglotis', en: 'Subglottal pressure' },
  stageL: { ms: 'Getaran stabil', en: 'Stable vibration' },
  stageR: { ms: 'Getaran tidak teratur', en: 'Irregular vibration (illustrative)' },
  stageL2: { ms: 'Nada tinggi, usaha seimbang', en: 'High pitch, balanced effort' },
  stageR2: { ms: 'Usaha berlebihan', en: 'Excessive effort (illustrative)' },
  stageFF: { ms: 'Lipatan palsu merapat', en: 'False folds squeezing' },
};

export const METERS = {
  mPressure: { ms: 'Tekanan udara', en: 'Air pressure' },
  mRate: { ms: 'Kadar getaran (pic)', en: 'Vibration rate (pitch)' },
  mTension: { ms: 'Ketegangan lipatan', en: 'Fold tension' },
  mEffort: { ms: 'Ketegangan leher', en: 'Neck / throat effort' },
};

export const DEFAULTS = {
  // visibility
  body: 1, lungs: 1, airway: 1, cartilage: 1, tract: 0.35, tractPulse: 0, detail: 1, stage: 0,
  // body airflow
  flow: 0, flowReach: 0, flowVis: 0, breath: 0.8, breathRate: 0.22,
  tractWaves: 0, waveRate: 2.5,
  // anatomical vocal folds
  wall: 1, open: 1, amp: 0, freq: 1.4, cq: 0.42, irr: 0, press: 0, ffs: 0, stretch: 0, gflow: 0.6, rings: 1,
  // stage (left / right)
  L_open: 0, L_amp: 1, L_freq: 1.4, L_cq: 0.42, L_irr: 0, L_press: 0, L_ffs: 0, L_stretch: 0, L_gflow: 0.6, L_rings: 1,
  R_open: 0, R_amp: 1, R_freq: 1.4, R_cq: 0.42, R_irr: 0, R_press: 0, R_ffs: 0, R_stretch: 0, R_gflow: 0.6, R_rings: 1,
  // meters (0..1)
  mPressure: 0, mRate: 0, mTension: 0, mEffort: 0,
  // synthesized sound
  aOn: 0, aF0: 140, aRough: 0, aBright: 0, aSide: 0,
};

export const SCENES = [
  {
    id: 'respiratory',
    duration: 14,
    title: { ms: 'Sistem Pernafasan', en: 'The Respiratory System' },
    desc: {
      ms: 'Model 3D separa lutsinar bagi paru-paru, bronkus, trakea, laring dan saluran vokal. Paru-paru ialah “bekalan kuasa” suara.',
      en: 'A semi-transparent 3D model of the lungs, bronchi, trachea, larynx and vocal tract. The lungs are the “power supply” of the voice.',
    },
    cam: [
      { t: 0, pos: [2.4, 1.6, 6.4], target: [0, 0.85, 0] },
      { t: 14, pos: [-1.9, 1.3, 6.0], target: [0, 0.85, 0] },
    ],
    keys: [{ t: 0, body: 1, lungs: 1, airway: 1, cartilage: 0.7, tract: 0.4, detail: 0, flowVis: 0 }],
    labels: [
      { k: 'lungR', at: 1 }, { k: 'lungL', at: 1.5 }, { k: 'trachea', at: 3 },
      { k: 'larynx', at: 4 }, { k: 'diaphragm', at: 5 }, { k: 'pharynx', at: 7 },
    ],
    subs: [
      { t: 0, ms: 'Ini ialah model 3D ilustrasi sistem pernafasan manusia — bukan imej perubatan sebenar.', en: 'This is an illustrative 3D model of the human respiratory system — not actual medical imaging.' },
      { t: 5, ms: 'Suara bermula di sini: paru-paru membekalkan aliran udara yang menjadi sumber tenaga suara.', en: 'Voice starts here: the lungs supply the airflow that powers the voice.' },
      { t: 10, ms: 'Seret skrin untuk memutar pandangan. Ketik dua kali untuk set semula.', en: 'Drag to rotate the view. Double-tap to reset.' },
    ],
  },
  {
    id: 'airflow',
    duration: 16,
    title: { ms: 'Aliran Udara', en: 'Airflow' },
    desc: {
      ms: 'Zarah biru menunjukkan udara bergerak dari paru-paru, melalui bronkus dan naik ke trakea menuju laring.',
      en: 'Blue particles show air moving out of the lungs, through the bronchi and up the trachea towards the larynx.',
    },
    cam: [
      { t: 0, pos: [1.7, 0.9, 3.9], target: [0, 0.65, 0.05] },
      { t: 16, pos: [1.0, 1.7, 2.7], target: [0, 1.3, 0.1] },
    ],
    keys: [
      { t: 0, body: 0.55, lungs: 1, airway: 1, cartilage: 0.8, tract: 0.4, detail: 0, flow: 0, flowVis: 0, flowReach: 0 },
      { t: 2.5, flow: 1, flowVis: 1 },
    ],
    labels: [
      { k: 'bronchus', at: 3 }, { k: 'trachea', at: 6 }, { k: 'lungR', at: 1 }, { k: 'diaphragm', at: 1 },
    ],
    subs: [
      { t: 0, ms: 'Semasa menghembus nafas, diafragma mengendur dan otot pernafasan mengawal tekanan udara dari paru-paru.', en: 'As we breathe out, the diaphragm relaxes and the breathing muscles regulate air pressure from the lungs.' },
      { t: 6, ms: 'Zarah biru mewakili aliran udara: dari bronkus kecil ke bronkus utama, kemudian naik melalui trakea.', en: 'Blue particles represent airflow: from small bronchi to the main bronchi, then up the trachea.' },
      { t: 11, ms: 'Aliran udara sahaja belum menjadi bunyi — ia hanyalah sumber tenaga.', en: 'Airflow alone is not yet sound — it is only the energy source.' },
    ],
  },
  {
    id: 'zoom',
    duration: 12,
    title: { ms: 'Menuju ke Laring', en: 'Into the Larynx' },
    desc: {
      ms: 'Laring (peti suara) terletak di atas trakea. Rangkanya terdiri daripada kartilaj yang melindungi lipatan vokal.',
      en: 'The larynx (voice box) sits on top of the trachea. Its framework of cartilages protects the vocal folds.',
    },
    cam: [
      { t: 0, pos: [0.75, 2.05, 1.3], target: g(0, 0.02, 0) },
      { t: 7, pos: g(0.36, 0.22, 0.5), target: G },
      { t: 12, pos: g(0.02, 0.42, 0.06), target: G },
    ],
    keys: [
      { t: 0, body: 0.3, lungs: 0.35, airway: 1, cartilage: 1, tract: 0.3, detail: 1, flow: 1, flowVis: 1, flowReach: 0, wall: 0.3 },
      { t: 6, body: 0.1, lungs: 0, flowVis: 0.5, wall: 0.3 },
      { t: 10.5, wall: 1, cartilage: 0.4 },
    ],
    labels: [
      { k: 'thyroid', at: 2 }, { k: 'cricoid', at: 3 }, { k: 'epiglottis', at: 4 },
      { k: 'hyoid', at: 5 }, { k: 'trachea', at: 1, until: 7 },
    ],
    subs: [
      { t: 0, ms: 'Kamera kini mengezum ke laring, di bahagian atas trakea di dalam leher.', en: 'The camera now zooms into the larynx, at the top of the trachea in the neck.' },
      { t: 4.5, ms: 'Laring dibina daripada kartilaj: kartilaj tiroid (halkum), krikoid dan epiglotis.', en: "The larynx is built from cartilages: the thyroid (Adam's apple), the cricoid and the epiglottis." },
      { t: 9, ms: 'Di dalamnya terdapat dua lipatan vokal.', en: 'Inside sit the two vocal folds.' },
    ],
  },
  {
    id: 'folds',
    duration: 14,
    title: { ms: 'Lipatan Vokal', en: 'The Vocal Folds' },
    desc: {
      ms: 'Lipatan vokal ialah tisu berlapis: otot di bahagian dalam, diliputi mukosa yang lembut dan fleksibel. Ruang di antaranya ialah glotis.',
      en: 'The vocal folds are layered tissue: muscle inside, covered by a soft, flexible mucosa. The space between them is the glottis.',
    },
    cam: [
      { t: 0, pos: g(0.03, 0.36, -0.13), target: g(0, 0, 0.0) },
      { t: 14, pos: g(-0.06, 0.34, -0.09), target: g(0, 0, 0.0) },
    ],
    keys: [
      { t: 0, body: 0, lungs: 0, airway: 0.2, cartilage: 0, tract: 0, detail: 1, flow: 0, flowVis: 0, open: 1, amp: 0, gflow: 0.6 },
    ],
    labels: [
      { k: 'fold', at: 1 }, { k: 'glottis', at: 5 }, { k: 'falseFold', at: 3 }, { k: 'arytenoid', at: 4 },
    ],
    subs: [
      { t: 0, ms: 'Pandangan dari atas, seperti pemeriksaan laringoskopi — tetapi ini model ilustrasi.', en: 'A view from above, like a laryngoscopy exam — but this is an illustrative model.' },
      { t: 5, ms: 'Dua lipatan vokal membentuk huruf V. Ruang di antaranya dipanggil glotis.', en: 'The two vocal folds form a V shape. The space between them is called the glottis.' },
      { t: 10, ms: 'Semasa bernafas biasa, glotis terbuka luas: udara mengalir bebas tanpa bunyi.', en: 'During quiet breathing the glottis is wide open: air flows freely and silently.' },
    ],
  },
  {
    id: 'phonation',
    duration: 26,
    title: { ms: 'Getaran Lipatan Vokal', en: 'Vocal-Fold Vibration' },
    desc: {
      ms: 'Lipatan vokal dirapatkan, tekanan udara di bawahnya meningkat, lalu lipatan terbuka dan tertutup berulang kali. Setiap kitaran menghasilkan denyutan bunyi.',
      en: 'The folds come together, air pressure builds beneath them, and they open and close repeatedly. Each cycle creates a pulse of sound.',
    },
    cam: [
      { t: 0, pos: g(0, 0.35, -0.1), target: G },
      { t: 11, pos: g(0, 0.34, -0.1), target: G },
      { t: 16, pos: g(0.1, 0.36, 0.12), target: g(0, -0.01, -0.01) },
      { t: 26, pos: g(0.12, 0.34, -0.05), target: g(0, -0.01, -0.01) },
    ],
    keys: [
      { t: 0, body: 0, lungs: 0, airway: 0.2, cartilage: 0, tract: 0, detail: 1, open: 1, amp: 0, gflow: 0.6, freq: 1.3, cq: 0.45, mPressure: 0.1, mRate: 0 },
      { t: 3, open: 0, amp: 0, mPressure: 0.45 },
      { t: 5.5, amp: 1, mPressure: 0.5, mRate: 0.3, aOn: 1, aF0: 140 },
      { t: 26 },
    ],
    meters: ['mPressure', 'mRate'],
    scope: 'main',
    labels: [
      { k: 'fold', at: 0.5, until: 14 }, { k: 'glottis', at: 1, until: 14 }, { k: 'subglottis', at: 15 },
    ],
    subs: [
      { t: 0, ms: 'Untuk bersuara, otot-otot laring merapatkan kedua-dua lipatan vokal.', en: 'To produce voice, laryngeal muscles bring the two vocal folds together.' },
      { t: 5, ms: 'Tekanan udara di bawah glotis meningkat hingga menolak lipatan vokal terbuka…', en: 'Air pressure builds beneath the glottis until it pushes the folds apart…' },
      { t: 10, ms: '…kemudian keanjalan tisu dan daya aerodinamik menutupnya semula. Kitaran ini berulang.', en: '…then tissue elasticity and aerodynamic forces close them again. The cycle repeats.' },
      { t: 15, ms: 'Bahagian bawah lipatan terbuka dahulu, diikuti bahagian atas — ini dipanggil gelombang mukosa.', en: 'The lower edge opens first, then the upper edge — this is called the mucosal wave.' },
      { t: 19.5, ms: 'Animasi ini sangat diperlahankan. Semasa bertutur, lipatan vokal bergetar kira-kira 100–250 kali sesaat.', en: 'This animation is greatly slowed down. In speech the folds vibrate roughly 100–250 times per second.' },
      { t: 23, ms: 'Setiap kitaran melepaskan denyutan udara — inilah sumber gelombang bunyi.', en: 'Each cycle releases a puff of air — this is the source of the sound waves.' },
    ],
  },
  {
    id: 'pitch',
    duration: 22,
    title: { ms: 'Pic Bukan Sekadar Tekanan Udara', en: 'Pitch Is Not Just Air Pressure' },
    desc: {
      ms: 'Pic dikawal terutamanya oleh panjang, ketegangan dan ketebalan lipatan vokal. Tekanan udara lebih banyak mempengaruhi kelantangan.',
      en: 'Pitch is controlled mainly by the length, tension and thickness of the vocal folds. Air pressure mainly affects loudness.',
    },
    cam: [
      { t: 0, pos: g(0, 0.37, -0.11), target: g(0, 0, -0.01) },
      { t: 22, pos: g(0.05, 0.38, -0.1), target: g(0, 0, -0.01) },
    ],
    keys: [
      { t: 0, body: 0, lungs: 0, airway: 0.2, cartilage: 0, tract: 0, detail: 1, open: 0, amp: 1, freq: 1.3, cq: 0.45, stretch: 0, gflow: 0.6, mPressure: 0.5, mRate: 0.3, mTension: 0.3, aOn: 1, aF0: 140 },
      { t: 4 },
      { t: 11, freq: 2.7, stretch: 1, amp: 0.72, mPressure: 0.55, mRate: 0.8, mTension: 0.85, aF0: 280 },
      { t: 22 },
    ],
    meters: ['mPressure', 'mRate', 'mTension'],
    scope: 'main',
    labels: [{ k: 'fold', at: 0.5 }, { k: 'arytenoid', at: 6 }],
    subs: [
      { t: 0, ms: 'Pic (tinggi rendah suara) ditentukan terutamanya oleh kadar getaran lipatan vokal.', en: 'Pitch (how high or low the voice is) depends mainly on how fast the vocal folds vibrate.' },
      { t: 5, ms: 'Untuk nada tinggi, otot krikotiroid meregangkan lipatan vokal — lebih panjang, lebih nipis dan lebih tegang.', en: 'For higher pitch, the cricothyroid muscle stretches the folds — longer, thinner and tenser.' },
      { t: 11.5, ms: 'Lihat meter: kadar getaran naik, tetapi tekanan udara hampir tidak berubah.', en: 'Watch the meters: vibration rate rises, but air pressure barely changes.' },
      { t: 16, ms: 'Nada tinggi tidak semestinya memerlukan tekanan udara yang lebih besar. Tekanan lebih mempengaruhi kelantangan.', en: 'High pitch does not always require greater air pressure. Pressure mainly affects loudness.' },
    ],
  },
  {
    id: 'resonance',
    duration: 20,
    title: { ms: 'Resonans', en: 'Resonance' },
    desc: {
      ms: 'Bunyi dari lipatan vokal (sumber) dibentuk oleh farinks, mulut dan hidung (penapis). Inilah yang memberi warna dan kejelasan suara.',
      en: 'Sound from the vocal folds (the source) is shaped by the pharynx, mouth and nose (the filter). This gives the voice its colour and clarity.',
    },
    cam: [
      { t: 0, pos: [2.5, 2.45, 0.9], target: [0, 2.2, 0.3] },
      { t: 20, pos: [2.3, 2.15, 1.7], target: [0, 2.2, 0.3] },
    ],
    keys: [
      { t: 0, body: 0.6, lungs: 0, airway: 0.6, cartilage: 0.6, tract: 1, tractPulse: 1, detail: 1, flow: 0.6, flowVis: 0.7, flowReach: 1, tractWaves: 1, waveRate: 2.5, open: 0, amp: 1, freq: 1.4, stretch: 0, aOn: 1, aF0: 150 },
    ],
    labels: [
      { k: 'pharynx', at: 3 }, { k: 'oral', at: 4 }, { k: 'nasal', at: 5 }, { k: 'larynx', at: 1 },
    ],
    subs: [
      { t: 0, ms: 'Bunyi dari lipatan vokal ialah “sumber”. Saluran vokal di atasnya bertindak sebagai “penapis”.', en: 'Sound from the vocal folds is the “source”. The vocal tract above acts as the “filter”.' },
      { t: 6, ms: 'Farinks, rongga mulut dan rongga hidung bergema dan menguatkan frekuensi tertentu (forman).', en: 'The pharynx, mouth and nasal cavities resonate and boost certain frequencies (formants).' },
      { t: 11, ms: 'Resonans mengubah kualiti dan kejelasan suara — tetapi resonans bukan punca getaran.', en: 'Resonance changes voice quality and clarity — but it is not what makes the folds vibrate.' },
      { t: 15.5, ms: 'Ringkasnya: aliran udara = tenaga · getaran = sumber bunyi · pic = kadar getaran · resonans = pembentuk bunyi.', en: 'In short: airflow = energy · vibration = sound source · pitch = vibration rate · resonance = sound shaping.' },
    ],
  },
  {
    id: 'compare',
    duration: 24,
    cut: true,
    portraitZoom: 1.75,
    landscapeZoom: 1.2,
    title: { ms: 'Getaran Stabil vs Tidak Teratur', en: 'Stable vs Irregular Vibration' },
    desc: {
      ms: 'Perbandingan ilustrasi: getaran yang sekata dan simetri berbanding getaran yang tidak teratur. Ini bukan alat diagnosis.',
      en: 'An illustrative comparison: regular, symmetrical vibration versus irregular vibration. This is not a diagnostic tool.',
    },
    cam: [
      { t: 0, pos: st(0, 0.58, -0.2), target: st(0, 0, 0) },
      { t: 24, pos: st(0.03, 0.56, -0.16), target: st(0, 0, 0) },
    ],
    keys: [
      { t: 0, body: 0, lungs: 0, airway: 0, cartilage: 0, tract: 0, detail: 0, stage: 1, flowVis: 0,
        L_amp: 1, L_freq: 1.3, L_cq: 0.45, L_irr: 0, R_amp: 1, R_freq: 1.3, R_cq: 0.3, R_irr: 0.95,
        aOn: 1, aF0: 150, aRough: 0, aSide: 1 },
      { t: 11.9, aRough: 0, aSide: 1 },
      { t: 12.1, aRough: 1, aSide: 2 },
      { t: 24 },
    ],
    scope: 'stage',
    labels: [{ k: 'stageL', at: 0.5 }, { k: 'stageR', at: 0.5 }],
    subs: [
      { t: 0, ms: 'Kiri: getaran stabil — kitaran sekata, simetri dan penutupan lengkap.', en: 'Left: stable vibration — regular, symmetrical cycles with complete closure.' },
      { t: 6, ms: 'Kanan: getaran tidak teratur (ilustrasi) — masa dan saiz kitaran berubah-ubah, kiri dan kanan tidak seiring.', en: 'Right: irregular vibration (illustrative) — cycle timing and size vary, and the two sides are out of step.' },
      { t: 12, ms: 'Lihat graf: corak stabil berulang dengan kemas; corak tidak teratur berubah setiap kitaran.', en: 'See the graphs: the stable pattern repeats neatly; the irregular one changes every cycle.' },
      { t: 18, ms: 'Ketidakteraturan seperti ini boleh didengar sebagai suara kasar atau serak. Ini ilustrasi ringkas, bukan alat diagnosis.', en: 'Irregularity like this can be heard as a rough or hoarse voice. This is a simplified illustration, not a diagnostic tool.' },
    ],
  },
  {
    id: 'effort',
    duration: 32,
    portraitZoom: 1.9,
    landscapeZoom: 1.2,
    title: { ms: 'Usaha Berlebihan & Bacaan Al-Quran Bernada Tinggi', en: 'Excessive Effort & High-Pitched Quran Recitation' },
    desc: {
      ms: 'Menolak udara terlalu kuat dan menegangkan tekak semasa nada tinggi boleh menghimpit lipatan vokal dan mengganggu getaran. Ini satu kemungkinan punca suara kasar — bukan satu-satunya.',
      en: 'Pushing air too hard and tensing the throat at high pitch can over-press the folds and disturb vibration. This is one possible cause of a rough voice — not the only one.',
    },
    cam: [
      { t: 0, pos: st(0, 0.56, -0.2), target: st(0, 0, 0) },
      { t: 12, pos: st(0, 0.55, -0.22), target: st(0, 0, 0) },
      { t: 32, pos: st(0.02, 0.5, -0.3), target: st(0, 0.02, 0) },
    ],
    keys: [
      { t: 0, body: 0, lungs: 0, airway: 0, cartilage: 0, tract: 0, detail: 0, stage: 1,
        L_amp: 0.75, L_freq: 2.6, L_cq: 0.45, L_irr: 0, L_stretch: 1, L_ffs: 0, L_press: 0, L_gflow: 0.6,
        R_amp: 0.75, R_freq: 2.6, R_cq: 0.45, R_irr: 0, R_stretch: 1, R_ffs: 0, R_press: 0, R_gflow: 0.6,
        mPressure: 0.5, mEffort: 0.2, mRate: 0.8, aOn: 1, aF0: 300, aRough: 0, aBright: 0, aSide: 1 },
      { t: 10 },
      { t: 15, R_amp: 0.5, R_irr: 0.65, R_ffs: 1, R_press: 1, R_cq: 0.5, R_gflow: 1, mPressure: 0.95, mEffort: 0.95, aRough: 0.7, aBright: 1, aSide: 2 },
      { t: 32 },
    ],
    meters: ['mPressure', 'mEffort', 'mRate'],
    scope: 'stage',
    labels: [{ k: 'stageL2', at: 0.5 }, { k: 'stageR2', at: 0.5 }, { k: 'stageFF', at: 14 }],
    subs: [
      { t: 0, ms: 'Bacaan al-Quran bernada tinggi memerlukan kawalan halus ketegangan lipatan vokal.', en: 'High-pitched Quran recitation requires fine control of vocal-fold tension.' },
      { t: 5, ms: 'Kiri: nada tinggi dengan usaha seimbang — lipatan diregangkan, tekanan udara sederhana, getaran lancar.', en: 'Left: high pitch with balanced effort — folds stretched, moderate air pressure, smooth vibration.' },
      { t: 11, ms: 'Kanan: usaha berlebihan — udara ditolak kuat, tekak tegang, lipatan vokal dihimpit terlalu rapat dan lipatan palsu turut merapat.', en: 'Right: excessive effort — air pushed hard, throat tense, folds pressed too tightly and the false folds squeeze inward.' },
      { t: 18.5, ms: 'Ini boleh mengganggu getaran yang lancar dan menyumbang kepada suara kasar. Jika berulang, ia boleh meningkatkan risiko kecederaan tisu.', en: 'This can disrupt smooth vibration and contribute to a rough voice. If repeated, it may raise the risk of tissue injury.' },
      { t: 25, ms: 'Namun, tidak semua suara serak pada nada tinggi berpunca daripada ketegangan. Punca lain termasuk jangkitan, refluks, nodul, polip, masalah saraf dan keletihan.', en: 'However, not all hoarseness at high pitch comes from strain. Other causes include infection, reflux, nodules, polyps, nerve problems and fatigue.' },
    ],
  },
  {
    id: 'summary',
    duration: 22,
    cut: true,
    card: 'health',
    title: { ms: 'Ringkasan & Nasihat Kesihatan', en: 'Summary & Health Advice' },
    desc: {
      ms: 'Aliran udara memberi tenaga, getaran menghasilkan bunyi, ketegangan mengawal pic dan resonans membentuk suara.',
      en: 'Airflow provides energy, vibration creates sound, tension controls pitch and resonance shapes the voice.',
    },
    cam: [
      { t: 0, pos: [0, 1.5, 6.8], target: [0, 1.0, 0] },
      { t: 22, pos: [2.6, 1.7, 6.0], target: [0, 1.0, 0] },
    ],
    keys: [
      { t: 0, body: 1, lungs: 1, airway: 1, cartilage: 0.8, tract: 0.8, tractPulse: 0.6, detail: 0, stage: 0,
        flow: 0.7, flowVis: 1, flowReach: 1, tractWaves: 0.7, waveRate: 2, open: 0, amp: 0.8 },
    ],
    labels: [{ k: 'larynx', at: 1 }, { k: 'trachea', at: 1.5 }, { k: 'oral', at: 2 }],
    subs: [
      { t: 0, ms: 'Aliran udara memberi tenaga, lipatan vokal menghasilkan bunyi, ketegangan mengawal pic, dan saluran vokal membentuk resonans.', en: 'Airflow provides power, the vocal folds create sound, tension controls pitch, and the vocal tract shapes resonance.' },
      { t: 7, ms: 'Suara yang sihat datang daripada keseimbangan — bukan daripada menolak udara sekuat-kuatnya.', en: 'A healthy voice comes from balance — not from pushing air as hard as possible.' },
      { t: 13, ms: 'Jika suara serak berterusan lebih daripada 3–4 minggu, dapatkan pemeriksaan doktor, terutamanya pakar Telinga, Hidung & Tekak (ENT).', en: 'If hoarseness lasts more than 3–4 weeks, seek a medical evaluation, ideally from an Ear, Nose & Throat (ENT) specialist.' },
    ],
  },
];

// Precompute start times.
let acc = 0;
for (const s of SCENES) {
  s.start = acc;
  acc += s.duration;
}
export const TOTAL = acc;

export function sceneAt(time) {
  for (let i = SCENES.length - 1; i >= 0; i--) {
    if (time >= SCENES[i].start) return i;
  }
  return 0;
}
