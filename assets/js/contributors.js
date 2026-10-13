'use strict';

var yumRepo = 'https://repo.secops-content.forticloud.com';
var basePath = 'https://fortisoar.contenthub.fortinet.com/';

init();

function init() {
  var _jsonPath = yumRepo + '/content-hub/participants.json';
  fetch(_jsonPath)
    .then(response => response.json())
    .then(data => {
      const container = document.getElementById('contributors');
      data.sort((a, b) => b.contributions - a.contributions);
      data.forEach(contributor => {
        const card = document.createElement('div');
        card.classList.add('cardDiv');
        card.classList.add('background-color-primary');
        card.classList.add('card-border');
        card.innerHTML = `
        <a href="${contributor.html_url}" target="_blank">
          <img class="avatar" src="${contributor.avatar_url}" alt="${contributor.login}" />
          <div class="name">${contributor.login}</div>
        </a>
        <div class="contributions text-light">${contributor.contributions} repo${contributor.contributions > 1 ? 's' : ''}</div>
      `;
        container.appendChild(card);
      });
    });
    showHomePageLink();
}

function showHomePageLink(){
  setTimeout(function () {
    $('#topbar-home-link').removeClass('d-none');
    $('#topbar-home-link').addClass('d-inline-block');
  }, 10);
}

