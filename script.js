'use strict';

/* =========================================================
   SIMULATORE CEDOLINO — FASE 1
   Anagrafica + Calendario + Motore di classificazione ore
   ========================================================= */

const CHIAVE_ANAGRAFICA = 'simCedolino_anagrafica_v1';
const CHIAVE_TURNI = 'simCedolino_turni_v1';
const CHIAVE_TEMA = 'simCedolino_tema_v1';
const CHIAVE_TABELLE = 'simCedolino_tabelle_v1';
const CHIAVE_CONGUAGLI = 'simCedolino_conguagli_v1';
const CHIAVE_STORICO = 'simCedolino_storico_v1';
const CHIAVE_ASSENZE = 'simCedolino_assenze_v1';
const CHIAVE_SEQUENZA = 'simCedolino_sequenza_v1';
const CHIAVE_NOTE_GIORNI = 'simCedolino_noteGiorni_v1';
const CHIAVE_SEQUENZA_ANCORA = 'simCedolino_sequenzaAncora_v1';
const CHIAVE_SEQUENZA_ULTIMO_GIORNO = 'simCedolino_sequenzaUltimoGiorno_v1';
const CHIAVE_ULTIMO_BACKUP = 'simCedolino_ultimoBackup_v1';
const CHIAVE_ASPETTATIVA_MIGRATA = 'simCedolino_aspettativaMigrata_v1';
const CHIAVE_DISCLAIMER_MOSTRATO = 'simCedolino_disclaimerMostrato_v1';
const CHIAVE_COLORI_TURNI = 'simCedolino_coloriTurni_v1';

const CATEGORIE_COLORABILI = [
  { chiave:'sera', etichetta:'Sera', predefinito:'transparent' },
  { chiave:'pomeriggio', etichetta:'Pomeriggio', predefinito:'transparent' },
  { chiave:'mattina', etichetta:'Mattina', predefinito:'transparent' },
  { chiave:'notte', etichetta:'Notte', predefinito:'#D9EBFA' },
  { chiave:'riposo', etichetta:'Riposo', predefinito:'#DCEEDD' },
  { chiave:'assenza', etichetta:'Assenze', predefinito:'#F3E5C0' }
];

function caricaColoriTurni(){
  try{
    const salvati = JSON.parse(localStorage.getItem(CHIAVE_COLORI_TURNI));
    if(salvati) return salvati;
  }catch{}
  const predefiniti = {};
  CATEGORIE_COLORABILI.forEach(c => { predefiniti[c.chiave] = c.predefinito; });
  return predefiniti;
}
let coloriTurni = caricaColoriTurni();
function salvaColoriTurniStorage(){ localStorage.setItem(CHIAVE_COLORI_TURNI, JSON.stringify(coloriTurni)); }
function applicaColoriTurni(){
  CATEGORIE_COLORABILI.forEach(c => {
    document.documentElement.style.setProperty('--tipo-' + c.chiave, coloriTurni[c.chiave] || c.predefinito);
  });
  renderLegendaColoriTurni();
}
function renderLegendaColoriTurni(){
  const box = el('legendaColoriTurni');
  if(!box) return;
  box.innerHTML = CATEGORIE_COLORABILI.map(c => {
    const colore = coloriTurni[c.chiave] || c.predefinito;
    if(colore === 'transparent') return '';
    return `<span><i class="pallino" style="background:${colore};"></i> ${c.etichetta}</span>`;
  }).join('');
}
function renderColoriTurni(){
  const box = el('corpoColoriTurni');
  box.innerHTML = CATEGORIE_COLORABILI.map(c => {
    const coloreAttuale = coloriTurni[c.chiave];
    const valoreInputColore = (coloreAttuale && coloreAttuale !== 'transparent') ? coloreAttuale : '#ffffff';
    return `
    <div class="riga-colore-categoria">
      <span class="etichetta-categoria">${c.etichetta}</span>
      <div class="griglia-swatch">
        <label class="swatch-colore-libero" title="Scegli un colore">
          <input type="color" data-categoria-libero="${c.chiave}" value="${valoreInputColore}">
        </label>
      </div>
    </div>`;
  }).join('');
  box.querySelectorAll('[data-categoria-libero]').forEach(input => {
    input.addEventListener('input', () => {
      coloriTurni[input.dataset.categoriaLibero] = input.value;
      salvaColoriTurniStorage();
      applicaColoriTurni();
      renderCalendario();
    });
  });
}


/* ---------------------------------------------------------
   TABELLE UFFICIALI PREDEFINITE (FASE 2)
   Valori indicativi da fonti pubbliche (CCNL 2022-2024,
   Legge di Bilancio 2026) — l'utente li verifica e corregge
   dal pannello "Tabelle Ufficiali".
   --------------------------------------------------------- */
const TABELLE_PREDEFINITE = {
  // Stipendi tabellari annui lordi (12 mensilità) — fonte: D.P.R. 24 marzo 2025, n. 53 (decreto EFFETTIVAMENTE
  // in vigore, recepimento accordi 2022-2024), Art. 2 comma 3, valori dal 1° gennaio 2024. Questo è il decreto
  // che si applica davvero oggi in busta paga — l'ipotesi di accordo 2025-2027 (firmata 15/07/2026) non è
  // ancora stata recepita in un decreto e quindi non è ancora legalmente in vigore.
  stipendiAnnuiAttuale: {
    'Agente': 20576.38, 'Agente Scelto': 21211.75, 'Assistente': 21896.00, 'Assistente Capo': 22775.75,
    'Assistente Capo Coordinatore': 23753.25,
    'Vice Sovrintendente': 22824.63, 'Sovrintendente': 23753.25, 'Sovrintendente Capo': 24290.88,
    'Sovrintendente Capo Coordinatore': 25610.50,
    'Vice Ispettore': 24584.13, 'Ispettore': 25610.50, 'Ispettore Capo': 26099.25,
    'Ispettore Superiore': 26881.25, 'Sostituto Commissario': 28054.25, 'Sostituto Commissario Coordinatore': 28934.00,
    'Vice Commissario': 26734.63, 'Commissario': 28934.00, 'Commissario Capo': 29422.75
  },
  // Tabella PROIETTATA dal 1° gennaio 2027, secondo l'ipotesi di accordo sindacale 2025-2027 firmata 15/07/2026 —
  // NON ancora ufficialmente in vigore: si applicherà solo dopo il recepimento in un decreto del Presidente
  // della Repubblica (come è successo per il D.P.R. 53/2025 sopra, con oltre un anno di ritardo dalla firma).
  // Usala per farti un'idea di cosa cambierà, non come valore certo per oggi.
  stipendiAnnui2027: {
    'Agente': 21840.43, 'Agente Scelto': 22514.84, 'Assistente': 23241.12, 'Assistente Capo': 24174.92,
    'Assistente Capo Coordinatore': 25212.47,
    'Vice Sovrintendente': 24226.79, 'Sovrintendente': 25212.47, 'Sovrintendente Capo': 25783.12,
    'Sovrintendente Capo Coordinatore': 27183.81,
    'Vice Ispettore': 25886.87, 'Ispettore': 27183.81, 'Ispettore Capo': 27702.59,
    'Ispettore Superiore': 28532.63, 'Sostituto Commissario': 29777.69, 'Sostituto Commissario Coordinatore': 30711.48,
    'Vice Commissario': 28376.99, 'Commissario': 30711.48, 'Commissario Capo': 31230.26
  },
  // Indennità pensionabile mensile lorda — fonte: stesso D.P.R. 53/2025, Art. 4, dal 1° gennaio 2024. In vigore oggi.
  indennitaPensionabileAnnuaAttuale: {
    'Agente': 608.39 * 12, 'Agente Scelto': 644.71 * 12, 'Assistente': 694.06 * 12, 'Assistente Capo': 758.49 * 12,
    'Assistente Capo Coordinatore': 758.49 * 12,
    'Vice Sovrintendente': 833.39 * 12, 'Sovrintendente': 837.31 * 12, 'Sovrintendente Capo': 887.23 * 12,
    'Sovrintendente Capo Coordinatore': 887.23 * 12,
    'Vice Ispettore': 863.42 * 12, 'Ispettore': 891.38 * 12, 'Ispettore Capo': 919.95 * 12,
    'Ispettore Superiore': 961.16 * 12, 'Sostituto Commissario': 972.48 * 12, 'Sostituto Commissario Coordinatore': 972.48 * 12,
    'Vice Commissario': 944.43 * 12, 'Commissario': 983.12 * 12, 'Commissario Capo': 993.29 * 12
  },
  // Proiettata dal 1° gennaio 2027 secondo l'ipotesi di accordo 2025-2027 — non ancora in vigore, vedi nota sopra.
  indennitaPensionabileAnnua2027: {
    'Agente': 648.56 * 12, 'Agente Scelto': 687.28 * 12, 'Assistente': 739.89 * 12, 'Assistente Capo': 808.57 * 12,
    'Assistente Capo Coordinatore': 808.57 * 12,
    'Vice Sovrintendente': 888.42 * 12, 'Sovrintendente': 892.60 * 12, 'Sovrintendente Capo': 945.81 * 12,
    'Sovrintendente Capo Coordinatore': 945.81 * 12,
    'Vice Ispettore': 920.43 * 12, 'Ispettore': 950.24 * 12, 'Ispettore Capo': 980.69 * 12,
    'Ispettore Superiore': 1024.63 * 12, 'Sostituto Commissario': 1036.69 * 12, 'Sostituto Commissario Coordinatore': 1036.69 * 12,
    'Vice Commissario': 1006.79 * 12, 'Commissario': 1048.04 * 12, 'Commissario Capo': 1058.88 * 12
  },
  // IIS: azzerata perché già inclusa (conglobata) nello stipendio tabellare del D.P.R. 53/2025 sopra —
  // sommarla di nuovo qui la conterebbe due volte. Confermato confrontando una busta paga reale:
  // Stipendio Tabellare (1.452,95) + IIS Conglobata (526,49) = esattamente il valore di stipendiAnnuiAttuale/12.
  iisMensile: 0,
  // Tariffe orarie straordinario EFFETTIVAMENTE in vigore — fonte: D.P.R. 24 marzo 2025, n. 53, Art. 6, dal 1/1/2024.
  straordinarioOrarioAttuale: {
    'Agente':                             { diurno: 12.03, notturnoOFestivo: 13.62, notturnoFestivo: 15.71 },
    'Agente Scelto':                      { diurno: 12.41, notturnoOFestivo: 14.04, notturnoFestivo: 16.20 },
    'Assistente':                         { diurno: 12.80, notturnoOFestivo: 14.49, notturnoFestivo: 16.71 },
    'Assistente Capo':                    { diurno: 13.32, notturnoOFestivo: 15.07, notturnoFestivo: 17.39 },
    'Assistente Capo Coordinatore':       { diurno: 13.89, notturnoOFestivo: 15.71, notturnoFestivo: 18.12 },
    'Vice Sovrintendente':                { diurno: 13.35, notturnoOFestivo: 15.10, notturnoFestivo: 17.42 },
    'Sovrintendente':                     { diurno: 13.89, notturnoOFestivo: 15.71, notturnoFestivo: 18.12 },
    'Sovrintendente Capo':                { diurno: 14.21, notturnoOFestivo: 16.07, notturnoFestivo: 18.54 },
    'Sovrintendente Capo Coordinatore':   { diurno: 14.97, notturnoOFestivo: 16.93, notturnoFestivo: 19.53 },
    'Vice Ispettore':                     { diurno: 14.26, notturnoOFestivo: 16.12, notturnoFestivo: 18.60 },
    'Ispettore':                          { diurno: 14.97, notturnoOFestivo: 16.93, notturnoFestivo: 19.53 },
    'Ispettore Capo':                     { diurno: 15.26, notturnoOFestivo: 17.26, notturnoFestivo: 19.91 },
    'Ispettore Superiore':                { diurno: 15.72, notturnoOFestivo: 17.78, notturnoFestivo: 20.51 },
    'Sostituto Commissario':              { diurno: 16.41, notturnoOFestivo: 18.56, notturnoFestivo: 21.41 },
    'Sostituto Commissario Coordinatore': { diurno: 16.91, notturnoOFestivo: 19.13, notturnoFestivo: 22.07 },
    'Vice Commissario':                   { diurno: 15.63, notturnoOFestivo: 17.68, notturnoFestivo: 20.40 },
    'Commissario':                        { diurno: 16.91, notturnoOFestivo: 19.13, notturnoFestivo: 22.07 },
    'Commissario Capo':                   { diurno: 17.21, notturnoOFestivo: 19.47, notturnoFestivo: 22.46 }
  },
  // Tariffe PROIETTATE dal 1° gennaio 2027, secondo l'ipotesi di accordo sindacale 2025-2027 firmata 15/07/2026 —
  // NON ancora ufficialmente in vigore (serve un decreto di recepimento, come il D.P.R. 53/2025 sopra).
  straordinarioOrario2027: {
    'Agente':                             { diurno: 12.77, notturnoOFestivo: 14.45, notturnoFestivo: 16.67 },
    'Agente Scelto':                      { diurno: 13.17, notturnoOFestivo: 14.90, notturnoFestivo: 17.19 },
    'Assistente':                         { diurno: 13.59, notturnoOFestivo: 15.37, notturnoFestivo: 17.73 },
    'Assistente Capo':                    { diurno: 14.13, notturnoOFestivo: 15.98, notturnoFestivo: 18.44 },
    'Assistente Capo Coordinatore':       { diurno: 14.74, notturnoOFestivo: 16.67, notturnoFestivo: 19.23 },
    'Vice Sovrintendente':                { diurno: 14.17, notturnoOFestivo: 16.03, notturnoFestivo: 18.50 },
    'Sovrintendente':                     { diurno: 14.74, notturnoOFestivo: 16.67, notturnoFestivo: 19.23 },
    'Sovrintendente Capo':                { diurno: 15.07, notturnoOFestivo: 17.05, notturnoFestivo: 19.67 },
    'Sovrintendente Capo Coordinatore':   { diurno: 15.89, notturnoOFestivo: 17.97, notturnoFestivo: 20.73 },
    'Vice Ispettore':                     { diurno: 15.13, notturnoOFestivo: 17.11, notturnoFestivo: 19.74 },
    'Ispettore':                          { diurno: 15.89, notturnoOFestivo: 17.97, notturnoFestivo: 20.73 },
    'Ispettore Capo':                     { diurno: 16.20, notturnoOFestivo: 18.32, notturnoFestivo: 21.14 },
    'Ispettore Superiore':                { diurno: 16.68, notturnoOFestivo: 18.87, notturnoFestivo: 21.77 },
    'Sostituto Commissario':              { diurno: 17.41, notturnoOFestivo: 19.69, notturnoFestivo: 22.71 },
    'Sostituto Commissario Coordinatore': { diurno: 17.95, notturnoOFestivo: 20.30, notturnoFestivo: 23.42 },
    'Vice Commissario':                   { diurno: 16.59, notturnoOFestivo: 18.76, notturnoFestivo: 21.65 },
    'Commissario':                        { diurno: 17.95, notturnoOFestivo: 20.30, notturnoFestivo: 23.42 },
    'Commissario Capo':                   { diurno: 18.26, notturnoOFestivo: 20.65, notturnoFestivo: 23.82 }
  },
  // Assegno di funzione — differenziato per ruolo (prima era uguale per tutti)
  // fonte: screenshot condiviso dall'utente (calcolatore stipendi online); funzionari non confermati, valore precedente lasciato come indicativo
  assegnoFunzioneAnnuo: {
    truppa: { soglia17: 1448.40, soglia27: 2949.83, soglia32: 3392.30 }, // Agenti e Assistenti
    sovr:   { soglia17: 1800.20, soglia27: 3018.20, soglia32: 3470.98 }, // Sovrintendenti
    isp:    { soglia17: 1829.40, soglia27: 3070.50, soglia32: 3531.03 }, // Ispettori
    funz:   { soglia17: 900,     soglia27: 1800,     soglia32: 3531 }   // Commissari/Funzionari — non confermato, da verificare
  },
  // Indennità presenza notturna e festiva — aggiornate al valore confermato da una busta paga reale
  // (marzo 2026): notturno 4,30€/h, festivo 14,00€/turno. Il valore precedente (SIULP, 4,10/12,00) era
  // probabilmente non aggiornato all'ultimo adeguamento.
  indennitaTurnoNotturnoOraria: 4.30,
  indennitaPresenzaFestivaTurno: 14.00,
  // Presenza festività particolari — fonte: SIULP (https://siulp.it/i-tuoi-diritti/trattamento-economico-accessorio/7/#otto)
  // aggiuntiva rispetto alla presenza festiva generica; spetta per le festività fisse
  // (1/1, 6/1, Lunedì dell'Angelo, 25/4, 1/5, 2/6, 15/8, 1/11, 8/12, 25/12, 26/12), non per le domeniche semplici
  indennitaFestivitaParticolareGiorno: 40.00,
  // Compensazione riposo lavorato — fonte: SIULP (https://siulp.it/i-tuoi-diritti/trattamento-economico-accessorio/10/#undici)
  // spetta se richiamati in servizio nel giorno di riposo settimanale o in un festivo infrasettimanale
  indennitaCompensazioneRiposoLavorato: 5.00,
  // Cambio turno — fonte: accordo FESI 2025 (SIULP, in pagamento da luglio 2026, aggiornato annualmente per accordo sindacale)
  // il compenso di 610€/anno per il personale dei reparti mobili non è modellato (caso troppo specifico)
  indennitaCambioTurno: 10.00,
  // Produttività collettiva (ex "indennità di valorizzazione funzioni di polizia") — fonte: accordo FESI 2025.
  // Importo per giorno di effettiva presenza in servizio; a differenza delle altre voci FESI qui sopra,
  // questo compenso può variare parecchio da un accordo annuale all'altro: verifica sempre sul cedolino reale.
  indennitaProduttivitaCollettiva: 6.63,
  // Indennità servizi esterni — fonte: SIULP (https://siulp.it/i-tuoi-diritti/trattamento-economico-accessorio/4/#cinque)
  // spetta per turno di durata non inferiore a 3 ore continuative
  indennitaServizioEsternoTurno: 6.00,
  // Ordine pubblico — fonte: SIULP (https://siulp.it/i-tuoi-diritti/trattamento-economico-accessorio/5/#sei)
  // spetta per turno di almeno 4 ore; fuori sede senza pernottamento ridotta del 30%
  indennitaOPInSede: 13.00,
  indennitaOPFuoriSede: 26.00,
  riduzioneOPSenzaPernottamento: 30,
  indennitaControlloTerritorioSeraleFlat: 5.00,
  indennitaControlloTerritorioNotturnoFlat: 10.00,
  reperibilitaGiornaliera: 17.50, // fonte: SIULP (https://siulp.it/i-tuoi-diritti/trattamento-economico-accessorio/11/#dodici)
  // Trattamento di missione — fonte: SIULP (https://siulp.it/i-tuoi-diritti/trattamento-economico-accessorio/2/#tre)
  // indennità oraria di trasferta: piena 4-8h, ridotta al 40% oltre le 8h; nessuna indennità fino a 4h
  indennitaTrasfertaOraria: 0.86,
  indennitaTrasfertaOrariaRidotta: 0.344,
  sindacatoMensile: 8.50,
  aliquotaPrevidenziale: 9.19,
  irpefScaglioni: [ { fino: 28000, aliquota: 23 }, { fino: 50000, aliquota: 33 }, { fino: Infinity, aliquota: 43 } ],
  noTaxAreaAnnua: 8500,
  detrazioneLavoroMensile: 95.00,
  detrazioneConiugeACaricoAnnua: 690.00,
  detrazionePerFiglioOver21Annua: 950.00,
  trattamentoIntegrativoMensile: 100.00,
  sogliaTrattamentoIntegrativoAnnua: 28000,
  sogliaDetassazioneAccessoriAnnua: 800,
  aliquotaDetassazioneAccessori: 15,
  buonoPastoValore: 7.00
};

let anagrafica = caricaAnagrafica();
let turni = caricaTurni(); // oggetto { 'YYYY-MM-DD': turnoData }
let tabelle = caricaTabelle();
let conguagliPerMese = caricaConguagli(); // oggetto { 'YYYY-MM': importo }
let storico = caricaStorico(); // oggetto { 'YYYY-MM': { totaleLordo, netto } }

let idContatore = 1;
// L'id deve restare unico anche quando si aggiunge una voce a un elenco già salvato in sessioni precedenti
// (dove idContatore riparte da 1): un id solo numerico rischiava di ripetersi e far confondere due voci diverse.
function nuovoId(){ return 'a' + Date.now().toString(36) + (idContatore++).toString(36) + Math.random().toString(36).slice(2, 6); }

const ASSENZE_PREDEFINITE = [
  { nome:'Congedo ordinario', valore:30, unita:'gg' },
  { nome:'Congedo straordinario', valore:45, unita:'gg' },
  { nome:'Riposo legge', valore:4, unita:'gg' },
  { nome:'Riposo festivo', valore:0, unita:'gg' },
  { nome:'Recupero festivo', valore:0, unita:'gg' },
  { nome:'Recupero riposo', valore:0, unita:'gg' },
  { nome:'Riposo compensativo', valore:0, unita:'h' },
  { nome:'Aspettativa', valore:730, unita:'gg' }, // 2 anni nell'arco della vita lavorativa (non annuale) — fonte: SIULP (https://siulp.it/i-tuoi-diritti/le-assenze-per-motivi-di-famiglia/), confermato anche dall'utente
  { nome:'Maternità/Paternità', valore:0, unita:'gg' }, // solo tracciamento date, nessun calcolo di importo (il pagamento varia nel tempo, vedi nota in Assenze)
  { nome:'Congedo parentale', valore:0, unita:'gg' }, // solo tracciamento date, nessun calcolo di importo (il pagamento varia nel tempo, vedi nota in Assenze)
  { nome:'L104', valore:3, unita:'gg' },
  { nome:'Donazione sangue', valore:12, unita:'gg' },
  { nome:'Ore studio', valore:150, unita:'h' },
  { nome:'Permesso breve', valore:54, unita:'h' },
  { nome:'Permesso sindacale', valore:36, unita:'h' }
];

