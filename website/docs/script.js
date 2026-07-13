let productsData = [];
let servicesData = [];
let faqData = [];
let companyInfo = {};

const DATA_SOURCES = [
    '../data',
    '/data',
    'https://raw.githubusercontent.com/DanielCsaszar01/climate-ai-automation/main/data'
];

const SERVICE_VISUALS = {
    installation: 'assets/intro-installation.jpg',
    maintenance: 'assets/service-maintenance.jpg',
    repair: 'assets/service-repair.jpg',
    consultation: 'assets/hero-split-ac.jpg',
    package: 'assets/service-commercial-install.jpg',
    default: 'assets/hero-split-ac.jpg'
};

const IMAGE_FALLBACK = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" role="img" aria-label="KlímaProfi kép helyőrző">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#0a84ff"/>
          <stop offset="100%" stop-color="#11c5ff"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="#eaf4ff"/>
      <circle cx="960" cy="160" r="120" fill="url(#g)" opacity="0.18"/>
      <circle cx="220" cy="620" r="160" fill="url(#g)" opacity="0.12"/>
      <rect x="130" y="160" width="940" height="480" rx="44" fill="#ffffff" stroke="#b9d8ff" stroke-width="8"/>
      <rect x="210" y="260" width="360" height="180" rx="28" fill="#dfefff"/>
      <rect x="640" y="260" width="360" height="28" rx="14" fill="#c7e4ff"/>
      <rect x="640" y="320" width="300" height="28" rx="14" fill="#c7e4ff"/>
      <rect x="640" y="380" width="220" height="28" rx="14" fill="#c7e4ff"/>
      <text x="130" y="705" font-family="Segoe UI, Arial, sans-serif" font-size="42" fill="#0b5fbf" font-weight="700">KlímaProfi</text>
      <text x="130" y="748" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="#5e7187">Kép helyőrző, ha a külső fotó nem töltene be</text>
    </svg>
`)}`;

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    renderHeroStats();
    renderProducts();
    renderServices();
    renderFAQ();
});

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatHuf(value) {
    const number = Number(value);
    return Number.isFinite(number) ? `${number.toLocaleString('hu-HU')} Ft` : 'N/A';
}

async function fetchJson(baseUrl, fileName) {
    const response = await fetch(`${baseUrl}/${fileName}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} while loading ${fileName} from ${baseUrl}`);
    }
    return response.json();
}

async function loadData() {
    for (const baseUrl of DATA_SOURCES) {
        try {
            const [products, services, faq, company] = await Promise.all([
                fetchJson(baseUrl, 'products.json'),
                fetchJson(baseUrl, 'services.json'),
                fetchJson(baseUrl, 'faq.json'),
                fetchJson(baseUrl, 'company_info.json')
            ]);

            productsData = products;
            servicesData = services;
            faqData = faq;
            companyInfo = company;
            console.log(`✅ Adatok sikeresen betöltve innen: ${baseUrl}`);
            return;
        } catch (error) {
            console.warn(`⚠️ Nem sikerült betölteni innen: ${baseUrl}`, error);
        }
    }

    console.error('❌ Az összes adatforrás betöltése sikertelen volt.');
}

