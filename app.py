from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import pandas as pd
import calendar
from statsmodels.tsa.arima.model import ARIMA
from datetime import datetime

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
    data = request.json
    months = int(data.get("months", 12))
    results = {}

    for item in ['jacket', 'tshirt', 'shorts']:
        sales_data = data.get(item, [])
        forecasted = forecast_sales(sales_data, months)
        results[item] = {
            "past": sales_data,
            "forecast": forecasted
        }

    total_months = len(results['jacket']['past']) + months
    all_months = [calendar.month_name[(i % 12) + 1] for i in range(total_months)]

    return jsonify({
        "months": all_months,
        "results": results
    })

if __name__ == '__main__':
    app.run(debug=True)