function caricaAssenze(){
  try{
    const salvate = JSON.parse(localStorage.getItem(CHIAVE_ASSENZE));
    if(salvate && Array.isArray(salvate) && salvate.length){
      // aggiungo eventuali nuove voci predefinite non ancora presenti nel salvataggio dell'utente
      const nomiEsistenti = salvate.map(a => a.nome);
      const mancanti = ASSENZE_PREDEFINITE
        .filter(a => !nomiEsistenti.includes(a.nome))
        .map(a => ({ id: nuovoId(), ...a, personalizzata:false }));
      const risultato = mancanti.length ? [...salvate, ...mancanti] : salvate;
      // rimosse dall'elenco predefinito: tolgo anche da eventuali salvataggi precedenti (solo se non rinominate/personalizzate dall'utente)
      const rimosseDaElencoPredefinito = ['Riposo settimanale', 'Permesso lutto/grave infermità familiare'];
      const risultatoFiltrato = risultato.filter(a => a.personalizzata || !rimosseDaElencoPredefinito.includes(a.nome));
      // il Riposo compensativo è sempre e solo in ore (valore/saldo automatico)
      risultatoFiltrato.forEach(a => {
        if(a.nome === 'Riposo compensativo') a.unita = 'h';
        if(a.nome === 'Recupero riposo') a.unita = 'gg';
        if(a.nome === 'Recupero festivo') a.unita = 'gg';
      });
      // Aspettativa: il vecchio valore predefinito era 0, aggiornato a 730 (2 anni) — ma questa correzione
      // va fatta UNA SOLA VOLTA: se ripetuta ad ogni caricamento, sovrascriverebbe anche uno 0 impostato
      // di proposito dall'utente (es. aspettativa esaurita), che deve invece poter restare 0.
      if(!localStorage.getItem(CHIAVE_ASPETTATIVA_MIGRATA)){
        const vocaAsp = risultatoFiltrato.find(a => a.nome === 'Aspettativa');
        if(vocaAsp && vocaAsp.valore === 0) vocaAsp.valore = 730;
        localStorage.setItem(CHIAVE_ASPETTATIVA_MIGRATA, '1');
      }
      // riordino secondo l'ordine predefinito (le voci personalizzate restano in coda, nell'ordine in cui sono state aggiunte)
      const ordinePredefinito = ASSENZE_PREDEFINITE.map(a => a.nome);
      risultatoFiltrato.sort((a, b) => {
        const ia = ordinePredefinito.indexOf(a.nome), ib = ordinePredefinito.indexOf(b.nome);
        if(ia === -1 && ib === -1) return 0;
        if(ia === -1) return 1;
        if(ib === -1) return -1;
        return ia - ib;
      });
      // Riparazione: il vecchio generatore di id (numerico, riparte da 1 ad ogni sessione) poteva produrre
      // collisioni quando si aggiungeva una voce mancante a un elenco già esistente (es. "Riposo festivo"
      // riaggiunta con lo stesso id già usato da un'altra voce, causando sigle/saldi sbagliati). Se trovo
      // id duplicati, assegno un id nuovo e univoco a tutte le occorrenze tranne la prima.
      const idVisti = new Set();
      risultatoFiltrato.forEach(a => {
        if(idVisti.has(a.id)) a.id = nuovoId();
        idVisti.add(a.id);
      });
      return risultatoFiltrato;
    }
  }catch{}
  localStorage.setItem(CHIAVE_ASPETTATIVA_MIGRATA, '1'); // parte già con 730, non serve mai migrarla
  return ASSENZE_PREDEFINITE.map(a => ({ id: nuovoId(), ...a, personalizzata:false }));
}
function salvaAssenzeStorage(){ localStorage.setItem(CHIAVE_ASSENZE, JSON.stringify(assenze)); }

let assenze = caricaAssenze(); // array [{ id, nome, valore, unita, personalizzata }]
localStorage.setItem(CHIAVE_ASSENZE, JSON.stringify(assenze)); // persiste subito l'eventuale merge di nuove voci predefinite

function caricaNoteGiorni(){
  try{ return JSON.parse(localStorage.getItem(CHIAVE_NOTE_GIORNI)) || {}; }catch{ return {}; }
}
function salvaNoteGiorniStorage(){ localStorage.setItem(CHIAVE_NOTE_GIORNI, JSON.stringify(noteGiorni)); }
let noteGiorni = caricaNoteGiorni(); // { 'AAAA-MM-GG': 'testo nota' }
let sequenzaTurni = caricaSequenza(); // array di chiavi MODELLI_TURNO, es. ['sera01','pomeriggio','mattina','notte01','riposo']

function caricaSequenza(){
  try{
    const salvata = JSON.parse(localStorage.getItem(CHIAVE_SEQUENZA));
    if(salvata && Array.isArray(salvata) && salvata.length){
      // compatibilità con il vecchio formato (array di stringhe)
      return salvata.map(p => typeof p === 'string' ? { tipo: p } : p);
    }
  }catch{}
  return [{tipo:'sera01'}, {tipo:'pomeriggio'}, {tipo:'mattina'}, {tipo:'notte01'}, {tipo:'riposo'}]; // turno in quinta predefinito
}
function salvaSequenzaStorage(){ localStorage.setItem(CHIAVE_SEQUENZA, JSON.stringify(sequenzaTurni)); }

function caricaTabelle(){
  try{
    const salvate = JSON.parse(localStorage.getItem(CHIAVE_TABELLE));
    if(!salvate) return JSON.parse(JSON.stringify(TABELLE_PREDEFINITE));
    // Migrazione: le vecchie tabelle salvate avevano lo straordinario a 4 gruppi
    // (es. "Agenti/Assistenti"), incompatibile con la nuova struttura per qualifica.
    if(salvate.straordinarioOrario && !salvate.straordinarioOrario['Agente']){
      delete salvate.straordinarioOrario;
    }
    // Migrazione: il vecchio assegno di funzione era un unico valore per tutti i ruoli,
    // incompatibile con la nuova struttura differenziata per ruolo.
    if(salvate.assegnoFunzioneAnnuo && !salvate.assegnoFunzioneAnnuo.truppa){
      delete salvate.assegnoFunzioneAnnuo;
    }
    return { ...JSON.parse(JSON.stringify(TABELLE_PREDEFINITE)), ...salvate };
  }catch{ return JSON.parse(JSON.stringify(TABELLE_PREDEFINITE)); }
}
function salvaTabelleStorage(){ localStorage.setItem(CHIAVE_TABELLE, JSON.stringify(tabelle)); }

function caricaConguagli(){
  try{ return JSON.parse(localStorage.getItem(CHIAVE_CONGUAGLI)) || {}; }catch{ return {}; }
}
function salvaConguagliStorage(){ localStorage.setItem(CHIAVE_CONGUAGLI, JSON.stringify(conguagliPerMese)); }

function caricaStorico(){
  try{ return JSON.parse(localStorage.getItem(CHIAVE_STORICO)) || {}; }catch{ return {}; }
}
function salvaStoricoStorage(){ localStorage.setItem(CHIAVE_STORICO, JSON.stringify(storico)); }
// Addizionale regionale IRPEF 2026 — fonte: elenco ufficiale aliquote regionali (CSV fornito dall'utente).
// Nota: Puglia e Molise avevano nel CSV due set di aliquote diverse per la stessa fascia di reddito senza
// un campo che li distinguesse chiaramente; è stato usato il primo set indicato, da verificare se non corrisponde.
const REGIONI_ADDIZIONALE_2026 = {
  "Abruzzo": { tipo:'scaglioni', scaglioni:[{fino:28000.0, aliquota:1.67}, {fino:50000.0, aliquota:2.87}, {fino:Infinity, aliquota:3.33}] },
  "Basilicata": { tipo:'unica', valore:1.23 },
  "Calabria": { tipo:'unica', valore:1.73 },
  "Campania": { tipo:'scaglioni', scaglioni:[{fino:15000.0, aliquota:1.73}, {fino:28000.0, aliquota:2.96}, {fino:50000.0, aliquota:3.2}, {fino:Infinity, aliquota:3.33}] },
  "Emilia-Romagna": { tipo:'scaglioni', scaglioni:[{fino:15000.0, aliquota:1.33}, {fino:28000.0, aliquota:1.93}, {fino:50000.0, aliquota:2.78}, {fino:Infinity, aliquota:3.33}] },
  "Friuli Venezia Giulia": { tipo:'scaglioni', scaglioni:[{fino:15000.0, aliquota:0.7}, {fino:28000.0, aliquota:1.23}, {fino:50000.0, aliquota:1.23}, {fino:Infinity, aliquota:1.23}] },
  "Lazio": { tipo:'scaglioni', scaglioni:[{fino:15000.0, aliquota:1.73}, {fino:28000.0, aliquota:3.33}, {fino:50000.0, aliquota:3.33}, {fino:Infinity, aliquota:3.33}] },
  "Liguria": { tipo:'scaglioni', scaglioni:[{fino:28000.0, aliquota:1.23}, {fino:50000.0, aliquota:3.18}, {fino:Infinity, aliquota:3.23}] },
  "Lombardia": { tipo:'scaglioni', scaglioni:[{fino:15000.0, aliquota:1.23}, {fino:28000.0, aliquota:1.58}, {fino:50000.0, aliquota:1.72}, {fino:Infinity, aliquota:1.73}] },
  "Marche": { tipo:'scaglioni', scaglioni:[{fino:15000.0, aliquota:1.23}, {fino:28000.0, aliquota:1.53}, {fino:50000.0, aliquota:1.7}, {fino:Infinity, aliquota:1.73}] },
  "Molise": { tipo:'scaglioni', scaglioni:[{fino:15000.0, aliquota:1.73}, {fino:28000.0, aliquota:1.93}, {fino:50000.0, aliquota:3.33}, {fino:Infinity, aliquota:3.33}] },
  "Piemonte": { tipo:'scaglioni', scaglioni:[{fino:15000.0, aliquota:1.62}, {fino:28000.0, aliquota:2.68}, {fino:50000.0, aliquota:3.31}, {fino:Infinity, aliquota:3.33}] },
  "Provincia di Bolzano": { tipo:'scaglioni', scaglioni:[{fino:28000.0, aliquota:1.23}, {fino:50000.0, aliquota:1.23}, {fino:Infinity, aliquota:1.73}] },
  "Provincia di Trento": { tipo:'scaglioni', scaglioni:[{fino:15000.0, aliquota:1.23}, {fino:28000.0, aliquota:1.23}, {fino:50000.0, aliquota:1.23}, {fino:Infinity, aliquota:1.73}] },
  "Puglia": { tipo:'scaglioni', scaglioni:[{fino:15000.0, aliquota:1.33}, {fino:28000.0, aliquota:1.43}, {fino:50000.0, aliquota:1.63}, {fino:Infinity, aliquota:1.85}] },
  "Sardegna": { tipo:'unica', valore:1.23 },
  "Sicilia": { tipo:'unica', valore:1.23 },
  "Toscana": { tipo:'scaglioni', scaglioni:[{fino:15000.0, aliquota:1.42}, {fino:28000.0, aliquota:1.43}, {fino:50000.0, aliquota:3.32}, {fino:Infinity, aliquota:3.33}] },
  "Umbria": { tipo:'scaglioni', scaglioni:[{fino:15000.0, aliquota:1.73}, {fino:28000.0, aliquota:3.02}, {fino:50000.0, aliquota:3.12}, {fino:Infinity, aliquota:3.33}] },
  "Valle d'Aosta": { tipo:'unica', valore:1.23 },
  "Veneto": { tipo:'unica', valore:1.23 },
};


function calcolaAliquotaAddizionaleRegionale(regione, redditoAnnuo){
  const dati = REGIONI_ADDIZIONALE_2026[regione];
  if(!dati) return 0;
  if(dati.tipo === 'unica') return dati.valore;
  for(const scaglione of dati.scaglioni){
    if(redditoAnnuo <= scaglione.fino) return scaglione.aliquota;
  }
  return dati.scaglioni[dati.scaglioni.length - 1].aliquota;
}

const MODELLI_TURNO = {
  mattina:     { oraInizio:'07:00', oraFine:'13:00', etichetta:'Mattina (07:00–13:00)' },
  pomeriggio:  { oraInizio:'13:00', oraFine:'19:00', etichetta:'Pomeriggio (13:00–19:00)' },
  sera24:      { oraInizio:'19:00', oraFine:'00:00', etichetta:'Sera (19:00–24:00)' },
  sera01:      { oraInizio:'19:00', oraFine:'01:00', etichetta:'Sera (19:00–01:00)' },
  notte00:     { oraInizio:'00:00', oraFine:'07:00', etichetta:'Notte (00:00–07:00)' },
  notte01:     { oraInizio:'01:00', oraFine:'07:00', etichetta:'Notte (01:00–07:00)' },
  mattutino:   { oraInizio:'08:00', oraFine:'14:00', etichetta:'Turno 08:00–14:00' },
  pomeridiano: { oraInizio:'14:00', oraFine:'20:00', etichetta:'Turno 14:00–20:00' }
};

function chiaveMese(anno, mese){ return `${anno}-${String(mese + 1).padStart(2,'0')}`; }

const oggi = new Date();
let meseCorrente = oggi.getMonth(); // 0-11
let annoCorrente = oggi.getFullYear();
let giornoSelezionato = null;
let turnoCopiato = null; // clipboard in memoria, non persistito

/* ---------------------------------------------------------
   FESTIVITÀ — Pasqua (algoritmo di Gauss) + festività fisse
   --------------------------------------------------------- */
