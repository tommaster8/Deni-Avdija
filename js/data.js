// נתוני המצגת. כל נתון מופיע במרשם העובדות ב־docs/PRD.md (סעיף 11.2).
// הנתונים מוקפאים לסוף עונת 2025–26.

const SEASONS = [ // Basketball-Reference ✅
  { season: '2020-21', team: 'WAS', games: 54, pts: 6.3,  reb: 4.9, ast: 1.2, fg: 41.7, tp: 31.5 },
  { season: '2021-22', team: 'WAS', games: 82, pts: 8.4,  reb: 5.2, ast: 2.0, fg: 43.2, tp: 31.7 },
  { season: '2022-23', team: 'WAS', games: 76, pts: 9.2,  reb: 6.4, ast: 2.8, fg: 43.7, tp: 29.7 },
  { season: '2023-24', team: 'WAS', games: 75, pts: 14.7, reb: 7.2, ast: 3.8, fg: 50.6, tp: 37.4 },
  { season: '2024-25', team: 'POR', games: 72, pts: 16.9, reb: 7.3, ast: 3.9, fg: 47.6, tp: 36.5 },
  { season: '2025-26', team: 'POR', games: 66, pts: 24.2, reb: 6.9, ast: 6.7, fg: 46.2, tp: 31.8 },
];

const METRICS = {
  pts: { label: 'נקודות למשחק', en: 'PTS', pct: false },
  reb: { label: 'ריבאונדים למשחק', en: 'REB', pct: false },
  ast: { label: 'אסיסטים למשחק', en: 'AST', pct: false },
  fg:  { label: 'אחוז מהשדה', en: 'FG%', pct: true },
  tp:  { label: 'אחוז לשלוש', en: '3P%', pct: true },
};

// רגעי "השעון הישראלי": שעות משוערות לפי שעת פתיחה רגילה (F27)
const CLOCK_MOMENTS = {
  draft: {
    title: 'ליל הדראפט',
    date: '19.11.2020',
    usCity: 'ניו יורק (ET)',
    usTime: '21:00',
    ilTime: '04:00',
    line: 'ארבע לפנות בוקר בישראל. אלפי טלפונים דולקים מתחת לשמיכות – והשם "דני אבדיה" עולה על המסך.',
  },
  career43: {
    title: '43 נקודות – שיא קריירה',
    date: '14.02.2024',
    usCity: 'וושינגטון (ET)',
    usTime: '19:00',
    ilTime: '02:00',
    line: 'שתיים בלילה, אמצע שבוע. מי שנשאר ער ראה את הערב הגדול של דני במדי וושינגטון.',
  },
  allstar: {
    title: 'משחק האולסטאר',
    date: '15.02.2026',
    usCity: 'לוס אנג\'לס (PT)',
    usTime: '17:00',
    ilTime: '03:00',
    line: 'שלוש לפנות בוקר. ישראלי ראשון במשחק האולסטאר – והמדינה כולה מחכה לבוקר כדי לדבר על זה.',
  },
};

// כל פריט כולל עונה/תאריך, והאם זה ממוצע למשחק או סך הכל
const TICKER_ITEMS = [
  'נולד ב־3.1.2001 בבית זרע',
  'בכורה במכבי ב־19.11.2017, בגיל 16 ו־320 ימים – הצעיר בתולדות המועדון',
  'MVP ליגת העל ⁦2019–20⁩ – הצעיר אי פעם',
  'MVP אליפות אירופה U20 ב־2019: ‏18.4 נק׳, 8.3 ריב׳, 5.3 אס׳ למשחק',
  'בחירה 9 בדראפט 2020 – הגבוהה ביותר לישראלי',
  'שיא קריירה: 43 נק׳ מול ניו אורלינס, 14.2.2024',
  'יורובאסקט 2025: ‏24.0 נק׳ למשחק וחמישיית המשנה של הטורניר',
  '⁦2025–26⁩: ‏24.2 נק׳, 6.9 ריב׳, 6.7 אס׳ למשחק (עונה סדירה)',
  '2026: הישראלי הראשון במשחק האולסטאר',
  'Play-In 2026: ‏41 נק׳ ו־12 אס׳ בניצחון על פיניקס',
];

