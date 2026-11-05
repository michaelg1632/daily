/* ---------- Vorlagen: Werte, Lebensbereiche, Farben ---------- */
const PALETTE=[['Himmel','#5CB8E8'],['Wiese','#5FCB7E'],['Sonne','#F5B14C'],['Koralle','#F08A8A'],['Flieder','#B08AF0'],['Türkis','#4FC9C0'],['Rosa','#F28CC4'],['Stahl','#8FA3B8']];

/* mode: 'last' zeigt den aktuellen Stand, 'sum' zählt zusammen. kind: 'exercise' liest den besten Satz aus Übungen. */
const mt=(id,name,unit,mode='last',kind='manual')=>({id,name,unit,mode,kind});
const CATALOG=[
  ['Körper',[mt('gewicht','Körpergewicht','kg'),mt('koerperfett','Körperfett','%'),mt('muskelmasse','Muskelmasse','kg'),mt('bauch','Bauchumfang','cm'),mt('brust','Brustumfang','cm'),mt('oberarm','Oberarm','cm'),mt('oberschenkel','Oberschenkel','cm')]],
  ['Übungen',[mt('bankdruecken','Bankdrücken','kg','last','exercise'),mt('kniebeuge','Kniebeuge','kg','last','exercise'),mt('kreuzheben','Kreuzheben','kg','last','exercise'),mt('schulterdruecken','Schulterdrücken','kg','last','exercise'),mt('rudern','Rudern','kg','last','exercise'),mt('latzug','Latzug','kg','last','exercise'),mt('klimmzuege','Klimmzüge','Wdh.','last','exercise'),mt('liegestuetze','Liegestütze','Wdh.','last','exercise')]],
  ['Ausdauer',[mt('distanz','Distanz','km','sum'),mt('ausdauerzeit','Ausdauerzeit','Min.','sum'),mt('schritte','Schritte','Schritte'),mt('ruhepuls','Ruhepuls','bpm')]],
  ['Schlaf und Energie',[mt('schlaf','Schlaf','Std.'),mt('schlafqualitaet','Schlafqualität','von 5'),mt('energie','Energie','von 5')]],
  ['Ernährung',[mt('kalorien','Kalorien','kcal'),mt('protein','Protein','g'),mt('wasser','Wasser','l')]],
  ['Finanzen',[mt('einnahmen','Einnahmen','€','sum'),mt('ausgaben','Ausgaben','€','sum'),mt('gespart','Gespart','€','sum'),mt('kontostand','Kontostand','€'),mt('schulden','Schulden','€')]],
  ['Lernen',[mt('lernzeit','Lernzeit','Std.','sum'),mt('seiten','Gelesene Seiten','Seiten','sum'),mt('vokabeln','Neue Vokabeln','Stück','sum'),mt('note','Note','Note')]],
  ['Arbeit',[mt('arbeitszeit','Arbeitszeit','Std.','sum'),mt('erledigt','Erledigte Aufgaben','Stück','sum'),mt('umsatz','Umsatz','€','sum'),mt('kunden','Kunden','Stück')]],
  ['Menschen',[mt('treffen','Treffen','Anzahl','sum'),mt('gemeinsam','Gemeinsame Zeit','Std.','sum')]],
  ['Wohlbefinden',[mt('stimmung','Stimmung','von 5'),mt('stress','Stress','von 5'),mt('meditation','Meditation','Min.','sum'),mt('bildschirm','Bildschirmzeit','Std.')]],
  ['Gewohnheiten',[mt('tageohne','Tage ohne','Tage'),mt('rueckfall','Rückfälle','Anzahl','sum')]],
  ['Kreativität',[mt('uebezeit','Übezeit','Std.','sum'),mt('fertig','Fertige Werke','Stück','sum')]]
];
const catalogItem=id=>{for(const[,items]of CATALOG){const x=items.find(i=>i.id===id);if(x)return x}return null};
const catalogGroup=id=>{for(const[g,items]of CATALOG)if(items.some(i=>i.id===id))return g;return'Werte'};