function calcolaPasqua(anno){
  const a = anno % 19, b = Math.floor(anno / 100), c = anno % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mese = Math.floor((h + l - 7 * m + 114) / 31);
  const giorno = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(anno, mese - 1, giorno);
}
function festivitaFisse(anno){
  return [
    `${anno}-01-01`, `${anno}-01-06`, `${anno}-04-25`, `${anno}-05-01`,
    `${anno}-06-02`, `${anno}-08-15`, `${anno}-11-01`, `${anno}-12-08`,
    `${anno}-12-25`, `${anno}-12-26`
  ];
}
function dataISO(d){
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
// Categorizza il turno in base alla fascia oraria in cui ricadono la MAGGIOR PARTE
// delle ore svolte (non solo l'orario di inizio) — es. un turno 23:00-07:00 risulta
// "notte" perché la maggioranza delle ore ricade in quella fascia, non "sera".
const INIZIALE_CATEGORIA = { mattina:'Matt', pomeriggio:'Pom', sera:'Sera', notte:'Not', riposo:'Rip' };
// Sigle mostrate sulla cella del calendario per le assenze, fornite dall'utente
// (per le voci non elencate esplicitamente, o personalizzate, si usa un fallback dalle prime lettere del nome)
const SIGLE_ASSENZE = {
  'Congedo ordinario': 'C.O.',
  'Congedo straordinario': 'C.S.',
  'Riposo legge': 'P.L.',
  'Riposo settimanale': 'R.S.',
  'Riposo festivo': 'R.F.',
  'Recupero riposo': 'R.R.',
  'Riposo compensativo': 'R.C.',
  'Aspettativa': 'Asp.',
  'Maternità/Paternità': 'Mat.P.',
  'Congedo parentale': 'C.Par.',
  'L104': 'L104',
  'Donazione sangue': 'D.San',
  'Ore studio': 'Stud',
  'Permesso breve': 'P.Bre',
  'Permesso sindacale': 'P.Sin',
  'Permesso lutto/grave infermità familiare': 'P.Lu.'
};
function siglaAssenza(nome){
  if(SIGLE_ASSENZE[nome]) return SIGLE_ASSENZE[nome];
  return nome.split(/\s+/).map(p => p[0]).join('').substring(0, 4).toUpperCase() + '.';
}

function categoriaTurno(oraInizio, oraFine, dataStr){
  const [hi, mi] = oraInizio.split(':').map(Number);
  const [hf, mf] = oraFine.split(':').map(Number);
  let inizio = new Date(dataStr + 'T00:00:00'); inizio.setHours(hi, mi, 0, 0);
  let fine = new Date(dataStr + 'T00:00:00'); fine.setHours(hf, mf, 0, 0);
  if(fine <= inizio) fine.setDate(fine.getDate() + 1);

  const minuti = { mattina:0, pomeriggio:0, sera:0, notte:0 };
  let cursore = new Date(inizio);
  while(cursore < fine){
    const h = cursore.getHours();
    if(h >= 6 && h < 12) minuti.mattina++;
    else if(h >= 12 && h < 18) minuti.pomeriggio++;
    else if(h >= 18) minuti.sera++;
    else minuti.notte++;
    cursore = new Date(cursore.getTime() + 60000);
  }
  return Object.entries(minuti).sort((a, b) => b[1] - a[1])[0][0];
}
// festività "fisse" (non domenica): Capodanno, Epifania, Pasqua, Pasquetta, 25 aprile, 1 maggio, 2 giugno, Ferragosto, Ognissanti, Immacolata, Natale, S.Stefano
function eFestivoFisso(dataStr){
  if(!dataStr) return false;
  const d = new Date(dataStr + 'T00:00:00');
  if(isNaN(d)) return false;
  const anno = d.getFullYear();
  const pasqua = calcolaPasqua(anno);
  const pasquetta = new Date(pasqua); pasquetta.setDate(pasqua.getDate() + 1);
  return festivitaFisse(anno).includes(dataStr) || dataISO(pasqua) === dataStr || dataISO(pasquetta) === dataStr;
}
function eDomenica(dataStr){
  const d = new Date(dataStr + 'T00:00:00');
  return !isNaN(d) && d.getDay() === 0;
}
function eFestivoOdDomenica(dataStr){ return eDomenica(dataStr) || eFestivoFisso(dataStr); }

/* ---------------------------------------------------------
   MOTORE DI CLASSIFICAZIONE ORE
   Analizza una finestra temporale minuto per minuto e la
   suddivide in 5 categorie mutuamente esclusive:
   ordinarie / notturne / festive / domenicali / notturne-festive
   --------------------------------------------------------- */
function classificaFinestra(inizio, fine){
  const cat = { ordinarie:0, notturne:0, festive:0, domenicali:0, notturneFestive:0, serali:0 };
  if(!(fine > inizio)) return cat;
  let cursore = new Date(inizio);
  while(cursore < fine){
    const ora = cursore.getHours();
    const notte = ora >= 22 || ora < 6;
    const iso = dataISO(cursore);
    const domenica = eDomenica(iso);
    const festivo = !domenica && eFestivoFisso(iso);
    if(notte && (domenica || festivo)) cat.notturneFestive++;
    else if(domenica) cat.domenicali++;
    else if(festivo) cat.festive++;
    else if(notte) cat.notturne++;
    else cat.ordinarie++;
    if(ora >= 18 && ora < 22) cat.serali++; // fascia serale, tracciata a parte per il controllo del territorio
    cursore = new Date(cursore.getTime() + 60000); // passo di 1 minuto
  }
  for(const k in cat) cat[k] = round2(cat[k] / 60); // minuti → ore
  return cat;
}
function round2(n){ return Math.round(n * 100) / 100; }

/**
 * Classifica un turno completo: ore ordinarie del turno + straordinario
 * prima/dopo, riconoscendo automaticamente fascia notturna e festività.
 */
function finestraDaOrari(dataBase, oraInizioStr, oraFineStr){
  if(!oraInizioStr || !oraFineStr) return { ore:0, classificazione:{ ordinarie:0, notturne:0, festive:0, domenicali:0, notturneFestive:0, serali:0 } };
  const [hs, ms] = oraInizioStr.split(':').map(Number);
  const [he, me] = oraFineStr.split(':').map(Number);
  let inizio = new Date(dataBase + 'T00:00:00'); inizio.setHours(hs, ms, 0, 0);
  let fine = new Date(dataBase + 'T00:00:00'); fine.setHours(he, me, 0, 0);
  if(fine <= inizio) fine.setDate(fine.getDate() + 1);
  const ore = (fine - inizio) / 3600000;
  if(ore > 24) return { ore:0, classificazione:{ ordinarie:0, notturne:0, festive:0, domenicali:0, notturneFestive:0, serali:0 } };
  return { ore: round2(ore), classificazione: classificaFinestra(inizio, fine) };
}

function classificaTurno(t){
  const vuoto = {
    oreTotali:0, ordinarie:0, notturne:0, festive:0, domenicali:0, notturneFestive:0, serali:0,
    strDiurno:0, strNotturno:0, strFestivo:0, strNotturnoFestivo:0, oreCompensate:0, orePermessoBreve:0, oreRecuperoPermessoBreve:0, errore:null
  };
  if(!t || t.riposo || t.assenzaTipo) return vuoto;
  if(!t.data || !t.oraInizio || !t.oraFine) return vuoto;

  const [hi, mi] = t.oraInizio.split(':').map(Number);
  const [hf, mf] = t.oraFine.split(':').map(Number);
  let inizio = new Date(t.data + 'T00:00:00'); inizio.setHours(hi, mi, 0, 0);
  let fine = new Date(t.data + 'T00:00:00'); fine.setHours(hf, mf, 0, 0);
  if(fine <= inizio) fine.setDate(fine.getDate() + 1);

  const oreTurno = (fine - inizio) / 3600000;
  if(oreTurno > 24) return { ...vuoto, errore:'Turno superiore a 24 ore: controlla gli orari.' };

  const base = classificaFinestra(inizio, fine);

  // Permesso breve durante il turno: le ore si tolgono dalle ore lavorative (non contano come lavorate/pagate)
  const permessoBreveCalc = t.permessoBreveAttivo ? finestraDaOrari(t.data, t.permessoBreveOraInizio, t.permessoBreveOraFine) : { ore:0, classificazione:{ ordinarie:0, notturne:0, festive:0, domenicali:0, notturneFestive:0, serali:0 } };
  const fpb = permessoBreveCalc.classificazione;
  const baseNetta = {
    ordinarie: round2(Math.max(0, base.ordinarie - fpb.ordinarie)),
    notturne: round2(Math.max(0, base.notturne - fpb.notturne)),
    festive: round2(Math.max(0, base.festive - fpb.festive)),
    domenicali: round2(Math.max(0, base.domenicali - fpb.domenicali)),
    notturneFestive: round2(Math.max(0, base.notturneFestive - fpb.notturneFestive)),
    serali: round2(Math.max(0, base.serali - fpb.serali))
  };
  const oreTurnoNette = round2(Math.max(0, oreTurno - permessoBreveCalc.ore));

  // Recupero permesso breve: finestra indipendente le cui ore, al contrario del permesso breve,
  // si SOMMANO alle ore lavorate pagate normali (non sono straordinario, sono ore ordinarie recuperate).
  const recuperoPBCalc = t.recuperoPermessoBreveAttivo ? finestraDaOrari(t.data, t.recuperoPermessoBreveOraInizio, t.recuperoPermessoBreveOraFine) : { ore:0, classificazione:{ ordinarie:0, notturne:0, festive:0, domenicali:0, notturneFestive:0, serali:0 } };
  const frpb = recuperoPBCalc.classificazione;
  baseNetta.ordinarie = round2(baseNetta.ordinarie + frpb.ordinarie);
  baseNetta.notturne = round2(baseNetta.notturne + frpb.notturne);
  baseNetta.festive = round2(baseNetta.festive + frpb.festive);
  baseNetta.domenicali = round2(baseNetta.domenicali + frpb.domenicali);
  baseNetta.notturneFestive = round2(baseNetta.notturneFestive + frpb.notturneFestive);
  baseNetta.serali = round2(baseNetta.serali + frpb.serali);

  // Straordinario prima/dopo: finestre orarie indipendenti (dalle-alle), come il rientro.
  // Un'eventuale pausa fra lo straordinario e il turno principale non viene conteggiata in alcuna categoria.
  const primaCalc = finestraDaOrari(t.data, t.straordinarioPrimaInizio, t.straordinarioPrimaFine);
  const dopoCalc = finestraDaOrari(t.data, t.straordinarioDopoInizio, t.straordinarioDopoFine);
  const finestraPrima = primaCalc.classificazione, finestraDopo = dopoCalc.classificazione;
  const strPrimaOre = primaCalc.ore, strDopoOre = dopoCalc.ore;

  // Secondo segmento (rientro/turno spezzato con pausa): orario proprio, non contiguo al turno principale.
  const secondoCalc = t.secondoAttivo ? finestraDaOrari(t.data, t.secondoOraInizio, t.secondoOraFine) : { ore:0, classificazione:{ ordinarie:0, notturne:0, festive:0, domenicali:0, notturneFestive:0, serali:0 } };
  const finestraSecondo = secondoCalc.classificazione, oreSecondo = secondoCalc.ore;

  const strDiurno = round2(finestraPrima.ordinarie + finestraDopo.ordinarie + finestraSecondo.ordinarie);
  const strNotturno = round2(finestraPrima.notturne + finestraDopo.notturne + finestraSecondo.notturne);
  const strFestivo = round2(finestraPrima.festive + finestraPrima.domenicali + finestraDopo.festive + finestraDopo.domenicali + finestraSecondo.festive + finestraSecondo.domenicali);
  const strNotturnoFestivo = round2(finestraPrima.notturneFestive + finestraDopo.notturneFestive + finestraSecondo.notturneFestive);

  // Se lo straordinario del giorno è convertito in riposo compensativo, non entra nel calcolo della paga:
  // le ore restano tracciate a parte (oreCompensate) invece di alimentare le categorie retribuite.
  const oreStraordinarioLavorate = round2(strDiurno + strNotturno + strFestivo + strNotturnoFestivo);
  const compensato = !!t.compensaStraordinario;

  return {
    oreTotali: round2(oreTurnoNette + strPrimaOre + strDopoOre + oreSecondo),
    ordinarie: baseNetta.ordinarie, notturne: baseNetta.notturne, festive: baseNetta.festive,
    domenicali: baseNetta.domenicali, notturneFestive: baseNetta.notturneFestive, serali: baseNetta.serali,
    strDiurno: compensato ? 0 : strDiurno,
    strNotturno: compensato ? 0 : strNotturno,
    strFestivo: compensato ? 0 : strFestivo,
    strNotturnoFestivo: compensato ? 0 : strNotturnoFestivo,
    oreCompensate: compensato ? oreStraordinarioLavorate : 0,
    orePermessoBreve: permessoBreveCalc.ore,
    oreRecuperoPermessoBreve: recuperoPBCalc.ore,
    errore: null
  };
}

/* ---------------------------------------------------------
   PERSISTENZA
   --------------------------------------------------------- */
function caricaAnagrafica(){
  try{ return JSON.parse(localStorage.getItem(CHIAVE_ANAGRAFICA)) || null; }catch{ return null; }
}
function salvaAnagraficaStorage(){ localStorage.setItem(CHIAVE_ANAGRAFICA, JSON.stringify(anagrafica)); }
function caricaTurni(){
  try{ return JSON.parse(localStorage.getItem(CHIAVE_TURNI)) || {}; }catch{ return {}; }
}
function salvaTurniStorage(){ localStorage.setItem(CHIAVE_TURNI, JSON.stringify(turni)); }

/* ---------------------------------------------------------
   MOTORE COMPETENZE — genera automaticamente le voci
   economiche da anagrafica + ore classificate + tabelle
   --------------------------------------------------------- */
function calcolaAssegnoFunzioneMensile(){
  if(!anagrafica || anagrafica.assegnoFunzionale !== 'si') return 0;
  const anni = Number(anagrafica.anni) || 0;
  const cat = (MAPPA_GRADI[anagrafica.qualifica] || { cat:'truppa' }).cat;
  const s = tabelle.assegnoFunzioneAnnuo[cat] || tabelle.assegnoFunzioneAnnuo.truppa;
  let annuo = 0;
  if(anni >= 32) annuo = s.soglia32;
  else if(anni >= 27) annuo = s.soglia27;
  else if(anni >= 17) annuo = s.soglia17;
  return round2(annuo / 12);
}

// Produttività collettiva: si liquida una volta sola a luglio, sui giorni di presenza effettiva
// dell'intero anno solare precedente (non del mese in corso).
function calcolaProduttivitaCollettivaAnnua(annoDiRiferimento){
  let giorniTotali = 0;
  for(let m = 0; m < 12; m++){
    giorniTotali += calcolaRiepilogoOreMese(annoDiRiferimento, m).giorniPresenzaEffettiva;
  }
  return round2(giorniTotali * tabelle.indennitaProduttivitaCollettiva);
}

function calcolaCompetenze(anno, mese){
  const { tot, reperibilita, turniServizioEsternoValidi, turniFestiviLavorati, turniFestivitaParticolare, turniCompensazioneRiposo, turniCambioTurno, giorniPresenzaEffettiva, giorniControlloTerritorioSerali, giorniControlloTerritorioNotturni, indennitaMissioniTotale, indennitaOPTotale } = calcolaRiepilogoOreMese(anno, mese);
  const qualifica = anagrafica ? anagrafica.qualifica : 'Agente';
  const tabellaStraordinario = anno >= 2027 ? tabelle.straordinarioOrario2027 : tabelle.straordinarioOrarioAttuale;
  const tariffe = tabellaStraordinario[qualifica] || tabellaStraordinario['Agente'];

  const tabellaStipendio = anno >= 2027 ? tabelle.stipendiAnnui2027 : tabelle.stipendiAnnuiAttuale;
  const tabellaIndennitaPensionabile = anno >= 2027 ? tabelle.indennitaPensionabileAnnua2027 : tabelle.indennitaPensionabileAnnuaAttuale;

  const stipendioTabellare = round2((tabellaStipendio[qualifica] || 0) / 12);
  const iis = round2(tabelle.iisMensile);
  const indennitaPensionabile = round2((tabellaIndennitaPensionabile[qualifica] || 0) / 12);
  const assegnoFunzione = calcolaAssegnoFunzioneMensile();

  const strDiurno = round2(tot.strDiurno * tariffe.diurno);
  const strNotturno = round2(tot.strNotturno * tariffe.notturnoOFestivo);
  const strFestivo = round2(tot.strFestivo * tariffe.notturnoOFestivo);
  const strNotturnoFestivo = round2(tot.strNotturnoFestivo * tariffe.notturnoFestivo);

  const indTurnoNotturno = round2(tot.notturne * tabelle.indennitaTurnoNotturnoOraria);
  const indFestiva = round2(turniFestiviLavorati * tabelle.indennitaPresenzaFestivaTurno);
  const indFestivitaParticolare = round2(turniFestivitaParticolare * tabelle.indennitaFestivitaParticolareGiorno);
  const indCompensazioneRiposo = round2(turniCompensazioneRiposo * tabelle.indennitaCompensazioneRiposoLavorato);
  const indCambioTurno = round2(turniCambioTurno * tabelle.indennitaCambioTurno);
  // Produttività collettiva: NON è una voce mensile. Viene liquidata in un'unica soluzione nel cedolino di luglio,
  // calcolata sui giorni di presenza effettiva dell'intero anno solare precedente (gennaio-dicembre).
  const indProduttivitaCollettiva = mese === 6 ? calcolaProduttivitaCollettivaAnnua(anno - 1) : 0;
  const indOP = indennitaOPTotale;
  const indServizioEsterno = round2(turniServizioEsternoValidi * tabelle.indennitaServizioEsternoTurno);
  const indControlloTerritorio = round2(
    giorniControlloTerritorioSerali * tabelle.indennitaControlloTerritorioSeraleFlat +
    giorniControlloTerritorioNotturni * tabelle.indennitaControlloTerritorioNotturnoFlat
  );
  const indReperibilita = round2(reperibilita * tabelle.reperibilitaGiornaliera);
  const indMissioni = indennitaMissioniTotale;

  // Tredicesima: erogata automaticamente a dicembre (mese indice 11), pari a una mensilità
  // di stipendio tabellare + IIS. Semplificazione: nella realtà ha un proprio conguaglio fiscale.
  const tredicesima = mese === 11 ? round2(stipendioTabellare + iis) : 0;

  const fisse = tredicesima > 0
    ? { stipendioTabellare, iis, indennitaPensionabile, assegnoFunzione, tredicesima }
    : { stipendioTabellare, iis, indennitaPensionabile, assegnoFunzione };
  const totaleFisse = round2(Object.values(fisse).reduce((a,b) => a+b, 0));

  const accessorie = { strDiurno, strNotturno, strFestivo, strNotturnoFestivo, indTurnoNotturno, indFestiva, indFestivitaParticolare, indOP, indServizioEsterno, indControlloTerritorio, indReperibilita, indMissioni, indCompensazioneRiposo, indCambioTurno, indProduttivitaCollettiva };
  const totaleAccessorie = round2(Object.values(accessorie).reduce((a,b) => a+b, 0));

  return { qualifica, fisse, totaleFisse, accessorie, totaleAccessorie, totaleLordo: round2(totaleFisse + totaleAccessorie), tot };
}

/* ---------------------------------------------------------
   MOTORE FISCALE — a cascata, come NoiPA
   --------------------------------------------------------- */
function calcolaIRPEFAnnua(imponibileAnnuo){
  if(imponibileAnnuo <= tabelle.noTaxAreaAnnua) return 0;
  let imposta = 0, sogliaPrec = 0;
  for(const scaglione of tabelle.irpefScaglioni){
    if(imponibileAnnuo > sogliaPrec){
      const quota = Math.min(imponibileAnnuo, scaglione.fino) - sogliaPrec;
      imposta += quota * scaglione.aliquota / 100;
    }
    sogliaPrec = scaglione.fino;
  }
  return imposta;
}

function generaCedolino(anno, mese){
  const comp = calcolaCompetenze(anno, mese);

  // 1. Imponibile previdenziale: solo voci fisse pensionabili
  const imponibilePrevidenziale = comp.totaleFisse;
  // 2. Contributi
  const contributi = round2(imponibilePrevidenziale * tabelle.aliquotaPrevidenziale / 100);
  // 3. Imponibile fiscale (parte fissa)
  const imponibileFiscaleFisso = round2(imponibilePrevidenziale - contributi);

  // Voci accessorie: detassazione al 15% entro la soglia mensile equivalente
  const sogliaMensile = tabelle.sogliaDetassazioneAccessoriAnnua / 12;
  const quotaAgevolata = Math.min(comp.totaleAccessorie, sogliaMensile);
  const quotaOrdinaria = round2(comp.totaleAccessorie - quotaAgevolata);
  const impostaAgevolata = round2(quotaAgevolata * tabelle.aliquotaDetassazioneAccessori / 100);

  const imponibileFiscaleTotale = round2(imponibileFiscaleFisso + quotaOrdinaria);

  // 4. IRPEF (mensilizzata dall'annuale)
  const irpefAnnuaStimata = calcolaIRPEFAnnua(imponibileFiscaleTotale * 12);
  const irpefOrdinaria = round2(irpefAnnuaStimata / 12);
  const irpefTotale = round2(irpefOrdinaria + impostaAgevolata);

  // 5. Detrazioni (semplificate, flat mensile)
  const redditoAnnuoStimato = imponibileFiscaleTotale * 12;
  const detrazioniLavoro = redditoAnnuoStimato > tabelle.noTaxAreaAnnua ? tabelle.detrazioneLavoroMensile : 0;
  const coniugeACarico = anagrafica && anagrafica.coniugeACarico === 'si';
  const figliOver21 = anagrafica ? (Number(anagrafica.figliOver21) || 0) : 0;
  const detrazioniFamiliari = round2(
    (coniugeACarico ? tabelle.detrazioneConiugeACaricoAnnua / 12 : 0) +
    (figliOver21 * tabelle.detrazionePerFiglioOver21Annua / 12)
  );
  const detrazioni = round2(detrazioniLavoro + detrazioniFamiliari);

  // 6. Trattamento integrativo
  const trattamentoIntegrativo = redditoAnnuoStimato < tabelle.sogliaTrattamentoIntegrativoAnnua ? tabelle.trattamentoIntegrativoMensile : 0;

  // 7. Addizionali regionale (automatica, a scaglioni in base alla regione) e comunale (manuale)
  const aliqRegionale = anagrafica && anagrafica.regione
    ? calcolaAliquotaAddizionaleRegionale(anagrafica.regione, redditoAnnuoStimato)
    : 0;
  const aliqComunale = anagrafica ? (Number(anagrafica.addComunale) || 0) : 0;
  const addizionali = round2(imponibileFiscaleTotale * (aliqRegionale + aliqComunale) / 100);

  // 8. Sindacato
  const sindacato = (anagrafica && anagrafica.sindacato) ? tabelle.sindacatoMensile : 0;

  // 9. Conguagli (inseriti manualmente dall'utente per il mese corrente)
  const conguagli = round2(Number(conguagliPerMese[chiaveMese(anno, mese)]) || 0);

  const netto = round2(comp.totaleLordo - contributi - irpefTotale + detrazioni + trattamentoIntegrativo - addizionali - sindacato + conguagli);

  return { comp, imponibilePrevidenziale, contributi, imponibileFiscaleTotale, irpefTotale, detrazioniLavoro, detrazioniFamiliari, detrazioni, trattamentoIntegrativo, addizionali, aliqRegionale, aliqComunale, sindacato, conguagli, netto };
}

// Ricostruisce cosa arriva effettivamente sul conto in un dato mese: lo stipendio base si accredita
// il mese successivo a quello lavorato, le indennità accessorie con un mese di ritardo ulteriore.
// La tredicesima invece NON è sfasata: si accredita a dicembre stesso.
// Il calcolo fiscale (contributi/IRPEF/addizionali) qui è una STIMA: nella realtà NoiPA emette due
// cedolini separati (stipendio e accessorio) con trattamento fiscale proprio; qui viene sommato
// il lordo delle due componenti e applicato un unico calcolo, come approssimazione.
function generaAccreditoConto(anno, mese){
  let meseFisse = mese - 1, annoFisse = anno;
  if(meseFisse < 0){ meseFisse = 11; annoFisse--; }
  let meseAccessorie = mese - 2, annoAccessorie = anno;
  if(meseAccessorie < 0){ meseAccessorie += 12; annoAccessorie--; }

  const compFisse = calcolaCompetenze(annoFisse, meseFisse);
  const compAccessorie = calcolaCompetenze(annoAccessorie, meseAccessorie);

  const tredicesimaFonteEsclusa = compFisse.fisse.tredicesima || 0;
  const fisseBase = round2(compFisse.totaleFisse - tredicesimaFonteEsclusa);
  const tredicesimaAccredito = mese === 11 ? round2(calcolaCompetenze(anno, 11).fisse.tredicesima || 0) : 0;
  const accessorieLorde = round2(compAccessorie.totaleLordo - compAccessorie.totaleFisse);

  const imponibilePrevidenziale = round2(fisseBase + tredicesimaAccredito);
  const contributi = round2(imponibilePrevidenziale * tabelle.aliquotaPrevidenziale / 100);
  const imponibileFiscaleFisso = round2(imponibilePrevidenziale - contributi);

  const sogliaMensile = tabelle.sogliaDetassazioneAccessoriAnnua / 12;
  const quotaAgevolata = Math.min(accessorieLorde, sogliaMensile);
  const quotaOrdinaria = round2(accessorieLorde - quotaAgevolata);
  const impostaAgevolata = round2(quotaAgevolata * tabelle.aliquotaDetassazioneAccessori / 100);

  const imponibileFiscaleTotale = round2(imponibileFiscaleFisso + quotaOrdinaria);

  const irpefAnnuaStimata = calcolaIRPEFAnnua(imponibileFiscaleTotale * 12);
  const irpefOrdinaria = round2(irpefAnnuaStimata / 12);
  const irpefTotale = round2(irpefOrdinaria + impostaAgevolata);

  const redditoAnnuoStimato = imponibileFiscaleTotale * 12;
  const detrazioniLavoro = redditoAnnuoStimato > tabelle.noTaxAreaAnnua ? tabelle.detrazioneLavoroMensile : 0;
  const coniugeACarico = anagrafica && anagrafica.coniugeACarico === 'si';
  const figliOver21 = anagrafica ? (Number(anagrafica.figliOver21) || 0) : 0;
  const detrazioniFamiliari = round2(
    (coniugeACarico ? tabelle.detrazioneConiugeACaricoAnnua / 12 : 0) +
    (figliOver21 * tabelle.detrazionePerFiglioOver21Annua / 12)
  );
  const detrazioni = round2(detrazioniLavoro + detrazioniFamiliari);

  const trattamentoIntegrativo = redditoAnnuoStimato < tabelle.sogliaTrattamentoIntegrativoAnnua ? tabelle.trattamentoIntegrativoMensile : 0;

  const aliqRegionale = anagrafica && anagrafica.regione
    ? calcolaAliquotaAddizionaleRegionale(anagrafica.regione, redditoAnnuoStimato)
    : 0;
  const aliqComunale = anagrafica ? (Number(anagrafica.addComunale) || 0) : 0;
  const addizionali = round2(imponibileFiscaleTotale * (aliqRegionale + aliqComunale) / 100);

  const sindacato = (anagrafica && anagrafica.sindacato) ? tabelle.sindacatoMensile : 0;

  const lordoTotale = round2(fisseBase + tredicesimaAccredito + accessorieLorde);
  const netto = round2(lordoTotale - contributi - irpefTotale + detrazioni + trattamentoIntegrativo - addizionali - sindacato);

  return {
    meseFisse, annoFisse, meseAccessorie, annoAccessorie,
    fisseBase, tredicesimaAccredito, accessorieLorde, lordoTotale,
    contributi, irpefTotale, detrazioni, trattamentoIntegrativo, addizionali, sindacato, netto
  };
}


/* ---------------------------------------------------------
   UI — TABELLE UFFICIALI
   --------------------------------------------------------- */
function renderTabelle(){
  const qualifica = anagrafica ? anagrafica.qualifica : 'Agente';
  const catRuolo = (MAPPA_GRADI[qualifica] || { cat:'truppa' }).cat;
  const NOMI_RUOLO = { truppa:'Agenti e Assistenti', sovr:'Sovrintendenti', isp:'Ispettori', funz:'Commissari/Funzionari' };
  const t = tabelle;
  el('corpoTabelle').innerHTML = `
    <div class="gruppo-tabelle">
      <h3>Voci fisse — ${qualifica}</h3>
      <p class="sotto-titolo" style="margin:-4px 0 6px;">Il cedolino usa in automatico la colonna giusta in base all'anno. "In vigore" = D.P.R. 24 marzo 2025, n. 53 (decreto effettivo, dal 1° gennaio 2024) — è quello che si applica davvero oggi. "Proiettata 2027" = dall'ipotesi di accordo sindacale 2025-2027 firmata 15/07/2026, non ancora recepita in un decreto: si applicherà solo dopo il recepimento ufficiale, per ora è solo una previsione.</p>
      <div class="riga-tabella"><span>Stipendio annuo — in vigore (€)</span><input data-t="stipendiAnnuiAttuale.${qualifica}" type="number" step="0.01" value="${t.stipendiAnnuiAttuale[qualifica] || 0}"></div>
      <div class="riga-tabella"><span>Stipendio annuo — proiettata 2027 (€)</span><input data-t="stipendiAnnui2027.${qualifica}" type="number" step="0.01" value="${t.stipendiAnnui2027[qualifica] || 0}"></div>
      <div class="riga-tabella"><span>Indennità pensionabile annua — in vigore (€)</span><input data-t="indennitaPensionabileAnnuaAttuale.${qualifica}" type="number" step="0.01" value="${round2(t.indennitaPensionabileAnnuaAttuale[qualifica] || 0)}"></div>
      <div class="riga-tabella"><span>Indennità pensionabile annua — proiettata 2027 (€)</span><input data-t="indennitaPensionabileAnnua2027.${qualifica}" type="number" step="0.01" value="${round2(t.indennitaPensionabileAnnua2027[qualifica] || 0)}"></div>
    </div>
    <div class="gruppo-tabelle">
      <h3>Straordinario orario — ${qualifica} — in vigore</h3>
      <p class="sotto-titolo" style="margin:-4px 0 6px;">Fonte: D.P.R. 24 marzo 2025, n. 53, Art. 6, dal 1° gennaio 2024. Il cedolino usa questa tabella per qualunque mese fino al 31/12/2026 compreso.</p>
      <div class="riga-tabella"><span>Diurno (€/h)</span><input data-t="straordinarioOrarioAttuale.${qualifica}.diurno" type="number" step="0.01" value="${t.straordinarioOrarioAttuale[qualifica].diurno}"></div>
      <div class="riga-tabella"><span>Notturno o Festivo (€/h)</span><input data-t="straordinarioOrarioAttuale.${qualifica}.notturnoOFestivo" type="number" step="0.01" value="${t.straordinarioOrarioAttuale[qualifica].notturnoOFestivo}"></div>
      <div class="riga-tabella"><span>Notturno Festivo (€/h)</span><input data-t="straordinarioOrarioAttuale.${qualifica}.notturnoFestivo" type="number" step="0.01" value="${t.straordinarioOrarioAttuale[qualifica].notturnoFestivo}"></div>
    </div>
    <div class="gruppo-tabelle">
      <h3>Straordinario orario — ${qualifica} — proiettata 2027</h3>
      <p class="sotto-titolo" style="margin:-4px 0 6px;">Dall'ipotesi di accordo 2025-2027, non ancora in vigore. Il cedolino la userà in automatico solo per i mesi da gennaio 2027 in poi.</p>
      <div class="riga-tabella"><span>Diurno (€/h)</span><input data-t="straordinarioOrario2027.${qualifica}.diurno" type="number" step="0.01" value="${t.straordinarioOrario2027[qualifica].diurno}"></div>
      <div class="riga-tabella"><span>Notturno o Festivo (€/h)</span><input data-t="straordinarioOrario2027.${qualifica}.notturnoOFestivo" type="number" step="0.01" value="${t.straordinarioOrario2027[qualifica].notturnoOFestivo}"></div>
      <div class="riga-tabella"><span>Notturno Festivo (€/h)</span><input data-t="straordinarioOrario2027.${qualifica}.notturnoFestivo" type="number" step="0.01" value="${t.straordinarioOrario2027[qualifica].notturnoFestivo}"></div>
    </div>
    <div class="gruppo-tabelle">
      <h3>Assegno di funzione annuo — ${NOMI_RUOLO[catRuolo]} (€, per soglia anni di servizio)</h3>
      ${catRuolo === 'funz' ? '<p class="sotto-titolo" style="margin:-4px 0 6px;">⚠ Valori per Commissari/Funzionari non confermati da fonte ufficiale, verificali sul tuo cedolino reale.</p>' : ''}
      <div class="riga-tabella"><span>Dopo 17 anni</span><input data-t="assegnoFunzioneAnnuo.${catRuolo}.soglia17" type="number" step="0.01" value="${t.assegnoFunzioneAnnuo[catRuolo].soglia17}"></div>
      <div class="riga-tabella"><span>Dopo 27 anni</span><input data-t="assegnoFunzioneAnnuo.${catRuolo}.soglia27" type="number" step="0.01" value="${t.assegnoFunzioneAnnuo[catRuolo].soglia27}"></div>
      <div class="riga-tabella"><span>Dopo 32 anni</span><input data-t="assegnoFunzioneAnnuo.${catRuolo}.soglia32" type="number" step="0.01" value="${t.assegnoFunzioneAnnuo[catRuolo].soglia32}"></div>
    </div>
    <div class="gruppo-tabelle">
      <h3>Indennità e trasferte</h3>
      <div class="riga-tabella"><span>Turno notturno ordinario (€/h, 22-06)</span><input data-t="indennitaTurnoNotturnoOraria" type="number" step="0.01" value="${t.indennitaTurnoNotturnoOraria}"></div>
      <div class="riga-tabella"><span>Presenza festiva/domenicale (€/turno)</span><input data-t="indennitaPresenzaFestivaTurno" type="number" step="0.01" value="${t.indennitaPresenzaFestivaTurno}"></div>
      <div class="riga-tabella"><span>Presenza festività particolari (€/giorno, aggiuntiva)</span><input data-t="indennitaFestivitaParticolareGiorno" type="number" step="0.01" value="${t.indennitaFestivitaParticolareGiorno}"></div>
      <div class="riga-tabella"><span>Compensazione riposo lavorato (€/giorno)</span><input data-t="indennitaCompensazioneRiposoLavorato" type="number" step="0.01" value="${t.indennitaCompensazioneRiposoLavorato}"></div>
      <div class="riga-tabella"><span>Ordine pubblico in sede (€/turno, min. 4h)</span><input data-t="indennitaOPInSede" type="number" step="0.01" value="${t.indennitaOPInSede}"></div>
      <div class="riga-tabella"><span>Ordine pubblico fuori sede (€/turno, min. 4h)</span><input data-t="indennitaOPFuoriSede" type="number" step="0.01" value="${t.indennitaOPFuoriSede}"></div>
      <div class="riga-tabella"><span>Riduzione fuori sede senza pernottamento (%)</span><input data-t="riduzioneOPSenzaPernottamento" type="number" step="1" value="${t.riduzioneOPSenzaPernottamento}"></div>
      <div class="riga-tabella"><span>Servizio esterno (€/turno, min. 3h)</span><input data-t="indennitaServizioEsternoTurno" type="number" step="0.01" value="${t.indennitaServizioEsternoTurno}"></div>
      <div class="riga-tabella"><span>Controllo territorio serale (€ fisso/giorno, se prevale la fascia 18-22)</span><input data-t="indennitaControlloTerritorioSeraleFlat" type="number" step="0.01" value="${t.indennitaControlloTerritorioSeraleFlat}"></div>
      <div class="riga-tabella"><span>Controllo territorio notturno (€ fisso/giorno, se prevale la fascia 22-06)</span><input data-t="indennitaControlloTerritorioNotturnoFlat" type="number" step="0.01" value="${t.indennitaControlloTerritorioNotturnoFlat}"></div>
      <div class="riga-tabella"><span>Reperibilità (€/turno)</span><input data-t="reperibilitaGiornaliera" type="number" step="0.01" value="${t.reperibilitaGiornaliera}"></div>
      <div class="riga-tabella"><span>Cambio turno (€/occorrenza)</span><input data-t="indennitaCambioTurno" type="number" step="0.01" value="${t.indennitaCambioTurno}"></div>
      <div class="riga-tabella"><span>Produttività collettiva (€/giorno di presenza)</span><input data-t="indennitaProduttivitaCollettiva" type="number" step="0.01" value="${t.indennitaProduttivitaCollettiva}"></div>
      <p class="sotto-titolo" style="margin:2px 0 8px;">Non è una voce mensile: viene liquidata in un'unica soluzione nel cedolino di luglio, sui giorni di presenza dell'intero anno solare precedente.</p>
      <div class="riga-tabella"><span>Missione — indennità oraria piena, 4-8h (€/h)</span><input data-t="indennitaTrasfertaOraria" type="number" step="0.001" value="${t.indennitaTrasfertaOraria}"></div>
      <div class="riga-tabella"><span>Missione — indennità oraria ridotta, oltre 8h (€/h)</span><input data-t="indennitaTrasfertaOrariaRidotta" type="number" step="0.001" value="${t.indennitaTrasfertaOrariaRidotta}"></div>
      <div class="riga-tabella"><span>Quota sindacale (€/mese)</span><input data-t="sindacatoMensile" type="number" step="0.01" value="${t.sindacatoMensile}"></div>
    </div>
    <div class="gruppo-tabelle">
      <h3>Parametri fiscali e previdenziali (nazionali)</h3>
      <div class="riga-tabella"><span>Aliquota previdenziale (%)</span><input data-t="aliquotaPrevidenziale" type="number" step="0.01" value="${t.aliquotaPrevidenziale}"></div>
      <div class="riga-tabella"><span>No-tax-area annua (€)</span><input data-t="noTaxAreaAnnua" type="number" step="1" value="${t.noTaxAreaAnnua}"></div>
      <div class="riga-tabella"><span>Detrazione lavoro dipendente (€/mese, semplificata)</span><input data-t="detrazioneLavoroMensile" type="number" step="0.01" value="${t.detrazioneLavoroMensile}"></div>
      <div class="riga-tabella"><span>Detrazione coniuge a carico (€/anno, semplificata)</span><input data-t="detrazioneConiugeACaricoAnnua" type="number" step="0.01" value="${t.detrazioneConiugeACaricoAnnua}"></div>
      <div class="riga-tabella"><span>Detrazione per figlio over 21 a carico (€/anno)</span><input data-t="detrazionePerFiglioOver21Annua" type="number" step="0.01" value="${t.detrazionePerFiglioOver21Annua}"></div>
      <div class="riga-tabella"><span>Trattamento integrativo (€/mese)</span><input data-t="trattamentoIntegrativoMensile" type="number" step="0.01" value="${t.trattamentoIntegrativoMensile}"></div>
    </div>
    <div class="gruppo-tabelle">
      <h3>Buono Pasto <span class="sotto-titolo" style="font-size:0.7rem;">(informativo, non incide sul cedolino)</span></h3>
      <div class="riga-tabella"><span>Valore buono pasto (€)</span><input data-t="buonoPastoValore" type="number" step="0.01" value="${t.buonoPastoValore}"></div>
    </div>`;
}

function leggiTabelleDaModale(){
  el('corpoTabelle').querySelectorAll('input[data-t]').forEach(input => {
    const percorso = input.dataset.t.split('.');
    let ref = tabelle;
    for(let i = 0; i < percorso.length - 1; i++) ref = ref[percorso[i]];
    ref[percorso[percorso.length - 1]] = Number(input.value) || 0;
  });
  salvaTabelleStorage();
}

/* ---------------------------------------------------------
   UI — ASSENZE DAL SERVIZIO (elenco personalizzabile)
   --------------------------------------------------------- */
/* ---------------------------------------------------------
   UI — SEQUENZA AUTOMATICA TURNI (personalizzabile)
   --------------------------------------------------------- */
const OPZIONI_SEQUENZA = { riposo:'Riposo', ...Object.fromEntries(Object.entries(MODELLI_TURNO).map(([k,v]) => [k, v.etichetta])), personalizzato:'Orario personalizzato…' };

const CAMPI_EXTRA_SEQUENZA = [
  { chiave:'servizioEsterno', etichetta:'Servizio esterno' },
  { chiave:'ordinePubblico', etichetta:'Ordine pubblico' },
  { chiave:'controlloTerritorio', etichetta:'Controllo territorio' },
  { chiave:'buonoPasto', etichetta:'Buono pasto' },
  { chiave:'reperibilita', etichetta:'Reperibilità' },
  { chiave:'missione', etichetta:'Missione' }
];

function renderSequenza(){
  el('campoSequenzaDataInizio').value = giornoSelezionato || dataISO(new Date());
  const lista = el('listaSequenza');
  lista.innerHTML = sequenzaTurni.map((passo, i) => {
    if(!passo.extra) passo.extra = {};
    const numeroAttivi = CAMPI_EXTRA_SEQUENZA.filter(c => passo.extra[c.chiave]).length;
    return `
    <div class="riga-sequenza" data-indice="${i}">
      <span class="numero-passo">${i + 1}</span>
      <select data-indice="${i}" data-campo="tipo">
        ${Object.entries(OPZIONI_SEQUENZA).map(([val, etichetta]) =>
          `<option value="${val}" ${val === passo.tipo ? 'selected' : ''}>${etichetta}</option>`).join('')}
      </select>
      ${passo.tipo !== 'riposo' ? `<button class="btn-extra-sequenza" type="button" data-indice-extra="${i}" title="Indennità e opzioni per questo passaggio">⚙${numeroAttivi > 0 ? ` (${numeroAttivi})` : ''}</button>` : ''}
      <button class="riga-rimuovi" type="button" title="Rimuovi passaggio">✕</button>
    </div>
    ${passo.tipo === 'personalizzato' ? `
    <div class="riga-sequenza-orari">
      <label class="campo-modale">Dalle<input type="time" data-indice="${i}" data-campo="oraInizio" value="${passo.oraInizio || ''}"></label>
      <label class="campo-modale">Alle<input type="time" data-indice="${i}" data-campo="oraFine" value="${passo.oraFine || ''}"></label>
    </div>` : ''}
    ${passo.tipo !== 'riposo' && passo.apertoExtra ? `
      <div class="pannello-extra-sequenza" data-pannello-extra="${i}">
        <label class="campo-modale">Servizio svolto<input type="text" data-indice="${i}" data-campo-extra="servizioSvolto" value="${passo.extra.servizioSvolto || ''}" placeholder="es. Pattugliamento"></label>
        <div class="griglia-check">
          ${CAMPI_EXTRA_SEQUENZA.map(c => `
            <label class="campo-modale campo-riga">
              <input type="checkbox" data-indice="${i}" data-campo-extra="${c.chiave}" ${passo.extra[c.chiave] ? 'checked' : ''}> ${c.etichetta}
            </label>`).join('')}
        </div>
        <label class="campo-modale campo-riga" style="margin-top:4px;">
          <input type="checkbox" data-indice="${i}" data-campo-extra="secondoAttivo" ${passo.extra.secondoAttivo ? 'checked' : ''}> Rientro pomeridiano (turno spezzato)
        </label>
        ${passo.extra.secondoAttivo ? `
          <div class="griglia-check">
            <label class="campo-modale">Rientro dalle<input type="time" data-indice="${i}" data-campo-extra="secondoOraInizio" value="${passo.extra.secondoOraInizio || ''}"></label>
            <label class="campo-modale">alle<input type="time" data-indice="${i}" data-campo-extra="secondoOraFine" value="${passo.extra.secondoOraFine || ''}"></label>
          </div>` : ''}
        <label class="campo-modale campo-riga" style="margin-top:4px;">
          <input type="checkbox" data-indice="${i}" data-campo-extra="straordinarioProgrammato" ${passo.extra.straordinarioProgrammato ? 'checked' : ''}> <strong>Straordinario programmato</strong>
        </label>
        ${passo.extra.straordinarioProgrammato ? `
          <div class="griglia-check">
            <label class="campo-modale">Prima — dalle<input type="time" data-indice="${i}" data-campo-extra="strPrimaInizio" value="${passo.extra.strPrimaInizio || ''}"></label>
            <label class="campo-modale">alle<input type="time" data-indice="${i}" data-campo-extra="strPrimaFine" value="${passo.extra.strPrimaFine || ''}"></label>
            <label class="campo-modale">Dopo — dalle<input type="time" data-indice="${i}" data-campo-extra="strDopoInizio" value="${passo.extra.strDopoInizio || ''}"></label>
            <label class="campo-modale">alle<input type="time" data-indice="${i}" data-campo-extra="strDopoFine" value="${passo.extra.strDopoFine || ''}"></label>
          </div>
          <p class="sotto-titolo" style="margin:2px 0 0;">Lascia vuote le coppie che non ti servono. Un'eventuale pausa fra lo straordinario e il turno non viene conteggiata, come nel turno singolo.</p>` : ''}
      </div>` : ''}`;
  }).join('');

  lista.querySelectorAll('select, input[data-campo]').forEach(campo => {
    campo.addEventListener('input', () => {
      const i = Number(campo.dataset.indice);
      sequenzaTurni[i][campo.dataset.campo] = campo.value;
      if(campo.dataset.campo === 'tipo') renderSequenza(); // per mostrare/nascondere i campi orario
    });
  });
  lista.querySelectorAll('[data-campo-extra]').forEach(campo => {
    campo.addEventListener('input', () => {
      const i = Number(campo.dataset.indice);
      const chiave = campo.dataset.campoExtra;
      sequenzaTurni[i].extra[chiave] = campo.type === 'checkbox' ? campo.checked : campo.value;
      if(chiave === 'secondoAttivo' || chiave === 'straordinarioProgrammato'){ renderSequenza(); return; }
      const numeroAttivi = CAMPI_EXTRA_SEQUENZA.filter(c => sequenzaTurni[i].extra[c.chiave]).length;
      const btnExtra = lista.querySelector(`.riga-sequenza[data-indice="${i}"] .btn-extra-sequenza`);
      if(btnExtra) btnExtra.textContent = `⚙${numeroAttivi > 0 ? ` (${numeroAttivi})` : ''}`;
    });
  });
  lista.querySelectorAll('.btn-extra-sequenza').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.indiceExtra);
      sequenzaTurni[i].apertoExtra = !sequenzaTurni[i].apertoExtra;
      renderSequenza();
    });
  });
  lista.querySelectorAll('.riga-rimuovi').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      if(sequenzaTurni.length <= 1) return; // almeno un passaggio
      sequenzaTurni.splice(i, 1);
      renderSequenza();
    });
  });
}

