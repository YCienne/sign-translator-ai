import React, { useState, useRef, useEffect } from 'react';
import Header from './Header';
import Footer from './footer';
import { FiMenu } from "react-icons/fi";

const Translation = () => {
    <Header />
    const [cameraActive, setCameraActive] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [translations, setTranslations] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState('English');
    const videoRef = useRef(null);
    const captureInterval = useRef(null);

    // List of supported languages
    const languages = ["English", "Spanish", "French", "Korean", "Italian", "Russian", "German", "Japanese", "Arabic", "Chinese"];

    // Start camera and initiate real-time translation on mount
    useEffect(() => {
        return () => stopTranslation(); // Cleanup interval on unmount
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = stream;
            setCameraActive(true);
            startRealTimeTranslation();
        } catch (error) {
            alert('Camera permission is required');
        }
    };

    const stopCamera = () => {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
        setCameraActive(false);
        stopTranslation();
    };

    const stopTranslation = () => {
        if (captureInterval.current) {
            clearInterval(captureInterval.current);
            captureInterval.current = null;
        }
    };

    const startRealTimeTranslation = () => {
        // Capture frames every second
        captureInterval.current = setInterval(async () => {
            if (videoRef.current && cameraActive) {
                const frame = await captureFrame(videoRef.current);
                const formData = new FormData();
                formData.append("file", frame);
                formData.append("language", selectedLanguage);

                try {
                    const response = await fetch("http://localhost:8000/predict", {
                        method: "POST",
                        body: formData
                    });
                    const data = await response.json();
                    setTranslations(prevTranslations => [...prevTranslations, data.map(d => d.label)]);
                } catch (error) {
                    console.error("Error fetching translation:", error);
                }
            }
        }, 1000); // Adjust capture frequency as needed
    };

    const captureFrame = (videoElement) => {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        return new Promise(resolve => canvas.toBlob(resolve, "image/jpeg"));
    };

    const handleLanguageChange = (e) => {
        setSelectedLanguage(e.target.value);
    };

    const handleUpload = (e) => {
        const file = e.target.files[0];
        setUploadFile(file);
        if (file.type.startsWith("video")) {
            videoRef.current.src = URL.createObjectURL(file);
        } else if (file.type.startsWith("image")) {
            const imageUrl = URL.createObjectURL(file);
            videoRef.current.src = imageUrl;
        }
    };

    const handleTranslation = async () => {
        if (uploadFile && uploadFile.type.startsWith("image")) {
            const formData = new FormData();
            formData.append("file", uploadFile);
            formData.append("language", selectedLanguage);

            const response = await fetch("http://localhost:8000/predict", {
                method: "POST",
                body: formData
            });

            const data = await response.json();
            setTranslations(data.map(d => d.label));
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen text-white">
            <div className="bg-gray-900 p-4 w-1/4 min-w-[200px] flex flex-col items-start">
                <div className="flex items-center">
                    <FiMenu className="text-xl mr-2" />
                    <select onChange={handleLanguageChange} className="bg-gray-700 p-2 rounded">
                        {languages.map((lang) => (
                            <option key={lang} value={lang}>{lang}</option>
                        ))}
                    </select>
                </div>
                <p className="mt-10">Translations</p>
                <div className="mt-5">
                    {translations.length > 0 ? translations.slice(-1) : "No translations yet."}
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center bg-gray-200 relative mt-20 mb-0 sm:mt-20">
                <video
                    ref={videoRef}
                    autoPlay
                    className="w-3/4 h-3/4 bg-gray-300"
                    controls={uploadFile && uploadFile.type.startsWith("video")}
                ></video>
                {!cameraActive && !uploadFile && (
                    <button onClick={startCamera} className="absolute text-lg font-bold py-2 px-4 bg-gray-800 text-white rounded">
                        Start Camera
                    </button>
                )}
                {cameraActive && (
                    <button onClick={stopCamera} className="absolute bottom-4 text-lg font-bold py-2 px-4 bg-red-500 text-white rounded">
                        Stop Camera
                    </button>
                )}
                {uploadFile && uploadFile.type.startsWith("image") && (
                    <button onClick={handleTranslation} className="absolute bottom-4 py-2 px-4 bg-gray-800 text-white rounded">
                        Translate
                    </button>
                )}
                <input type="file" onChange={handleUpload} className="absolute top-4 right-4" />
            </div>
        </div>
    );
};

export default Translation;
