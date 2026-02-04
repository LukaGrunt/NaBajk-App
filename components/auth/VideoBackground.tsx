import React, { useRef, useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

export function VideoBackground() {
  const video = useRef<Video>(null);
  const [videoError, setVideoError] = useState(false);
  const { width, height } = useWindowDimensions();

  // TODO: Replace placeholder video with final video
  // Place video file at: /assets/video/welcome-placeholder.mp4
  // Video should be high quality, cycling footage optimized for mobile

  const handleVideoError = () => {
    console.warn('Video failed to load, using fallback gradient');
    setVideoError(true);
  };

  return (
    <View style={styles.container}>
      {!videoError ? (
        <Video
          ref={video}
          source={require('@/assets/video/welcome-placeholder.mp4')}
          style={{ width, height }}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
          onError={handleVideoError}
        />
      ) : (
        // Fallback gradient if video fails to load
        <LinearGradient
          colors={['#03130E', '#0A1F18', '#03130E']}
          style={{ width, height }}
        />
      )}

      {/* Dark overlay for text readability */}
      <LinearGradient
        colors={['rgba(3, 19, 14, 0.4)', 'rgba(3, 19, 14, 0.7)', 'rgba(3, 19, 14, 0.85)']}
        style={styles.overlay}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