/* ---------------------------------------------------------
   COPIA / INCOLLA TURNO — singolo giorno e settimana precedente
   --------------------------------------------------------- */
function copiaTurnoCorrente(){
  if(!giornoSelezionato || !turni[giornoSelezionato]) return;
  turnoCopiato = JSON.parse(JSON.stringify(turni[giornoSelezionato]));
  aggiornaDettaglioGiorno();
}

function incollaTurnoCorrente(){
  if(!giornoSelezionato || !turnoCopiato) return;
  const esegui = () => {
    turni[giornoSelezionato] = { ...turnoCopiato, data: giornoSelezionato, generatoAutomaticamente: true };
    salvaTurniStorage();
    renderCalendario();
  };
  if(turni[giornoSelezionato]){
    mostraConferma('Il giorno selezionato ha già un turno: verrà sovrascritto. Continuare?', esegui);
  } else {
    esegui();
  }
}

function cancellaTurniMese(){
  const giorniNelMese = new Date(annoCorrente, meseCorrente + 1, 0).getDate();
  const isoDelMese = [];
  for(let g = 1; g <= giorniNelMese; g++){
    const iso = dataISO(new Date(annoCorrente, meseCorrente, g));
    if(turni[iso]) isoDelMese.push(iso);
  }
  if(isoDelMese.length === 0){
    mostraAvviso(`Nessun turno inserito in ${NOMI_MESI[meseCorrente]} ${annoCorrente} da cancellare.`);
    return;
  }
  mostraConferma(
    `Stai per cancellare ${isoDelMese.length} turno/i di ${NOMI_MESI[meseCorrente]} ${annoCorrente}.\n` +
    `L'operazione non è reversibile. Continuare?`,
    () => {
      isoDelMese.forEach(iso => delete turni[iso]);
      salvaTurniStorage();
      renderCalendario();
    }
  );
}

function applicaModelloTurnoInQuinta(){
  sequenzaTurni = [{tipo:'sera01'}, {tipo:'pomeriggio'}, {tipo:'mattina'}, {tipo:'notte01'}, {tipo:'riposo'}];
  salvaSequenzaStorage();
  renderSequenza();
}

function applicaModelloSettimanaCorta(){
  const base = (oraInizio, oraFine, extra) => ({ tipo:'personalizzato', oraInizio, oraFine, extra: extra || {} });
  const riposo = () => ({ tipo:'riposo' });
  const rientro = { secondoAttivo:true, secondoOraInizio:'15:00', secondoOraFine:'18:00' };

  sequenzaTurni = [
    base('08:00','14:00'),               // lunedì
    base('08:00','14:00', {...rientro}), // martedì — rientro pomeridiano 3h
    base('08:00','14:00'),               // mercoledì
    base('08:00','14:00', {...rientro}), // giovedì — rientro pomeridiano 3h
    base('08:00','14:00'),               // venerdì
    riposo(),                            // sabato
    riposo()                             // domenica
  ];
  salvaSequenzaStorage();
  renderSequenza();
}

function applicaModelloSettimanaLunga(){
  const base = (oraInizio, oraFine) => ({ tipo:'personalizzato', oraInizio, oraFine, extra:{} });
  const riposo = () => ({ tipo:'riposo' });

  sequenzaTurni = [
    base('08:00','14:00'), base('08:00','14:00'), base('08:00','14:00'),
    base('08:00','14:00'), base('08:00','14:00'), base('08:00','14:00'), // lunedì-sabato
    riposo()                                                              // domenica
  ];
  salvaSequenzaStorage();
  renderSequenza();
}

