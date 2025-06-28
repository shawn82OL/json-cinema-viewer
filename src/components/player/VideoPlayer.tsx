
import React, { useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Artplayer from 'artplayer';

interface VideoPlayerProps {
  currentUrl: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ currentUrl }) => {
  const { toast } = useToast();
  const playerRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<Artplayer | null>(null);

  const initPlayer = () => {
    if (artRef.current) {
      artRef.current.destroy();
    }

    if (playerRef.current && currentUrl) {
      console.log('初始化播放器，链接:', currentUrl);
      
      artRef.current = new Artplayer({
        container: playerRef.current,
        url: currentUrl,
        volume: 0.5,
        isLive: false,
        muted: false,
        autoplay: false,
        pip: true,
        setting: true,
        loop: false,
        flip: true,
        playbackRate: true,
        aspectRatio: true,
        fullscreen: true,
        fullscreenWeb: true,
        subtitleOffset: true,
        miniProgressBar: true,
        mutex: true,
        backdrop: true,
        playsInline: true,
        autoSize: false,
        airplay: true,
        theme: '#8b5cf6',
        lang: navigator.language.toLowerCase(),
        moreVideoAttr: {
          crossOrigin: 'anonymous',
        },
      });

      artRef.current.on('ready', () => {
        console.log('播放器准备就绪');
      });

      artRef.current.on('error', (error) => {
        console.error('播放器错误:', error);
        toast({
          title: "播放错误",
          description: "视频加载失败，请尝试其他播放源",
          variant: "destructive"
        });
      });
    }
  };

  useEffect(() => {
    if (currentUrl && playerRef.current) {
      initPlayer();
    }
    
    return () => {
      if (artRef.current) {
        artRef.current.destroy();
      }
    };
  }, [currentUrl]);

  return (
    <Card className="bg-black/50 backdrop-blur-md border-purple-500/20">
      <CardContent className="p-0">
        <div 
          ref={playerRef}
          className="w-full aspect-video rounded-lg overflow-hidden bg-black"
          style={{ maxHeight: '70vh' }}
        ></div>
      </CardContent>
    </Card>
  );
};
