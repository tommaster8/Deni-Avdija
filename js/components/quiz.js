// חידון הסיום
GN.quiz = (() => {
  const { $ } = GN;
  let index = 0;
  let score = 0;

  function render() {
    const opts = $('quiz-options');
    opts.innerHTML = '';
    $('quiz-explain').textContent = '';
    $('quiz-next').hidden = true;

    if (index >= QUIZ.length) {
      $('quiz-q').textContent = score === QUIZ.length ? 'FINAL: ניקוד מושלם! 🏆' : `FINAL: ${score} מתוך ${QUIZ.length}`;
      const again = document.createElement('button');
      again.type = 'button';
      again.textContent = '⟲ שחקו שוב';
      again.addEventListener('click', () => { index = 0; score = 0; $('quiz-score').textContent = 0; render(); });
      opts.appendChild(again);
      return;
    }

    const item = QUIZ[index];
    $('quiz-q').textContent = `${index + 1}. ${item.q}`;
    item.options.forEach((text, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.addEventListener('click', () => answer(b, i, item));
      opts.appendChild(b);
    });
  }

  function answer(button, i, item) {
    [...$('quiz-options').children].forEach((o, j) => {
      o.disabled = true;
      if (j === item.answer) o.classList.add('correct');
    });
    if (i === item.answer) $('quiz-score').textContent = ++score;
    else button.classList.add('wrong');
    $('quiz-explain').textContent = item.explain;
    $('quiz-next').textContent = index === QUIZ.length - 1 ? 'לתוצאה ←' : 'הבא ←';
    $('quiz-next').hidden = false;
  }

  function init() {
    $('quiz-total').textContent = QUIZ.length;
    $('quiz-next').addEventListener('click', () => { index++; render(); });
    render();
  }

  return { init };
})();
