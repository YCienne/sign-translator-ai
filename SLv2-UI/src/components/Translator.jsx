import React, { useState, useRef, useEffect } from 'react';
import { FiMenu, FiUpload } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const Translation = () => {
    const [cameraActive, setCameraActive] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [translations, setTranslations] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState("en");
    const videoRef = useRef(null);
    const wsRef = useRef(null);
    const navigate = useNavigate();
    

    
    const languages = [
        { text: "English", code: "en" },
        { text: "Spanish", code: "es" },
        { text: "French", code: "fr" },
        { text: "Korean", code: "ko" },
        { text: "Italian", code: "it" },
        { text: "Russian", code: "ru" },  
        { text: "German", code: "de" },
        { text: "Japanese", code: "ja" },
        { text: "Arabic", code: "ar" },
        { text: "Chinese", code: "zh" },
    ];

    useEffect(() => {
        return () => stopTranslation(); 
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = stream;
            setCameraActive(true);
                
            startRealTimeTranslation();
            captureInterval();
            videoRef.current.onloadedmetadata = () => {
                console.log("Video metadata loaded");
                    
            };
        } catch (error) {
            alert("Camera permission is required");
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
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        clearInterval(captureInterval);
    };

    let speaking = false;
    const queue = [];

    const speak = (text) => {
    if (typeof text !== "string" || !text.trim()) return;

    queue.push(text);
    if (!speaking) playNext();
    };

    function playNext() {
    if (queue.length === 0) {
        speaking = false;
        return;
    }

    speaking = true;
    const text = queue.shift();
    console.log("Speaking:", text);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US"; 
    utterance.onend = () => playNext();

    speechSynthesis.speak(utterance);
    }


    const startRealTimeTranslation = () => {
        wsRef.current = new WebSocket(`ws://localhost:8000/ws/predict?lang=${selectedLanguage}`);
            
        wsRef.current.onopen = () => {
            console.log("WebSocket connection established");
        };
            
        wsRef.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("Received data:", data);
        
                if (data.error) {
                    console.error("Server error:", data.error);
                } else if (data.length > 0) {
                    const newTranslations = data.map((d) => ({
                        label: d.label,
                        translation: d.translation ?? d.label,
                    }));
                    setTranslations((prev) => [...prev, ...newTranslations]);
                    newTranslations.forEach((d) => speak(d.translation));
                    

                    newTranslations.forEach((translation) => {
                        speak(d.translation);
                    });
                }
                else {
                    console.warn("No detections received.");
                }
            } catch (error) {
                console.error("Error processing message:", error);
            }
        };
            
        wsRef.current.onerror = (error) => {
            console.error("WebSocket error:", error);
        };
            
        wsRef.current.onclose = () => {
            console.log("WebSocket connection closed");
        };
            
            
        return () => {
            clearInterval(captureInterval);
        
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }; 

    const captureFrame = (videoElement) => {
        return new Promise((resolve, reject) => {
        
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
        
            if (!context) {
                reject(new Error("Canvas context not available"));
                return;
            }
        
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
        
            console.log("Canvas dimensions:", canvas.width, canvas.height);
        
            context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
                // Checking canvas for content
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            if (imageData.data.every((val) => val === 0)) {
                reject(new Error("Canvas has no content (image not captured properly)"));
                return;
            }
        
                // Creating Blob from the canvas
            canvas.toBlob((blob) => {
                if (blob) {
                    console.log("Frame captured successfully");
                    resolve(blob);  
                } else {
                    reject(new Error("Blob creation failed"));
                }
            }, "image/jpeg");
        });
    };
        
    let isCapturing = false;

    const captureInterval = setInterval(async () => {
        if (videoRef.current && cameraActive && !isCapturing) {
            isCapturing = true;
    
            try {
                const frame = await captureFrame(videoRef.current);
                console.log("Captured frame:", frame);
    
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result.split(",")[1];
                    if (wsRef.current.readyState === WebSocket.OPEN) {
                        console.log("Sending frame to server:", base64data.slice(0, 50)); 
                        wsRef.current.send(base64data);
                    } else {
                        console.warn("WebSocket not ready, frame skipped.");
                    }
                };
                reader.readAsDataURL(frame);
            } catch (error) {
                console.error("Error capturing frame:", error);
            } finally {
                isCapturing = false;
            }
        }
    }, 3000);

    //Language change handler
    const handleLanguageChange = (e) => {
        setSelectedLanguage(e.target.value);
    }

    const handleUpload = (e) => {
        const file = e.target.files[0];
        const allowedTypes = ["image/jpeg", "image/png", "video/mp4"];
        if (!allowedTypes.includes(file.type)) {
            alert("Only image and video files are allowed.");
            return;
        }
        setUploadFile(file);
        if (file.type.startsWith("video")) {
            const videoURL =  URL.createObjectURL(file);
            videoRef.current.src = videoURL;
            startRealTimeTranslation();
            processUploadedVideo(file);
            
        } else if (file.type.startsWith("image")) {
            const imageUrl = URL.createObjectURL(file);
            videoRef.current.src = imageUrl;
        }
    };