function generaSequenzaTurni(indiceInizialeForzato){
  const dataInizioStr = el('campoSequenzaDataInizio').value;
  const numeroGiorni = Math.max(1, Math.min(366, Number(el('campoSequenzaGiorni').value) || 1));
  if(!dataInizioStr || sequenzaTurni.length === 0) return;

  const dataInizio = new Date(dataInizioStr + 'T00:00:00');
  const indiceIniziale = indiceInizialeForzato !== undefined
    ? ((indiceInizialeForzato % sequenzaTurni.length) + sequenzaTurni.length) % sequenzaTurni.length
    : 0;

  // Conto quanti giorni nell'intervallo hanno già un turno inserito, per chiedere conferma
  let giorniEsistenti = 0;
  for(let i = 0; i < numeroGiorni; i++){
    const d = new Date(dataInizio); d.setDate(d.getDate() + i);
    if(turni[dataISO(d)]) giorniEsistenti++;
  }
  const eseguiGenerazione = () => {
    for(let i = 0; i < numeroGiorni; i++){
      const d = new Date(dataInizio); d.setDate(d.getDate() + i);
      const iso = dataISO(d);
      const passo = sequenzaTurni[(indiceIniziale + i) % sequenzaTurni.length];
      if(passo.tipo === 'riposo'){
        turni[iso] = { data: iso, riposo: true, generatoAutomaticamente: true };
      } else {
        const oraInizio = passo.tipo === 'personalizzato' ? (passo.oraInizio || '') : MODELLI_TURNO[passo.tipo].oraInizio;
        const oraFine = passo.tipo === 'personalizzato' ? (passo.oraFine || '') : MODELLI_TURNO[passo.tipo].oraFine;
        if(!oraInizio || !oraFine) continue; // passo personalizzato incompleto: salta il giorno
        const extra = passo.extra || {};
        turni[iso] = {
          data: iso, riposo: false, assenzaTipo: null,
          oraInizio, oraFine, generatoAutomaticamente: true,
          servizioSvolto: extra.servizioSvolto || '',
          straordinarioPrimaInizio: extra.straordinarioProgrammato ? (extra.strPrimaInizio || '') : '',
          straordinarioPrimaFine: extra.straordinarioProgrammato ? (extra.strPrimaFine || '') : '',
          straordinarioDopoInizio: extra.straordinarioProgrammato ? (extra.strDopoInizio || '') : '',
          straordinarioDopoFine: extra.straordinarioProgrammato ? (extra.strDopoFine || '') : '',
          secondoAttivo: !!extra.secondoAttivo, secondoOraInizio: extra.secondoOraInizio || '', secondoOraFine: extra.secondoOraFine || '',
          reperibilita: !!extra.reperibilita, missione: !!extra.missione, servizioEsterno: !!extra.servizioEsterno,
          ordinePubblico: !!extra.ordinePubblico, controlloTerritorio: !!extra.controlloTerritorio, cambioTurno: false,
          buonoPasto: !!extra.buonoPasto
        };
      }
    }
    // L'ancora di rotazione si registra solo quando si genera "da zero" (indice 0),
    // così "Continua turnazione" può sempre calcolare la fase corretta rispetto a questo punto.
    if(indiceIniziale === 0){
      localStorage.setItem(CHIAVE_SEQUENZA_ANCORA, dataInizioStr);
    }
    // Registro sempre l'ultimo giorno effettivamente scritto: "Continua turnazione" riparte da qui + 1,
    // senza bisogno di calcolarlo o digitarlo a mano, e senza toccare i giorni già inseriti.
    const ultimoGiornoScritto = new Date(dataInizio); ultimoGiornoScritto.setDate(ultimoGiornoScritto.getDate() + numeroGiorni - 1);
    localStorage.setItem(CHIAVE_SEQUENZA_ULTIMO_GIORNO, dataISO(ultimoGiornoScritto));
    salvaTurniStorage();
    salvaSequenzaStorage();
    mostraScheda('turni');
    renderCalendario();
  };

  if(giorniEsistenti > 0){
    mostraConferma(
      `Attenzione: ${giorniEsistenti} giorno/i nell'intervallo scelto ${giorniEsistenti === 1 ? 'ha' : 'hanno'} già un turno inserito.\n` +
      `Generando la sequenza, ${giorniEsistenti === 1 ? 'verrà sovrascritto' : 'verranno sovrascritti'} e persi.\n\nContinuare comunque?`,
      eseguiGenerazione
    );
  } else {
    eseguiGenerazione();
  }
}

function continuaSequenzaTurni(){
  if(sequenzaTurni.length === 0) return;
  const ancoraStr = localStorage.getItem(CHIAVE_SEQUENZA_ANCORA);
  const ultimoGiornoStr = localStorage.getItem(CHIAVE_SEQUENZA_ULTIMO_GIORNO);
  if(!ancoraStr || !ultimoGiornoStr){
    mostraAvviso('Non c\'è ancora una turnazione generata da cui continuare: usa prima "Genera" per crearne una, poi potrai continuarla per altri giorni o mesi senza sfasare la rotazione.');
    return;
  }
  // Riparte automaticamente dal giorno subito dopo l'ultimo generato, senza toccare i giorni già inseriti
  const ultimoGiorno = new Date(ultimoGiornoStr + 'T00:00:00');
  const nuovoInizio = new Date(ultimoGiorno); nuovoInizio.setDate(nuovoInizio.getDate() + 1);
  const nuovoInizioStr = dataISO(nuovoInizio);
  el('campoSequenzaDataInizio').value = nuovoInizioStr;

  const ancora = new Date(ancoraStr + 'T00:00:00');
  const giorniTrascorsi = Math.round((nuovoInizio - ancora) / 86400000);
  const indiceIniziale = giorniTrascorsi % sequenzaTurni.length;
  generaSequenzaTurni(indiceIniziale);
}

function trovaAssenzaRecuperoFestivo(){
  return assenze.find(a => a.nome === 'Recupero festivo') || null;
}
function calcolaGiorniRecuperoFestivoAccumulati(){
  return Object.values(turni).filter(t => t.recuperoFestivoLavorato).length;
}

function trovaAssenzaRecuperoRiposo(){
  return assenze.find(a => a.nome === 'Recupero riposo') || null;
}
function calcolaGiorniRecuperoAccumulati(){
  return Object.values(turni).filter(t => t.compensazioneRiposo).length;
}

function calcolaOreCompensateAccumulate(){
  let totale = 0;
  for(const t of Object.values(turni)){
    if(t.riposo || t.assenzaTipo) continue;
    totale += classificaTurno(t).oreCompensate || 0;
  }
  return round2(totale);
}
function calcolaOreAssenzaUsate(assenzaId){
  let totale = 0;
  for(const t of Object.values(turni)){
    if(t.assenzaTipo !== assenzaId) continue;
    const f = finestraDaOrari(t.data, t.riposoCompensativoOraInizio, t.riposoCompensativoOraFine);
    totale += f.ore;
  }
  return round2(totale);
}

function contaGiorniUsatiAssenza(assenzaId){
  return Object.values(turni).filter(t => t.assenzaTipo === assenzaId).length;
}
function contaGiorniUsatiAssenzaNelMese(assenzaId, anno, mese){
  const prefisso = `${anno}-${String(mese + 1).padStart(2, '0')}-`;
  return Object.entries(turni).filter(([iso, t]) => iso.startsWith(prefisso) && t.assenzaTipo === assenzaId).length;
}
function contaGiorniUsatiAssenzaNelAnno(assenzaId, anno){
  const prefisso = `${anno}-`;
  return Object.entries(turni).filter(([iso, t]) => iso.startsWith(prefisso) && t.assenzaTipo === assenzaId).length;
}
function calcolaOreAssenzaUsateNelAnno(assenzaId, anno){
  const prefisso = `${anno}-`;
  let totale = 0;
  for(const [iso, t] of Object.entries(turni)){
    if(!iso.startsWith(prefisso) || t.assenzaTipo !== assenzaId) continue;
    totale += finestraDaOrari(t.data, t.riposoCompensativoOraInizio, t.riposoCompensativoOraFine).ore;
  }
  return round2(totale);
}
// Il permesso breve si può consumare in due modi: come assenza a giornata intera (assenzaTipo, come le altre
// assenze orarie) oppure come permesso parziale dentro un turno lavorato normalmente (campoPermessoBreveAttivo).
// Questa funzione somma entrambe le fonti per il saldo annuo.
// "Ore rimanenti" di Permesso breve: si scala SOLO quando si prende il permesso, e resta scalato
// per sempre — recuperare l'ora lavorandola in seguito non restituisce il "diritto" di prenderne altro,
// serve solo a non perdere la retribuzione di quell'ora (vedi calcolaOreDaRecuperareAnno/OreRecuperateAnno).
function calcolaOrePermessoBreveUsateAnno(anno){
  const voce = assenze.find(a => a.nome === 'Permesso breve');
  const idVoce = voce ? voce.id : null;
  const prefisso = `${anno}-`;
  let totale = 0;
  for(const [iso, t] of Object.entries(turni)){
    if(!iso.startsWith(prefisso)) continue;
    if(idVoce && t.assenzaTipo === idVoce){
      totale += finestraDaOrari(t.data, t.riposoCompensativoOraInizio, t.riposoCompensativoOraFine).ore;
    } else if(t.permessoBreveAttivo){
      totale += finestraDaOrari(t.data, t.permessoBreveOraInizio, t.permessoBreveOraFine).ore;
    }
  }
  return round2(totale);
}
// Ore di permesso breve prese ma non ancora recuperate lavorandole (debito residuo verso l'amministrazione).
function calcolaOreDaRecuperareAnno(anno){
  const prefisso = `${anno}-`;
  let prese = 0, recuperate = 0;
  for(const [iso, t] of Object.entries(turni)){
    if(!iso.startsWith(prefisso)) continue;
    if(t.permessoBreveAttivo) prese += finestraDaOrari(t.data, t.permessoBreveOraInizio, t.permessoBreveOraFine).ore;
    if(t.recuperoPermessoBreveAttivo) recuperate += finestraDaOrari(t.data, t.recuperoPermessoBreveOraInizio, t.recuperoPermessoBreveOraFine).ore;
  }
  return round2(Math.max(0, prese - recuperate));
}
// Ore di permesso breve già recuperate lavorandole (totale cumulativo dell'anno, non scala mai le ore rimanenti).
function calcolaOreRecuperateAnno(anno){
  const prefisso = `${anno}-`;
  let totale = 0;
  for(const [iso, t] of Object.entries(turni)){
    if(!iso.startsWith(prefisso)) continue;
    if(t.recuperoPermessoBreveAttivo) totale += finestraDaOrari(t.data, t.recuperoPermessoBreveOraInizio, t.recuperoPermessoBreveOraFine).ore;
  }
  return round2(totale);
}
// Congedo ordinario: i giorni non goduti al 31/12 si sommano allo spettante del nuovo anno (riporto).
// Uso l'anno più vecchio con turni salvati come base del calcolo: non conosciamo l'anno di assunzione reale,
// quindi il riporto viene ricostruito solo a partire da lì (limite noto, spiegato in app).
function calcolaSaldoCongedoOrdinario(anno){
  const voce = assenze.find(a => a.nome === 'Congedo ordinario');
  if(!voce) return { valoreEffettivo: 0, usate: 0, riporto: 0 };
  const anniConDati = Object.keys(turni).map(iso => Number(iso.slice(0, 4)));
  const primoAnno = anniConDati.length ? Math.min(anno, ...anniConDati) : anno;
  let riporto = 0;
  for(let y = primoAnno; y < anno; y++){
    riporto += voce.valore - contaGiorniUsatiAssenzaNelAnno(voce.id, y);
  }
  return { valoreEffettivo: round2(voce.valore + riporto), usate: contaGiorniUsatiAssenzaNelAnno(voce.id, anno), riporto: round2(riporto) };
}

// Elenco (FIFO) delle date di turni che hanno generato credito per una voce automatica (Recupero riposo/festivo)
// ancora disponibili: le prime date guadagnate sono considerate le prime consumate.
function elencoDateDisponibiliCredito(nomeVoce, campoFonte){
  const voce = assenze.find(a => a.nome === nomeVoce);
  if(!voce) return [];
  const dateGuadagnate = Object.entries(turni)
    .filter(([iso, t]) => t[campoFonte])
    .map(([iso]) => iso)
    .sort();
  const usate = contaGiorniUsatiAssenza(voce.id);
  return dateGuadagnate.slice(usate);
}
function formattaDataBreve(iso){
  const [a, m, g] = iso.split('-');
  return `${g}/${m}/${a}`;
}

function renderAssenze(){
  const box = el('corpoAssenze');
  const NOMI_ANNUALI_SEMPLICI = ['Congedo straordinario', 'Riposo legge', 'Donazione sangue', 'Ore studio', 'Permesso breve', 'Permesso sindacale'];
  box.innerHTML = assenze.map(a => {
    const eRiposoCompensativo = a.nome === 'Riposo compensativo';
    const eRecuperoRiposo = a.nome === 'Recupero riposo';
    const eRecuperoFestivo = a.nome === 'Recupero festivo';
    const eL104 = a.nome === 'L104';
    const eCongedoOrdinario = a.nome === 'Congedo ordinario';
    const eAnnualeSemplice = NOMI_ANNUALI_SEMPLICI.includes(a.nome);
    const automatica = eRiposoCompensativo || eRecuperoRiposo || eRecuperoFestivo;
    const unitaEffettiva = eRiposoCompensativo ? 'h' : a.unita;
    const saldoCO = eCongedoOrdinario ? calcolaSaldoCongedoOrdinario(annoCorrente) : null;
    const valoreEffettivo = eRiposoCompensativo ? calcolaOreCompensateAccumulate()
      : eRecuperoRiposo ? calcolaGiorniRecuperoAccumulati()
      : eRecuperoFestivo ? calcolaGiorniRecuperoFestivoAccumulati()
      : eCongedoOrdinario ? saldoCO.valoreEffettivo
      : a.valore;
    const usate = eCongedoOrdinario ? saldoCO.usate
      : unitaEffettiva === 'h' ? (a.nome === 'Permesso breve' ? calcolaOrePermessoBreveUsateAnno(annoCorrente) : eAnnualeSemplice ? calcolaOreAssenzaUsateNelAnno(a.id, annoCorrente) : calcolaOreAssenzaUsate(a.id))
      : eL104 ? contaGiorniUsatiAssenzaNelMese(a.id, annoCorrente, meseCorrente)
      : eAnnualeSemplice ? contaGiorniUsatiAssenzaNelAnno(a.id, annoCorrente)
      : contaGiorniUsatiAssenza(a.id);
    const rimangono = round2(valoreEffettivo - usate);
    const classeRimanenti = rimangono < 0 ? 'esaurito' : (rimangono === 0 ? 'zero' : 'positivo');

    // Congedo ordinario: i giorni riportati dall'anno prima si consumano per primi (FIFO)
    let dettaglioRiporto = '';
    if(eCongedoOrdinario && saldoCO.riporto !== 0){
      const poolVecchi = Math.max(0, saldoCO.riporto);
      const vecchiRimasti = round2(Math.max(0, poolVecchi - usate));
      const nuoviRimasti = round2(rimangono - vecchiRimasti);
      dettaglioRiporto = `<div class="riga-assenza-nota" style="margin-top:2px;"><span class="sotto-titolo" style="font-size:0.75rem;">di cui riportati dal ${annoCorrente - 1}: ${saldoCO.riporto} gg (${vecchiRimasti} ancora disponibili, consumati per primi) · spettanti ${annoCorrente}: ${a.valore} gg (${nuoviRimasti} disponibili)</span></div>`;
    }

    // Elenco a comparsa delle date che hanno generato credito, ancora disponibili (Recupero riposo/festivo)
    let elencoDate = '';
    if(eRecuperoRiposo || eRecuperoFestivo){
      const campoFonte = eRecuperoRiposo ? 'compensazioneRiposo' : 'recuperoFestivoLavorato';
      const dateDisponibili = elencoDateDisponibiliCredito(a.nome, campoFonte);
      elencoDate = `
      <div class="riga-assenza-nota" style="margin-top:2px;">
        <button type="button" class="btn-elenco-date" data-toggle-date="${a.id}">📅 ${dateDisponibili.length ? `Vedi le ${dateDisponibili.length} date disponibili` : 'Nessuna data disponibile'}</button>
      </div>
      <div class="lista-date-disponibili" data-lista-date="${a.id}" style="display:none;">${dateDisponibili.map(d => `<span class="chip-data">${formattaDataBreve(d)}</span>`).join('')}</div>`;
    }
    // Permesso breve: ore prese non toccano più le ore rimanenti col recupero — mostro separatamente
    // quanto resta da recuperare e quanto è già stato recuperato lavorandolo (due conteggi indipendenti).
    let dettaglioRecuperoPB = '';
    if(a.nome === 'Permesso breve'){
      const daRecuperare = calcolaOreDaRecuperareAnno(annoCorrente);
      const recuperate = calcolaOreRecuperateAnno(annoCorrente);
      if(daRecuperare > 0 || recuperate > 0){
        dettaglioRecuperoPB = `<div class="riga-assenza-nota" style="margin-top:2px;"><span class="sotto-titolo" style="font-size:0.75rem;">Ore da recuperare: ${daRecuperare} h · Ore recuperate nel ${annoCorrente}: ${recuperate} h</span></div>`;
      }
    }

    const etichettaUsate = eL104 ? `Usate a ${NOMI_MESI[meseCorrente]}: ${usate} ${unitaEffettiva}`
      : (eAnnualeSemplice || eCongedoOrdinario) ? `Usate nel ${annoCorrente}: ${usate} ${unitaEffettiva}`
      : `Usate: ${usate} ${unitaEffettiva}`;
    const notaRicarica = eL104 ? ' <span class="sotto-titolo" style="font-size:0.7rem;">(si ricarica ogni mese)</span>'
      : eCongedoOrdinario ? ' <span class="sotto-titolo" style="font-size:0.7rem;">(i giorni non goduti si sommano all\'anno nuovo)</span>'
      : eAnnualeSemplice ? ' <span class="sotto-titolo" style="font-size:0.7rem;">(si ricarica ogni anno, non si accumula)</span>'
      : '';
    return `
    <div class="riga-assenza" data-id="${a.id}">
      ${a.personalizzata
        ? `<input type="text" data-campo="nome" value="${a.nome}">`
        : `<span>${a.nome}${notaRicarica}</span>`}
      ${automatica
        ? `<span class="valore-automatico" style="padding:6px 9px; font-size:0.85rem;" title="${eRiposoCompensativo ? 'Calcolato in automatico dagli straordinari convertiti' : eRecuperoRiposo ? 'Calcolato in automatico dai giorni di riposo lavorato (richiamo)' : 'Calcolato in automatico dai giorni festivi lavorati'}">${valoreEffettivo} ${unitaEffettiva} auto</span>`
        : `<input type="number" data-campo="valore" value="${a.valore}" step="1" min="0">`}
      <select data-campo="unita" ${eRiposoCompensativo ? 'disabled' : ''}>
        <option value="gg" ${unitaEffettiva === 'gg' ? 'selected' : ''}>gg</option>
        <option value="h" ${unitaEffettiva === 'h' ? 'selected' : ''}>h</option>
      </select>
      ${a.personalizzata ? '<button class="riga-rimuovi" type="button" title="Rimuovi">✕</button>' : '<span></span>'}
      <div class="riga-assenza-nota">
        <span class="assenza-usate">${etichettaUsate}</span>
        <span class="assenza-rimanenti ${classeRimanenti}">${rimangono < 0 ? '⚠ ' : ''}${rimangono} ${unitaEffettiva} rimanenti</span>
        <span class="indicatore-salvato">✓ Salvato</span>
      </div>
      ${dettaglioRiporto}
      ${dettaglioRecuperoPB}
      ${elencoDate}
    </div>`;
  }).join('');

  box.querySelectorAll('[data-toggle-date]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lista = box.querySelector(`[data-lista-date="${btn.dataset.toggleDate}"]`);
      if(lista) lista.style.display = lista.style.display === 'none' ? '' : 'none';
    });
  });

  box.querySelectorAll('.riga-assenza').forEach(riga => {
    const id = riga.dataset.id;
    const voce = assenze.find(a => a.id === id);
    riga.querySelectorAll('input, select').forEach(campo => {
      campo.addEventListener('input', () => {
        if(campo.dataset.campo === 'valore') voce.valore = Number(campo.value) || 0;
        else voce[campo.dataset.campo] = campo.value;
        salvaAssenzeStorage();
        const usate = contaGiorniUsatiAssenza(voce.id);
        const rimangono = round2(voce.valore - usate);
        const classeRimanenti = rimangono < 0 ? 'esaurito' : (rimangono === 0 ? 'zero' : 'positivo');
        riga.querySelector('.assenza-usate').textContent = `Usate: ${usate} ${voce.unita}`;
        const spanRim = riga.querySelector('.assenza-rimanenti');
        spanRim.className = `assenza-rimanenti ${classeRimanenti}`;
        spanRim.textContent = `${rimangono < 0 ? '⚠ ' : ''}${rimangono} ${voce.unita} rimanenti`;
        const indicatore = riga.querySelector('.indicatore-salvato');
        indicatore.classList.add('visibile');
        clearTimeout(indicatore._timeoutSalvato);
        indicatore._timeoutSalvato = setTimeout(() => indicatore.classList.remove('visibile'), 1300);
      });
    });
    const btnRimuovi = riga.querySelector('.riga-rimuovi');
    if(btnRimuovi){
      btnRimuovi.addEventListener('click', () => {
        assenze = assenze.filter(a => a.id !== id);
        salvaAssenzeStorage();
        renderAssenze();
      });
    }
  });
}

/* ---------------------------------------------------------
   UI — CEDOLINO SIMULATO
   --------------------------------------------------------- */