function renderHeroStats() {
    const company = companyInfo.company || {};
    const founded = Number(company.founded);
    const years = Number.isFinite(founded) ? Math.max(new Date().getFullYear() - founded, 0) : 0;

    const bindings = {
        'stat-products': productsData.length,
        'stat-services': servicesData.length,
        'stat-years': `${years}+`,
        'stat-area': company.services_area || 'Budapest'
    };

    Object.entries(bindings).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

function productImage(product) {
    return product.image_url || SERVICE_VISUALS.default;
}

function attachImageFallbacks() {
    document.querySelectorAll('.product-card img, .service-card img, .hero-image-card img, .intro-image-frame img').forEach(img => {
        img.addEventListener('error', () => {
            if (img.dataset.fallbackApplied === 'true') {
                return;
            }
            img.dataset.fallbackApplied = 'true';
            img.src = IMAGE_FALLBACK;
        });
    });
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    grid.innerHTML = productsData.map(product => {
        const features = Array.isArray(product.features) ? product.features : [];
        const stockClass = product.in_stock ? 'in-stock' : 'out-of-stock';

        return `
            <article class="product-card">
                <div class="product-media">
                    <img src="${escapeHtml(productImage(product))}" alt="${escapeHtml(product.name)} képe" loading="lazy" decoding="async">
                    <div class="product-badges">
                        <span class="badge ${stockClass}">${product.in_stock ? 'Raktáron' : 'Elfogyott'}</span>
                        <span class="badge soft">${escapeHtml(product.energy_class || 'Energiaosztály')}</span>
                    </div>
                </div>
                <div class="product-body">
                    <p class="eyebrow">${escapeHtml(product.brand)} • ${escapeHtml(product.type || 'inverter')}</p>
                    <h3>${escapeHtml(product.name)}</h3>
                    <p class="product-description">${escapeHtml(product.description)}</p>

                    <div class="spec-chips">
                        <span>🌡️ ${escapeHtml(product.cooling_capacity_btu)}</span>
                        <span>🔊 ${escapeHtml(product.noise_level)} dB</span>
                        <span>📏 ${escapeHtml(product.room_size_min)}-${escapeHtml(product.room_size_max)} m²</span>
                    </div>

                    <div class="price-row">
                        <span class="price">${formatHuf(product.price)}</span>
                        <span class="product-cta-note">Szakszerű telepítéssel</span>
                    </div>

                    <div class="feature-tags">
                        ${features.map(item => `<span>${escapeHtml(item)}</span>`).join('')}
                    </div>

                    <button class="ghost-btn" onclick="scrollToSection('kapcsolat')">Ajánlatot kérek</button>
                </div>
            </article>
        `;
    }).join('');

    attachImageFallbacks();
}

function serviceImage(service) {
    return SERVICE_VISUALS[service.type] || SERVICE_VISUALS.default;
}

function renderServices() {
    const grid = document.getElementById('services-grid');
    if (!grid) return;

    const labels = {
        installation: 'Telepítés',
        maintenance: 'Karbantartás',
        repair: 'Szerviz',
        consultation: 'Tanácsadás',
        package: 'Csomag'
    };

    grid.innerHTML = servicesData.map(service => `
        <article class="service-card">
            <div class="service-media">
                <img src="${escapeHtml(serviceImage(service))}" alt="${escapeHtml(service.name)} illusztráció" loading="lazy" decoding="async">
                <span class="service-type">${escapeHtml(labels[service.type] || service.type)}</span>
            </div>
            <div class="service-body">
                <h3>${escapeHtml(service.name)}</h3>
                <p>${escapeHtml(service.description)}</p>

                <div class="service-meta">
                    <span>⏱️ ${escapeHtml(service.duration_hours)} óra</span>
                    <span>${service.base_price > 0 ? formatHuf(service.base_price) : 'Egyedi árazás'}</span>
                </div>

                ${Array.isArray(service.includes) && service.includes.length ? `
                    <h4>Tartalmazza</h4>
                    <ul>
                        ${service.includes.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
                    </ul>
                ` : ''}

                ${service.frequency_recommended ? `<p class="service-note">Ajánlott: ${escapeHtml(service.frequency_recommended)}</p>` : ''}
            </div>
        </article>
    `).join('');

    attachImageFallbacks();
}

function renderFAQ() {
    const container = document.getElementById('faq-container');
    if (!container) return;

    container.innerHTML = faqData.map((item, index) => `
        <div class="faq-item" data-index="${index}">
            <div class="faq-question">
                <h4>${escapeHtml(item.question)}</h4>
                <span class="faq-toggle">▼</span>
            </div>
            <div class="faq-answer">
                <p>${escapeHtml(item.answer)}</p>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            faqItem.classList.toggle('active');
        });
    });
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

console.log('🚀 KlímaProfi weboldal betöltve!');
console.log('💬 A chatbot widget a chatbot_widget.js-ből töltődik be!');
