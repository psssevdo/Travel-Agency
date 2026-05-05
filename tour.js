function getText(parent, selector) {
  const element = parent.querySelector(selector);
  return element ? element.textContent.trim() : '';
}

function parseXml(text) {
  const xml = new DOMParser().parseFromString(text, 'application/xml');
  const error = xml.querySelector('parsererror');

  if (error) {
    throw new Error('Ошибка в структуре XML-файла');
  }

  return xml;
}

function loadCities(xml) {
  const select = document.getElementById('citySelect');
  if (!select) return;

  select.innerHTML = '';
  const cities = Array.from(xml.querySelectorAll('departure-cities city'));
  const cityNames = cities.length ? cities.map(city => city.textContent.trim()) : ['Минск'];

  cityNames.forEach(name => {
    const option = document.createElement('option');
    option.textContent = name;
    select.appendChild(option);
  });
}

function getTourId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function getTourById(xml, id) {
  const tours = Array.from(xml.querySelectorAll('travel-agency > tour'));
  return tours.find(tour => tour.getAttribute('id') === id) || tours[0];
}

function fillSelect(selectId, items, fallbackText) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = '';

  if (!items.length && fallbackText) {
    const option = document.createElement('option');
    option.textContent = fallbackText;
    select.appendChild(option);
    return;
  }

  items.forEach(item => {
    const option = document.createElement('option');
    option.textContent = item.textContent.trim();
    select.appendChild(option);
  });
}

function renderDetails(tour) {
  const detailsContainer = document.getElementById('tourDetails');
  const sideDetails = document.getElementById('sideDetails');
  const details = Array.from(tour.querySelectorAll('details item'));

  detailsContainer.innerHTML = '';
  sideDetails.innerHTML = '';

  details.forEach(item => {
    const label = item.getAttribute('label') || '';
    const value = item.getAttribute('value') || '';

    const detail = document.createElement('div');
    detail.className = 'tour-detail';
    detail.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    detailsContainer.appendChild(detail);

    const sideItem = document.createElement('li');
    sideItem.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    sideDetails.appendChild(sideItem);
  });
}

function renderProgramme(tour) {
  const container = document.getElementById('tourProgramme');
  const days = Array.from(tour.querySelectorAll('programme day'));

  container.innerHTML = '';

  days.forEach(day => {
    const item = document.createElement('div');
    item.className = 'programme-day';
    item.innerHTML = `
      <div class="programme-day__number">День ${day.getAttribute('number') || ''}</div>
      <h3>${day.getAttribute('title') || ''}</h3>
      <p>${day.textContent.trim()}</p>
    `;
    container.appendChild(item);
  });
}

function renderList(tour, selector, listId, mark) {
  const list = document.getElementById(listId);
  const items = Array.from(tour.querySelectorAll(selector));

  list.innerHTML = '';

  items.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${mark}</span>${item.textContent.trim()}`;
    list.appendChild(li);
  });
}

// Функция галереи УДАЛЕНА

function renderTags(tour) {
  const container = document.getElementById('tourTags');
  const tags = Array.from(tour.querySelectorAll('tags tag'));

  container.innerHTML = '';

  tags.forEach(tag => {
    const span = document.createElement('span');
    span.textContent = tag.textContent.trim();
    container.appendChild(span);
  });
}

function renderTour(tour) {
  const country = getText(tour, 'country');
  const region = getText(tour, 'region');
  const tagline = getText(tour, 'tagline');
  const price = getText(tour, 'price');
  const image = getText(tour, 'image');
  const description = getText(tour, 'description');

  document.title = `Aydatur — ${country}`;
  document.getElementById('heroImage').src = image;
  document.getElementById('heroImage').alt = country;
  document.getElementById('tourCountry').textContent = country;
  document.getElementById('tourRegion').textContent = region;
  document.getElementById('tourTagline').textContent = tagline;
  document.getElementById('tourPrice').textContent = price;
  document.getElementById('sidePrice').textContent = price;
  document.getElementById('tourDescription').textContent = description;

  renderTags(tour);
  renderDetails(tour);
  renderProgramme(tour);
  renderList(tour, 'included item', 'includedList', '✓');
  renderList(tour, 'excluded item', 'excludedList', '×');
  // Вызов renderGallery УДАЛЕН

  fillSelect('dateSelect', Array.from(tour.querySelectorAll('dates date')), 'Уточнить у менеджера');
  fillSelect('nightSelect', Array.from(tour.querySelectorAll('nightOptions option')), 'Стандартный вариант');

  const bookingBtn = document.getElementById('bookingBtn');
  bookingBtn.onclick = function () {
    const date = document.getElementById('dateSelect').value;
    const nights = document.getElementById('nightSelect').value;
    const name = document.getElementById('clientName').value.trim() || 'гость';
    alert(`Заявка принята!\nТур: ${country}\nДата: ${date}\nНочей: ${nights}\nИмя: ${name}`);
  };
}

function showError(message) {
  const page = document.getElementById('tourPage');
  page.innerHTML = `
    <div class="tour-message">
      <h1>Не удалось открыть тур</h1>
      <p>${message}. Проверьте файл data.xml и запускайте сайт через Live Server.</p>
      <a href="tours.html">Вернуться к списку туров</a>
    </div>
  `;
}

fetch('data.xml')
  .then(response => {
    if (!response.ok) throw new Error('Файл data.xml не найден');
    return response.text();
  })
  .then(text => {
    const xml = parseXml(text);
    loadCities(xml);
    const tour = getTourById(xml, getTourId());

    if (!tour) {
      throw new Error('В XML нет ни одного тура');
    }

    renderTour(tour);
  })
  .catch(error => {
    const select = document.getElementById('citySelect');
    if (select) {
      select.innerHTML = '<option>Минск</option>';
    }

    showError(error.message);
  });