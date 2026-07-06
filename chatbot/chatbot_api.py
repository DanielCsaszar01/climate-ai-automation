from dotenv import load_dotenv
load_dotenv()  # Ez betölti a .env fájlt

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from groq import Groq

app = Flask(__name__)
CORS(app)

# Initialize Groq client
groq_api_key = os.getenv('GROQ_API_KEY', '')
if not groq_api_key:
    print("⚠️  GROQ_API_KEY nincs beállítva!")

client = Groq(api_key=groq_api_key)

# Load data
products_data = []
services_data = []
faq_data = []
company_info = {}

def load_data():
    """Betöltse az adatokat JSON fájlokból"""
    global products_data, services_data, faq_data, company_info
    
    try:
        with open('data/products.json', 'r', encoding='utf-8') as f:
            products_data = json.load(f)
        with open('data/services.json', 'r', encoding='utf-8') as f:
            services_data = json.load(f)
        with open('data/faq.json', 'r', encoding='utf-8') as f:
            faq_data = json.load(f)
        with open('data/company_info.json', 'r', encoding='utf-8') as f:
            company_info = json.load(f)
        print("✅ Adatok sikeresen betöltve!")
    except FileNotFoundError as e:
        print(f"❌ Hiba az adatok betöltésénél: {e}")

def create_system_prompt():
    """Létrehozza a system promptot az adatok alapján"""
    def _as_int(value):
        if isinstance(value, bool):
            return None
        if isinstance(value, (int, float)):
            return int(value)
        if isinstance(value, str):
            cleaned = value.strip().replace(" ", "").replace(",", "")
            if cleaned.isdigit():
                return int(cleaned)
        return None

    def _format_price(value):
        parsed = _as_int(value)
        if parsed is not None:
            return f"{parsed:,} Ft"
        return str(value) if value not in (None, "") else "N/A"

    products_text = "\n".join([
        f"- {p.get('name', 'Ismeretlen termék')} ({p.get('brand', 'Ismeretlen márka')}): "
        f"{p.get('cooling_capacity_btu', 'N/A')}, {_format_price(p.get('price', p.get('ar')))}, "
        f"Energia: {p.get('energy_class', 'N/A')}"
        for p in products_data
    ])

    services_text = "\n".join([
        f"- {s.get('name', 'Ismeretlen szolgáltatás')}: "
        f"{(_format_price(s.get('price', s.get('base_price', s.get('ar')))) if (_as_int(s.get('price', s.get('base_price', s.get('ar')))) or 0) > 0 else 'Ár a munka után')} "
        f"({s.get('duration_hours', 'N/A')})"
        for s in services_data
    ])

    faq_text = "\n".join([
        f"Q: {faq.get('question', 'N/A')}\nA: {faq.get('answer', 'N/A')}\n"
        for faq in faq_data
    ])
    
    system_prompt = f"""Te egy segítőkész AI asszisztens vagy a KlímaProfi Kft. számára.

CÉG ADATOK:
- Név: {company_info.get('company', {}).get('name', 'KlímaProfi Kft.')}
- Telefon: {company_info.get('company', {}).get('contact', {}).get('phone', '+36 1 234 5678')}
- Email: {company_info.get('company', {}).get('contact', {}).get('email', 'info@klimaprofi.hu')}

TERMÉKEK:
{products_text}

SZOLGÁLTATÁSOK:
{services_text}

GYAKORAN ISMÉTELT KÉRDÉSEK:
{faq_text}

SZABÁLYOK:
- Csak a fentebbi termékekre és szolgáltatásokra válaszolj
- Ha valami nem szerepel, jelezd és ajánld fel a kapcsolatfelvetelt
- Barátságos, segítőkész hangnemben kommunikálj
- Magyar nyelven válaszolj
- Ha szobaméretet vagy egyéb igényt ír le a vásárló, ajánld a megfelelő klímát
- A szobaméretek alapján:
  * 12-20 m²: Midea Inverter Easy (9000 BTU) vagy LG Standard Plus (12000 BTU)
  * 20-35 m²: LG Standard Plus (12000 BTU)
  * 35-55 m²: Daikin Perfera Plus (18000 BTU)
  * 50-80 m²: Fujitsu Slim Design (24000 BTU)
- Minden klímára 5-10 év gyártói garancia, telepítésre 2 év garancia
"""
    return system_prompt

@app.route('/api/chat', methods=['POST'])
def chat():
    """Chatbot endpoint"""
    try:
        data = request.json
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({"error": "Üres üzenet"}), 400
        
        if not groq_api_key:
            return jsonify({"error": "GROQ_API_KEY nincs beállítva"}), 500
        
        # System prompt az adatok alapján
        system_prompt = create_system_prompt()
        
        # Groq API call
        response = client.chat.completions.create(
            model="mixtral-8x7b-32768",  # Ingyen modell
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        bot_response = response.choices[0].message.content
        
        return jsonify({
            "success": True,
            "response": bot_response
        })
    
    except Exception as e:
        print(f"❌ Hiba a chatbot-ban: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({"status": "ok", "message": "KlímaProfi chatbot API fut!"})

@app.route('/', methods=['GET'])
def home():
    """Root endpoint"""
    return jsonify({
        "app": "KlímaProfi Chatbot API",
        "version": "1.0",
        "endpoints": {
            "/api/chat": "POST - Chatbot üzenet",
            "/api/health": "GET - Health check"
        }
    })

if __name__ == '__main__':
    load_data()
    port = int(os.getenv('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