function renderCedolino(){
  const c = generaCedolino(annoCorrente, meseCorrente);
  const box = el('contenitoreCedolino');
  const riga = (nome, val, sottr=false) => `<div class="cedolino-riga${sottr?' sottrazione':''}"><span>${nome}</span><span>${sottr?'− ':''}${euro(val)}</span></div>`;

  box.innerHTML = `
    <div class="timbro-simulazione">Simulazione<br>Non Ufficiale</div>
    <div class="cedolino-sezione">
      <h4>Competenze Fisse — ${c.comp.qualifica}</h4>
      ${riga('Stipendio Tabellare (incl. IIS conglobata)', c.comp.fisse.stipendioTabellare)}
      ${c.comp.fisse.iis > 0 ? riga('IIS', c.comp.fisse.iis) : ''}
      ${riga('Indennità Pensionabile', c.comp.fisse.indennitaPensionabile)}
      ${riga('Assegno Funzionale', c.comp.fisse.assegnoFunzione)}
      ${c.comp.fisse.tredicesima ? riga('Tredicesima Mensilità', c.comp.fisse.tredicesima) : ''}
      <div class="cedolino-totale"><span>Totale Competenze Fisse</span><span>${euro(c.comp.totaleFisse)}</span></div>
    </div>
    <div class="cedolino-sezione">
      <h4>Competenze Accessorie (da turni classificati automaticamente)</h4>
      ${riga(`Straordinario Diurno (${c.comp.tot.strDiurno} h)`, c.comp.accessorie.strDiurno)}
      ${riga(`Straordinario Notturno (${c.comp.tot.strNotturno} h)`, c.comp.accessorie.strNotturno)}
      ${riga(`Straordinario Festivo (${c.comp.tot.strFestivo} h)`, c.comp.accessorie.strFestivo)}
      ${riga(`Straordinario Notturno Festivo (${c.comp.tot.strNotturnoFestivo} h)`, c.comp.accessorie.strNotturnoFestivo)}
      ${riga(`Ind. Turno Notturno (${c.comp.tot.notturne} h)`, c.comp.accessorie.indTurnoNotturno)}
      ${riga('Ind. Festiva/Domenicale', c.comp.accessorie.indFestiva)}
      ${c.comp.accessorie.indFestivitaParticolare ? riga('Ind. Festività Particolari', c.comp.accessorie.indFestivitaParticolare) : ''}
      ${riga('Ind. Ordine Pubblico', c.comp.accessorie.indOP)}
      ${riga('Ind. Servizi Esterni', c.comp.accessorie.indServizioEsterno)}
      ${riga('Ind. Controllo Territorio', c.comp.accessorie.indControlloTerritorio)}
      ${riga('Reperibilità', c.comp.accessorie.indReperibilita)}
      ${riga('Missioni', c.comp.accessorie.indMissioni)}
      ${riga('Compensazione Riposo Lavorato', c.comp.accessorie.indCompensazioneRiposo)}
      ${riga('Cambio Turno', c.comp.accessorie.indCambioTurno)}
      ${c.comp.accessorie.indProduttivitaCollettiva > 0 ? riga(`Produttività Collettiva (anno ${annoCorrente - 1}, liquidata a luglio)`, c.comp.accessorie.indProduttivitaCollettiva) : ''}
      <div class="cedolino-totale"><span>Totale Competenze Accessorie</span><span>${euro(c.comp.totaleAccessorie)}</span></div>
    </div>
    <div class="cedolino-sezione">
      <div class="cedolino-totale"><span>TOTALE LORDO</span><span>${euro(c.comp.totaleLordo)}</span></div>
    </div>
    <div class="cedolino-sezione">
      <h4>Ritenute e Fiscalità</h4>
      ${riga('Imponibile Previdenziale', c.imponibilePrevidenziale)}
      ${riga('Contributi', c.contributi, true)}
      ${riga('Imponibile Fiscale', c.imponibileFiscaleTotale)}
      ${riga('IRPEF', c.irpefTotale, true)}
      ${riga('Detrazioni Lavoro Dipendente', c.detrazioniLavoro)}
      ${c.detrazioniFamiliari ? riga('Detrazioni Familiari (coniuge/figli)', c.detrazioniFamiliari) : ''}
      ${riga('Trattamento Integrativo', c.trattamentoIntegrativo)}
      ${riga(`Addizionali Regionale (${c.aliqRegionale.toFixed(2)}%)/Comunale (${c.aliqComunale.toFixed(2)}%)`, c.addizionali, true)}
      ${riga('Quota Sindacale', c.sindacato, true)}
      ${riga('Conguagli', c.conguagli)}
    </div>
    <div class="cedolino-netto">
      <div class="etichetta">Netto in Busta (stimato)</div>
      <div class="valore">${euro(c.netto)}</div>
    </div>`;
  box.hidden = false;
  el('btnStampaCedolino').hidden = false;
  el('btnNascondiCedolino').hidden = false;

  // Archivio nello storico mensile
  storico[chiaveMese(annoCorrente, meseCorrente)] = { totaleLordo: c.comp.totaleLordo, netto: c.netto };
  salvaStoricoStorage();
  renderStorico();
}

function renderAccreditoConto(){
  const a = generaAccreditoConto(annoCorrente, meseCorrente);
  const box = el('contenitoreAccreditoConto');
  const riga = (nome, val, sottr=false) => `<div class="cedolino-riga${sottr?' sottrazione':''}"><span>${nome}</span><span>${sottr?'− ':''}${euro(val)}</span></div>`;

  box.innerHTML = `
    <div class="timbro-simulazione">Simulazione<br>Non Ufficiale</div>
    <div class="cedolino-sezione">
      <h4>Accredito stimato — ${NOMI_MESI[meseCorrente]} ${annoCorrente}</h4>
      ${riga(`Stipendio base (competenza ${NOMI_MESI[a.meseFisse]} ${a.annoFisse})`, a.fisseBase)}
      ${a.tredicesimaAccredito ? riga('Tredicesima Mensilità', a.tredicesimaAccredito) : ''}
      ${riga(`Indennità accessorie (competenza ${NOMI_MESI[a.meseAccessorie]} ${a.annoAccessorie})`, a.accessorieLorde)}
    </div>
    <div class="cedolino-sezione">
      <h4>Trattenute (stimate sul totale accreditato)</h4>
      ${riga('Contributi Previdenziali', a.contributi, true)}
      ${riga('IRPEF Netta', a.irpefTotale, true)}
      ${riga('Detrazioni', a.detrazioni)}
      ${a.trattamentoIntegrativo ? riga('Trattamento Integrativo', a.trattamentoIntegrativo) : ''}
      ${riga(`Addizionali Regionale/Comunale`, a.addizionali, true)}
      ${a.sindacato ? riga('Quota Sindacale', a.sindacato, true) : ''}
    </div>
    <div class="cedolino-netto">
      <div class="etichetta">Netto Stimato in Arrivo sul Conto</div>
      <div class="valore">${euro(a.netto)}</div>
    </div>`;
  box.hidden = false;
  el('btnCancellaAccreditoConto').hidden = false;
}


function renderStorico(){
  const tbody = document.querySelector('#tabellaStorico tbody');
  const chiavi = Object.keys(storico).sort();
  if(chiavi.length === 0){
    tbody.innerHTML = '<tr><td colspan="3" class="sotto-titolo">Nessun cedolino generato finora.</td></tr>';
    return;
  }
  tbody.innerHTML = chiavi.map(k => {
    const [anno, mese] = k.split('-').map(Number);
    const voce = storico[k];
    return `<tr><td>${NOMI_MESI[mese - 1]} ${anno}</td><td class="totale-riga">${euro(voce.totaleLordo)}</td><td class="totale-riga">${euro(voce.netto)}</td></tr>`;
  }).join('');
}

function cancellaStorico(){
  const numVoci = Object.keys(storico).length;
  if(numVoci === 0){
    mostraAvviso('Lo storico è già vuoto, non c\'è nulla da cancellare.');
    return;
  }
  mostraConferma(
    `Stai per cancellare lo storico di ${numVoci} mese/i generati.\nL'operazione non è reversibile. Continuare?`,
    () => {
      storico = {};
      salvaStoricoStorage();
      renderStorico();
    }
  );
}
function euro(n){
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString('it-IT', { minimumFractionDigits:2, maximumFractionDigits:2 }) + ' €';
}

function renderRiepilogoAnnuale(anno){
  const tot = { ordinarie:0, notturne:0, festive:0, domenicali:0, notturneFestive:0, strDiurno:0, strNotturno:0, strFestivo:0, strNotturnoFestivo:0 };
  for(let m = 0; m < 12; m++){
    const { tot: totMese } = calcolaRiepilogoOreMese(anno, m);
    for(const k of Object.keys(tot)) tot[k] += totMese[k] || 0;
  }

  let totaleLordoAnno = 0, totaleNettoAnno = 0, mesiInclusi = 0;
  for(let m = 0; m < 12; m++){
    const voce = storico[chiaveMese(anno, m)];
    if(voce){ totaleLordoAnno += voce.totaleLordo; totaleNettoAnno += voce.netto; mesiInclusi++; }
  }

  el('raOrdinarie').textContent = round2(tot.ordinarie).toLocaleString('it-IT', {minimumFractionDigits:2});
  el('raNotturne').textContent = round2(tot.notturne).toLocaleString('it-IT', {minimumFractionDigits:2});
  el('raFestive').textContent = round2(tot.festive).toLocaleString('it-IT', {minimumFractionDigits:2});
  el('raDomenicali').textContent = round2(tot.domenicali).toLocaleString('it-IT', {minimumFractionDigits:2});
  el('raNotturneFestive').textContent = round2(tot.notturneFestive).toLocaleString('it-IT', {minimumFractionDigits:2});
  el('raStrDiurno').textContent = round2(tot.strDiurno).toLocaleString('it-IT', {minimumFractionDigits:2});
  el('raStrNotturno').textContent = round2(tot.strNotturno).toLocaleString('it-IT', {minimumFractionDigits:2});
  el('raStrFestivo').textContent = round2(tot.strFestivo).toLocaleString('it-IT', {minimumFractionDigits:2});
  el('raStrNotturnoFestivo').textContent = round2(tot.strNotturnoFestivo).toLocaleString('it-IT', {minimumFractionDigits:2});
  el('raTotaleLordo').textContent = euro(round2(totaleLordoAnno));
  el('raTotaleNetto').textContent = euro(round2(totaleNettoAnno));
  el('raMesiLordo').textContent = `(${mesiInclusi}/12 mesi generati)`;
  el('contenitoreRiepilogoAnnuale').hidden = false;
  el('btnCancellaRiepilogoAnnuale').hidden = false;
}

const el = id => document.getElementById(id);
function escapeHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
const NOMI_MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

function renderCalendario(){
  el('etichettaMese').textContent = `${NOMI_MESI[meseCorrente]} ${annoCorrente}`;
  el('campoConguagliMese').value = conguagliPerMese[chiaveMese(annoCorrente, meseCorrente)] || 0;
  const griglia = el('calendarioGriglia');
  griglia.innerHTML = '';

  const isoOggi = dataISO(new Date());
  const primoGiorno = new Date(annoCorrente, meseCorrente, 1);
  const giorniNelMese = new Date(annoCorrente, meseCorrente + 1, 0).getDate();
  // getDay(): 0=domenica..6=sabato → convertiamo a settimana che inizia lunedì (0=lunedì..6=domenica)
  const offset = (primoGiorno.getDay() + 6) % 7;

  for(let i = 0; i < offset; i++){
    const vuota = document.createElement('div');
    vuota.className = 'giorno-cella vuota';
    griglia.appendChild(vuota);
  }

  for(let g = 1; g <= giorniNelMese; g++){
    const d = new Date(annoCorrente, meseCorrente, g);
    const iso = dataISO(d);
    const t = turni[iso];
    const sabato = d.getDay() === 6;
    const cella = document.createElement('div');
    let classi = 'giorno-cella';
    let categoria = null;
    if(sabato) classi += ' sabato';
    if(eFestivoOdDomenica(iso)) classi += ' festivo';
    if(t && t.riposo){
      classi += ' tipo-riposo';
      categoria = 'riposo';
    } else if(t && t.assenzaTipo){
      classi += ' riposo-giorno tipo-assenza';
    } else if(t && t.oraInizio && t.oraFine){
      categoria = categoriaTurno(t.oraInizio, t.oraFine, t.data);
      classi += ' ha-turno tipo-' + categoria;
    }
    if(t && t.generatoAutomaticamente) classi += ' auto-generato';
    if(iso === isoOggi) classi += ' oggi';
    if(iso === giornoSelezionato) classi += ' selezionata';
    cella.className = classi;
    if(t && t.assenzaTipo){
      const voceAssenza = assenze.find(a => a.id === t.assenzaTipo);
      if(voceAssenza) cella.title = voceAssenza.nome;
    } else if(t && t.servizioSvolto) cella.title = t.servizioSvolto;
    let etichetta = categoria ? INIZIALE_CATEGORIA[categoria] : '';
    if(t && t.aggiornamentoProfessionale) etichetta = 'AGG';
    else if(t && t.addestramentoTiro) etichetta = 'TIRI';
    if(t && t.assenzaTipo){
      const voceAssenza = assenze.find(a => a.id === t.assenzaTipo);
      if(voceAssenza) etichetta = siglaAssenza(voceAssenza.nome);
    }
    const haServizioSvolto = t && t.servizioSvolto && !t.riposo && !t.assenzaTipo;
    cella.innerHTML = `<span class="giorno-numero">${g}</span>${etichetta ? `<span class="giorno-etichetta">${etichetta}</span>` : ''}${haServizioSvolto ? '<span class="giorno-servizio-marcatore" title="Servizio annotato">✎</span>' : ''}`;
    cella.addEventListener('click', () => selezionaGiorno(iso));
    griglia.appendChild(cella);
  }

  if(!giornoSelezionato || giornoSelezionato.slice(0,7) !== `${annoCorrente}-${String(meseCorrente+1).padStart(2,'0')}`){
    // se non c'è ancora una selezione nel mese visualizzato, seleziona il primo giorno
    giornoSelezionato = dataISO(new Date(annoCorrente, meseCorrente, 1));
  }
  aggiornaDettaglioGiorno();
  aggiornaRiepilogoMensile();
}

function calcolaIndennitaMissioneOre(ore){
  if(ore <= 4) return 0;
  if(ore <= 8) return round2(ore * tabelle.indennitaTrasfertaOraria);
  return round2(ore * tabelle.indennitaTrasfertaOrariaRidotta); // oltre 8h: tariffa ridotta al 40%
}

function calcolaRiepilogoOreMese(anno, mese){
  const tot = { ordinarie:0, notturne:0, festive:0, domenicali:0, notturneFestive:0, strDiurno:0, strNotturno:0, strFestivo:0, strNotturnoFestivo:0 };
  let riposi = 0, reperibilita = 0, missioni = 0, servizioEsterno = 0, ordinePubblico = 0, buoniPasto = 0, indennitaOPTotale = 0, oreCompensateTotale = 0;
  let giorniControlloTerritorioSerali = 0, giorniControlloTerritorioNotturni = 0, indennitaMissioniTotale = 0, turniServizioEsternoValidi = 0, turniFestiviLavorati = 0, turniFestivitaParticolare = 0, turniCompensazioneRiposo = 0, turniCambioTurno = 0, giorniPresenzaEffettiva = 0;
  const giorniNelMese = new Date(anno, mese + 1, 0).getDate();
  for(let g = 1; g <= giorniNelMese; g++){
    const iso = dataISO(new Date(anno, mese, g));
    const t = turni[iso];
    if(!t) continue;
    if(t.riposo){ riposi++; continue; }
    // Un giorno con un'assenza selezionata (es. Congedo ordinario) non genera nessuna indennità accessoria,
    // anche se sono rimaste spuntate delle voci da quando il giorno era un turno lavorato normale
    // (es. inserito prima con la sequenza automatica, poi convertito in assenza).
    if(t.assenzaTipo) continue;
    const c = classificaTurno(t);
    for(const k of Object.keys(tot)) tot[k] += c[k] || 0;
    oreCompensateTotale += c.oreCompensate || 0;
    if(t.reperibilita) reperibilita++;
    if(t.missione){
      missioni++;
      const oreMissione = Number(t.durataMissioneOre) || c.oreTotali || 0;
      indennitaMissioniTotale += calcolaIndennitaMissioneOre(oreMissione);
    }
    if(t.servizioEsterno){
      servizioEsterno++;
      if((c.oreTotali || 0) >= 3) turniServizioEsternoValidi++; // richiede almeno 3 ore continuative
    }
    if(t.ordinePubblico){
      ordinePubblico++;
      if((c.oreTotali || 0) >= 4){
        let importoOP = t.opSede === 'fuori' ? tabelle.indennitaOPFuoriSede : tabelle.indennitaOPInSede;
        if(t.opSede === 'fuori' && t.opPernottamento === false){
          importoOP = round2(importoOP * (1 - tabelle.riduzioneOPSenzaPernottamento / 100));
        }
        indennitaOPTotale += importoOP;
      }
    }
    if(t.buonoPasto) buoniPasto++;
    if(t.compensazioneRiposo) turniCompensazioneRiposo++;
    if(t.cambioTurno) turniCambioTurno++;
    if(t.oraInizio && t.oraFine && !t.assenzaTipo) giorniPresenzaEffettiva++;
    if((c.festive || 0) + (c.domenicali || 0) + (c.notturneFestive || 0) > 0) turniFestiviLavorati++;
    if(eFestivoFisso(t.data) && (c.oreTotali || 0) > 0) turniFestivitaParticolare++;
    // Indennità controllo territorio: serve almeno 3h continuative nella fascia, e NON è cumulabile con l'ordine pubblico
    // (fonte: normativa citata dall'utente — D.Lgs./contratto recepito con D.P.C.M. 2022 n.57, in vigore dal 31/12/2021)
    if(t.controlloTerritorio && !t.ordinePubblico){
      const oreSerali = c.serali || 0, oreNotturne = c.notturne || 0;
      if(oreSerali < 3 && oreNotturne < 3){ /* meno di 3h continuative in entrambe le fasce: nessuna indennità */ }
      else if(oreNotturne > oreSerali) giorniControlloTerritorioNotturni++;
      else giorniControlloTerritorioSerali++; // fascia serale prevalente, o parità
    }
  }
  return { tot, riposi, reperibilita, missioni, servizioEsterno, ordinePubblico, buoniPasto, turniServizioEsternoValidi, turniFestiviLavorati, turniFestivitaParticolare, turniCompensazioneRiposo, turniCambioTurno, giorniPresenzaEffettiva, oreCompensateTotale: round2(oreCompensateTotale),
    giorniControlloTerritorioSerali, giorniControlloTerritorioNotturni, indennitaMissioniTotale: round2(indennitaMissioniTotale),
    indennitaOPTotale: round2(indennitaOPTotale) };
}

function aggiornaRiepilogoMensile(){
  const { tot, riposi, reperibilita, missioni, servizioEsterno, ordinePubblico, buoniPasto, giorniControlloTerritorioSerali, giorniControlloTerritorioNotturni, oreCompensateTotale } = calcolaRiepilogoOreMese(annoCorrente, meseCorrente);

  el('rOrdinarie').textContent = round2(tot.ordinarie).toLocaleString('it-IT', {minimumFractionDigits:2});
  el('rNotturne').textContent = round2(tot.notturne).toLocaleString('it-IT', {minimumFractionDigits:2});
  el('rFestive').textContent = round2(tot.festive).toLocaleString('it-IT', {minimumFractionDigits:2});
  el('rDomenicali').textContent = round2(tot.domenicali).toLocaleString('it-IT', {minimumFractionDigits:2});
  el('rNotturneFestive').textContent = round2(tot.notturneFestive).toLocaleString('it-IT', {minimumFractionDigits:2});
  el('rStrDiurno').textContent = round2(tot.strDiurno).toLocaleString('it-IT', {minimumFractionDigits:2});
  el('rStrNotturno').textContent = round2(tot.strNotturno).toLocaleString('it-IT', {minimumFractionDigits:2});
  el('rStrFestivo').textContent = round2(tot.strFestivo).toLocaleString('it-IT', {minimumFractionDigits:2});
  el('rStrNotturnoFestivo').textContent = round2(tot.strNotturnoFestivo).toLocaleString('it-IT', {minimumFractionDigits:2});
  el('rRiposi').textContent = riposi;
  el('rReperibilita').textContent = reperibilita;
  el('rMissioni').textContent = missioni;
  el('rServizioEsterno').textContent = servizioEsterno;
  el('rOrdinePubblico').textContent = ordinePubblico;
  el('rControlloTerritorio').textContent = `${giorniControlloTerritorioSerali} serale · ${giorniControlloTerritorioNotturni} notturno`;
  el('rBuoniPasto').textContent = `${buoniPasto} (${euro(round2(buoniPasto * tabelle.buonoPastoValore))})`;
  el('rOreCompensate').textContent = round2(oreCompensateTotale).toLocaleString('it-IT', {minimumFractionDigits:2});
}

/* ---------------------------------------------------------
   UI — MODALE TURNO
   --------------------------------------------------------- */
const NOMI_GIORNI = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];

function selezionaGiorno(iso){
  giornoSelezionato = iso;
  // aggiorna solo le classi di selezione, senza ricostruire l'intera griglia
  document.querySelectorAll('#calendarioGriglia .giorno-cella').forEach(c => c.classList.remove('selezionata'));
  const celle = document.querySelectorAll('#calendarioGriglia .giorno-cella:not(.vuota)');
  const cellaTrovata = [...celle].find(c => c.querySelector('.giorno-numero').textContent === String(Number(iso.slice(8,10))));
  if(cellaTrovata) cellaTrovata.classList.add('selezionata');
  aggiornaDettaglioGiorno();
}

function aggiornaDettaglioGiorno(){
  if(!giornoSelezionato) return;
  const d = new Date(giornoSelezionato + 'T00:00:00');
  el('dettaglioGiornoTitolo').textContent = `${NOMI_GIORNI[d.getDay()]} ${d.getDate()} ${NOMI_MESI[d.getMonth()]} ${d.getFullYear()}`;
  const t = turni[giornoSelezionato];
  const corpo = el('dettaglioGiornoCorpo');
  if(!t){
    corpo.textContent = 'Nessun turno inserito — premi + per aggiungerlo.';
  } else if(t.assenzaTipo){
    const voceAssenza = assenze.find(a => a.id === t.assenzaTipo);
    corpo.textContent = `Assenza: ${voceAssenza ? voceAssenza.nome : 'voce eliminata'}`;
  } else if(t.riposo){
    corpo.textContent = 'Giorno di riposo.';
  } else if(t.oraInizio && t.oraFine){
    const c = classificaTurno(t);
    const haStraordinario = c.strDiurno > 0 || c.strNotturno > 0 || c.strFestivo > 0 || c.strNotturnoFestivo > 0;
    const oraStrPrima = (t.straordinarioPrimaInizio && t.straordinarioPrimaFine)
      ? `<span class="dettaglio-orario-straordinario"> · straordinario prima ${t.straordinarioPrimaInizio}–${t.straordinarioPrimaFine}</span>` : '';
    const oraStrDopo = (t.straordinarioDopoInizio && t.straordinarioDopoFine)
      ? `<span class="dettaglio-orario-straordinario"> · straordinario dopo ${t.straordinarioDopoInizio}–${t.straordinarioDopoFine}</span>` : '';
    corpo.innerHTML =
      `<div class="dettaglio-riga-orario">${t.oraInizio} – ${t.oraFine}${oraStrPrima}${oraStrDopo}</div>` +
      (t.servizioSvolto ? `<div class="dettaglio-servizio-svolto">✎ ${escapeHtml(t.servizioSvolto)}</div>` : '') +
      `<div class="dettaglio-riga-ore">Ore totali: ${c.oreTotali} (ordinarie ${c.ordinarie}, notturne ${c.notturne}, festive ${c.festive}, domenicali ${c.domenicali}, notturne festive ${c.notturneFestive})</div>` +
      (haStraordinario ? `<div class="dettaglio-riga-ore" style="font-weight:700;">Ore straordinario: diurno ${c.strDiurno}, notturno ${c.strNotturno}, festivo ${c.strFestivo}, notturno festivo ${c.strNotturnoFestivo}</div>` : '');
  } else {
    corpo.textContent = 'Turno incompleto — premi + per completarlo.';
  }
  el('btnCopiaTurno').disabled = !t;
  el('btnIncollaTurno').disabled = !turnoCopiato;
  el('campoNotaGiorno').value = noteGiorni[giornoSelezionato] || '';
}

