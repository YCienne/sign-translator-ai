import React, { useState } from 'react';
import axios from 'axios';

function UploadForm() {
    const [file, setFile] = useState(null);
    const [predictions, setPredictions] = useState([]);
    const [error, setError] = useState('');

    // Handle file selection
    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setPredictions([]); // Clear previous predictions
        setError('');
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file first');
            return;
        }
    
        const formData = new FormData();
        formData.append('file', file);
    
        try {
            const response = await axios.post('http://127.0.0.1:8000/predict', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setPredictions(response.data);  // Set predictions from response
            setError('');
        } catch (err) {
            setError('Error uploading file or receiving response');
            console.error("Request failed:", err.response ? err.response.data : err.message);
        }
    };
    
    return (
        <div>
            <h2>ASL Detection</h2>
            <form onSubmit={handleSubmit}>
                <input type="file" onChange={handleFileChange} accept="image/*" />
                <button type="submit">Upload and Predict</button>
            </form>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {predictions.length > 0 && (
                <div>
                    <h3>Predictions:</h3>
                    <ul>
                        {predictions.map((pred, index) => (
                            <li key={index}>
                                <strong>{pred.label}</strong>: {pred.confidence.toFixed(2)}
                                <div>Box: {pred.box.join(', ')}</div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default UploadForm;
