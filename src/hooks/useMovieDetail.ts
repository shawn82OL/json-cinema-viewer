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
    
    // 处理多个播放源，通常用$$$分隔
    const sources = playUrl.split('$$$');
    let allUrls: PlayUrl[] = [];
    
    sources.forEach((source, sourceIndex) => {
      console.log(`处理播放源 ${sourceIndex + 1}:`, source);
      
      // 每个播放源内的集数用#分隔
      const episodes = source.split('#');
      
      episodes.forEach((episode, episodeIndex) => {
        if (!episode.trim()) return;
        
        const parts = episode.split('$');
        if (parts.length >= 2) {
          const episodeName = parts[0].trim();
          const episodeUrl = parts[1].trim();
          
          // 验证URL是否有效
          if (episodeUrl && episodeUrl.length > 10) {
            // 保持原始的集数名称
            const finalName = episodeName || `第${episodeIndex + 1}集`;
            
            allUrls.push({
              name: finalName,
              url: episodeUrl
            });
            
            console.log(`添加集数: ${finalName}, 链接: ${episodeUrl.substring(0, 50)}...`);
          } else {
            console.log(`跳过无效链接: ${episodeName} - ${episodeUrl}`);
          }
        } else {
          console.log(`跳过格式错误的集数: ${episode}`);
        }
      });
    });
    
    // 去重处理（基于URL）
    const uniqueUrls = allUrls.filter((url, index, self) => 
      index === self.findIndex(u => u.url === url.url)
    );
    
    console.log(`解析出的播放链接: ${uniqueUrls.length}个有效集数`);
    return uniqueUrls;
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
        
        // 解析播放链接
        const urls = parsePlayUrls(movieData.vod_play_url);
        setPlayUrls(urls);
        
        console.log('成功加载影片详情:', movieData.vod_name);
        console.log('播放链接数量:', urls.length);
        
        if (urls.length === 0) {
          toast({
            title: "播放链接解析失败",
            description: "该影片暂无可用的播放链接",
            variant: "destructive"
          });
        }
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