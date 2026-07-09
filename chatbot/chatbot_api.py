from dotenv import load_dotenv
import os
import json
import httpx
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
groq_api_key = os.getenv('GROQ_API_KEY', '')
if not groq_api_key:
    print("⚠️  GROQ_API_KEY is not set!")

# Create a custom httpx client that does NOT use environment proxies
custom_httpx_client = httpx.Client(trust_env=False)

# Initialize the Groq client, passing in our custom, clean http_client
client = Groq(api_key=groq_api_key, http_client=custom_httpx_client)
print("✅ Groq client initialized successfully (with proxy bug workaround).")


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

@app.route('/api/chat', methods=['POST'])
def chat():
    """Chatbot endpoint"""
    try:
        data = request.json
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({"error": "Empty message"}), 400
        
        system_prompt = create_system_prompt()
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile", # Final attempt with a large, stable model
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        bot_response = response.choices[0].message.content
        return jsonify({"success": True, "response": bot_response})
    
    except Exception as e:
        print(f"❌ Error in chatbot endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/', methods=['GET'])
def home():
    return jsonify({"app": "KlímaProfi Chatbot API", "version": "1.0"})

if __name__ == '__main__':
    load_data()
    port = int(os.getenv('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
