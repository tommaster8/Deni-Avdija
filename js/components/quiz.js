// חידון הסיום: שאלה אחת בכל פעם, משוב מיידי, ניקוד, ומסך סיכום עם סקירת תשובות.
GN.quiz = (() => {
  const { $ } = GN;
  let index = 0;
  let score = 0;
  let answers = []; // { chosen, correct } לכל שאלה

  const RATINGS = [
    { min: 1, text: 'MVP! ניקוד מושלם 🏆' },
    { min: 0.7, text: 'All-Star. אתם מכירים את דני היטב ★' },
    { min: 0.4, text: 'שחקן רוטציה. עוד צפייה אחת במצגת ואתם בחמישייה.' },
    { min: 0, text: 'רוקי. שווה לעבור שוב על המצגת 😉' },
  ];

  function setProgress() {
    $('quiz-progress').style.width = `${(answers.length / QUIZ.length) * 100}%`;
    $('quiz-step').textContent = index < QUIZ.length ? `שאלה ${index + 1} מתוך ${QUIZ.length}` : 'סיום';
  }

  function renderQuestion() {
    const item = QUIZ[index];
    $('quiz-body').hidden = false;
    $('quiz-summary').hidden = true;
    $('quiz-q').textContent = item.q;
    $('quiz-explain').textContent = '';
    $('quiz-explain').className = 'quiz-explain';
    $('quiz-next').hidden = true;
    const opts = $('quiz-options');
    opts.innerHTML = '';
    item.options.forEach((text, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<span class="opt-key">${'אבגד'[i]}</span>${text}`;
      b.addEventListener('click', () => answer(b, i));
      opts.appendChild(b);
    });
    opts.classList.remove('in');
    void opts.offsetWidth;
    opts.classList.add('in');
    setProgress();
  }

  function answer(button, i) {
    const item = QUIZ[index];
    const correct = i === item.answer;
    [...$('quiz-options').children].forEach((o, j) => {
      o.disabled = true;
      if (j === item.answer) o.classList.add('correct');
    });
    if (correct) {
      GN.tween($('quiz-score'), score, score + 1, { duration: 400 });
      score++;
    } else {
      button.classList.add('wrong');
    }
    answers.push({ chosen: i, correct });
    $('quiz-explain').textContent = `${correct ? '✓ נכון! ' : '✗ לא בדיוק. '}${item.explain}`;
    $('quiz-explain').className = `quiz-explain ${correct ? 'ok' : 'bad'}`;
    $('quiz-next').textContent = index === QUIZ.length - 1 ? 'לתוצאות ←' : 'השאלה הבאה ←';
    $('quiz-next').hidden = false;
    $('quiz-next').focus({ preventScroll: true });
    setProgress();
  }

  function renderSummary() {
    $('quiz-body').hidden = true;
    $('quiz-summary').hidden = false;
    const ratio = score / QUIZ.length;
    GN.tween($('quiz-final'), 0, score, { duration: 800 });
    $('quiz-rating').textContent = RATINGS.find((r) => ratio >= r.min).text;
    $('quiz-review').innerHTML = QUIZ.map((q, i) => {
      const a = answers[i];
      return `<li class="${a.correct ? 'ok' : 'bad'}"><span>${a.correct ? '✓' : '✗'}</span>
        <div>${q.q}<small>התשובה הנכונה: ${q.options[q.answer]}${a.correct ? '' : ` · בחרתם: ${q.options[a.chosen]}`}</small></div></li>`;
    }).join('');
    setProgress();
    $('quiz-restart').focus({ preventScroll: true });
  }

  function restart() {
    index = 0;
    score = 0;
    answers = [];
    $('quiz-score').textContent = '0';
    renderQuestion();
  }

  function init() {
    $('quiz-total').textContent = QUIZ.length;
    $('quiz-final-total').textContent = QUIZ.length;
    $('quiz-next').addEventListener('click', () => {
      index++;
      index < QUIZ.length ? renderQuestion() : renderSummary();
    });
    $('quiz-restart').addEventListener('click', restart);
    restart();
  }

  return { init, restart };
})();
