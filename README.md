NOMYRA Finance V58

Aggiornamenti principali:
- Caricamento bilancio con periodo obbligatorio Da/A.
- Confronti validati: benchmark aziende solo su stesso periodo esatto; confronto periodi solo con stessa durata.
- Periodo precedente usato come riferimento per dati iniziali, incluse rimanenze finali -> rimanenze iniziali da verificare.
- Nuova sezione Consigli con azioni e verifiche da fare in base ai numeri rossi.
- Ask NOMYRA migliorato per rispondere a concetti finanziari, numeri rossi, previsioni e azioni consigliate.
- Proiezione stimata a fine periodo per bilanci progressivi/infrannuali.


V59: correzione natura conti (perdita = segno negativo), stima ammortamenti da periodo precedente / mesi, e nota metodologica in Analisi bilancio.


## V60
- Corretto calcolo e spiegazione prezzo medio: fatturato / quantità.
- Aggregazione prodotti ora salva quantità, prezzo medio per prodotto e margine stimato.
- Aggiunta lettura decisionale produttività: prezzo medio, costo stimato/unità, margine stimato e dettaglio per prodotto.
- Aggiunta configurazione mesi stagionali nel profilo aziendale.
- Migliorato Ask NOMYRA su prezzi, prodotti, costi, margini e stagionalità.


## V61 - Produttività: prezzo medio pulito e righe non prodotto
- Il prezzo medio prodotto esclude pedane, pallet, timbri, ottone, spese/accessori e note credito.
- Le note credito/rettifiche vengono separate: incidono sul fatturato netto, ma non sul prezzo medio modello.
- La piattaforma mostra quantità, fatturato, prezzo medio, costo stimato e margine stimato per singolo prodotto.
- Segnala righe dove quantità × prezzo non coincide con importo riga: viene usato l'importo reale, ma la riga resta da verificare.
- Ask NOMYRA risponde su prezzo medio, NC, pedane/timbri/accessori e riconciliazione con il bilancio.

V62: dettaglio prodotto cliccabile nella sezione Produttività.
- Ogni riga prodotto apre una finestra con dettaglio per cliente.
- Mostra cliente, quantità fatturata, fatturato, prezzo medio, costo stimato, margine unitario e utile/perdita stimata.
- Il worker salva `productClientDetails` sui nuovi report caricati.
- Ask NOMYRA può rispondere su dove si perde margine per prodotto/cliente.
