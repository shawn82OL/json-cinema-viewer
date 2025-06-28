
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MovieDetail, PlayUrl } from '@/types/movie';

export const useMovieDetail = (apiUrl: string | null, movieId: string | null) => {
  const { toast } = useToast();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [playUrls, setPlayUrls] = useState<PlayUrl[]>([]);
  const [loading, setLoading] = useState(true);

  const parsePlayUrls = (playUrl: string): PlayUrl[] => {
    if (!playUrl) {
      console.log('没有播放链接数据');
      return [];
    }
    
    console.log('原始播放链接数据:', playUrl);
    
    const episodes = playUrl.split('#');
    const urls: PlayUrl[] = [];
    
    episodes.forEach((episode) => {
      const parts = episode.split('$');
      if (parts.length >= 2) {
        const episodeNum = parts[0];
        const episodeUrl = parts[1];
        urls.push({
          name: `第${episodeNum}集`,
          url: episodeUrl.trim()
        });
        console.log(`添加集数: 第${episodeNum}集, 链接: ${episodeUrl.trim()}`);
      }
    });
    
    console.log('解析出的播放链接:', urls);
    return urls;
  };

  const fetchMovieDetail = async () => {
    if (!apiUrl || !movieId) return;
    
    try {
      setLoading(true);
      let url = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}ac=detail&ids=${movieId}`;
      
      console.log('正在获取影片详情:', url);
      
      let response;
      try {
        response = await fetch(url);
        if (!response.ok) throw new Error('Direct request failed');
        console.log('直接请求成功');
      } catch (error) {
        console.log('直接请求失败，尝试使用代理...', error);
        try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
          response = await fetch(proxyUrl);
          console.log('代理请求成功');
        } catch (proxyError) {
          console.log('代理1失败，尝试备用代理...', proxyError);
          const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(url)}`;
          response = await fetch(proxyUrl2);
          console.log('备用代理请求成功');
        }
      }
      
      const data = await response.json();
      console.log('获取到的数据:', data);
      
      if (data.list && data.list[0]) {
        const movieData = data.list[0];
        setMovie(movieData);
        const urls = parsePlayUrls(movieData.vod_play_url);
        setPlayUrls(urls);
        console.log('成功加载影片详情:', movieData.vod_name);
      } else {
        console.error('数据格式错误:', data);
        toast({
          title: "加载失败",
          description: "无法获取影片详情，数据格式不正确",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('获取影片详情失败:', error);
      toast({
        title: "连接错误",
        description: "无法连接到数据源，请检查网络连接",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieDetail();
  }, [apiUrl, movieId]);

  return { movie, playUrls, loading };
};
