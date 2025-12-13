import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FiPlay, 
  FiPause, 
  FiVolume2, 
  FiVolumeX, 
  FiMaximize, 
  FiMinimize,
  FiSkipBack,
  FiSkipForward,
  FiSettings
} from 'react-icons/fi';
import styles from './VideoPlayer.module.css';

const VideoPlayer = ({ videoUrl, title }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const tapTimeoutRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [seekIndicator, setSeekIndicator] = useState({ show: false, direction: null, side: null });
  const [isBuffering, setIsBuffering] = useState(false);

  // Hide controls after inactivity
  useEffect(() => {
    let timeout;
    const resetTimeout = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', resetTimeout);
      container.addEventListener('touchstart', resetTimeout);
    }

    return () => {
      clearTimeout(timeout);
      if (container) {
        container.removeEventListener('mousemove', resetTimeout);
        container.removeEventListener('touchstart', resetTimeout);
      }
    };
  }, [isPlaying]);

  // Keyboard controls
  useEffect(() => {
    const handleKeydown = (e) => {
      if (!videoRef.current) return;
      
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(-0.1);
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  }, []);

  const changeVolume = useCallback((delta) => {
    if (!videoRef.current) return;
    const newVolume = Math.min(1, Math.max(0, volume + delta));
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, [volume]);

  const seek = useCallback((seconds) => {
    if (!videoRef.current) return;
    const videoDuration = videoRef.current.duration || 0;
    const newTime = Math.min(
      videoDuration,
      Math.max(0, videoRef.current.currentTime + seconds)
    );
    videoRef.current.currentTime = newTime;
    
    // Show seek indicator
    setSeekIndicator({ 
      show: true, 
      direction: seconds > 0 ? 'forward' : 'backward',
      side: seconds > 0 ? 'right' : 'left'
    });
    setTimeout(() => setSeekIndicator({ show: false, direction: null, side: null }), 500);
  }, [duration]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleProgressClick = (e) => {
    if (!videoRef.current || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = percent * duration;
  };

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleDoubleClick = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    
    if (clickX < width / 3) {
      // Left third - seek backward
      seek(-10);
    } else if (clickX > (width * 2) / 3) {
      // Right third - seek forward
      seek(10);
    } else {
      // Center - toggle fullscreen
      toggleFullscreen();
    }
  };

  const handleClick = (e) => {
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
      handleDoubleClick(e);
    } else {
      tapTimeoutRef.current = setTimeout(() => {
        togglePlay();
        tapTimeoutRef.current = null;
      }, 200);
    }
  };

  const changePlaybackRate = (rate) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  const formatTime = (time) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!videoUrl) {
    return (
      <div className={styles.placeholder}>
        <div className={styles.placeholderIcon}>🎬</div>
        <p>No video available</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`${styles.container} ${isFullscreen ? styles.fullscreen : ''}`}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className={styles.video}
        onClick={handleClick}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        playsInline
      />

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className={styles.bufferingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}

      {/* Seek Indicators */}
      {seekIndicator.show && (
        <div className={`${styles.seekIndicator} ${styles[seekIndicator.side]}`}>
          {seekIndicator.direction === 'forward' ? (
            <>
              <FiSkipForward size={32} />
              <span>10s</span>
            </>
          ) : (
            <>
              <FiSkipBack size={32} />
              <span>10s</span>
            </>
          )}
        </div>
      )}

      {/* Center Play Button */}
      {!isPlaying && !isBuffering && (
        <button className={styles.centerPlayBtn} onClick={togglePlay}>
          <FiPlay size={48} />
        </button>
      )}

      {/* Controls */}
      <div className={`${styles.controls} ${showControls ? styles.visible : ''}`}>
        {/* Progress Bar */}
        <div 
          ref={progressRef}
          className={styles.progressBar}
          onClick={handleProgressClick}
        >
          <div 
            className={styles.progressFilled}
            style={{ width: `${progressPercent}%` }}
          />
          <div 
            className={styles.progressHandle}
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Bottom Controls */}
        <div className={styles.bottomControls}>
          <div className={styles.leftControls}>
            <button className={styles.controlBtn} onClick={togglePlay}>
              {isPlaying ? <FiPause size={22} /> : <FiPlay size={22} />}
            </button>

            <button className={styles.controlBtn} onClick={() => seek(-10)}>
              <FiSkipBack size={20} />
            </button>

            <button className={styles.controlBtn} onClick={() => seek(10)}>
              <FiSkipForward size={20} />
            </button>

            <div className={styles.volumeControl}>
              <button className={styles.controlBtn} onClick={toggleMute}>
                {isMuted || volume === 0 ? <FiVolumeX size={20} /> : <FiVolume2 size={20} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (videoRef.current) videoRef.current.volume = val;
                  setVolume(val);
                  setIsMuted(val === 0);
                }}
                className={styles.volumeSlider}
              />
            </div>

            <span className={styles.time}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className={styles.rightControls}>
            <div className={styles.speedControl}>
              <button 
                className={styles.controlBtn}
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              >
                <FiSettings size={18} />
                <span className={styles.speedLabel}>{playbackRate}x</span>
              </button>
              
              {showSpeedMenu && (
                <div className={styles.speedMenu}>
                  {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                    <button
                      key={rate}
                      className={`${styles.speedOption} ${playbackRate === rate ? styles.active : ''}`}
                      onClick={() => changePlaybackRate(rate)}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className={styles.controlBtn} onClick={toggleFullscreen}>
              {isFullscreen ? <FiMinimize size={20} /> : <FiMaximize size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
