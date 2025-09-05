from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json()
    prompt = data.get("prompt", "")
    # Replace with your model's response logic
    response = {"output": f"Echo: {prompt}"}
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
