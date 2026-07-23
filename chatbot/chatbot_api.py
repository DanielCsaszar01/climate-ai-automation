from dotenv import load_dotenv
import os
import json
import httpx
import re
import unicodedata
from groq import Groq
from flask import Flask, request, jsonify
from flask_cors import CORS

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# --- Groq Client Initialization with Workaround ---
# The groq library has a bug where it incorrectly handles system proxy settings.
# To bypass this, we explicitly create our own httpx client with proxy handling disabled
# and pass it to the Groq client.
cloud_api_key = os.getenv('CLOUD_API_KEY', '')
if not cloud_api_key:
    print("⚠️  CLOUD_API_KEY is not set!")

client = None
if cloud_api_key:
    # Create a custom httpx client that does NOT use environment proxies
    custom_httpx_client = httpx.Client(trust_env=False)

    # Initialize the Groq client, passing in our custom, clean http_client
    client = Groq(api_key=cloud_api_key, http_client=custom_httpx_client)
    print("✅ Groq client initialized successfully (with proxy bug workaround).")
else:
    print("ℹ️  Groq API kulcs nélkül helyi tartalék válaszokat használunk.")


# --- Data Loading ---
products_data = []
services_data = []
faq_data = []
company_info = {}

def load_data():
    """Loads data from JSON files using absolute paths."""
    global products_data, services_data, faq_data, company_info

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)

    data_paths = {
        "products": os.path.join(project_root, 'data', 'products.json'),
        "services": os.path.join(project_root, 'data', 'services.json'),
        "faq": os.path.join(project_root, 'data', 'faq.json'),
        "company_info": os.path.join(project_root, 'data', 'company_info.json')
    }

    try:
        with open(data_paths["products"], 'r', encoding='utf-8') as f:
            products_data = json.load(f)
        with open(data_paths["services"], 'r', encoding='utf-8') as f:
            services_data = json.load(f)
        with open(data_paths["faq"], 'r', encoding='utf-8') as f:
            faq_data = json.load(f)
        with open(data_paths["company_info"], 'r', encoding='utf-8') as f:
            company_info = json.load(f)
        print("✅ Data loaded successfully!")
    except FileNotFoundError as e:
        print(f"❌ Error loading data: {e}")
    except Exception as e:
        print(f"❌ An unexpected error occurred during data loading: {e}")

load_data()

def create_system_prompt():
    """Creates the system prompt based on the loaded data."""
    # This function remains the same, so it's shortened for brevity in this view
    def _as_int(value):
        if isinstance(value, bool): return None
        if isinstance(value, (int, float)): return int(value)
        if isinstance(value, str):
            cleaned = value.strip().replace(" ", "").replace(",", "")
            if cleaned.isdigit(): return int(cleaned)
        return None

    def _format_price(value):
        parsed = _as_int(value)
        return f"{parsed:,} Ft" if parsed is not None else (str(value) if value not in (None, "") else "N/A")

    products_text = "\n".join([f"- {p.get('name', 'N/A')} ({p.get('brand', 'N/A')}): {_format_price(p.get('price', p.get('ar')))}" for p in products_data])
    services_text = "\n".join([f"- {s.get('name', 'N/A')}: {_format_price(s.get('price', s.get('base_price', s.get('ar'))))}" for s in services_data])
    faq_text = "\n".join([f"Q: {faq.get('question', 'N/A')}\nA: {faq.get('answer', 'N/A')}" for faq in faq_data])
    
    return f"""Te egy segítőkész AI asszisztens vagy a KlímaProfi Kft. számára.

CÉG ADATOK:
- Név: {company_info.get('company', {}).get('name', 'KlímaProfi Kft.')}
- Telefon: {company_info.get('company', {}).get('contact', {}).get('phone', 'N/A')}
- Email: {company_info.get('company', {}).get('contact', {}).get('email', 'N/A')}

TERMÉKEK:
{products_text}

SZOLGÁLTATÁSOK:
{services_text}

GYAKORAN ISMÉTELT KÉRDÉSEK:
{faq_text}

SZABÁLYOK:
- Csak a fentebbi adatok alapján válaszolj.
- Ha valamire nem tudod a választ, jelezd, hogy az az információ nem áll rendelkezésre, és ajánld fel a kapcsolatfelvételt.
- Barátságos, segítőkész hangnemben, magyarul kommunikálj.
- Ha szobaméretet vagy igényt ad meg a felhasználó, ajánlj a BTU érték alapján klímát.
  * 12-20 m²: ~9000 BTU
  * 20-35 m²: ~12000 BTU
  * 35-55 m²: ~18000 BTU
  * 50-80 m²: ~24000 BTU
"""

