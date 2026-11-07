// 글의 소제목(h2)으로 오른쪽 목차를 만들고, 지금 읽는 소제목을 표시합니다.
(function () {
  var article = document.querySelector('.post');
  var toc = document.querySelector('.toc');
  if (!article || !toc) return;

  var headings = article.querySelectorAll('h2');
  if (headings.length < 2) return;

  var list = toc.querySelector('.toc-list');
  var links = [];

  headings.forEach(function (heading, index) {
    if (!heading.id) heading.id = 'section-' + (index + 1);
    var item = document.createElement('li');
    var link = document.createElement('a');
    link.href = '#' + heading.id;
    link.textContent = heading.textContent;
    item.appendChild(link);
    list.appendChild(item);
    links.push(link);
  });

  toc.hidden = false;

  function markCurrent() {
    var current = 0;
    headings.forEach(function (heading, index) {
      if (heading.getBoundingClientRect().top <= 120) current = index;
    });
    links.forEach(function (link, index) {
      link.classList.toggle('is-current', index === current);
    });
  }

  markCurrent();
  window.addEventListener('scroll', markCurrent, { passive: true });
})();