const TEMPLATES=[
  {id:'leer',name:'Leeres Projekt',desc:'Du legst alles selbst an.',color:0,quick:[],groups:[]},
  {id:'sport',name:'Sport und Fitness',desc:'Training, Sätze und Körperwerte',color:1,sets:true,quick:['Krafttraining','Ausdauer','Mobility','Sportkurs'],groups:[['Übungen',['bankdruecken','kniebeuge','kreuzheben']],['Körper',['gewicht']]]},
  {id:'gesundheit',name:'Gesundheit',desc:'Schlaf, Ernährung und Arzttermine',color:5,quick:['Arzttermin','Spaziergang','Früh schlafen','Vorsorge'],groups:[['Schlaf und Energie',['schlaf','energie']],['Ernährung',['wasser']],['Körper',['gewicht']]]},
  {id:'finanzen',name:'Finanzen',desc:'Einnahmen, Ausgaben und Sparziele',color:2,quick:['Budget prüfen','Rechnungen zahlen','Ausgaben eintragen'],groups:[['Geldfluss',['einnahmen','ausgaben']],['Vermögen',['gespart','kontostand']]]},
  {id:'lernen',name:'Lernen und Ausbildung',desc:'Lernzeit, Bücher und Prüfungen',color:4,quick:['Lernblock','Kurs','Lesen','Prüfung'],groups:[['Fortschritt',['lernzeit','seiten']],['Ergebnisse',['note']]]},
  {id:'beruf',name:'Beruf und Karriere',desc:'Fokuszeit, Bewerbungen und Weiterbildung',color:0,quick:['Fokuszeit','Bewerbung','Weiterbildung','Gespräch'],groups:[['Arbeit',['arbeitszeit','erledigt']]]},
  {id:'vorhaben',name:'Eigenes Vorhaben',desc:'Business, Nebenprojekt oder großer Plan',color:3,quick:['Planung','Umsetzung','Gespräch','Rückblick'],groups:[['Zahlen',['umsatz','kunden']],['Zeit',['arbeitszeit']]]},
  {id:'menschen',name:'Familie und Freunde',desc:'Zeit für Menschen, die dir wichtig sind',color:6,quick:['Treffen','Anruf','Gemeinsamer Abend'],groups:[['Zeit',['treffen','gemeinsam']]]},
  {id:'zuhause',name:'Zuhause und Alltag',desc:'Haushalt, Reparaturen und Erledigungen',color:7,quick:['Putzen','Einkaufen','Reparatur','Ausmisten'],groups:[['Erledigungen',['erledigt']]]},
  {id:'kreativ',name:'Hobby und Kreativität',desc:'Üben, Gestalten und Weiterkommen',color:3,quick:['Üben','Projektzeit','Kurs'],groups:[['Fortschritt',['uebezeit','fertig']]]},
  {id:'innen',name:'Achtsamkeit und Glaube',desc:'Stille, Rituale und innere Ruhe',color:4,quick:['Meditation','Gebet','Tagebuch','Stille Zeit'],groups:[['Wohlbefinden',['meditation','stimmung']]]},
  {id:'gewohnheit',name:'Gewohnheit ändern',desc:'Weniger von etwas oder neu anfangen',color:5,quick:['Check-in','Rückblick'],groups:[['Verlauf',['tageohne','rueckfall']],['Wohlbefinden',['stimmung']]]}
];
const TRIGGERS=['Stress','Müdigkeit','Zeitmangel','Frust','Ablenkung','Umfeld','Gewohnheit','Sonstiges'];
const EXERCISES=['Bankdrücken','Schrägbankdrücken','Schulterdrücken','Seitheben','Dips','Trizepsdrücken','Klimmzüge','Latzug','Rudern','Kreuzheben','Face Pulls','Bizepscurls','Kniebeuge','Beinpresse','Beinstrecker','Beinbeuger','Wadenheben','Ausfallschritte','Liegestütze','Plank'];
const MILES=[3,5,10,20,30,50,75,100,150,200,300];
const DAY_MILES=[7,14,30,60,100,200,365];

/* ---------- Startbild: Zitate mit eigenem Bild ---------- */
const QUOTES=[
  ['apfel','Der einzige Weg, großartige Arbeit zu leisten, ist zu lieben, was man tut.','Steve Jobs'],
  ['erde','Die Zukunft hängt davon ab, was du heute tust.','Mahatma Gandhi'],
  ['uhr','Es ist nicht wenig Zeit, die wir haben, sondern viel, die wir nicht nutzen.','Seneca'],
  ['auto','Wer immer tut, was er schon kann, bleibt immer das, was er schon ist.','Henry Ford'],
  ['hand','Der beste Weg, die Zukunft vorherzusagen, ist, sie zu gestalten.','Peter Drucker'],
  ['lego','Erfolg ist die Summe kleiner Anstrengungen, die Tag für Tag wiederholt werden.','Robert Collier'],
  ['klettern','Glaube, dass du es kannst, und du bist schon halb dort.','Theodore Roosevelt'],
  ['birne','Unsere größte Schwäche liegt im Aufgeben. Der sicherste Weg zum Erfolg ist immer, es noch einmal zu versuchen.','Thomas Edison'],
  ['boxen','Wer kämpft, kann verlieren. Wer nicht kämpft, hat schon verloren.','Bertolt Brecht']
];
/* Warten noch auf ein Bild und werden nicht angezeigt. */
const PENDING_QUOTES=[
  ['Disziplin ist die Brücke zwischen Zielen und ihrer Verwirklichung.','Jim Rohn'],
  ['Hindernisse sind jene furchterregenden Dinge, die du siehst, wenn du deine Ziele aus den Augen verlierst.','Henry Ford'],
  ['Es kommt nicht darauf an, wie langsam du gehst, solange du nicht stehen bleibst.','Konfuzius'],
  ['Die Grenzen meiner Sprache bedeuten die Grenzen meiner Welt.','Ludwig Wittgenstein'],
  ['Wer hohe Türme bauen will, muss lange beim Fundament verweilen.','Anton Bruckner'],
  ['Mut steht am Anfang des Handelns, Glück am Ende.','Demokrit'],
  ['Nichts auf der Welt ist so mächtig wie eine Idee, deren Zeit gekommen ist.','Victor Hugo'],
  ['Ein Mensch, der keine Fehler gemacht hat, hat nie etwas Neues ausprobiert.','Albert Einstein'],
  ['Nichts wird funktionieren, wenn du es nicht tust.','Maya Angelou'],
  ['Die größte Entdeckung meiner Generation ist, dass ein Mensch sein Leben ändern kann, indem er seine Einstellung ändert.','William James'],
  ['Hat man sein Warum des Lebens, so verträgt man sich fast mit jedem Wie.','Friedrich Nietzsche'],
  ['Man kann einem Menschen nichts lehren, man kann ihm nur helfen, es in sich selbst zu entdecken.','Galileo Galilei']
];
