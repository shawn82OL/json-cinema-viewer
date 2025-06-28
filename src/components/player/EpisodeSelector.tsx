import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayUrl } from '@/types/movie';

interface EpisodeSelectorProps {
  playUrls: PlayUrl[];
  currentUrl: string;
  onEpisodeSelect: (url: string) => void;
}

export const EpisodeSelector: React.FC<EpisodeSelectorProps> = ({
  playUrls,
  currentUrl,
  onEpisodeSelect
}) => {
  if (playUrls.length === 0) return null;

  // 如果集数少于等于20集，直接显示所有集数
  if (playUrls.length <= 20) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-purple-500/20">
        <CardContent className="p-4">
          <h3 className="text-white text-base font-semibold mb-3">
            选集播放 ({playUrls.length}集)
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {playUrls.map((episode, index) => (
              <Button
                key={index}
                variant={currentUrl === episode.url ? "default" : "ghost"}
                size="sm"
                onClick={() => onEpisodeSelect(episode.url)}
                className={`text-xs h-8 px-2 truncate ${
                  currentUrl === episode.url 
                    ? "bg-purple-600 hover:bg-purple-700 text-white" 
                    : "text-white hover:bg-white/10 border border-purple-500/30"
                }`}
                title={episode.name}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // 如果集数超过20集，使用分页显示
  const episodesPerPage = 20;
  const totalPages = Math.ceil(playUrls.length / episodesPerPage);
  
  // 生成分页数据
  const pages = Array.from({ length: totalPages }, (_, index) => {
    const start = index * episodesPerPage;
    const end = Math.min(start + episodesPerPage, playUrls.length);
    return {
      label: `${start + 1}-${end}`,
      episodes: playUrls.slice(start, end),
      startIndex: start
    };
  });

  // 找到当前播放集数所在的页面
  const currentEpisodeIndex = playUrls.findIndex(ep => ep.url === currentUrl);
  const currentPageIndex = Math.floor(currentEpisodeIndex / episodesPerPage);
  const defaultTab = currentPageIndex >= 0 ? currentPageIndex.toString() : "0";

  return (
    <Card className="bg-white/10 backdrop-blur-md border-purple-500/20">
      <CardContent className="p-4">
        <h3 className="text-white text-base font-semibold mb-3">
          选集播放 ({playUrls.length}集)
        </h3>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full bg-black/30" style={{ gridTemplateColumns: `repeat(${totalPages}, minmax(0, 1fr))` }}>
            {pages.map((page, index) => (
              <TabsTrigger 
                key={index} 
                value={index.toString()}
                className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                {page.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {pages.map((page, pageIndex) => (
            <TabsContent key={pageIndex} value={pageIndex.toString()} className="mt-3">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {page.episodes.map((episode, episodeIndex) => {
                  const globalIndex = page.startIndex + episodeIndex;
                  return (
                    <Button
                      key={globalIndex}
                      variant={currentUrl === episode.url ? "default" : "ghost"}
                      size="sm"
                      onClick={() => onEpisodeSelect(episode.url)}
                      className={`text-xs h-8 px-2 ${
                        currentUrl === episode.url 
                          ? "bg-purple-600 hover:bg-purple-700 text-white" 
                          : "text-white hover:bg-white/10 border border-purple-500/30"
                      }`}
                      title={episode.name}
                    >
                      {globalIndex + 1}
                    </Button>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};