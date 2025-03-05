import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { Camera, CheckCircle, XCircle } from 'lucide-react';

function App() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [matchResult, setMatchResult] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoComparing, setIsAutoComparing] = useState(true);  // Auto comparing starts automatically
  const [showReference, setShowReference] = useState(false);

  const referenceImage = '/image/image1.jpg'; // This refers to the image in public/images folder


  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        await Promise.all([
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
        ]);
        setIsModelLoaded(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading models:', error);
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  // Auto-compare faces when enabled
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isAutoComparing && isModelLoaded && webcamRef.current?.video?.readyState === 4) {
      interval = setInterval(compareFaces, 3000); // Compare every 3 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAutoComparing, isModelLoaded]);

  const compareFaces = async () => {
    if (!webcamRef.current || !isModelLoaded) return;

    try {
      setIsLoading(true);
      const referenceImg = await faceapi.fetchImage(referenceImage);
      const webcamImage = webcamRef.current.getScreenshot();

      if (!webcamImage) return;

      const img = await faceapi.fetchImage(webcamImage);
      
      const referenceDetection = await faceapi
        .detectSingleFace(referenceImg)
        .withFaceLandmarks()
        .withFaceDescriptor();

      const currentDetection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (referenceDetection && currentDetection) {
        const distance = faceapi.euclideanDistance(
          referenceDetection.descriptor,
          currentDetection.descriptor
        );
        const isMatch = distance < 0.6;  // You can adjust the threshold (0.6) for better match precision
        setMatchResult(isMatch);

        // Log the result to the console
        if (isMatch) {
          console.log('Match Found!');
        } else {
          console.log('No Match');
        }
      } else {
        setMatchResult(false);
        console.log('No Face Detected');
      }
    } catch (error) {
      console.error('Error comparing faces:', error);
      setMatchResult(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Camera className="w-8 h-8" />
            Face Recognition System
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4" style={{ display: showReference ? 'block' : 'none' }}>
              <h2 className="text-xl font-semibold">Reference Image</h2>
              <img
                src={referenceImage}
                alt="Reference"
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Live Camera</h2>
              <div className="relative">
                <Webcam
                  ref={webcamRef}
                  className="w-full rounded-lg"
                  mirrored
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-4">
            {isLoading && (
              <div className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></span>
                <span>Processing...</span>
              </div>
            )}

            {matchResult !== null && !isLoading && (
              <div className="flex items-center gap-2 text-lg font-semibold">
                {matchResult ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <span className="text-green-500">Match Found!</span>
                    
                    
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-500" />
                    <span className="text-red-500">No Match</span>
                    
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
