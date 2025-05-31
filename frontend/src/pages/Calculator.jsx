import React, { useState, useEffect } from 'react';
import { calculate, getCalculations } from '../api';
import jsPDF from 'jspdf';

function Calculator() {
  const [inputs, setInputs] = useState({
    energy: 0,
    fuel: 0, // Changed from food
    livestock: 0,
    fertilizers: 0,
  });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const calculations = await getCalculations();
      setHistory(calculations);
    } catch (err) {
      setError('Failed to load history: ' + err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs({ ...inputs, [name]: parseFloat(value) || 0 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await calculate(inputs);
      setResult(response);
      fetchHistory();
    } catch (err) {
      setError('Calculation failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  const generatePDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.text('Carbon Footprint Report', 20, 20);
    doc.text(`CO2: ${result.co2.toFixed(2)} kg`, 20, 30);
    doc.text(`CH4: ${result.ch4.toFixed(2)} kg`, 20, 40);
    doc.text(`N2O: ${result.n2o.toFixed(2)} kg`, 20, 50);
    doc.text(`Total: ${result.total.toFixed(2)} kg CO2e`, 20, 60);
    doc.save('carbon-footprint-report.pdf');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-green-600">Carbon Footprint Calculator</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="mb-6">
        {['energy', 'fuel', 'livestock', 'fertilizers'].map((field) => (
          <div key={field} className="mb-4">
            <label className="block text-gray-700 capitalize">{field} (units)</label>
            <input
              type="number"
              name={field}
              value={inputs[field]}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              step="0.1"
              min="0"
            />
          </div>
        ))}
        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
          Calculate
        </button>
      </form>
      {result && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Results</h3>
          <p>CO2: {result.co2.toFixed(2)} kg</p>
          <p>CH4: {result.ch4.toFixed(2)} kg</p>
          <p>N2O: {result.n2o.toFixed(2)} kg</p>
          <p>Total: {result.total.toFixed(2)} kg CO2e</p>
          <button
            onClick={generatePDF}
            className="mt-4 bg-green-600 text-white p-2 rounded hover:bg-green-700"
          >
            Download PDF
          </button>
        </div>
      )}
      <div>
        <h3 className="text-xl font-semibold mb-2">Calculation History</h3>
        {history.length === 0 ? (
          <p>No calculations yet.</p>
        ) : (
          <ul className="list-disc pl-5">
            {history.map((calc) => (
              <li key={calc.id}>
                {new Date(calc.created_at).toLocaleString()}: {calc.total.toFixed(2)} kg CO2e
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Calculator;