function apriModaleTurno(iso){
  giornoSelezionato = iso;
  const t = turni[iso] || {};
  el('titoloModaleTurno').textContent = 'Turno del ' + iso.split('-').reverse().join('/');
  el('campoModelloTurno').value = '';
  el('campoRiposo').checked = !!t.riposo;
  popolaSelectAssenze();
  el('campoAssenzaTipo').value = t.assenzaTipo || '';
  el('campoRCOraInizio').value = t.riposoCompensativoOraInizio || '';
  el('campoRCOraFine').value = t.riposoCompensativoOraFine || '';
  el('campoOraInizio').value = t.oraInizio || '';
  el('campoOraFine').value = t.oraFine || '';
  el('campoServizioSvolto').value = t.servizioSvolto || '';
  el('campoStrPrimaInizio').value = t.straordinarioPrimaInizio || '';
  el('campoStrPrimaFine').value = t.straordinarioPrimaFine || '';
  el('campoStrDopoInizio').value = t.straordinarioDopoInizio || '';
  el('campoStrDopoFine').value = t.straordinarioDopoFine || '';
  el('campoCompensaStraordinario').checked = !!t.compensaStraordinario;
  el('campoPermessoBreveAttivo').checked = !!t.permessoBreveAttivo;
  el('campoPermessoBreveInizio').value = t.permessoBreveOraInizio || '';
  el('campoPermessoBreveFine').value = t.permessoBreveOraFine || '';
  el('campiPermessoBreve').style.display = t.permessoBreveAttivo ? '' : 'none';
  el('campoRecuperoPermessoBreveAttivo').checked = !!t.recuperoPermessoBreveAttivo;
  el('campoRecuperoPermessoBreveInizio').value = t.recuperoPermessoBreveOraInizio || '';
  el('campoRecuperoPermessoBreveFine').value = t.recuperoPermessoBreveOraFine || '';
  el('campiRecuperoPermessoBreve').style.display = t.recuperoPermessoBreveAttivo ? '' : 'none';
  el('campoSecondoAttivo').checked = !!t.secondoAttivo;
  el('campoSecondoOraInizio').value = t.secondoOraInizio || '';
  el('campoSecondoOraFine').value = t.secondoOraFine || '';
  el('campiSecondoSegmento').style.display = t.secondoAttivo ? '' : 'none';
  el('campoReperibilita').checked = !!t.reperibilita;
  el('campoMissione').checked = !!t.missione;
  el('campoDurataMissione').value = t.durataMissioneOre || 0;
  el('campoDurataMissioneBox').style.display = t.missione ? '' : 'none';
  el('campoServizioEsterno').checked = !!t.servizioEsterno;
  el('campoOrdinePubblico').checked = !!t.ordinePubblico;
  el('campoOPSede').value = t.opSede || 'in';
  el('campoOPPernottamento').checked = t.opPernottamento !== false;
  el('campoOrdinePubblicoBox').style.display = t.ordinePubblico ? '' : 'none';
  el('campoOPPernottamentoBox').style.display = (t.ordinePubblico && t.opSede === 'fuori') ? '' : 'none';
  el('campoControlloTerritorio').checked = !!t.controlloTerritorio;
  el('campoCambioTurno').checked = !!t.cambioTurno;
  el('campoCompensazioneRiposo').checked = !!t.compensazioneRiposo;
  el('campoRecuperoFestivo').checked = !!t.recuperoFestivoLavorato;
  el('campoBuonoPasto').checked = !!t.buonoPasto;
  el('campoAggiornamentoProfessionale').checked = !!t.aggiornamentoProfessionale;
  el('campoAddestramentoTiro').checked = !!t.addestramentoTiro;
  aggiornaVisibilitaCampiOrario();
  aggiornaAnteprima();
  el('pannelloTurno').hidden = false;
  el('pannelloTurno').scrollIntoView({ behavior:'smooth', block:'start' });
}

function popolaSelectAssenze(){
  const sel = el('campoAssenzaTipo');
  const valorePrecedente = sel.value;
  // Permesso breve ha una sua modalità dedicata dentro il turno (dalle-alle), non va più selezionato qui come assenza a giornata intera
  sel.innerHTML = '<option value="">— nessuna (turno di lavoro o riposo) —</option>' +
    assenze.filter(a => a.nome !== 'Permesso breve').map(a => `<option value="${a.id}">${a.nome} (${a.unita})</option>`).join('');
  sel.value = valorePrecedente;
}

function aggiornaVisibilitaCampiOrario(){
  const assente = el('campoRiposo').checked || !!el('campoAssenzaTipo').value;
  el('campiOrario').style.display = assente ? 'none' : '';
  const voceSelezionata = assenze.find(a => a.id === el('campoAssenzaTipo').value);
  const eOraria = voceSelezionata && voceSelezionata.unita === 'h';
  el('campiRiposoCompensativo').style.display = eOraria ? '' : 'none';
}

function leggiTurnoDalModale(){
  return {
    data: giornoSelezionato,
    riposo: el('campoRiposo').checked,
    assenzaTipo: el('campoAssenzaTipo').value || null,
    riposoCompensativoOraInizio: el('campoRCOraInizio').value,
    riposoCompensativoOraFine: el('campoRCOraFine').value,
    oraInizio: el('campoOraInizio').value,
    oraFine: el('campoOraFine').value,
    servizioSvolto: el('campoServizioSvolto').value,
    straordinarioPrimaInizio: el('campoStrPrimaInizio').value,
    straordinarioPrimaFine: el('campoStrPrimaFine').value,
    straordinarioDopoInizio: el('campoStrDopoInizio').value,
    straordinarioDopoFine: el('campoStrDopoFine').value,
    compensaStraordinario: el('campoCompensaStraordinario').checked,
    permessoBreveAttivo: el('campoPermessoBreveAttivo').checked,
    permessoBreveOraInizio: el('campoPermessoBreveInizio').value,
    permessoBreveOraFine: el('campoPermessoBreveFine').value,
    recuperoPermessoBreveAttivo: el('campoRecuperoPermessoBreveAttivo').checked,
    recuperoPermessoBreveOraInizio: el('campoRecuperoPermessoBreveInizio').value,
    recuperoPermessoBreveOraFine: el('campoRecuperoPermessoBreveFine').value,
    secondoAttivo: el('campoSecondoAttivo').checked,
    secondoOraInizio: el('campoSecondoOraInizio').value,
    secondoOraFine: el('campoSecondoOraFine').value,
    reperibilita: el('campoReperibilita').checked,
    missione: el('campoMissione').checked,
    durataMissioneOre: Number(el('campoDurataMissione').value) || 0,
    servizioEsterno: el('campoServizioEsterno').checked,
    ordinePubblico: el('campoOrdinePubblico').checked,
    opSede: el('campoOPSede').value,
    opPernottamento: el('campoOPPernottamento').checked,
    controlloTerritorio: el('campoControlloTerritorio').checked,
    cambioTurno: el('campoCambioTurno').checked,
    compensazioneRiposo: el('campoCompensazioneRiposo').checked,
    recuperoFestivoLavorato: el('campoRecuperoFestivo').checked,
    buonoPasto: el('campoBuonoPasto').checked,
    aggiornamentoProfessionale: el('campoAggiornamentoProfessionale').checked,
    addestramentoTiro: el('campoAddestramentoTiro').checked
  };
}

function aggiornaAnteprima(){
  const t = leggiTurnoDalModale();
  const box = el('anteprimaClassificazione');
  const boxStr = el('anteprimaStraordinario');
  const boxRC = el('anteprimaRiposoCompensativo');
  if(boxRC){
    const voceSel = assenze.find(a => a.id === t.assenzaTipo);
    if(voceSel && voceSel.unita === 'h'){
      const f = finestraDaOrari(t.data || dataISO(new Date()), t.riposoCompensativoOraInizio, t.riposoCompensativoOraFine);
      if(f.ore > 0){
        const eRC = voceSel.nome === 'Riposo compensativo';
        const totaleDisponibile = eRC ? calcolaOreCompensateAccumulate() : voceSel.valore;
        const oreStessoGiornoAltrove = (giornoSelezionato && turni[giornoSelezionato] && turni[giornoSelezionato].assenzaTipo === voceSel.id)
          ? finestraDaOrari(turni[giornoSelezionato].data, turni[giornoSelezionato].riposoCompensativoOraInizio, turni[giornoSelezionato].riposoCompensativoOraFine).ore : 0;
        const usateAltrove = calcolaOreAssenzaUsate(voceSel.id) - oreStessoGiornoAltrove;
        const rimanentiDopo = round2(totaleDisponibile - usateAltrove - f.ore);
        boxRC.textContent = `Consuma ${f.ore}h dal saldo di ${voceSel.nome}` + (rimanentiDopo < 0 ? ` — ⚠ saldo insufficiente, andresti a ${rimanentiDopo}h` : ` (resterebbero ${rimanentiDopo}h).`);
      } else {
        boxRC.textContent = 'Indica l\'orario del turno sostituito per calcolare le ore consumate.';
      }
    } else {
      boxRC.textContent = '';
    }
  }
  if(t.riposo){
    box.textContent = 'Giorno di riposo — nessuna ora da classificare.';
    if(boxStr) boxStr.textContent = '';
    return;
  }
  const c = classificaTurno(t);
  const boxPB = el('anteprimaPermessoBreve');
  const boxRPB = el('anteprimaRecuperoPermessoBreve');
  const vocePB = assenze.find(a => a.nome === 'Permesso breve');
  const oggiPermessoOre = (giornoSelezionato && turni[giornoSelezionato] && turni[giornoSelezionato].data && turni[giornoSelezionato].data.startsWith(String(annoCorrente)))
    ? classificaTurno(turni[giornoSelezionato]).orePermessoBreve : 0;
  const oggiRecuperoOre = (giornoSelezionato && turni[giornoSelezionato] && turni[giornoSelezionato].data && turni[giornoSelezionato].data.startsWith(String(annoCorrente)))
    ? classificaTurno(turni[giornoSelezionato]).oreRecuperoPermessoBreve : 0;
  const usateAnnoAltrove = vocePB ? round2(calcolaOrePermessoBreveUsateAnno(annoCorrente) - oggiPermessoOre) : 0;
  if(boxPB){
    if(t.permessoBreveAttivo && c.orePermessoBreve > 0 && vocePB){
      const rimanentiDopo = round2(vocePB.valore - usateAnnoAltrove - c.orePermessoBreve);
      boxPB.textContent = `Turno ridotto a ${round2(c.oreTotali)}h lavorate. Toglie ${c.orePermessoBreve}h dal saldo di Permesso breve (in modo permanente)` +
        (rimanentiDopo < 0 ? ` — ⚠ saldo insufficiente, andresti a ${rimanentiDopo}h.` : ` (resterebbero ${rimanentiDopo}h nel ${annoCorrente}).`) +
        ` Ricordati di recuperarle: ti restano da recuperare ${c.orePermessoBreve}h in più rispetto a prima.`;
    } else if(t.permessoBreveAttivo){
      boxPB.textContent = 'Indica l\'orario del permesso breve per calcolare le ore da togliere al turno.';
    } else {
      boxPB.textContent = 'Le ore di permesso breve si tolgono dalle ore lavorative del turno (es. turno 13:00–19:00 con permesso 18:00–19:00 = 5h lavorate, 1h di permesso) e scalano per sempre il saldo di Permesso breve in Assenze — recuperarle in seguito non fa tornare su il saldo, serve solo a non perdere la retribuzione di quell\'ora.';
    }
  }
  if(boxRPB){
    if(t.recuperoPermessoBreveAttivo && c.oreRecuperoPermessoBreve > 0){
      boxRPB.textContent = `${c.oreRecuperoPermessoBreve}h retribuite in più (non contano nel totale ore del turno). Scalano dalle ore ancora da recuperare, senza toccare il saldo di Permesso breve rimanente.`;
    } else if(t.recuperoPermessoBreveAttivo){
      boxRPB.textContent = 'Indica l\'orario del recupero per calcolare le ore da aggiungere al turno.';
    } else {
      boxRPB.textContent = 'Queste ore, a differenza del permesso breve, entrano nel calcolo della paga (ore retribuite in più), ma non si sommano al totale ore del turno né toccano il saldo rimanente di Permesso breve: scalano solo il debito di "ore da recuperare".';
    }
  }
  if(boxStr){
    const primaCalc = finestraDaOrari(t.data || dataISO(new Date()), t.straordinarioPrimaInizio, t.straordinarioPrimaFine);
    const dopoCalc = finestraDaOrari(t.data || dataISO(new Date()), t.straordinarioDopoInizio, t.straordinarioDopoFine);
    let testo = (primaCalc.ore > 0 || dopoCalc.ore > 0)
      ? `Ore di straordinario calcolate — prima: ${primaCalc.ore}h · dopo: ${dopoCalc.ore}h`
      : '';
    if(t.compensaStraordinario && c.oreCompensate > 0) testo += `${testo ? ' — ' : ''}${c.oreCompensate}h convertite in riposo compensativo, escluse dalla paga.`;
    boxStr.textContent = testo;
  }
  if(c.errore){ box.textContent = '⚠ ' + c.errore; return; }
  if(!t.oraInizio || !t.oraFine){ box.textContent = 'Inserisci ora inizio e ora fine per vedere la classificazione automatica.'; return; }
  box.textContent =
    `Ore totali: ${c.oreTotali}\n` +
    `Ordinarie: ${c.ordinarie} · Notturne: ${c.notturne} · Festive: ${c.festive} · Domenicali: ${c.domenicali} · Notturne festive: ${c.notturneFestive}\n` +
    `Straordinario — Diurno: ${c.strDiurno} · Notturno: ${c.strNotturno} · Festivo: ${c.strFestivo} · Notturno festivo: ${c.strNotturnoFestivo}`;
}

/* ---------------------------------------------------------
   UI — MODALE ANAGRAFICA
   --------------------------------------------------------- */
/* ---------------------------------------------------------
   BADGE GRADO — mostrina semplificata in SVG per qualifica
   (rappresentazione indicativa per categoria, non riproduzione
   ufficiale dei gradi) — truppa: barre rosse; sovrintendenti:
   rombi oro; ispettori: pentagoni oro; funzionari: stelle oro
   --------------------------------------------------------- */
// Parametro stipendiale per qualifica — fonte: tabella incrementi CCNL 2025/2027 (PDF condiviso dall'utente, gennaio 2027)
const PARAMETRO_STIPENDIALE = {
  'Agente': 105.25, 'Agente Scelto': 108.50, 'Assistente': 112.00,
  'Assistente Capo': 116.50, 'Assistente Capo Coordinatore': 121.50,
  'Vice Sovrintendente': 116.75, 'Sovrintendente': 121.50, 'Sovrintendente Capo': 124.25,
  'Sovrintendente Capo Coordinatore': 131.00,
  'Vice Ispettore': 124.75, 'Ispettore': 131.00, 'Ispettore Capo': 133.50, 'Ispettore Superiore': 137.50,
  'Sostituto Commissario': 143.50, 'Sostituto Commissario Coordinatore': 148.00,
  'Vice Commissario': 136.75, 'Commissario': 148.00, 'Commissario Capo': 150.50
};

const MAPPA_GRADI = {
  'Agente': { cat:'truppa', n:0 },
  'Agente Scelto': { cat:'truppa', n:1 },
  'Assistente': { cat:'truppa', n:2 },
  'Assistente Capo': { cat:'truppa', n:3 },
  'Assistente Capo Coordinatore': { cat:'truppa', n:3, extra:true },
  'Vice Sovrintendente': { cat:'sovr', n:1 },
  'Sovrintendente': { cat:'sovr', n:2 },
  'Sovrintendente Capo': { cat:'sovr', n:3 },
  'Sovrintendente Capo Coordinatore': { cat:'sovr', n:3, extra:true },
  'Vice Ispettore': { cat:'isp', n:1 },
  'Ispettore': { cat:'isp', n:2 },
  'Ispettore Capo': { cat:'isp', n:3 },
  'Ispettore Superiore': { cat:'isp', n:4 },
  'Sostituto Commissario': { cat:'funz', n:1 },
  'Sostituto Commissario Coordinatore': { cat:'funz', n:1, extra:true },
  'Vice Commissario': { cat:'funz', n:2 },
  'Commissario': { cat:'funz', n:3 },
  'Commissario Capo': { cat:'funz', n:3, extra:true }
};

function puntiStella(cx, cy, rEst, rInt){
  let punti = [];
  for(let i = 0; i < 10; i++){
    const raggio = i % 2 === 0 ? rEst : rInt;
    const angolo = (Math.PI / 5) * i - Math.PI / 2;
    punti.push(`${(cx + raggio * Math.cos(angolo)).toFixed(1)},${(cy + raggio * Math.sin(angolo)).toFixed(1)}`);
  }
  return punti.join(' ');
}

function svgBadgeGrado(qualifica){
  const info = MAPPA_GRADI[qualifica] || { cat:'truppa', n:0 };
  const colore = info.cat === 'truppa' ? '#D65C5C' : '#D9B23C';
  const spacing = 5.5;
  const primo = 8 - ((info.n - 1) * spacing) / 2;
  let simboli = '';
  for(let i = 0; i < info.n; i++){
    const cx = info.n > 0 ? primo + i * spacing : 0;
    if(info.cat === 'truppa') simboli += `<rect x="${(cx-0.9).toFixed(1)}" y="4" width="1.8" height="10" fill="${colore}"/>`;
    else if(info.cat === 'sovr') simboli += `<polygon points="${cx},4 ${(cx+3).toFixed(1)},9 ${cx},14 ${(cx-3).toFixed(1)},9" fill="${colore}"/>`;
    else if(info.cat === 'isp') simboli += `<polygon points="${cx},4 ${(cx+2.7).toFixed(1)},6.9 ${(cx+1.6).toFixed(1)},11.4 ${(cx-1.6).toFixed(1)},11.4 ${(cx-2.7).toFixed(1)},6.9" fill="${colore}"/>`;
    else if(info.cat === 'funz') simboli += `<polygon points="${puntiStella(cx, 9, 3.1, 1.3)}" fill="${colore}"/>`;
  }
  const extra = info.extra
    ? `<polygon points="24,3 26,5 24,7 22,5" fill="none" stroke="${colore}" stroke-width="0.8"/>`
    : '';
  return `<svg width="32" height="18" viewBox="0 0 32 18" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle; flex-shrink:0;">
    <rect x="0.5" y="0.5" width="31" height="17" rx="2.5" fill="#16233F" stroke="#0D101C" stroke-width="1"/>
    ${simboli}${extra}
  </svg>`;
}

function aggiornaRiassuntoAnagrafica(){
  el('btnAnagrafica').innerHTML = anagrafica
    ? `${svgBadgeGrado(anagrafica.qualifica)} ${anagrafica.qualifica}`
    : '🪪 Anagrafica';
}
function popolaFormAnagrafica(){
  if(anagrafica){
    el('campoQualifica').value = anagrafica.qualifica || 'Agente';
    el('campoAnni').value = anagrafica.anni || '';
    el('campoAssegnoFunzionale').value = anagrafica.assegnoFunzionale || 'no';
    el('campoSede').value = anagrafica.sede || '';
    el('campoRegione').value = anagrafica.regione || 'Lombardia';
    el('campoComune').value = anagrafica.comune || '';
    el('campoAddComunale').value = anagrafica.addComunale ?? '';
    el('campoConiugeACarico').value = anagrafica.coniugeACarico || 'no';
    el('campoFigliUnder21').value = anagrafica.figliUnder21 ?? 0;
    el('campoFigliOver21').value = anagrafica.figliOver21 ?? 0;
    el('campoSindacato').value = anagrafica.sindacato || '';
  }
  aggiornaVisualizzazioneParametro();
}
function aggiornaVisualizzazioneParametro(){
  const parametro = PARAMETRO_STIPENDIALE[el('campoQualifica').value];
  el('visualizzaParametro').textContent = parametro !== undefined ? parametro.toFixed(2).replace('.', ',') : '—';
}
function cancellaAnagrafica(){
  anagrafica = null;
  localStorage.removeItem(CHIAVE_ANAGRAFICA);
  el('campoQualifica').value = 'Agente';
  el('campoAnni').value = '';
  el('campoAssegnoFunzionale').value = 'no';
  el('campoSede').value = '';
  el('campoRegione').value = 'Lombardia';
  el('campoComune').value = '';
  el('campoAddComunale').value = '';
  el('campoConiugeACarico').value = 'no';
  el('campoFigliUnder21').value = 0;
  el('campoFigliOver21').value = 0;
  el('campoSindacato').value = '';
  aggiornaVisualizzazioneParametro();
  aggiornaRiassuntoAnagrafica();
}
function salvaAnagraficaDaModale(){
  anagrafica = {
    qualifica: el('campoQualifica').value,
    anni: el('campoAnni').value,
    assegnoFunzionale: el('campoAssegnoFunzionale').value,
    sede: el('campoSede').value,
    regione: el('campoRegione').value,
    comune: el('campoComune').value,
    addComunale: Number(el('campoAddComunale').value) || 0,
    coniugeACarico: el('campoConiugeACarico').value,
    figliUnder21: Number(el('campoFigliUnder21').value) || 0,
    figliOver21: Number(el('campoFigliOver21').value) || 0,
    sindacato: el('campoSindacato').value
  };
  salvaAnagraficaStorage();
  aggiornaRiassuntoAnagrafica();
  mostraScheda('turni');
}

/* ---------------------------------------------------------
   TEMA
   --------------------------------------------------------- */
function applicaTema(tema){
  document.body.dataset.tema = tema;
  localStorage.setItem(CHIAVE_TEMA, tema);
}

/* ---------------------------------------------------------
   INIZIALIZZAZIONE
   --------------------------------------------------------- */
/* ---------------------------------------------------------
   BACKUP — esportazione/importazione completa dei dati
   --------------------------------------------------------- */
