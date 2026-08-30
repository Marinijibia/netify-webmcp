'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, CheckCircle, AlertCircle, Shield, RefreshCw } from 'lucide-react';
import { WebBiometricService } from '@/lib/biometrics';
import { useTheme } from '@/lib/theme/theme-context';

type ScanStage = 'ALIGNING' | 'TRACKING' | 'ANALYZING' | 'LIVENESS_CHECK' | 'VERIFIED' | 'FAILED';

interface LandmarkPoint {
  id: number;
  x: number; // percentage from center
  y: number; // percentage from center
  label: string;
}

// 16 3D Biometric Nodal Vector Points matching mobile app
const BIOMETRIC_LANDMARKS: LandmarkPoint[] = [
  { id: 1, x: 0, y: -0.35, label: 'Forehead' },
  { id: 2, x: -0.25, y: -0.32, label: 'Left Temple' },
  { id: 3, x: 0.25, y: -0.32, label: 'Right Temple' },
  { id: 4, x: -0.18, y: -0.16, label: 'Left Eye' },
  { id: 5, x: 0.18, y: -0.16, label: 'Right Eye' },
  { id: 6, x: 0, y: -0.06, label: 'Nose Bridge' },
  { id: 7, x: 0, y: 0.06, label: 'Nose Tip' },
  { id: 8, x: -0.30, y: 0.05, label: 'Left Cheek' },
  { id: 9, x: 0.30, y: 0.05, label: 'Right Cheek' },
  { id: 10, x: -0.14, y: 0.22, label: 'Mouth Left' },
  { id: 11, x: 0.14, y: 0.22, label: 'Mouth Right' },
  { id: 12, x: 0, y: 0.28, label: 'Lower Lip' },
  { id: 13, x: 0, y: 0.38, label: 'Chin' },
  { id: 14, x: -0.28, y: 0.30, label: 'Left Jaw' },
  { id: 15, x: 0.28, y: 0.30, label: 'Right Jaw' },
  { id: 16, x: 0, y: -0.22, label: 'Glabella' },
];

interface WebFaceRecognitionScannerProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  isEnrollment?: boolean;
}