def _normalize_text(value):
    if not value:
        return ""
    normalized = unicodedata.normalize("NFKD", str(value)).encode("ascii", "ignore").decode("ascii")
    return normalized.lower()


def _format_huf(value):
    try:
        return f"{int(float(value)):,} Ft"
    except (TypeError, ValueError):
        return "N/A"


def _find_best_product_for_area(area_m2):
    if area_m2 is None or not products_data:
        return None

    if area_m2 <= 20:
        target_btu = 9000
    elif area_m2 <= 35:
        target_btu = 12000
    elif area_m2 <= 55:
        target_btu = 18000
    else:
        target_btu = 24000

    return sorted(products_data, key=lambda p: abs((p.get('cooling_capacity') or 0) - target_btu))[0]


def generate_local_response(user_message):
    message = _normalize_text(user_message)

    area_match = re.search(r'(\d+(?:[\.,]\d+)?)\s*(?:m2|m\u00b2|nm)', message)
    btu_match = re.search(r'(\d{4,5})\s*btu', message)

    if area_match:
        area_m2 = float(area_match.group(1).replace(',', '.'))
        product = _find_best_product_for_area(area_m2)
        if product:
            installation = next((s for s in services_data if s.get('type') == 'installation'), None)
            return (
                f"{area_m2:g} m²-hez a {product.get('name', 'ajánlott klíma')} jó választás. "
                f"Kapacitás: {product.get('cooling_capacity_btu', 'N/A')}, ár: {_format_huf(product.get('price'))}. "
                + (f"Telepítés: {_format_huf(installation.get('base_price'))}." if installation else "")
            ).strip()

    if btu_match:
        target_btu = int(btu_match.group(1))
        product = sorted(
            products_data,
            key=lambda p: abs((p.get('cooling_capacity') or 0) - target_btu)
        )[0] if products_data else None
        if product:
            return (
                f"A {target_btu} BTU-hoz a {product.get('name', 'ajánlott klíma')} áll a legközelebb. "
                f"Ár: {_format_huf(product.get('price'))}, szobaméret-ajánlás: {product.get('room_size_min', 'N/A')}-{product.get('room_size_max', 'N/A')} m²."
            )

    if any(keyword in message for keyword in ['telepit', 'felszereles', 'install', 'beepites']):
        installation = next((s for s in services_data if s.get('type') == 'installation'), None)
        if installation:
            return (
                f"A klíma telepítés alapára {_format_huf(installation.get('base_price'))} egységenként. "
                f"Ez tartalmazza a felszerelést, csövezést, elektromos bekötést és tesztelést."
            )

    if any(keyword in message for keyword in ['karbantart', 'tisztit', 'tisztítás', 'szuro', 'szűrő']):
        maintenance = next((s for s in services_data if s.get('type') == 'maintenance'), None)
        if maintenance:
            return (
                f"A klíma tisztítás és karbantartás díja {_format_huf(maintenance.get('base_price'))}. "
                f"Ajánlott gyakoriság: {maintenance.get('frequency_recommended', 'évente 1-2 alkalommal')}."
            )

    if any(keyword in message for keyword in ['javit', 'szerviz', 'hiba', 'rosszul mukodik', 'rosszul működik', 'szivargas', 'szivárg']):
        contact = company_info.get('company', {}).get('contact', {})
        return (
            "Javítás és szervizelés esetén az első diagnosztika díjmentes. "
            f"Hívj minket a {contact.get('phone', 'N/A')} számon vagy írj a {contact.get('email', 'N/A')} címre."
        )

    if any(keyword in message for keyword in ['garancia', 'jotallas', 'jótáll', 'warranty']):
        faq = next((item for item in faq_data if item.get('id') == 'faq-003'), None)
        if faq:
            return faq.get('answer', 'Garanciával kapcsolatban érdeklődj ügyfélszolgálatunál.')

    if any(keyword in message for keyword in ['szallit', 'szállit', 'szállít', 'delivery']):
        faq = next((item for item in faq_data if item.get('id') == 'faq-006'), None)
        if faq:
            return faq.get('answer', 'Szállítással kapcsolatban érdeklődj ügyfélszolgálatunál.')

    if any(keyword in message for keyword in ['marca', 'márka', 'brand']):
        faq = next((item for item in faq_data if item.get('id') == 'faq-007'), None)
        if faq:
            return faq.get('answer', 'Ezekkel a márkákkal dolgozunk.')

    if any(keyword in message for keyword in ['wifi', 'okos', 'smart']):
        faq = next((item for item in faq_data if item.get('id') == 'faq-009'), None)
        if faq:
            return faq.get('answer', 'A modern modellek WiFi vezérlést is tudnak.')

    if any(keyword in message for keyword in ['ar', 'ár', 'koltseg', 'költség', 'mennyibe']):
        product_lines = [f"- {p.get('name', 'N/A')}: {_format_huf(p.get('price'))}" for p in products_data]
        service_lines = [f"- {s.get('name', 'N/A')}: {_format_huf(s.get('base_price'))}" for s in services_data if s.get('base_price') is not None]
        return (
            "Termékeink és szolgáltatásaink főbb árai:\n"
            + "\n".join(product_lines)
            + "\n\nSzolgáltatások:\n"
            + "\n".join(service_lines)
        )

    if any(keyword in message for keyword in ['termek', 'termék', 'klima', 'klíma']):
        product_lines = [f"- {p.get('name', 'N/A')} ({p.get('cooling_capacity_btu', 'N/A')}): {_format_huf(p.get('price'))}" for p in products_data]
        return "Elérhető klímáink:\n" + "\n".join(product_lines)

    contact = company_info.get('company', {}).get('contact', {})
    return (
        "Szívesen segítek klímaválasztásban, telepítésben vagy karbantartásban. "
        f"Írhatsz konkrét szobaméretet is, vagy hívj minket: {contact.get('phone', 'N/A')}, e-mail: {contact.get('email', 'N/A')}."
    )

@app.route('/api/chat', methods=['POST'])
def chat():
    """Chatbot endpoint"""
    try:
        data = request.get_json(silent=True) or {}
        if not isinstance(data, dict):
            data = {}

        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({"error": "Empty message"}), 400
        
        system_prompt = create_system_prompt()

        if client is not None:
            try:
                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    temperature=0.7,
                    max_tokens=500
                )

                bot_response = response.choices[0].message.content
                return jsonify({"success": True, "response": bot_response, "source": "groq"})
            except Exception as api_error:
                print(f"⚠️  Groq hívás sikertelen, helyi válaszra váltunk: {api_error}")

        bot_response = generate_local_response(user_message)
        return jsonify({"success": True, "response": bot_response, "source": "local_fallback"})

    except Exception as e:
        print(f"❌ Error in chatbot endpoint: {e}")
        fallback_message = locals().get('user_message', '')
        return jsonify({"success": True, "response": generate_local_response(fallback_message), "source": "local_fallback", "warning": str(e)})

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/', methods=['GET'])
def home():
    return jsonify({"app": "KlímaProfi Chatbot API", "version": "1.0"})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 10000))
    app.run(debug=True, host='0.0.0.0', port=port)