function aggiornaStatoBackup(){
  const box = el('statoBackup');
  if(!box) return;
  const dataStr = localStorage.getItem(CHIAVE_ULTIMO_BACKUP);
  const cEDati = Object.keys(turni).length > 0;
  if(!dataStr){
    box.innerHTML = cEDati
      ? '⚠ Non hai ancora fatto nessun backup. Esportane uno per non rischiare di perdere i tuoi dati.'
      : 'Nessun backup ancora effettuato.';
    box.className = cEDati ? 'sotto-titolo avviso-backup' : 'sotto-titolo';
    return;
  }
  const giorni = Math.floor((new Date() - new Date(dataStr)) / 86400000);
  const dataFormattata = formattaDataBreve(dataStr.slice(0, 10));
  if(giorni >= 14){
    box.innerHTML = `⚠ Ultimo backup: ${dataFormattata} (${giorni} giorni fa). Ti conviene farne uno nuovo.`;
    box.className = 'sotto-titolo avviso-backup';
  } else {
    box.innerHTML = `✓ Ultimo backup: ${dataFormattata} (${giorni === 0 ? 'oggi' : giorni === 1 ? '1 giorno fa' : giorni + ' giorni fa'}).`;
    box.className = 'sotto-titolo';
  }
}

function esportaBackup(){
  const dati = {
    versioneBackup: 1,
    dataEsportazione: new Date().toISOString(),
    anagrafica, turni, tabelle, conguagliPerMese, storico, assenze, sequenzaTurni,
    noteGiorni, sequenzaAncora: localStorage.getItem(CHIAVE_SEQUENZA_ANCORA) || null
  };
  const blob = new Blob([JSON.stringify(dati, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-simulatore-cedolino-${dataISO(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
  localStorage.setItem(CHIAVE_ULTIMO_BACKUP, new Date().toISOString());
  aggiornaStatoBackup();
}

function importaBackup(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const dati = JSON.parse(reader.result);
      if(!dati || typeof dati !== 'object') throw new Error('formato non valido');
      if(dati.anagrafica !== undefined) anagrafica = dati.anagrafica;
      if(dati.turni) turni = dati.turni;
      if(dati.tabelle) tabelle = dati.tabelle;
      if(dati.conguagliPerMese) conguagliPerMese = dati.conguagliPerMese;
      if(dati.storico) storico = dati.storico;
      if(dati.assenze) assenze = dati.assenze;
      if(dati.sequenzaTurni) sequenzaTurni = dati.sequenzaTurni;
      if(dati.noteGiorni){ noteGiorni = dati.noteGiorni; salvaNoteGiorniStorage(); }
      if(dati.sequenzaAncora) localStorage.setItem(CHIAVE_SEQUENZA_ANCORA, dati.sequenzaAncora);

      salvaAnagraficaStorage(); salvaTurniStorage(); salvaTabelleStorage();
      salvaConguagliStorage(); salvaStoricoStorage(); salvaAssenzeStorage(); salvaSequenzaStorage();

      aggiornaRiassuntoAnagrafica();
      renderCalendario();
      renderStorico();
      el('contenitoreCedolino').hidden = true;
      mostraAvviso('Backup importato correttamente.');
    }catch(e){
      mostraAvviso('File di backup non valido o corrotto.');
    }
  };
  reader.readAsText(file);
}

/* ---------------------------------------------------------
   AVVISO / CONFERMA — sostituiscono alert()/confirm() nativi,
   che in alcuni contesti (anteprima in-app, webview) possono
   non mostrarsi e far fallire silenziosamente l'operazione.
   --------------------------------------------------------- */
function mostraAvviso(messaggio, titolo){
  el('titoloAvviso').textContent = titolo || 'Avviso';
  el('testoAvviso').textContent = messaggio;
  el('btnAnnullaAvviso').hidden = true;
  el('btnConfermaAvviso').textContent = 'OK';
  el('btnConfermaAvviso').onclick = () => { el('overlayAvviso').hidden = true; };
  el('overlayAvviso').hidden = false;
}

function mostraConferma(messaggio, alConfermare, titolo){
  el('titoloAvviso').textContent = titolo || 'Conferma';
  el('testoAvviso').textContent = messaggio;
  el('btnAnnullaAvviso').hidden = false;
  el('btnConfermaAvviso').textContent = 'Continua';
  el('btnAnnullaAvviso').onclick = () => { el('overlayAvviso').hidden = true; };
  el('btnConfermaAvviso').onclick = () => { el('overlayAvviso').hidden = true; alConfermare(); };
  el('overlayAvviso').hidden = false;
}

function mostraScheda(nome){
  const viste = { turni: 'vistaTurni', cedolino: 'vistaCedolino', assenze: 'vistaAssenze', tabelle: 'vistaTabelle', anagrafica: 'vistaAnagrafica', sequenza: 'vistaSequenza' };
  const tab = { turni: 'tabTurni', cedolino: 'tabCedolino', assenze: 'tabAssenze', tabelle: 'btnTabelle', anagrafica: 'btnAnagrafica' };
  Object.keys(viste).forEach(k => { el(viste[k]).hidden = (k !== nome); });
  Object.keys(tab).forEach(k => { el(tab[k]).classList.toggle('attiva', k === nome); });
  if(nome === 'assenze') renderAssenze();
  if(nome === 'tabelle') renderTabelle();
  if(nome === 'anagrafica') popolaFormAnagrafica();
  if(nome === 'sequenza') renderSequenza();
  window.scrollTo({ top:0, behavior:'instant' });
}

function inizializza(){
  applicaTema(localStorage.getItem(CHIAVE_TEMA) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'scuro' : 'chiaro'));
  applicaColoriTurni();
  if(!localStorage.getItem(CHIAVE_DISCLAIMER_MOSTRATO)){
    mostraAvviso(
      'Questa è un\'app indipendente, non ufficiale e non affiliata alla Polizia di Stato né ad alcun ente pubblico. I valori delle tabelle sono presi da fonti pubbliche online (siti sindacali, normativa pubblicata) e possono contenere errori o non essere aggiornati. L\'autore declina ogni responsabilità per incongruenze, errori o danni derivanti dall\'uso dell\'app: verifica sempre i dati sul tuo cedolino ufficiale prima di prendere decisioni.',
      'Prima di iniziare'
    );
    localStorage.setItem(CHIAVE_DISCLAIMER_MOSTRATO, '1');
  }
  aggiornaRiassuntoAnagrafica();
  renderCalendario();
  aggiornaStatoBackup();
  if(Object.keys(turni).length > 0){
    const dataUltimoBackup = localStorage.getItem(CHIAVE_ULTIMO_BACKUP);
    const giorniPassati = dataUltimoBackup ? Math.floor((new Date() - new Date(dataUltimoBackup)) / 86400000) : Infinity;
    if(giorniPassati >= 30){
      mostraAvviso(dataUltimoBackup
        ? `Sono passati ${giorniPassati} giorni dall'ultimo backup. I tuoi dati vivono solo su questo dispositivo: se lo perdi o cambi telefono senza aver esportato un backup recente, li perdi. Vai su Backup Dati (in fondo a ogni pagina) per esportarne uno nuovo.`
        : `Non hai mai fatto un backup dei tuoi dati. Vivono solo su questo dispositivo: vai su Backup Dati (in fondo a ogni pagina) per esportarne uno.`);
    }
  }

  let timeoutNotaGiorno;
  el('campoNotaGiorno').addEventListener('input', () => {
    if(!giornoSelezionato) return;
    clearTimeout(timeoutNotaGiorno);
    timeoutNotaGiorno = setTimeout(() => {
      const testo = el('campoNotaGiorno').value;
      if(testo) noteGiorni[giornoSelezionato] = testo;
      else delete noteGiorni[giornoSelezionato];
      salvaNoteGiorniStorage();
    }, 400);
  });

  if(!anagrafica) mostraScheda('anagrafica');

  el('btnMesePrec').addEventListener('click', () => {
    meseCorrente--; if(meseCorrente < 0){ meseCorrente = 11; annoCorrente--; }
    renderCalendario();
    el('contenitoreCedolino').hidden = true;
  });
  el('btnMeseSucc').addEventListener('click', () => {
    meseCorrente++; if(meseCorrente > 11){ meseCorrente = 0; annoCorrente++; }
    renderCalendario();
    el('contenitoreCedolino').hidden = true;
  });

  el('etichettaMese').addEventListener('click', () => {
    el('campoVaiMese').value = meseCorrente;
    el('campoVaiAnno').value = annoCorrente;
    el('overlayVaiAMese').hidden = false;
  });
  el('btnChiudiVaiAMese').addEventListener('click', () => { el('overlayVaiAMese').hidden = true; });
  el('overlayVaiAMese').addEventListener('click', e => { if(e.target.id === 'overlayVaiAMese') el('overlayVaiAMese').hidden = true; });
  el('btnVaiAMese').addEventListener('click', () => {
    const meseScelto = Number(el('campoVaiMese').value);
    const annoScelto = Number(el('campoVaiAnno').value);
    if(!annoScelto) return;
    meseCorrente = meseScelto; annoCorrente = annoScelto;
    renderCalendario();
    el('contenitoreCedolino').hidden = true;
    el('overlayVaiAMese').hidden = true;
  });
  el('btnVaiOggi').addEventListener('click', () => {
    const adesso = new Date();
    meseCorrente = adesso.getMonth(); annoCorrente = adesso.getFullYear();
    giornoSelezionato = dataISO(adesso);
    renderCalendario();
    el('contenitoreCedolino').hidden = true;
    el('overlayVaiAMese').hidden = true;
  });

  el('btnAnagrafica').addEventListener('click', () => mostraScheda('anagrafica'));
  el('btnSalvaAnagrafica').addEventListener('click', salvaAnagraficaDaModale);
  el('btnCancellaAnagrafica').addEventListener('click', () => {
    mostraConferma(
      'Questo cancellerà i dati anagrafici salvati (qualifica, anni di servizio, sede, regione, ecc.) e riporterà il form ai valori predefiniti. Turni, assenze, tabelle e cedolini generati non vengono toccati. Continuare?',
      cancellaAnagrafica
    );
  });
  el('campoQualifica').addEventListener('change', aggiornaVisualizzazioneParametro);

  el('btnTabelle').addEventListener('click', () => mostraScheda('tabelle'));
  el('btnSalvaTabelle').addEventListener('click', () => {
    leggiTabelleDaModale();
    mostraScheda('turni');
    aggiornaRiepilogoMensile();
    if(!el('contenitoreCedolino').hidden) renderCedolino();
  });
  el('btnResetTabelle').addEventListener('click', () => {
    tabelle = JSON.parse(JSON.stringify(TABELLE_PREDEFINITE));
    renderTabelle();
  });

  el('btnAggiungiAssenza').addEventListener('click', () => {
    assenze.push({ id: nuovoId(), nome:'Nuova voce', valore:0, unita:'gg', personalizzata:true });
    salvaAssenzeStorage();
    renderAssenze();
  });

  el('btnApriSequenza').addEventListener('click', () => mostraScheda('sequenza'));
  el('btnChiudiSequenza').addEventListener('click', () => mostraScheda('turni'));
  el('btnAggiungiStepSequenza').addEventListener('click', () => {
    sequenzaTurni.push({ tipo:'riposo' });
    renderSequenza();
  });
  el('btnGeneraSequenza').addEventListener('click', () => generaSequenzaTurni());
  el('btnContinuaSequenza').addEventListener('click', continuaSequenzaTurni);

  function aggiornaGiorniDaPreset(){
    const preset = el('campoSequenzaDurataPreset').value;
    if(preset === 'personalizzato') return; // il numero resta quello digitato dall'utente
    const dataInizioStr = el('campoSequenzaDataInizio').value || dataISO(new Date());
    const inizio = new Date(dataInizioStr + 'T00:00:00');
    const fine = new Date(inizio);
    if(preset === 'settimana') fine.setDate(fine.getDate() + 7);
    else if(preset === 'mese') fine.setMonth(fine.getMonth() + 1);
    else if(preset === 'mese3') fine.setMonth(fine.getMonth() + 3);
    else if(preset === 'mese6') fine.setMonth(fine.getMonth() + 6);
    else if(preset === 'mese9') fine.setMonth(fine.getMonth() + 9);
    else if(preset === 'anno') fine.setFullYear(fine.getFullYear() + 1);
    const giorni = Math.round((fine - inizio) / 86400000);
    el('campoSequenzaGiorni').value = Math.min(giorni, 366);
  }
  el('campoSequenzaDurataPreset').addEventListener('change', aggiornaGiorniDaPreset);
  el('campoSequenzaDataInizio').addEventListener('change', aggiornaGiorniDaPreset);
  el('campoSequenzaGiorni').addEventListener('input', () => { el('campoSequenzaDurataPreset').value = 'personalizzato'; });

  el('btnModelloTurnoInQuinta').addEventListener('click', () => {
    mostraConferma(
      'Questo sostituirà tutti i passaggi attuali della sequenza con il turno in quinta predefinito (Sera, Pomeriggio, Mattina, Notte, Riposo). Continuare?',
      applicaModelloTurnoInQuinta
    );
  });
  el('btnModelloSettimanaCorta').addEventListener('click', () => {
    mostraConferma(
      'Questo sostituirà tutti i passaggi attuali della sequenza con il modello settimana corta (7 righe). Continuare?',
      applicaModelloSettimanaCorta
    );
  });
  el('btnModelloSettimanaLunga').addEventListener('click', () => {
    mostraConferma(
      'Questo sostituirà tutti i passaggi attuali della sequenza con il modello settimana lunga (7 righe). Continuare?',
      applicaModelloSettimanaLunga
    );
  });

  el('btnCopiaTurno').addEventListener('click', copiaTurnoCorrente);
  el('btnIncollaTurno').addEventListener('click', incollaTurnoCorrente);
  el('btnCancellaTurniMese').addEventListener('click', cancellaTurniMese);
  el('btnCancellaStorico').addEventListener('click', cancellaStorico);

  el('btnEsportaBackup').addEventListener('click', esportaBackup);
  el('btnImportaBackup').addEventListener('click', () => el('campoImportaBackup').click());
  el('campoImportaBackup').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(file){
      mostraConferma(
        'Importare questo backup sovrascriverà TUTTI i dati attuali (anagrafica, turni, tabelle, assenze, storico). Continuare?',
        () => importaBackup(file)
      );
    }
    e.target.value = ''; // permette di reimportare lo stesso file in seguito
  });

  el('btnGeneraCedolino').addEventListener('click', renderCedolino);
  el('btnGeneraAccreditoConto').addEventListener('click', renderAccreditoConto);
  el('btnStampaCedolino').addEventListener('click', () => window.print());
  el('btnNascondiCedolino').addEventListener('click', () => {
    el('contenitoreCedolino').hidden = true;
    el('contenitoreCedolino').innerHTML = '';
    el('btnStampaCedolino').hidden = true;
    el('btnNascondiCedolino').hidden = true;
  });
  el('btnCancellaAccreditoConto').addEventListener('click', () => {
    el('contenitoreAccreditoConto').hidden = true;
    el('contenitoreAccreditoConto').innerHTML = '';
    el('btnCancellaAccreditoConto').hidden = true;
  });

  el('campoAnnoRiepilogo').value = annoCorrente;
  el('btnCalcolaRiepilogoAnnuale').addEventListener('click', () => {
    const anno = Number(el('campoAnnoRiepilogo').value) || annoCorrente;
    renderRiepilogoAnnuale(anno);
  });
  el('btnCancellaRiepilogoAnnuale').addEventListener('click', () => {
    el('contenitoreRiepilogoAnnuale').hidden = true;
    el('btnCancellaRiepilogoAnnuale').hidden = true;
  });
  el('campoConguagliMese').addEventListener('input', () => {
    conguagliPerMese[chiaveMese(annoCorrente, meseCorrente)] = Number(el('campoConguagliMese').value) || 0;
    salvaConguagliStorage();
  });
  renderStorico();

  el('btnTheme').addEventListener('click', () => {
    applicaTema(document.body.dataset.tema === 'scuro' ? 'chiaro' : 'scuro');
  });
  el('btnApriColoriTurni').addEventListener('click', () => {
    const aperto = !el('pannelloColoriTurni').hidden;
    el('pannelloColoriTurni').hidden = aperto;
    if(!aperto) renderColoriTurni();
  });
  el('btnRipristinaColoriTurni').addEventListener('click', () => {
    mostraConferma('Questo riporta tutti i colori dei turni ai valori predefiniti. Continuare?', () => {
      coloriTurni = {};
      CATEGORIE_COLORABILI.forEach(c => { coloriTurni[c.chiave] = c.predefinito; });
      salvaColoriTurniStorage();
      applicaColoriTurni();
      renderColoriTurni();
      renderCalendario();
    });
  });

  el('btnChiudiTurno').addEventListener('click', () => { el('pannelloTurno').hidden = true; });

  el('campoRiposo').addEventListener('change', () => {
    if(el('campoRiposo').checked) el('campoAssenzaTipo').value = '';
    aggiornaVisibilitaCampiOrario(); aggiornaAnteprima();
  });
  el('campoAssenzaTipo').addEventListener('change', () => {
    if(el('campoAssenzaTipo').value) el('campoRiposo').checked = false;
    aggiornaVisibilitaCampiOrario(); aggiornaAnteprima();
  });
  el('campoRCOraInizio').addEventListener('input', aggiornaAnteprima);
  el('campoRCOraFine').addEventListener('input', aggiornaAnteprima);

  // Precompilo "alle" dello straordinario prima con l'inizio del turno (di solito coincidono),
  // e "dalle" dello straordinario dopo con la fine del turno — solo se il campo è ancora vuoto.
  el('campoOraInizio').addEventListener('change', () => {
    if(!el('campoStrPrimaFine').value) el('campoStrPrimaFine').value = el('campoOraInizio').value;
  });
  el('campoOraFine').addEventListener('change', () => {
    if(!el('campoStrDopoInizio').value) el('campoStrDopoInizio').value = el('campoOraFine').value;
  });

  el('campoMissione').addEventListener('change', () => {
    const attiva = el('campoMissione').checked;
    el('campoDurataMissioneBox').style.display = attiva ? '' : 'none';
    if(attiva && Number(el('campoDurataMissione').value) === 0){
      // precompilo con le ore totali del turno come punto di partenza, modificabile
      const t = leggiTurnoDalModale();
      const c = classificaTurno(t);
      if(c.oreTotali > 0) el('campoDurataMissione').value = c.oreTotali;
    }
  });

  el('campoOrdinePubblico').addEventListener('change', () => {
    const attivo = el('campoOrdinePubblico').checked;
    el('campoOrdinePubblicoBox').style.display = attivo ? '' : 'none';
    el('campoOPPernottamentoBox').style.display = (attivo && el('campoOPSede').value === 'fuori') ? '' : 'none';
  });
  el('campoOPSede').addEventListener('change', () => {
    el('campoOPPernottamentoBox').style.display = el('campoOPSede').value === 'fuori' ? '' : 'none';
  });

  el('campoModelloTurno').addEventListener('change', () => {
    const scelta = el('campoModelloTurno').value;
    if(!scelta) return;
    if(scelta === 'riposo'){
      el('campoRiposo').checked = true;
      el('campoAssenzaTipo').value = '';
    } else {
      el('campoRiposo').checked = false;
      el('campoAssenzaTipo').value = '';
      el('campoOraInizio').value = MODELLI_TURNO[scelta].oraInizio;
      el('campoOraFine').value = MODELLI_TURNO[scelta].oraFine;
    }
    aggiornaVisibilitaCampiOrario();
    aggiornaAnteprima();
  });
  ['campoOraInizio','campoOraFine','campoStrPrimaInizio','campoStrPrimaFine','campoStrDopoInizio','campoStrDopoFine','campoSecondoOraInizio','campoSecondoOraFine'].forEach(id => {
    el(id).addEventListener('input', aggiornaAnteprima);
  });
  el('campoCompensaStraordinario').addEventListener('change', aggiornaAnteprima);
  el('campoPermessoBreveAttivo').addEventListener('change', () => {
    el('campiPermessoBreve').style.display = el('campoPermessoBreveAttivo').checked ? '' : 'none';
    aggiornaAnteprima();
  });
  el('campoPermessoBreveInizio').addEventListener('input', aggiornaAnteprima);
  el('campoPermessoBreveFine').addEventListener('input', aggiornaAnteprima);
  el('campoRecuperoPermessoBreveAttivo').addEventListener('change', () => {
    el('campiRecuperoPermessoBreve').style.display = el('campoRecuperoPermessoBreveAttivo').checked ? '' : 'none';
    aggiornaAnteprima();
  });
  el('campoRecuperoPermessoBreveInizio').addEventListener('input', aggiornaAnteprima);
  el('campoRecuperoPermessoBreveFine').addEventListener('input', aggiornaAnteprima);
  el('campoSecondoAttivo').addEventListener('change', () => {
    el('campiSecondoSegmento').style.display = el('campoSecondoAttivo').checked ? '' : 'none';
    aggiornaAnteprima();
  });

  el('btnSalvaTurno').addEventListener('click', () => {
    turni[giornoSelezionato] = leggiTurnoDalModale();
    salvaTurniStorage();
    el('pannelloTurno').hidden = true;
    renderCalendario();
  });
  el('tabTurni').addEventListener('click', () => mostraScheda('turni'));
  el('tabCedolino').addEventListener('click', () => mostraScheda('cedolino'));
  el('tabAssenze').addEventListener('click', () => mostraScheda('assenze'));

  el('btnFabTurno').addEventListener('click', () => {
    if(giornoSelezionato) apriModaleTurno(giornoSelezionato);
  });

  el('btnRimuoviTurno').addEventListener('click', () => {
    delete turni[giornoSelezionato];
    salvaTurniStorage();
    el('pannelloTurno').hidden = true;
    renderCalendario();
  });
}

document.addEventListener('DOMContentLoaded', inizializza);

/* ---------------------------------------------------------
   PWA — registrazione service worker (offline + installabile)
   --------------------------------------------------------- */
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service worker non registrato:', e));
  });
}