const QUIZ = [
  {
    q: 'באיזו בחירה נבחר דני בדראפט 2020?',
    options: ['3', '9', '15', '23'],
    answer: 1,
    explain: 'בחירה 9 של וושינגטון – הגבוהה ביותר אי פעם של שחקן ישראלי.',
  },
  {
    q: 'מה הקשר בין 19.11.2017 ל־19.11.2020?',
    options: ['שני שיאי נקודות', 'בכורה במכבי ודראפט', 'שתי אליפויות', 'שני טריידים'],
    answer: 1,
    explain: 'באותו תאריך בדיוק, בהפרש של שלוש שנים: בכורה בבוגרים של מכבי, ואז הדראפט ל־NBA.',
  },
  {
    q: 'כמה נקודות למשחק קלע דני בעונת ⁦2025–26⁩?',
    options: ['14.7', '16.9', '20.1', '24.2'],
    answer: 3,
    explain: '24.2 נקודות למשחק בעונה הסדירה – העונה שהביאה אותו למשחק האולסטאר.',
  },
  {
    q: 'מי נבחר MVP של אליפות אירופה U20 בשנת 2019?',
    options: ['עמרי כספי', 'דני אבדיה', 'ניקולה יוקיץ\'', 'לאורי מרקאנן'],
    answer: 1,
    explain: 'דני, עם 18.4 נק׳, 8.3 ריב׳ ו־5.3 אס׳ למשחק, וזהב לישראל בתל אביב.',
  },
  {
    q: 'למי עבר דני בטרייד ביולי 2024?',
    options: ['פורטלנד', 'פיניקס', 'סן אנטוניו', 'ניו אורלינס'],
    answer: 0,
    explain: 'לפורטלנד טרייל בלייזרס, ושם הוא הפך לאולסטאר.',
  },
  {
    q: 'כמה אליפויות ליגה ברצף זכה דני עם מכבי תל אביב?',
    options: ['1', '2', '3', '4'],
    answer: 2,
    explain: 'שלוש ברצף: 2018, 2019 ו־2020.',
  },
  {
    q: 'מה הכינוי של דני?',
    options: ['The Hammer', 'Turbo', 'Air Israel', 'Big Game'],
    answer: 1,
    explain: '"Turbo" – הכינוי שמופיע בפרופיל שלו ב־Basketball-Reference.',
  },
];

// צילומים ברישיון פתוח מ־Wikimedia Commons (כתובות נבדקו: HTTP 200)
const PHOTOS = {
  maccabi: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Deni_Avdija_vs_Milano.jpg/960px-Deni_Avdija_vs_Milano.jpg',
    alt: 'דני אבדיה במדי מכבי תל אביב מול מילאנו',
    caption: 'מכבי מול מילאנו, יורוליג, נובמבר 2019',
    credit: '© Claudio Degaspari / Basketinside · CC BY-SA 2.0',
    page: 'https://commons.wikimedia.org/wiki/File:Deni_Avdija_vs_Milano.jpg',
    pos: 'center 30%',
  },
  israelYouth: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Deni_Avdija_dribbling.jpg/960px-Deni_Avdija_dribbling.jpg',
    alt: 'דני אבדיה מכדרר במדי נבחרת ישראל הצעירה',
    caption: 'נבחרת ישראל הצעירה מול ארגנטינה, מנהיים, אפריל 2018',
    credit: '© Sven Mandel · CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Deni_Avdija_dribbling.jpg',
    pos: 'center 20%',
  },
  wizardsRim: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Deni_Avdija_and_Nikola_Vucevic_battling_at_the_rim%2C_Wizards_vs_Bulls_on_January_1%2C_2022.jpg/960px-Deni_Avdija_and_Nikola_Vucevic_battling_at_the_rim%2C_Wizards_vs_Bulls_on_January_1%2C_2022.jpg',
    alt: 'דני אבדיה במדי וושינגטון נאבק מול ניקולה ווצ\'ביץ\' ליד הסל',
    caption: 'וושינגטון מול שיקגו, 1.1.2022',
    credit: '© All-Pro Reels · CC BY-SA 2.0',
    page: 'https://commons.wikimedia.org/wiki/File:Deni_Avdija_and_Nikola_Vucevic_battling_at_the_rim,_Wizards_vs_Bulls_on_January_1,_2022.jpg',
    pos: 'center 62%',
  },
  wizardsPlay: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Deni_Avdija_1.jpg/960px-Deni_Avdija_1.jpg',
    alt: 'דני אבדיה מוביל כדור במדי וושינגטון',
    caption: 'וושינגטון מול הקליפרס, 25.1.2022',
    credit: '© All-Pro Reels · CC BY-SA 2.0',
    page: 'https://commons.wikimedia.org/wiki/File:Deni_Avdija_1.jpg',
    pos: 'center 30%',
  },
};