// Function to capture a frame from the video element
const captureFrameFromUpload = (videoElement) => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
            reject(new Error("Canvas context not available"));
            return;
        }

        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        console.log("Canvas dimensions:", canvas.width, canvas.height);

        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Check if the canvas has content
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        if (imageData.data.every((val) => val === 0)) {
            reject(new Error("Canvas has no content (image not captured properly)"));
            return;
        }

        // Create the Blob from the canvas
        canvas.toBlob((blob) => {
            if (blob) {
                console.log("Frame captured successfully");
                resolve(blob);
            } else {
                reject(new Error("Blob creation failed"));
            }
        }, "image/jpeg");
    });
};

// Function to process the uploaded video
const processUploadedVideo = (uploadedVideoFile) => {
    const videoElement = document.createElement("video");
    videoElement.src = URL.createObjectURL(uploadedVideoFile);
    videoElement.crossOrigin = "anonymous";

        let isCapturing = false;

    // When video metadata is loaded, start processing
    videoElement.onloadedmetadata = () => {
        const captureFrame = async () => {
            if (!isCapturing) {
                isCapturing = true;
                try {
                    const frame = await captureFrameFromUpload(videoElement);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64data = reader.result.split(",")[1];
                        if (wsRef.current?.readyState === WebSocket.OPEN) {
                            wsRef.current.send(base64data);
                        }
                    };
                    reader.readAsDataURL(frame);
                } catch (error) {
                    console.error("Error capturing frame:", error);
                } finally {
                    isCapturing = false;
                }
            }
            if (videoElement.currentTime < videoElement.duration) {
                requestAnimationFrame(captureFrame);
            }
        };

        videoElement.play();
        captureFrame();
    };
    videoElement.onerror = (error) => {
        console.error("Error loading video:", error);
    };

};

            const handleTranslation = async () => {
                if (uploadFile) {
                    const formData = new FormData();
                    formData.append("file", uploadFile);
                    formData.append("language", selectedLanguage);
                    
                    try{
                    const response = await fetch("http://localhost:8000/predict", {
                        method: "POST",
                        body: formData
                    });

                    const data = await response.json();
                    console.log("API response: ", data);
                    const labels = data.map(d => ({ label: d.label, translation: d.translation }));
                    setTranslations(labels);

                    labels.forEach(d => speak(d.translation));
                    } catch (error) {
                    console.error("Translation error:", error);
                    }
                }
            };

            const clearFeed = () => {
                setUploadFile(null);
                setTranslations([]);
                captureFrame(null);
                
                if (cameraActive) {
                    startCamera();
                }

                if (videoRef.current) {
                    videoRef.current.pause();
                    videoRef.current.srcObject = null; 
                    videoRef.current.load(); 
                    videoRef.current.src = "";
                    video.current.currentTime = 0;
                }
        
                // Revoke the object URL to free up memory
                if (videoFile) {
                    URL.revokeObjectURL(videoFile);
                    setVideoFile(null);
                }

                if (captureInterval) {
                    clearInterval(captureInterval); 
                }

                const canvas = document.querySelector("canvas");
                    if (canvas) {
                        const context = canvas.getContext("2d");
                        context.clearRect(0, 0, canvas.width, canvas.height); 
                }


                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.close(); 
                    wsRef.current = null;
                    console.log("WebSocket connection closed.");
                }
                
                window.location.reload(true);
                console.log("Feed cleared.");
            };

            const goHome = () => {
                navigate("/");
            };
            

            return (
                <div className="flex flex-col md:flex-row h-screen text-white">
                    <div className="bg-gray-900 p-4 w-1/4 min-w-[200px] flex flex-col items-start">
                        <div className="flex items-center">
                            <FiMenu className="text-xl mr-2" />
                            <select
                                onChange={handleLanguageChange}
                                value={selectedLanguage}
                                className="bg-gray-800 p-2 rounded"
                                >
                                {languages.map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                    {lang.text}
                                    </option>
                                ))}
                            </select>

                        </div>
                        <p className="mt-10">Translations</p> 
                        <div className="flex flex-1 flex-col mt-5">
                            <ul className='flex flex-row gap-2'>
                                {translations.length > 0 ? (
                                    translations
                                    .slice(-5)
                                    .map((item, index) => <li key={index}><strong>{item.label}:</strong>{item.translation}</li>)
                                ) : (
                                        <p>No translations yet</p>
                                )}
                            </ul>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-700 relative mt-20 mb-0 sm:mt-20">
                        {uploadFile ? (
                            uploadFile.type.startsWith("video") ? ( 
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    className="w-3/4 h-3/4 bg-gray-300"
                                    controls
                                ></video>
                                
                            ) : (
                                <img
                                    src={URL.createObjectURL(uploadFile)}
                                    alt="Uploaded image for translation"
                                    className="w-3/4 h-3/4 bg-gray-300"
                                />
                            )
                        ) : (
                            <video
                                ref={videoRef}
                                autoPlay
                                className="w-3/4 h-3/4 bg-gray-300"
                            />
                        )}

                        <div className="absolute bottom-4 flex space-x-4">
                            {!cameraActive && !uploadFile && (
                                <button onClick={startCamera } className="text-lg font-bold py-2 px-4 bg-gray-900 text-white rounded-full">
                                    Start Camera
                                </button>
                            )}
                            
                            {cameraActive && (
                                <button onClick={stopCamera} className="text-lg font-bold py-2 px-4 bg-gray-900 text-white rounded-full">
                                    Stop Camera
                                </button>
                            )}
                            {uploadFile && uploadFile.type.startsWith("image") && (
                                <button onClick={handleTranslation} className="text-lg font-bold py-2 px-4 bg-gray-900 text-white rounded-full">
                                    Translate
                                </button>
                            )}
                            <button onClick={clearFeed} className="text-lg font-bold py-2 px-4 bg-gray-900 text-white rounded-full">
                                Clear Feed
                            </button>
                        </div>
                        <button onClick={goHome} className="absolute top-4 left-4 text-lg font-bold py-2 px-4 bg-gray-900 text-white rounded-full">
                            Home
                        </button>
                        <label htmlFor="file-upload" className="absolute flex gap-2 w-auto ml-auto top-6 cursor-pointer sm:left-36">
                            <FiUpload className="text-3xl text-white" /> Upload Media
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            onChange={handleUpload}
                            style={{ display: 'none' }} 
                        />
                    </div>
                    
                </div>
            );
        };

        export default Translation;
