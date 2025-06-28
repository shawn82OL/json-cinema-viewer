import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

  // 简化集数名称显示
  const getEpisodeDisplayName = (name: string, index: number) => {
    // 如果名称太长，只显示集数
    if (name.length > 8) {
      return `${index + 1}`;
    }
    
    // 提取数字部分
    const match = name.match(/\d+/);
    if (match) {
      return match[0];
    }
    
    // 如果没有数字，使用索引
    return `${index + 1}`;
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-purple-500/20">
      <CardContent className="p-4">
        <h3 className="text-white text-base font-semibold mb-3">
          选集播放 ({playUrls.length}集)
        </h3>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 gap-2">
          {playUrls.map((episode, index) => (
            <Button
              key={index}
              variant={currentUrl === episode.url ? "default" : "ghost"}
              size="sm"
              onClick={() => onEpisodeSelect(episode.url)}
              className={`text-xs h-8 px-1 min-w-0 flex-shrink-0 ${
                currentUrl === episode.url 
                  ? "bg-purple-600 hover:bg-purple-700 text-white" 
                  : "text-white hover:bg-white/10 border border-purple-500/30"
              }`}
              title={episode.name} // 显示完整名称作为提示
            >
              {getEpisodeDisplayName(episode.name, index)}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};