// ציר הקריירה: כל תחנה עם אירועים מאומתים. ⚠ = דורש אימות (F05, F06)
const TIMELINE = [
  {
    year: '2013', label: 'נוער', tag: 'ההתחלה',
    title: 'מבני הרצליה לנוער מכבי',
    events: ['מתחיל לשחק בכיתה ד׳ בבני הרצליה ⚠', 'בגיל 12 עובר למחלקת הנוער של מכבי תל אביב ⚠'],
  },
  {
    year: '2017', label: 'בכורה', tag: 'MACCABI',
    title: 'הצעיר בתולדות מכבי',
    events: ['19.11.2017: בכורה בבוגרים מול נס ציונה', 'גיל 16 ו־320 ימים – השחקן הצעיר אי פעם במועדון'],
    big: '16', bigLabel: 'שנים, 320 ימים',
  },
  {
    year: '2018', label: 'זהב', tag: 'ISRAEL U20',
    title: 'זהב ראשון באירופה',
    events: ['מדליית זהב באליפות אירופה U20', 'MVP במחנה Basketball Without Borders Europe בבלגרד'],
    photo: 'israelYouth',
  },
  {
    year: '2019', label: 'MVP', tag: 'ISRAEL U20',
    title: 'זהב שני ו־MVP בתל אביב',
    events: ['92–84 על ספרד בגמר, 23 נק׳ לדני', 'MVP הטורניר: 18.4 נק׳, 8.3 ריב׳, 5.3 אס׳ למשחק', 'בכורה בנבחרת הבוגרת (פברואר)'],
    photo: 'maccabi',
  },
  {
    year: '2020', label: 'דראפט', tag: 'NBA DRAFT',
    title: 'MVP בישראל, בחירה 9 ב־NBA',
    events: ['MVP ליגת העל – הצעיר בהיסטוריה', 'אליפות שלישית ברצף עם מכבי', '19.11.2020: בחירה 9 של וושינגטון'],
    big: '9', bigLabel: 'בחירה בדראפט',
  },
  {
    year: '2022', label: 'יורובאסקט', tag: 'WASHINGTON · ISRAEL',
    title: 'מוביל את הנבחרת',
    events: ['יורובאסקט 2022: מוביל את ישראל בנקודות (14.6), בריבאונד (8.2) ובאסיסטים (4.6) למשחק'],
    photo: 'wizardsRim',
  },
  {
    year: '2024', label: 'טרייד', tag: 'WAS → POR',
    title: '43 נקודות, ואז פורטלנד',
    events: ['14.2.2024: שיא קריירה, 43 נק׳ מול ניו אורלינס', '6.7.2024: טרייד לפורטלנד טרייל בלייזרס'],
    photo: 'wizardsPlay',
  },
  {
    year: '2025', label: 'אירופה', tag: 'EUROBASKET',
    title: 'כוכב יורובאסקט',
    events: ['24.0 נק׳ למשחק ביורובאסקט 2025', 'חמישיית המשנה של הטורניר, לצד יוקיץ׳ ומרקאנן'],
    big: '24.0', bigLabel: 'נק׳ למשחק',
  },
  {
    year: '2026', label: 'All-Star', tag: 'PORTLAND',
    title: 'הישראלי הראשון באולסטאר',
    events: ['ינואר: שחקן השבוע במערב', 'פברואר: נבחר למשחק האולסטאר', 'אפריל: 41 נק׳ ב־Play-In ועלייה לפלייאוף'],
    big: '★', bigLabel: 'NBA ALL-STAR',
  },
];
