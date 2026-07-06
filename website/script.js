// Data loading
let productsData = [];
let servicesData = [];
let faqData = [];
let companyInfo = {};

// Base URL for data files (GitHub raw)
const DATA_BASE_URL = 'https://raw.githubusercontent.com/DanielCsaszar01/climate-ai-automation/main/data';

// Load data on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    renderProducts();
    renderServices();
    renderFAQ();
});

// Load all data from JSON files
async function loadData() {
    try {
        const [products, services, faq, company] = await Promise.all([
            fetch(`${DATA_BASE_URL}/products.json`).then(r => r.json()),
            fetch(`${DATA_BASE_URL}/services.json`).then(r => r.json()),
            fetch(`${DATA_BASE_URL}/faq.json`).then(r => r.json()),
            fetch(`${DATA_BASE_URL}/company_info.json`).then(r => r.json())
        ]);
        
        productsData = products;
        servicesData = services;
        faqData = faq;
        companyInfo = company;
        
        console.log('✅ Adatok sikeresen betöltve!');
    } catch (error) {
        console.error('❌ Hiba az adatok betöltésekor:', error);
    }
}

// Render Products
function renderProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = productsData.map(product => `
        <div class="product-card">
            <div class="badge ${!product.in_stock ? 'out-of-stock' : ''}">
                ${product.in_stock ? '✓ Raktáron' : '❌ Elfogyott'}
            </div>
            <h3>${product.name}</h3>
            <p class="brand">Márka: <strong>${product.brand}</strong></p>
            
            <div class="specs">
                <p>🌡️ <strong>Hűtőkapacitás:</strong> ${product.cooling_capacity_btu}</p>
                <p>💨 <strong>Fűtőkapacitás:</strong> ${product.heating_capacity} W</p>
                <p>🔊 <strong>Zajszint:</strong> ${product.noise_level} dB</p>
                <p>📏 <strong>Szobaméretek:</strong> ${product.room_size_min}-${product.room_size_max} m²</p>
                <p>⚡ <strong>Energiaosztály:</strong> ${product.energy_class}</p>
            </div>
            
            <p class="price">${product.price.toLocaleString('hu-HU')} Ft</p>
            <p>${product.description}</p>
            
            <div style="margin-top: 1rem; font-size: 0.85rem; color: #666;">
                <p>✓ ${product.features.join('<br>✓ ')}</p>
            </div>
        </div>
    `).join('');
}

// Render Services
function renderServices() {
    const grid = document.getElementById('services-grid');
    grid.innerHTML = servicesData.map(service => `
        <div class="service-card">
            <span class="service-type">${service.type}</span>
            <h3>${service.name}</h3>
            <p>${service.description}</p>
            
            ${service.base_price > 0 ? `<p class="price">${service.base_price.toLocaleString('hu-HU')} Ft</p>` : '<p class="price" style="color: #ff6b6b;">Ár a munkát követően</p>'}
            
            <p><strong>⏱️ Időtartam:</strong> ${service.duration_hours}</p>
            
            ${service.includes ? `
                <h4 style="margin-top: 1rem; color: #0099ff;">Tartalmazott:</h4>
                <ul>
                    ${service.includes.map(item => `<li>${item}</li>`).join('')}
                </ul>
            ` : ''}
            
            ${service.frequency_recommended ? `<p style="margin-top: 1rem; font-style: italic; color: #666;">💡 Ajánlott: ${service.frequency_recommended}</p>` : ''}
        </div>
    `).join('');
}

// Render FAQ
function renderFAQ() {
    const container = document.getElementById('faq-container');
    container.innerHTML = faqData.map((item, index) => `
        <div class="faq-item" data-index="${index}">
            <div class="faq-question">
                <h4>${item.question}</h4>
                <span class="faq-toggle">▼</span>
            </div>
            <div class="faq-answer">
                <p>${item.answer}</p>
            </div>
        </div>
    `).join('');
    
    // Add click handlers to FAQ items
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            faqItem.classList.toggle('active');
        });
    });
}

// Scroll to section
function scrollTo(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

console.log('🚀 KlímaProfi weboldal betöltve!');
console.log('💬 A chatbot widget a chatbot_widget.js-ből töltődik be!');
