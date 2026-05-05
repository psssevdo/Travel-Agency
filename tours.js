function getText(parent, selector) {
  const element = parent.querySelector(selector);
  return element ? element.textContent.trim() : '';
}

function getTours(xml) {
  return Array.from(xml.querySelectorAll('travel-agency > tour'));
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

function createTourCard(tour) {
  const id = tour.getAttribute('id');
  const country = getText(tour, 'country');
  const description = getText(tour, 'description');
  const price = getText(tour, 'price');
  const image = getText(tour, 'image');

  const card = document.createElement('article');
  card.className = 'card';

  card.innerHTML = `
    <img src="${image}" alt="${country}" loading="lazy">
    <div class="card-title">${country}</div>
    <p class="card-desc">${description}</p>
    <div class="card-footer">
      <span class="card-price">${price}</span>
      <a class="card-btn" href="tour.html?id=${encodeURIComponent(id)}">Подробнее</a>
    </div>
  `;

  return card;
}

// Функция для определения реального региона по стране (без отдельной группы для Турции)
function getRealRegion(country, originalRegion) {
  // Европа
  if (country === 'Италия' || country === 'Франция' || country === 'Испания' || country === 'Германия') {
    return 'Туры в Европу';
  }
  // Азия (включая Турцию)
  if (country === 'Турция' || country === 'Таиланд' || country === 'Япония' || country === 'Бали' || country === 'Вьетнам') {
    return 'Туры в Азию';
  }
  // Африка
  if (country === 'Египет' || country === 'Марокко' || country === 'Кения' || country === 'Тунис') {
    return 'Туры в Африку';
  }
  // Америка
  if (country === 'США' || country === 'Бразилия' || country === 'Канада' || country === 'Мексика') {
    return 'Туры в Америку';
  }
  
  // Если страна не распознана, используем оригинальный регион (но не "Лучшие туры")
  return (originalRegion === 'Лучшие туры') ? 'Другие туры' : originalRegion;
}

function renderTours(xml) {
  const container = document.getElementById('toursContainer');
  const tours = getTours(xml);

  if (!container) return;

  if (!tours.length) {
    container.innerHTML = '<div class="page-title"><span>Туры не найдены</span></div>';
    return;
  }

  container.innerHTML = '';

  const groups = [];
  tours.forEach(tour => {
    const country = getText(tour, 'country');
    const originalRegion = getText(tour, 'region');
    const region = getRealRegion(country, originalRegion);
    
    let group = groups.find(item => item.region === region);

    if (!group) {
      group = { region: region, tours: [] };
      groups.push(group);
    }

    group.tours.push(tour);
  });

  // Сортируем группы: Европа → Азия → Африка → Америка → Другие
  const regionOrder = ['Туры в Европу', 'Туры в Азию', 'Туры в Африку', 'Туры в Америку', 'Другие туры'];
  groups.sort((a, b) => {
    const indexA = regionOrder.indexOf(a.region);
    const indexB = regionOrder.indexOf(b.region);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  groups.forEach(group => {
    const title = document.createElement('div');
    title.className = 'page-title';
    title.innerHTML = `<span>${group.region}</span>`;
    container.appendChild(title);

    const section = document.createElement('section');
    section.className = 'slider-section';
    section.innerHTML = `
      <div class="slider-wrapper">
        <button class="slider-btn prev" type="button" onclick="slide(this, -1)">&#8249;</button>
        <div class="slider-track"></div>
        <button class="slider-btn next" type="button" onclick="slide(this, 1)">&#8250;</button>
      </div>
    `;

    const track = section.querySelector('.slider-track');
    group.tours.forEach(tour => track.appendChild(createTourCard(tour)));
    container.appendChild(section);
  });
}

function slide(btn, dir) {
  const track = btn.parentElement.querySelector('.slider-track');
  const card = track.querySelector('.card');
  if (!track || !card) return;

  const gap = 16;
  const step = card.offsetWidth + gap;
  track.scrollBy({ left: dir * step, behavior: 'smooth' });
}

function showError(message) {
  const container = document.getElementById('toursContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="page-title"><span>Не удалось загрузить туры</span></div>
    <div class="xml-error">${message}. Проверьте файл data.xml и запускайте сайт через Live Server.</div>
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
    renderTours(xml);
  })
  .catch(error => {
    const select = document.getElementById('citySelect');
    if (select) {
      select.innerHTML = '<option>Минск</option>';
    }

    showError(error.message);
  });