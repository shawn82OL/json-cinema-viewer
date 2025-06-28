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
      
      // 处理播放链接，确保兼容性
      let playUrl = currentUrl;
      
      // 如果是相对路径，尝试构建完整URL
      if (playUrl.startsWith('/') || playUrl.startsWith('./')) {
        const currentPageUrl = window.location.href;
        const apiParam = new URLSearchParams(window.location.search).get('api');
        if (apiParam) {
          try {
            const apiDomain = new URL(apiParam).origin;
            playUrl = apiDomain + playUrl;
          } catch (e) {
            console.log('无法构建完整URL，使用原始链接');
          }
        }
      }
      
      // 如果链接不是以http开头，添加https
      if (!playUrl.startsWith('http')) {
        playUrl = 'https://' + playUrl;
      }
      
      console.log('处理后的播放链接:', playUrl);
      
      try {
        artRef.current = new Artplayer({
          container: playerRef.current,
          url: playUrl,
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
            preload: 'metadata',
          },
          // 添加更多兼容性设置
          type: 'auto', // 自动检测视频格式
          customType: {
            m3u8: function(video: HTMLVideoElement, url: string) {
              // 如果是m3u8格式，尝试直接播放
              if (url.includes('.m3u8')) {
                video.src = url;
              }
            }
          }
        });

        artRef.current.on('ready', () => {
          console.log('播放器准备就绪');
        });

        artRef.current.on('video:loadstart', () => {
          console.log('开始加载视频');
        });

        artRef.current.on('video:canplay', () => {
          console.log('视频可以播放');
        });

        artRef.current.on('video:error', (error) => {
          console.error('视频播放错误:', error);
          toast({
            title: "视频播放错误",
            description: "当前视频无法播放，请尝试其他集数",
            variant: "destructive"
          });
        });

        artRef.current.on('error', (error) => {
          console.error('播放器错误:', error);
          
          // 尝试使用代理播放
          if (!playUrl.includes('proxy')) {
            console.log('尝试使用代理播放...');
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(currentUrl)}`;
            
            if (artRef.current) {
              artRef.current.switchUrl(proxyUrl);
            }
          } else {
            toast({
              title: "播放错误",
              description: "视频加载失败，请尝试其他播放源或稍后重试",
              variant: "destructive"
            });
          }
        });

      } catch (error) {
        console.error('播放器初始化失败:', error);
        toast({
          title: "播放器初始化失败",
          description: "无法初始化视频播放器",
          variant: "destructive"
        });
      }
    }
  };

  useEffect(() => {
    if (currentUrl && playerRef.current) {
      // 延迟初始化，确保DOM已准备好
      const timer = setTimeout(() => {
        initPlayer();
      }, 100);
      
      return () => clearTimeout(timer);
    }
    
    return () => {
      if (artRef.current) {
        try {
          artRef.current.destroy();
        } catch (error) {
          console.log('播放器销毁时出错:', error);
        }
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