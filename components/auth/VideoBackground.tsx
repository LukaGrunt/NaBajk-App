import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const videoSource = require('@/assets/video/welcome-placeholder.mp4');

export function VideoBackground() {
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      <LinearGradient
        colors={['rgba(3,19,14,0.45)', 'rgba(3,19,14,0.2)', 'rgba(3,19,14,0.65)']}
        style={StyleSheet.absoluteFill}
      />
    </>
  );
}