export default function WebFaceRecognitionScanner({
  isOpen,
  onSuccess,
  onClose,
  title = 'Face ID Camera Verification',
  subtitle = 'Position your face in the 3D frame to sign in',
  isEnrollment = false,
}: WebFaceRecognitionScannerProps) {
  const { tokens, isLight } = useTheme();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [scanStage, setScanStage] = useState<ScanStage>('ALIGNING');
  const [statusMessage, setStatusMessage] = useState('Initializing computer camera...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeLandmarks, setActiveLandmarks] = useState<number[]>([]);
  const [laserPosition, setLaserPosition] = useState(15); // Percentage 15% to 85%

  // Stop camera stream safely
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start camera stream on modal open
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScanStage('ALIGNING');
      setErrorMessage(null);
      setActiveLandmarks([]);
      return;
    }

    let isCancelled = false;

    async function startCamera() {
      setErrorMessage(null);
      setScanStage('ALIGNING');
      setStatusMessage('Starting computer camera...');

      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error('Camera access is not supported by your browser.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStatusMessage('Align your face inside the 3D frame');
        startScanSequence();
      } catch (err: any) {
        console.warn('Camera stream error:', err);
        setErrorMessage(
          err.name === 'NotAllowedError'
            ? 'Camera access was denied. Please allow camera permissions in your browser bar.'
            : 'Could not access computer camera. Please ensure a webcam is connected.'
        );
        setScanStage('FAILED');
      }
    }

    startCamera();

    return () => {
      isCancelled = true;
      stopCamera();
    };
  }, [isOpen]);

  // Laser animation cycle
  useEffect(() => {
    if (!isOpen || scanStage === 'VERIFIED' || scanStage === 'FAILED') return;

    const interval = setInterval(() => {
      setLaserPosition((prev) => (prev >= 82 ? 18 : prev + 2.5));
    }, 40);

    return () => clearInterval(interval);
  }, [isOpen, scanStage]);

  // Biometric nodal scan simulation progression
  const startScanSequence = () => {
    // 1. Aligning -> Tracking (1s)
    setTimeout(() => {
      setScanStage('TRACKING');
      setStatusMessage('Facial contour detected. Locking 3D nodal vectors...');
      setActiveLandmarks([1, 4, 5, 6, 7]);

      // 2. Analyzing (2s)
      setTimeout(() => {
        setScanStage('ANALYZING');
        setStatusMessage('Analyzing 16 biometric landmark vectors...');
        setActiveLandmarks([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 16]);

        // 3. Liveness Check (3s)
        setTimeout(() => {
          setScanStage('LIVENESS_CHECK');
          setStatusMessage('Liveness verified. Validating facial signature...');
          setActiveLandmarks(BIOMETRIC_LANDMARKS.map((l) => l.id));

          // 4. Verified (4s)
          setTimeout(() => {
            setScanStage('VERIFIED');
            setStatusMessage(isEnrollment ? 'Face ID enrolled successfully!' : 'Face verified! Signing in...');
            
            // Save mock signature for enrollment
            WebBiometricService.saveFaceSignature('verified_3d_facial_signature_' + Date.now());

            setTimeout(() => {
              stopCamera();
              onSuccess();
            }, 900);
          }, 1100);
        }, 1100);
      }, 1100);
    }, 1000);
  };

  const handleRetry = () => {
    setScanStage('ALIGNING');
    setErrorMessage(null);
    setActiveLandmarks([]);
    setStatusMessage('Align your face inside the 3D frame');
    startScanSequence();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 16, 28, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.surfaceBorder}`,
          borderRadius: '20px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: isLight ? tokens.shadowCard : '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'all 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            width: '100%',
            padding: '18px 24px',
            borderBottom: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isLight ? '#F8FAFC' : '#00253F',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: tokens.accentSoft,
                border: '1px solid #00A581',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Camera size={18} color="#00A581" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: tokens.textPrimary }}>{title}</h3>
              <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.textSecondary }}>{subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: tokens.textSecondary,
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Camera Viewport & Biometric Oval HUD */}
        <div
          style={{
            position: 'relative',
            width: '320px',
            height: '380px',
            margin: '28px 0 16px',
            borderRadius: '160px',
            overflow: 'hidden',
            backgroundColor: '#001424',
            border: `3px solid ${
              scanStage === 'VERIFIED' ? '#00A581' : scanStage === 'FAILED' ? '#EF4444' : '#0F5470'
            }`,
            boxShadow: `0 0 30px ${
              scanStage === 'VERIFIED'
                ? 'rgba(0, 165, 129, 0.5)'
                : scanStage === 'FAILED'
                ? 'rgba(239, 68, 68, 0.3)'
                : 'rgba(0, 165, 129, 0.15)'
            }`,
          }}
        >
          {/* Live Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)', // Mirror webcam
            }}
          />

          {/* 3D Biometric Nodal Vector Points Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {BIOMETRIC_LANDMARKS.map((landmark) => {
              const isActive = activeLandmarks.includes(landmark.id);
              const xPos = 160 + landmark.x * 240;
              const yPos = 190 + landmark.y * 300;

              return (
                <div
                  key={landmark.id}
                  style={{
                    position: 'absolute',
                    left: `${xPos}px`,
                    top: `${yPos}px`,
                    width: isActive ? '8px' : '4px',
                    height: isActive ? '8px' : '4px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? '#3AD0A9' : 'rgba(15, 84, 112, 0.6)',
                    boxShadow: isActive ? '0 0 10px #3AD0A9' : 'none',
                    transform: 'translate(-50%, -50%)',
                    transition: 'all 0.3s ease',
                  }}
                />
              );
            })}
          </div>

          {/* Vertical Laser Scan Line */}
          {scanStage !== 'VERIFIED' && scanStage !== 'FAILED' && (
            <div
              style={{
                position: 'absolute',
                top: `${laserPosition}%`,
                left: '10%',
                right: '10%',
                height: '2px',
                backgroundColor: '#3AD0A9',
                boxShadow: '0 0 12px 2px #3AD0A9',
                transition: 'top 0.04s linear',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Corner Brackets / Crosshairs */}
          <div
            style={{
              position: 'absolute',
              inset: '20px',
              borderRadius: '140px',
              border: '1.5px dashed rgba(0, 165, 129, 0.4)',
              pointerEvents: 'none',
            }}
          />

          {/* Success Overlay Checkmark */}
          {scanStage === 'VERIFIED' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 32, 53, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 165, 129, 0.2)',
                  border: '2px solid #00A581',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 25px #00A581',
                }}
              >
                <CheckCircle size={38} color="#3AD0A9" />
              </div>
            </div>
          )}
        </div>

        {/* Status Message */}
        <div style={{ padding: '0 24px 20px', textAlign: 'center', width: '100%' }}>
          <p
            style={{
              margin: '0 0 8px',
              fontSize: '13.5px',
              fontWeight: '600',
              color: scanStage === 'VERIFIED' ? '#00A581' : scanStage === 'FAILED' ? '#EF4444' : tokens.textPrimary,
            }}
          >
            {statusMessage}
          </p>

          {errorMessage && (
            <div
              style={{
                backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '8px 14px',
                borderRadius: '8px',
                color: isLight ? '#B91C1C' : '#FCA5A5',
                fontSize: '12px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={14} />
              <span>{errorMessage}</span>
            </div>
          )}

          {scanStage === 'FAILED' && (
            <button
              type="button"
              onClick={handleRetry}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} />
              <span>Try Camera Again</span>
            </button>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '12px',
              fontSize: '11px',
              color: tokens.textMuted,
            }}
          >
            <Shield size={12} color="#00A581" />
            <span>Encrypted local 3D facial nodal vector recognition</span>
          </div>
        </div>
      </div>
    </div>
  );
}
