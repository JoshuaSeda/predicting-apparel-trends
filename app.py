from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
import calendar
import os

app = Flask(__name__)
CORS(app)

def forecast_sales(sales_data, months):
    series = pd.Series(sales_data)
    model = ARIMA(series, order=(1, 1, 1))
    model_fit = model.fit()
    forecast = model_fit.forecast(steps=months)
    return forecast.tolist()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/forecast', methods=['POST'])
def forecast():
    file = request.files.get('file')
    months = int(request.form.get('months', 12))

    if not file:
        return jsonify({'error': 'No file uploaded'}), 400

    df = pd.read_csv(file)
    required_cols = {'Month', 'Jacket', 'Tshirt', 'Shorts'}
    if not required_cols.issubset(set(df.columns)):
        return jsonify({'error': 'CSV must include Month, Jacket, Tshirt, Shorts columns'}), 400

    results = {}
    for item in ['Jacket', 'Tshirt', 'Shorts']:
        sales_data = df[item].dropna().tolist()
        forecasted = forecast_sales(sales_data, months)
        results[item.lower()] = {
            "past": sales_data,
            "forecast": forecasted
        }

    all_months = df['Month'].tolist() + [calendar.month_name[(i % 12) + 1] for i in range(months)]

    return jsonify({
        "months": all_months,
        "results": results
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))  # Use Render's provided PORT
    app.run(host="0.0.0.0", port=port, debug=False)
